import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Save,
  KeyRound,
  Shield,
  Building2,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Activity,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  HardDrive,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Database,
  Plus,
  Layers,
  Bug,
  AlertCircle,
  FileJson,
  Play,
  X,
} from 'lucide-react';
import {
  getStoredPassword,
  saveStoredPassword,
  resetCredentialsToDefault,
  DEFAULT_CREDENTIALS,
} from '../../utils/credentials';
import { AccessPointRole, SyncActivityLogEntry, OfflineActionItem } from '../../types';
import {
  getSyncActivityLogs,
  addSyncActivityLog,
  clearSyncActivityLogs,
  getOfflineQueue,
  updateOfflineQueueItem,
  removeOfflineQueueItem,
  clearOfflineQueue,
  seedSampleOfflineQueue,
  getPayloadSizeBytes,
  queueOfflineAction,
} from '../../utils/offlineStorage';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    addAuditLog,
    currentUser,
    logout,
    isOnline,
    offlineStats,
    syncOfflineQueue,
    currentSite,
  } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'sync_history' | 'sync_queue' | 'operational'>('sync_history');

  // Operational Settings Form
  const [companyForm, setCompanyForm] = useState({
    company_name: settings.company_name,
    company_address: settings.company_address,
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    master_drive_link: settings.master_drive_link,
  });

  const [rulesForm, setRulesForm] = useState({
    work_hours_standard: settings.work_hours_standard,
    break_minutes: settings.break_minutes,
    break_schedule: settings.break_schedule,
    anti_duplicate_minutes: settings.anti_duplicate_minutes,
    sss_default_rate: settings.sss_default_rate,
    philhealth_default_rate: settings.philhealth_default_rate,
  });

  const [pwForm, setPwForm] = useState({
    access_point: 'ceo',
    current_password: '',
    new_password: '',
  });

  const [revealedRoles, setRevealedRoles] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  // Sync History State
  const [syncLogs, setSyncLogs] = useState<SyncActivityLogEntry[]>(() => getSyncActivityLogs());
  const [syncSearch, setSyncSearch] = useState('');
  const [syncDirectionFilter, setSyncDirectionFilter] = useState<'ALL' | 'PUSH' | 'PULL' | 'HEARTBEAT'>('ALL');
  const [syncStatusFilter, setSyncStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'IN_PROGRESS'>('ALL');
  const [syncServiceFilter, setSyncServiceFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync Queue State
  const [offlineQueue, setOfflineQueue] = useState<OfflineActionItem[]>(() => getOfflineQueue());
  const [queueSearch, setQueueSearch] = useState('');
  const [queueTypeFilter, setQueueTypeFilter] = useState<string>('ALL');
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);

  // Visual Batch Synchronization Progress State
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    currentLabel: string;
    remainingBytes: number;
    totalBytes: number;
    stage: 'INITIALIZING' | 'UPLOADING' | 'VERIFYING' | 'COMPLETE';
  } | null>(null);

  // Reload data on mount
  useEffect(() => {
    setSyncLogs(getSyncActivityLogs());
    setOfflineQueue(getOfflineQueue());
  }, []);

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(companyForm);
    setFeedback('Company information updated successfully.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleRulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(rulesForm);
    setFeedback('Operational timekeeping & payroll rules updated.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback('');
    const role = pwForm.access_point as AccessPointRole;
    const currentExpected = getStoredPassword(role);

    if (pwForm.current_password.trim() !== currentExpected) {
      setErrorFeedback(`Incorrect current password for ${role.toUpperCase()}. Verification failed.`);
      return;
    }

    if (!pwForm.new_password.trim()) {
      setErrorFeedback('New password cannot be empty.');
      return;
    }

    saveStoredPassword(role, pwForm.new_password.trim());
    addAuditLog('CHANGE_PASSWORD', 'CREDENTIALS', role, `Updated access key for ${role}`);
    setFeedback(`Security master key updated for ${role.toUpperCase()}.`);
    setPwForm({ access_point: role, current_password: '', new_password: '' });
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleResetCredentials = () => {
    resetCredentialsToDefault();
    setFeedback('Master credentials reset to factory default policy.');
    setPwForm({ access_point: 'ceo', current_password: '', new_password: '' });
    setTimeout(() => setFeedback(''), 3000);
  };

  // Visual Batch Synchronization with Progress Bar
  const handleBatchSyncWithProgress = async () => {
    if (isBatchSyncing) return;
    setIsBatchSyncing(true);
    setSyncFeedback(null);

    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0) {
      setSyncFeedback('No pending offline transactions to synchronize.');
      setIsBatchSyncing(false);
      return;
    }

    const totalItems = currentQueue.length;
    const totalBytes = currentQueue.reduce(
      (sum, item) => sum + (item.payloadSizeBytes || getPayloadSizeBytes(item.payload)),
      0
    );

    setBatchProgress({
      total: totalItems,
      completed: 0,
      currentLabel: `Initializing batch sync for ${totalItems} transactions (${(totalBytes / 1024).toFixed(2)} KB)...`,
      remainingBytes: totalBytes,
      totalBytes,
      stage: 'INITIALIZING',
    });

    // Step 1: Initialize
    await new Promise((r) => setTimeout(r, 450));

    let completed = 0;
    let remainingBytes = totalBytes;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < currentQueue.length; i++) {
      const item = currentQueue[i];
      const itemSize = item.payloadSizeBytes || getPayloadSizeBytes(item.payload);

      setBatchProgress({
        total: totalItems,
        completed,
        currentLabel: `Committing [${item.type}] ${item.id} (${itemSize} B) to cloud gateway...`,
        remainingBytes,
        totalBytes,
        stage: 'UPLOADING',
      });

      // Realistic dispatch step
      await new Promise((r) => setTimeout(r, 350));

      const startTime = performance.now();
      if (isOnline) {
        // Success commit
        const latency = Math.max(35, Math.round(performance.now() - startTime) + 32);
        removeOfflineQueueItem(item.id);
        addSyncActivityLog({
          direction: 'PUSH',
          service:
            item.type === 'ATTENDANCE_SCAN'
              ? 'ATTENDANCE_QUEUE'
              : item.type === 'DEDUCTION_ADD'
              ? 'CANTEEN_CHITS'
              : 'PAYROLL_VOUCHERS',
          status: 'SUCCESS',
          records_count: 1,
          payload_summary: `Committed queued transaction ${item.id} (${item.type}) to cloud`,
          site_id: item.site_id || currentSite || 'SITE-001',
          device_id: item.device_id || 'BROWSER-ADMIN-CONSOLE',
          latency_ms: latency,
          details: `Batch synchronization payload: ${itemSize} bytes committed. Response 200 OK.`,
        });
        successCount++;
      } else {
        // Offline failure: increment retry
        const latency = Math.max(20, Math.round(performance.now() - startTime) + 12);
        const newRetries = (item.retryCount || 0) + 1;
        updateOfflineQueueItem(item.id, {
          retryCount: newRetries,
          status: 'FAILED',
          lastError: 'HTTP 503 Service Unavailable: Remote database endpoint unreachable in offline buffer mode.',
        });
        addSyncActivityLog({
          direction: 'PUSH',
          service: 'ATTENDANCE_QUEUE',
          status: 'FAILED',
          records_count: 0,
          payload_summary: `Failed to commit queued transaction ${item.id} (${item.type})`,
          site_id: item.site_id || currentSite || 'SITE-001',
          device_id: item.device_id || 'BROWSER-ADMIN-CONSOLE',
          latency_ms: latency,
          details: `Upload failed: Network offline. Retry count incremented to ${newRetries}. Payload preserved in buffer.`,
          error_message: 'ERR_CONNECTION_REFUSED: Central server offline buffer active.',
        });
        failCount++;
      }

      completed++;
      remainingBytes = Math.max(0, remainingBytes - itemSize);

      setBatchProgress({
        total: totalItems,
        completed,
        currentLabel: `Committed ${completed} of ${totalItems} (${Math.round((completed / totalItems) * 100)}%)`,
        remainingBytes,
        totalBytes,
        stage: 'VERIFYING',
      });
    }

    // Step 4: Verification complete
    setBatchProgress({
      total: totalItems,
      completed: totalItems,
      currentLabel: `Batch complete: ${successCount} committed successfully, ${failCount} retained in retry queue.`,
      remainingBytes: 0,
      totalBytes,
      stage: 'COMPLETE',
    });

    // Refresh state
    setOfflineQueue(getOfflineQueue());
    setSyncLogs(getSyncActivityLogs());
    setSyncFeedback(
      `Batch synchronization finished: ${successCount} transactions committed (${(totalBytes / 1024).toFixed(2)} KB), ${failCount} failed.`
    );

    // Keep completed banner visible for 3.5 seconds
    setTimeout(() => {
      setIsBatchSyncing(false);
      setBatchProgress(null);
    }, 3500);
  };

  // Single Transaction Retry Handler in Sync Queue
  const handleRetrySingleQueueItem = async (itemId: string) => {
    const item = offlineQueue.find((q) => q.id === itemId);
    if (!item) return;

    const startTime = performance.now();
    const itemSize = item.payloadSizeBytes || getPayloadSizeBytes(item.payload);

    if (isOnline) {
      removeOfflineQueueItem(itemId);
      const latency = Math.max(30, Math.round(performance.now() - startTime) + 35);
      addSyncActivityLog({
        direction: 'PUSH',
        service: item.type === 'ATTENDANCE_SCAN' ? 'ATTENDANCE_QUEUE' : 'SYSTEM_STATE',
        status: 'SUCCESS',
        records_count: 1,
        payload_summary: `Individual Retry: Successfully committed transaction ${item.id} (${item.type})`,
        site_id: item.site_id || 'SITE-001',
        device_id: item.device_id || 'BROWSER-ADMIN-CONSOLE',
        latency_ms: latency,
        details: `Granular retry successful. Payload (${itemSize} bytes) accepted by cloud endpoint.`,
      });
      setOfflineQueue(getOfflineQueue());
      setSyncLogs(getSyncActivityLogs());
      setSyncFeedback(`Transaction ${item.id} retried and synced successfully (${latency} ms).`);
    } else {
      const newRetries = (item.retryCount || 0) + 1;
      updateOfflineQueueItem(itemId, {
        retryCount: newRetries,
        status: 'FAILED',
        lastError: 'HTTP 504 Gateway Timeout: Remote host unreachable (Browser offline).',
      });
      setOfflineQueue(getOfflineQueue());
      setSyncFeedback(`Retry failed for ${item.id}: Network is currently offline. Retry count now ${newRetries}.`);
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Discard / Remove Queue Item
  const handleRemoveQueueItem = (itemId: string) => {
    removeOfflineQueueItem(itemId);
    setOfflineQueue(getOfflineQueue());
    setSyncFeedback(`Discarded transaction ${itemId} from offline sync queue.`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Seed Sample Offline Queue
  const handleSeedSampleQueue = () => {
    const seeded = seedSampleOfflineQueue();
    setOfflineQueue(seeded);
    setSyncFeedback(`Reset and seeded ${seeded.length} diagnostic transactions into sync queue.`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Add Test Transaction to Queue
  const handleAddSampleQueueTransaction = () => {
    const types: OfflineActionItem['type'][] = ['ATTENDANCE_SCAN', 'DEDUCTION_ADD', 'GCASH_PAY'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const newItem = queueOfflineAction({
      type: chosenType,
      payload: {
        timestamp: new Date().toISOString(),
        site_id: currentSite || 'SITE-001',
        device_id: `DEVICE-${Math.floor(100 + Math.random() * 900)}`,
        note: 'Diagnostic test packet generated from SettingsView Sync Queue tool',
        test_data_block: Array.from({ length: 6 }, (_, i) => ({ seq: i + 1, hash: Math.random().toString(36) })),
      },
      site_id: currentSite || 'SITE-001',
      device_id: 'BROWSER-ADMIN-CONSOLE',
      status: 'PENDING',
    });
    setOfflineQueue(getOfflineQueue());
    setSyncFeedback(`Queued new diagnostic test transaction: ${newItem.id} (${newItem.payloadSizeBytes} bytes).`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Timestamp_ISO',
      'Direction',
      'Service',
      'Status',
      'Records_Count',
      'Duration_ms',
      'Site_ID',
      'Device_ID',
      'Payload_Summary',
      'Details',
      'Error_Message',
    ];
    const rows = filteredSyncLogs.map((l) => [
      l.id,
      l.timestamp,
      l.direction,
      l.service,
      l.status,
      l.records_count,
      l.latency_ms,
      l.site_id || '',
      l.device_id || '',
      `"${(l.payload_summary || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.error_message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DRC-Sync-History-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear Logs Handler
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear the local synchronization history log?')) {
      clearSyncActivityLogs();
      setSyncLogs([]);
      setSyncFeedback('Synchronization activity logs cleared.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Filtered Sync Logs
  const filteredSyncLogs = useMemo(() => {
    return syncLogs.filter((log) => {
      if (syncDirectionFilter !== 'ALL' && log.direction !== syncDirectionFilter) return false;
      if (syncStatusFilter !== 'ALL' && log.status !== syncStatusFilter) return false;
      if (syncServiceFilter !== 'ALL' && log.service !== syncServiceFilter) return false;
      if (syncSearch.trim()) {
        const q = syncSearch.toLowerCase();
        const matchesSummary = (log.payload_summary || '').toLowerCase().includes(q);
        const matchesService = (log.service || '').toLowerCase().includes(q);
        const matchesSite = (log.site_id || '').toLowerCase().includes(q);
        const matchesDevice = (log.device_id || '').toLowerCase().includes(q);
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        if (!matchesSummary && !matchesService && !matchesSite && !matchesDevice && !matchesDetails) return false;
      }
      return true;
    });
  }, [syncLogs, syncDirectionFilter, syncStatusFilter, syncServiceFilter, syncSearch]);

  // Filtered Offline Queue
  const filteredOfflineQueue = useMemo(() => {
    return offlineQueue.filter((item) => {
      if (queueTypeFilter !== 'ALL' && item.type !== queueTypeFilter) return false;
      if (queueStatusFilter === 'RETRYING' && (item.retryCount || 0) === 0) return false;
      if (queueStatusFilter === 'PENDING' && (item.retryCount || 0) > 0) return false;
      if (queueSearch.trim()) {
        const q = queueSearch.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesType = item.type.toLowerCase().includes(q);
        const matchesSite = (item.site_id || '').toLowerCase().includes(q);
        const matchesDevice = (item.device_id || '').toLowerCase().includes(q);
        const matchesError = (item.lastError || '').toLowerCase().includes(q);
        const matchesPayload = JSON.stringify(item.payload).toLowerCase().includes(q);
        if (!matchesId && !matchesType && !matchesSite && !matchesDevice && !matchesError && !matchesPayload) {
          return false;
        }
      }
      return true;
    });
  }, [offlineQueue, queueTypeFilter, queueStatusFilter, queueSearch]);

  // Aggregate Sync Metrics
  const syncMetrics = useMemo(() => {
    const totalPushes = syncLogs.filter((l) => l.direction === 'PUSH').length;
    const totalPulls = syncLogs.filter((l) => l.direction === 'PULL').length;
    const totalSuccess = syncLogs.filter((l) => l.status === 'SUCCESS').length;
    const successRate = syncLogs.length > 0 ? Math.round((totalSuccess / syncLogs.length) * 100) : 100;
    const avgDuration =
      syncLogs.length > 0
        ? Math.round(syncLogs.reduce((acc, l) => acc + (l.latency_ms || 40), 0) / syncLogs.length)
        : 0;

    return { totalPushes, totalPulls, totalSuccess, successRate, avgDuration };
  }, [syncLogs]);

  // Aggregate Queue Metrics
  const queueMetrics = useMemo(() => {
    const totalCount = offlineQueue.length;
    const totalBytes = offlineQueue.reduce(
      (sum, item) => sum + (item.payloadSizeBytes || getPayloadSizeBytes(item.payload)),
      0
    );
    const withRetries = offlineQueue.filter((item) => (item.retryCount || 0) > 0).length;
    const maxRetry = offlineQueue.reduce((max, item) => Math.max(max, item.retryCount || 0), 0);
    const avgSize = totalCount > 0 ? Math.round(totalBytes / totalCount) : 0;

    return { totalCount, totalBytes, withRetries, maxRetry, avgSize };
  }, [offlineQueue]);

  // Format Helpers
  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Enterprise System Settings</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Operational Parameters, Security Keys, Sync Queue &amp; Cloud Logs</span>
          </div>
        </div>

        {/* Live Network State Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span>{isOnline ? 'Cloud Endpoint Active' : 'Offline Buffer Mode'}</span>
            <span className="text-[10px] opacity-70 font-mono">
              ({offlineQueue.length} queued)
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#234338] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sync_history')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sync_history'
              ? 'bg-[#0e1a16] text-[#a3e635] border-t-2 border-[#a3e635] border-x border-[#234338]'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#a3e635]" />
          <span>Sync History &amp; Progress</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#13241f] border border-[#234338] text-slate-300 rounded font-mono">
            {syncLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sync_queue')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sync_queue'
              ? 'bg-[#0e1a16] text-[#a3e635] border-t-2 border-[#a3e635] border-x border-[#234338]'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Sync Queue Diagnostics</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              queueMetrics.withRetries > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#13241f] border border-[#234338] text-[#a3e635]'
            }`}
          >
            {offlineQueue.length} Pending
          </span>
        </button>

        <button
          onClick={() => setActiveTab('operational')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'operational'
              ? 'bg-[#0e1a16] text-[#a3e635] border-t-2 border-[#a3e635] border-x border-[#234338]'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Operational &amp; Security Policy</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Visual 'Batch Synchronization' Progress Bar (Appears in both sync tabs when batch sync is running or completed) */}
      {batchProgress && (
        <div className="bg-[#13241f] border-2 border-[#a3e635] rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`w-4 h-4 text-[#a3e635] ${
                  batchProgress.stage !== 'COMPLETE' ? 'animate-spin' : ''
                }`}
              />
              <span className="font-bold text-white text-xs sm:text-sm">
                {batchProgress.stage === 'COMPLETE'
                  ? 'Batch Synchronization Complete'
                  : 'Batch Synchronization In Progress'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/40">
                {Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <span>
                <strong>{batchProgress.completed}</strong> of <strong>{batchProgress.total}</strong> transactions
              </span>
              <span>&bull;</span>
              <span className="text-[#a3e635] font-semibold">
                {batchProgress.remainingBytes > 0
                  ? `${(batchProgress.remainingBytes / 1024).toFixed(2)} KB remaining to upload`
                  : '0 B remaining'}
              </span>
            </div>
          </div>

          {/* Real-Time Progress Bar Track */}
          <div className="w-full bg-[#080f0d] border border-[#234338] h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] via-[#84cc16] to-[#a3e635] rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{
                width: `${Math.max(
                  4,
                  Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)
                )}%`,
              }}
            />
          </div>

          {/* Stage & Current Status */}
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
            <div className="truncate max-w-lg font-mono text-slate-200">
              &gt; {batchProgress.currentLabel}
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
              <span
                className={
                  batchProgress.stage === 'INITIALIZING'
                    ? 'text-[#a3e635] font-bold'
                    : 'text-slate-500'
                }
              >
                1. Queue Validated
              </span>
              <span>&rarr;</span>
              <span
                className={
                  batchProgress.stage === 'UPLOADING'
                    ? 'text-[#a3e635] font-bold'
                    : 'text-slate-500'
                }
              >
                2. Payload Dispatched
              </span>
              <span>&rarr;</span>
              <span
                className={
                  batchProgress.stage === 'VERIFYING'
                    ? 'text-[#a3e635] font-bold'
                    : 'text-slate-500'
                }
              >
                3. Ledger Verifying
              </span>
              <span>&rarr;</span>
              <span
                className={
                  batchProgress.stage === 'COMPLETE'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-500'
                }
              >
                4. Cloud Committed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SYNC HISTORY & PROGRESS INTERFACE */}
      {activeTab === 'sync_history' && (
        <div className="space-y-6">
          {/* Diagnostic Header Bar */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#a3e635]" />
                  <h2 className="text-base font-bold text-white">
                    Background Push / Pull Synchronization Audit Trail
                  </h2>
                </div>
                <div className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Real-time synchronization activity log recording exact timestamped events, push/pull directions,
                  sync duration (latency in milliseconds), and success/failure status. Used by site managers to troubleshoot
                  offline-to-online replication between field turnstiles and the cloud database.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleBatchSyncWithProgress}
                  disabled={isBatchSyncing || offlineQueue.length === 0}
                  className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  title="Dispatch batch synchronization of pending transactions with visual progress tracking"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                  <span>{isBatchSyncing ? 'Batch Syncing...' : `Batch Sync Queue (${offlineQueue.length})`}</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Export filtered sync logs to CSV format"
                >
                  <Download className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => {
                    setSyncLogs(getSyncActivityLogs());
                    setOfflineQueue(getOfflineQueue());
                  }}
                  className="p-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                  title="Reload latest logs and queue from local storage"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleClearLogs}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer transition-colors"
                  title="Clear synchronization history log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sync Feedback Toast */}
            {syncFeedback && (
              <div className="mt-4 p-3 bg-[#13241f] border border-[#a3e635]/40 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 animate-in fade-in duration-150">
                <Zap className="w-4 h-4 text-[#a3e635] shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Push Uploads</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {syncMetrics.totalPushes}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Field queue to cloud</div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Pull Downloads</span>
                <ArrowDownLeft className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {syncMetrics.totalPulls}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Masterlist &amp; credentials</div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Sync Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
              </div>
              <div className="text-2xl font-black text-[#a3e635] mt-1 font-mono">
                {syncMetrics.successRate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {syncMetrics.totalSuccess} / {syncLogs.length} events OK
              </div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Avg Sync Duration</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  syncMetrics.avgDuration < 150
                    ? 'text-emerald-400'
                    : syncMetrics.avgDuration < 400
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {syncMetrics.avgDuration} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Network round-trip latency</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={syncSearch}
                  onChange={(e) => setSyncSearch(e.target.value)}
                  placeholder="Filter by summary, device ID, site, details..."
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Service Filter */}
              <select
                value={syncServiceFilter}
                onChange={(e) => setSyncServiceFilter(e.target.value)}
                className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Services</option>
                <option value="ATTENDANCE_QUEUE">Attendance Queue</option>
                <option value="CANTEEN_CHITS">Canteen Meal Chits</option>
                <option value="MASTERLIST_CACHE">Masterlist Cache</option>
                <option value="PAYROLL_VOUCHERS">Payroll Vouchers</option>
                <option value="SYSTEM_STATE">System State</option>
              </select>
            </div>

            {/* Direction Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Direction:</span>
              {(['ALL', 'PUSH', 'PULL', 'HEARTBEAT'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setSyncDirectionFilter(dir)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    syncDirectionFilter === dir
                      ? 'bg-[#a3e635] text-[#080f0d]'
                      : 'bg-[#13241f] text-slate-400 hover:text-white border border-[#234338]'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Status:</span>
              {(['ALL', 'SUCCESS', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSyncStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    syncStatusFilter === st
                      ? 'bg-[#10b981] text-white'
                      : 'bg-[#13241f] text-slate-400 hover:text-white border border-[#234338]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sync History Timestamped Table */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#13241f] text-slate-400 border-b border-[#234338] text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-center">Direction</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Payload Summary &amp; Batch Size</th>
                    <th className="p-3">Site / Device</th>
                    <th className="p-3 text-right">Duration (Latency)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/60">
                  {filteredSyncLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <div className="font-bold text-white text-sm">No Synchronization Logs Found</div>
                        <div className="text-xs text-slate-500 mt-1">
                          No background sync events match the selected filter criteria.
                        </div>
                        <button
                          onClick={() => {
                            setSyncSearch('');
                            setSyncDirectionFilter('ALL');
                            setSyncStatusFilter('ALL');
                            setSyncServiceFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredSyncLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-[#13241f]/60 transition-colors">
                            {/* Timestamp */}
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-mono text-white font-semibold">
                                {formatTimestamp(log.timestamp)}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{formatRelativeTime(log.timestamp)}</span>
                              </div>
                            </td>

                            {/* Direction */}
                            <td className="p-3 text-center whitespace-nowrap">
                              {log.direction === 'PUSH' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <ArrowUpRight className="w-3 h-3" />
                                  PUSH
                                </span>
                              ) : log.direction === 'PULL' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  PULL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <Activity className="w-3 h-3" />
                                  HEARTBEAT
                                </span>
                              )}
                            </td>

                            {/* Service */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-mono text-[11px] text-slate-300 font-semibold bg-[#13241f] px-2 py-1 rounded border border-[#234338]">
                                {log.service}
                              </span>
                            </td>

                            {/* Payload Summary & Records Count */}
                            <td className="p-3">
                              <div className="font-medium text-slate-200 line-clamp-1">
                                {log.payload_summary}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#080f0d] text-[#a3e635] rounded border border-[#234338]">
                                  {log.records_count} records
                                </span>
                                {log.details && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-xs">
                                    {log.details}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Site / Device */}
                            <td className="p-3 whitespace-nowrap text-[11px] font-mono text-slate-300">
                              <div>{log.site_id || 'SITE-GLOBAL'}</div>
                              <div className="text-[10px] text-slate-500">
                                {log.device_id || 'LOCAL-CLIENT'}
                              </div>
                            </td>

                            {/* Sync Duration / Latency */}
                            <td className="p-3 text-right whitespace-nowrap">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  log.latency_ms < 150
                                    ? 'text-emerald-400'
                                    : log.latency_ms < 400
                                    ? 'text-amber-300'
                                    : 'text-rose-400'
                                }`}
                              >
                                {log.latency_ms} ms
                              </span>
                            </td>

                            {/* Status */}
                            <td className="p-3 text-center whitespace-nowrap">
                              {log.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  SUCCESS
                                </span>
                              ) : log.status === 'FAILED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  FAILED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  RETRY
                                </span>
                              )}
                            </td>

                            {/* Details Trigger */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="px-2 py-1 bg-[#13241f] hover:bg-[#234338] text-slate-300 hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-3 h-3 text-[#a3e635]" />
                                    <span>Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                    <span>Inspect</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Diagnostic Row */}
                          {isExpanded && (
                            <tr className="bg-[#080f0d] border-b border-[#234338]">
                              <td colSpan={8} className="p-4">
                                <div className="space-y-3 bg-[#13241f]/70 border border-[#234338] rounded-xl p-4 text-xs font-mono">
                                  <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
                                    <div className="text-white font-bold flex items-center gap-2">
                                      <Database className="w-4 h-4 text-[#a3e635]" />
                                      <span>Technical Synchronization Diagnostic Payload &bull; {log.id}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      ISO: {log.timestamp}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                                    <div>
                                      <div className="text-slate-400 font-semibold mb-1 uppercase text-[9px]">
                                        Summary &amp; Endpoint Parameters
                                      </div>
                                      <div className="bg-[#080f0d] p-2.5 rounded-lg border border-[#234338] text-slate-200">
                                        <div><strong>Summary:</strong> {log.payload_summary}</div>
                                        <div className="mt-1"><strong>Records Transferred:</strong> {log.records_count} items</div>
                                        <div className="mt-1"><strong>Duration:</strong> {log.latency_ms} ms (Round-Trip)</div>
                                        <div className="mt-1"><strong>Origin Device:</strong> {log.device_id || 'BROWSER-CLIENT'}</div>
                                        <div className="mt-1"><strong>Target Site:</strong> {log.site_id || 'SITE-GLOBAL'}</div>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-slate-400 font-semibold mb-1 uppercase text-[9px]">
                                        Diagnostics &amp; Network Replication Details
                                      </div>
                                      <div className="bg-[#080f0d] p-2.5 rounded-lg border border-[#234338] text-slate-200">
                                        <div><strong>Details:</strong> {log.details || 'Standard transactional push/pull batch'}</div>
                                        {log.error_message && (
                                          <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300">
                                            <strong>Error Message:</strong> {log.error_message}
                                          </div>
                                        )}
                                        <div className="mt-2 text-[10px] text-emerald-400">
                                          Replication Protocol: WebSocket keep-alive + IndexedDB offline fallback
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-[#13241f] border-t border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{filteredSyncLogs.length}</strong> of{' '}
                <strong className="text-white">{syncLogs.length}</strong> recorded sync events
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Push (Upload)</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  <span>Pull (Download)</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                  <span>Heartbeat</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNC QUEUE DIAGNOSTIC TOOL */}
      {activeTab === 'sync_queue' && (
        <div className="space-y-6">
          {/* Diagnostic Header Bar */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">
                    Sync Queue Diagnostic Tool (Offline-to-Online Buffer)
                  </h2>
                </div>
                <div className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Lists all pending transactions waiting to be uploaded to the central server.
                  Inspect individual payload sizes (in bytes/KB), retry counts, and HTTP failure codes for granular
                  debugging of offline-to-online replication bottlenecks.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleBatchSyncWithProgress}
                  disabled={isBatchSyncing || offlineQueue.length === 0}
                  className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  title="Dispatch batch synchronization of pending transactions with visual progress tracking"
                >
                  <Play className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                  <span>{isBatchSyncing ? 'Batch Syncing...' : `Batch Sync Queue (${offlineQueue.length})`}</span>
                </button>

                <button
                  onClick={handleAddSampleQueueTransaction}
                  className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Queue a new test offline transaction packet"
                >
                  <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>+ Queue Test Item</span>
                </button>

                <button
                  onClick={handleSeedSampleQueue}
                  className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Seed representative sample transactions with various error codes"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Seed Diagnostics</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Clear all pending offline transactions from the sync queue?')) {
                      clearOfflineQueue();
                      setOfflineQueue([]);
                      setSyncFeedback('Pending sync queue cleared.');
                      setTimeout(() => setSyncFeedback(null), 3000);
                    }
                  }}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer transition-colors"
                  title="Clear all queue items"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sync Feedback Toast */}
            {syncFeedback && (
              <div className="mt-4 p-3 bg-[#13241f] border border-[#a3e635]/40 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 animate-in fade-in duration-150">
                <Zap className="w-4 h-4 text-[#a3e635] shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Pending Queue Items</span>
                <Database className="w-4 h-4 text-[#a3e635]" />
              </div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {queueMetrics.totalCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Transactions waiting upload</div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Cumulative Payload Size</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {queueMetrics.totalBytes > 1024
                  ? `${(queueMetrics.totalBytes / 1024).toFixed(2)} KB`
                  : `${queueMetrics.totalBytes} B`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Avg: {queueMetrics.avgSize} B / transaction
              </div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Retrying / Failed</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  queueMetrics.withRetries > 0 ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                {queueMetrics.withRetries}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Packets with retry &gt; 0</div>
            </div>

            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold">Max Retry Count</span>
                <Bug className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
                {queueMetrics.maxRetry} <span className="text-xs font-normal text-slate-400">/ 5 max</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Automatic threshold: 5 retries</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Filter by transaction ID, payload, device ID, failure reason..."
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Type Filter */}
              <select
                value={queueTypeFilter}
                onChange={(e) => setQueueTypeFilter(e.target.value)}
                className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Action Types</option>
                <option value="ATTENDANCE_SCAN">ATTENDANCE_SCAN</option>
                <option value="DEDUCTION_ADD">DEDUCTION_ADD</option>
                <option value="GCASH_PAY">GCASH_PAY</option>
                <option value="PAYROLL_VERIFY">PAYROLL_VERIFY</option>
                <option value="NOTE_ADD">NOTE_ADD</option>
              </select>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Status:</span>
              {(['ALL', 'PENDING', 'RETRYING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    queueStatusFilter === st
                      ? 'bg-[#10b981] text-white'
                      : 'bg-[#13241f] text-slate-400 hover:text-white border border-[#234338]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Sync Queue Granular Table */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#13241f] text-slate-400 border-b border-[#234338] text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3">Queue ID &amp; Time</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3 text-right">Payload Size</th>
                    <th className="p-3 text-center">Retry Count</th>
                    <th className="p-3">Site / Device</th>
                    <th className="p-3">Last Failure / Diagnostic Reason</th>
                    <th className="p-3 text-center">Granular Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/60">
                  {filteredOfflineQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <div className="font-bold text-white text-sm">Sync Queue Is Empty</div>
                        <div className="text-xs text-slate-500 mt-1">
                          All local transactions have been committed to the central database.
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <button
                            onClick={handleSeedSampleQueue}
                            className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                          >
                            Seed Sample Diagnostics Queue
                          </button>
                          <button
                            onClick={handleAddSampleQueueTransaction}
                            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer"
                          >
                            + Queue Test Item
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOfflineQueue.map((item) => {
                      const isExpanded = expandedQueueId === item.id;
                      const payloadSize = item.payloadSizeBytes || getPayloadSizeBytes(item.payload);
                      const isHighRetry = (item.retryCount || 0) >= 3;
                      const hasRetried = (item.retryCount || 0) > 0;

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-[#13241f]/60 transition-colors">
                            {/* Queue ID & Queued Timestamp */}
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-mono text-white font-bold">{item.id}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{formatRelativeTime(item.timestamp)}</span>
                              </div>
                            </td>

                            {/* Action Type */}
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                  item.type === 'ATTENDANCE_SCAN'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : item.type === 'DEDUCTION_ADD'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : item.type === 'GCASH_PAY'
                                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                    : item.type === 'PAYROLL_VERIFY'
                                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                    : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>

                            {/* Payload Size */}
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="font-mono font-bold text-xs text-white">
                                {payloadSize > 1024
                                  ? `${(payloadSize / 1024).toFixed(2)} KB`
                                  : `${payloadSize} B`}
                              </div>
                              <div className="w-16 bg-[#080f0d] h-1.5 rounded-full overflow-hidden ml-auto mt-1 border border-[#234338]">
                                <div
                                  className="h-full bg-emerald-400"
                                  style={{ width: `${Math.min(100, Math.round((payloadSize / 2048) * 100))}%` }}
                                />
                              </div>
                            </td>

                            {/* Retry Count */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                  isHighRetry
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : hasRetried
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-[#13241f] text-slate-300 border-[#234338]'
                                }`}
                              >
                                {item.retryCount || 0} / {item.maxRetries || 5} retries
                              </span>
                            </td>

                            {/* Site / Device */}
                            <td className="p-3 whitespace-nowrap text-[11px] font-mono text-slate-300">
                              <div>{item.site_id || 'SITE-001'}</div>
                              <div className="text-[10px] text-slate-500">
                                {item.device_id || 'TURNSTILE-GATE-01'}
                              </div>
                            </td>

                            {/* Failure Reason */}
                            <td className="p-3 max-w-xs">
                              {item.lastError ? (
                                <div className="text-[11px] text-rose-300 font-mono truncate" title={item.lastError}>
                                  <AlertCircle className="w-3 h-3 text-rose-400 inline mr-1" />
                                  <span>{item.lastError}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>Pending initial network dispatch</span>
                                </div>
                              )}
                            </td>

                            {/* Granular Actions */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => setExpandedQueueId(isExpanded ? null : item.id)}
                                  className="px-2 py-1 bg-[#13241f] hover:bg-[#234338] text-slate-300 hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Inspect JSON payload details"
                                >
                                  <FileJson className="w-3 h-3 text-[#a3e635]" />
                                  <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                </button>

                                <button
                                  onClick={() => handleRetrySingleQueueItem(item.id)}
                                  className="px-2 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/40 text-emerald-300 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Retry individual transaction upload now"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Retry</span>
                                </button>

                                <button
                                  onClick={() => handleRemoveQueueItem(item.id)}
                                  className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded cursor-pointer transition-colors"
                                  title="Discard / Delete from queue"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded JSON Payload Inspector */}
                          {isExpanded && (
                            <tr className="bg-[#080f0d] border-b border-[#234338]">
                              <td colSpan={7} className="p-4">
                                <div className="space-y-3 bg-[#13241f]/80 border border-[#234338] rounded-xl p-4 text-xs font-mono">
                                  <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
                                    <div className="text-white font-bold flex items-center gap-2">
                                      <FileJson className="w-4 h-4 text-[#a3e635]" />
                                      <span>Raw Transaction Payload Inspector &bull; {item.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <span>Size: <strong className="text-emerald-400">{payloadSize} Bytes</strong></span>
                                      <span>&bull;</span>
                                      <span>Attempts: <strong className="text-amber-300">{item.retryCount || 0}</strong></span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                                    <div className="md:col-span-2">
                                      <div className="text-slate-400 font-semibold mb-1 uppercase text-[9px]">
                                        JSON Payload Content
                                      </div>
                                      <pre className="bg-[#080f0d] p-3 rounded-lg border border-[#234338] text-slate-200 overflow-x-auto max-h-56 text-[10px] leading-relaxed">
                                        {JSON.stringify(item.payload, null, 2)}
                                      </pre>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <div className="text-slate-400 font-semibold mb-1 uppercase text-[9px]">
                                          Debugging Diagnostic Recommendation
                                        </div>
                                        <div className="bg-[#080f0d] p-3 rounded-lg border border-[#234338] text-slate-300 space-y-1.5 text-[11px]">
                                          {item.lastError?.includes('504') ? (
                                            <div>
                                              <strong className="text-amber-300">HTTP 504 Gateway Timeout:</strong>
                                              <div className="text-slate-400 text-[10px] mt-0.5">
                                                Check site cellular LTE router or turnstile optical tablet antenna.
                                                Payload is intact and safely buffered.
                                              </div>
                                            </div>
                                          ) : item.lastError?.includes('429') ? (
                                            <div>
                                              <strong className="text-rose-300">HTTP 429 Rate Limit:</strong>
                                              <div className="text-slate-400 text-[10px] mt-0.5">
                                                Upstream API limit reached. The system applies exponential backoff
                                                before automatic retry.
                                              </div>
                                            </div>
                                          ) : item.lastError?.includes('408') ? (
                                            <div>
                                              <strong className="text-amber-300">HTTP 408 Timeout:</strong>
                                              <div className="text-slate-400 text-[10px] mt-0.5">
                                                Ledger locked during concurrent write. Safe to retry manually.
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <strong className="text-[#a3e635]">Ready for Cloud Upload:</strong>
                                              <div className="text-slate-400 text-[10px] mt-0.5">
                                                Packet is queued in browser storage. Click 'Retry' or trigger batch sync.
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="pt-1">
                                        <button
                                          onClick={() => handleRetrySingleQueueItem(item.id)}
                                          className="w-full py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                                        >
                                          <Play className="w-3.5 h-3.5" />
                                          <span>Dispatch Individual Retry</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-[#13241f] border-t border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{filteredOfflineQueue.length}</strong> of{' '}
                <strong className="text-white">{offlineQueue.length}</strong> queued transactions
                &bull; Total Size:{' '}
                <strong className="text-[#a3e635]">
                  {(queueMetrics.totalBytes / 1024).toFixed(2)} KB
                </strong>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  onClick={handleBatchSyncWithProgress}
                  disabled={offlineQueue.length === 0 || isBatchSyncing}
                  className="px-3 py-1 bg-[#a3e635] text-[#080f0d] font-bold rounded hover:bg-[#84cc16] cursor-pointer disabled:opacity-50"
                >
                  Commit All Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL & SECURITY POLICY */}
      {activeTab === 'operational' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Company Profile Card */}
            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#234338] mb-4">
                  <Building2 className="w-4 h-4 text-[#a3e635]" />
                  <h2 className="text-sm font-bold text-white">Company Identity &amp; Public Information</h2>
                </div>

                <form onSubmit={handleCompanySubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Corporate Name</label>
                    <input
                      type="text"
                      required
                      value={companyForm.company_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Head Office Address</label>
                    <input
                      type="text"
                      required
                      value={companyForm.company_address}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Corporate Email</label>
                      <input
                        type="email"
                        required
                        value={companyForm.contact_email}
                        onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                      <input
                        type="text"
                        required
                        value={companyForm.contact_phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Master Google Drive Vault URL</label>
                    <input
                      type="url"
                      required
                      value={companyForm.master_drive_link}
                      onChange={(e) => setCompanyForm({ ...companyForm, master_drive_link: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Company Info
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Operational & Break Rules Card */}
            <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#234338] mb-4">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Shift Standards &amp; Break Calculation Rules</h2>
                </div>

                <form onSubmit={handleRulesSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Standard Work Hours / Shift</label>
                      <input
                        type="number"
                        required
                        value={rulesForm.work_hours_standard}
                        onChange={(e) => setRulesForm({ ...rulesForm, work_hours_standard: Number(e.target.value) })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Total Break Minutes Deducted</label>
                      <input
                        type="number"
                        required
                        value={rulesForm.break_minutes}
                        onChange={(e) => setRulesForm({ ...rulesForm, break_minutes: Number(e.target.value) })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mandatory Break Schedule</label>
                    <input
                      type="text"
                      required
                      value={rulesForm.break_schedule}
                      onChange={(e) => setRulesForm({ ...rulesForm, break_schedule: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      Deducts 90 minutes (1.5 hours) from elapsed turnstile shift
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Anti-Duplicate Window (Mins)</label>
                      <input
                        type="number"
                        required
                        value={rulesForm.anti_duplicate_minutes}
                        onChange={(e) => setRulesForm({ ...rulesForm, anti_duplicate_minutes: Number(e.target.value) })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SSS Employee Rate</label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        value={rulesForm.sss_default_rate}
                        onChange={(e) => setRulesForm({ ...rulesForm, sss_default_rate: Number(e.target.value) })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">PhilHealth Employee Rate</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={rulesForm.philhealth_default_rate}
                      onChange={(e) => setRulesForm({ ...rulesForm, philhealth_default_rate: Number(e.target.value) })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Operational Rules
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Access Point Master Passwords Section */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#a3e635]" />
                <h2 className="text-sm font-bold text-white">Access Point Passwords &amp; Master Keys</h2>
              </div>
              <button
                type="button"
                onClick={handleResetCredentials}
                className="text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 font-semibold cursor-pointer"
                title="Reset all role passwords to default factory configuration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {(['ceo', 'admin 1', 'admin 2'] as AccessPointRole[]).map((r) => {
                const isUserRole = currentUser?.access_point === r;
                return (
                  <div
                    key={r}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      isUserRole
                        ? 'bg-[#10b981]/10 border-[#10b981]/40'
                        : 'bg-[#13241f] border-[#234338]'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {DEFAULT_CREDENTIALS[r].label}
                      </div>
                      <div className="font-mono font-bold text-xs text-[#a3e635] mt-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Protected &amp; Encrypted</span>
                      </div>
                    </div>
                    {isUserRole && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#a3e635] text-[#080f0d] rounded">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs max-w-xl">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Access Point</label>
                  <select
                    value={pwForm.access_point}
                    onChange={(e) => setPwForm({ ...pwForm, access_point: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white uppercase font-bold"
                  >
                    <option value="ceo">CEO</option>
                    <option value="admin 1">Admin 1</option>
                    <option value="admin 2">Admin 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="Current"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Secure Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="New password"
                  />
                </div>
              </div>

              {errorFeedback && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {errorFeedback}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#13241f] border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Access Point Key
                </button>

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setFeedback('Successfully logged out of current access point.');
                      setTimeout(() => setFeedback(''), 3000);
                    }}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Log Out ({currentUser.access_point.toUpperCase()})</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
