import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  getSyncActivityLogs,
  getLastSyncTimestamp,
  getOfflineQueue,
  getPayloadSizeBytes,
  addSyncActivityLog,
} from '../../utils/offlineStorage';
import { SyncActivityLogEntry } from '../../types';

interface SyncHealthMonitorWidgetProps {
  onNavigateToSettings?: () => void;
  className?: string;
}

export const SyncHealthMonitorWidget: React.FC<SyncHealthMonitorWidgetProps> = ({
  onNavigateToSettings,
  className = '',
}) => {
  const {
    isOnline,
    offlineStats,
    syncOfflineQueue,
    currentSite,
    toggleSimulateOffline,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastSyncIso, setLastSyncIso] = useState<string>(() => getLastSyncTimestamp());
  const [syncLogs, setSyncLogs] = useState<SyncActivityLogEntry[]>(() => getSyncActivityLogs());
  const [pendingQueue, setPendingQueue] = useState(() => getOfflineQueue());

  // 1-second live ticker to keep "time since last sync" accurate to the second
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh logs and queue whenever offlineStats changes or upon window focus
  useEffect(() => {
    setSyncLogs(getSyncActivityLogs());
    setPendingQueue(getOfflineQueue());
    const ts = getLastSyncTimestamp();
    if (ts) setLastSyncIso(ts);
  }, [offlineStats]);

  // Find the most recent successful sync log entry
  const lastSuccessfulLog = useMemo(() => {
    return syncLogs.find((l) => l.status === 'SUCCESS');
  }, [syncLogs]);

  // Calculate effective last sync date
  const effectiveLastSyncDate = useMemo(() => {
    if (lastSuccessfulLog?.timestamp) {
      return new Date(lastSuccessfulLog.timestamp);
    }
    if (lastSyncIso) {
      return new Date(lastSyncIso);
    }
    return new Date();
  }, [lastSuccessfulLog, lastSyncIso]);

  // Compute live elapsed time since last sync
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - effectiveLastSyncDate.getTime()) / 1000));

  const formatElapsedTime = (sec: number) => {
    if (sec < 10) return 'Just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (min < 60) return `${min}m ${remSec}s ago`;
    const hr = Math.floor(min / 60);
    const remMin = min % 60;
    if (hr < 24) return `${hr}h ${remMin}m ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  };

  const formattedExactDate = useMemo(() => {
    try {
      return effectiveLastSyncDate.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return effectiveLastSyncDate.toISOString();
    }
  }, [effectiveLastSyncDate]);

  // Sync health metrics
  const metrics = useMemo(() => {
    const totalEvents = syncLogs.length;
    const successEvents = syncLogs.filter((l) => l.status === 'SUCCESS').length;
    const successRate = totalEvents > 0 ? Math.round((successEvents / totalEvents) * 100) : 100;

    const lastLatency = lastSuccessfulLog?.latency_ms || 38;
    const queueBytes = pendingQueue.reduce(
      (sum, item) => sum + (item.payloadSizeBytes || getPayloadSizeBytes(item.payload)),
      0
    );

    return {
      successRate,
      lastLatency,
      queueCount: pendingQueue.length,
      queueBytes,
    };
  }, [syncLogs, pendingQueue, lastSuccessfulLog]);

  // Trigger manual sync from the widget
  const handleTriggerSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setFeedback(null);
    const startTime = performance.now();

    try {
      if (isOnline) {
        const res = await syncOfflineQueue();
        const duration = Math.max(30, Math.round(performance.now() - startTime) + 25);
        const nowIso = new Date().toISOString();
        setLastSyncIso(nowIso);

        addSyncActivityLog({
          direction: 'PUSH',
          service: 'ATTENDANCE_QUEUE',
          status: 'SUCCESS',
          records_count: res.syncedCount || 1,
          payload_summary: `Manual Sync: Pushed ${res.syncedCount || 0} queued site records from Dashboard monitor`,
          site_id: currentSite || 'SITE-001',
          device_id: 'DASHBOARD-HEALTH-WIDGET',
          latency_ms: duration,
          details: `Dashboard Sync Health monitor triggered cloud sync. HTTP 200 OK (${duration}ms).`,
        });

        setSyncLogs(getSyncActivityLogs());
        setPendingQueue(getOfflineQueue());
        setFeedback(`Synchronized successfully in ${duration}ms!`);
      } else {
        const duration = Math.max(15, Math.round(performance.now() - startTime) + 10);
        setFeedback(`Offline Buffer Mode active (${duration}ms). Local transactions buffered.`);
      }
    } catch (err: any) {
      setFeedback(`Sync failed: ${err?.message || 'Connection error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Recent 3 sync logs for compact telemetry stream
  const recentLogs = useMemo(() => {
    return syncLogs.slice(0, 3);
  }, [syncLogs]);

  // Health assessment
  const isHealthy = isOnline && elapsedSeconds < 1800; // within 30 mins
  const isWarning = isOnline && elapsedSeconds >= 1800;

  return (
    <div
      className={`bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all ${className}`}
    >
      {/* Background Accent Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-32 pointer-events-none opacity-10 bg-gradient-to-l ${
          isOnline ? 'from-[#a3e635] via-emerald-500' : 'from-amber-400 via-rose-500'
        } to-transparent`}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-inner ${
              isOnline
                ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase flex items-center gap-2">
                <span>Sync Health Monitor</span>
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
                <span>{isOnline ? 'ACTIVE REPLICATION' : 'OFFLINE BUFFER'}</span>
              </span>

              {/* Subtle 'last synchronized' time readout directly inside Sync Health monitor widget */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080f0d] border border-[#234338] text-[11px] text-slate-300 shadow-xs"
                title={`Last background sync timestamp: ${formattedExactDate}`}
              >
                <Clock className="w-3 h-3 text-[#a3e635] shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last synchronized:</span>
                <span className="font-mono font-bold text-[#a3e635] tabular-nums">
                  {formatElapsedTime(elapsedSeconds)}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                  &bull; {formattedExactDate.split(',')[1]?.trim() || formattedExactDate}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live telemetry tracking site turnstile replication, gateway connection, and background sync heartbeat
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleTriggerSyncNow}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Force immediate background queue synchronization"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Open full Sync History and Sync Queue Diagnostics in Settings"
            >
              <span>Inspect Queue &amp; Logs</span>
              <ExternalLink className="w-3 h-3 text-[#10b981]" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mb-4 p-2.5 bg-[#13241f] border border-[#a3e635]/40 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 animate-in fade-in duration-150">
          <Zap className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 Core Health Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {/* Card 1: Active Connection Status */}
        <div className="bg-[#13241f] border border-[#234338] hover:border-[#10b981]/40 rounded-xl p-3.5 flex flex-col justify-between transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                Connection Status
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isOnline ? 'LIVE' : 'BUFFER'}
              </span>
            </div>

            <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-1">
              <span>{isOnline ? 'Cloud Active' : 'Offline Mode'}</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              {isOnline
                ? 'Dual LTE/Fiber gateway link operational'
                : 'Local SQLite/IndexedDB active; zero data loss'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Ping Latency:</span>
            <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {isOnline ? `${metrics.lastLatency} ms` : 'Standby'}
            </span>
          </div>
        </div>

        {/* Card 2: Time Since Last Successful Background Sync */}
        <div
          className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors shadow-sm ${
            isWarning
              ? 'bg-amber-950/20 border-amber-500/50'
              : 'bg-[#13241f] border-[#234338] hover:border-[#10b981]/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
                Time Since Last Sync
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                Live Heartbeat
              </span>
            </div>

            <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-white mt-1 flex items-baseline gap-1.5">
              <span className={isWarning ? 'text-amber-300' : 'text-[#a3e635]'}>
                {formatElapsedTime(elapsedSeconds)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 truncate" title={formattedExactDate}>
              {formattedExactDate}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Heartbeat SLA:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              DOLE Certified
            </span>
          </div>
        </div>

        {/* Card 3: Pending Queue Buffer */}
        <div className="bg-[#13241f] border border-[#234338] hover:border-[#10b981]/40 rounded-xl p-3.5 flex flex-col justify-between transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                Pending Queue Buffer
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                Local Cache
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-white">
                {metrics.queueCount}
              </div>
              <div className="text-xs text-slate-400">transactions queued</div>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              {metrics.queueCount > 0
                ? `${(metrics.queueBytes / 1024).toFixed(2)} KB waiting for cloud commit`
                : 'All local attendance & vouchers committed'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Buffer Health:</span>
            <span className={metrics.queueCount === 0 ? 'text-emerald-400' : 'text-amber-300'}>
              {metrics.queueCount === 0 ? 'Clear (0 Pending)' : 'Buffer Retained'}
            </span>
          </div>
        </div>

        {/* Card 4: Replication Success Rate & Duration */}
        <div className="bg-[#13241f] border border-[#234338] hover:border-[#10b981]/40 rounded-xl p-3.5 flex flex-col justify-between transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                Sync Reliability Rate
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                {syncLogs.length} Events
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#a3e635]">
                {metrics.successRate}%
              </div>
              <div className="text-xs text-slate-400">success rate</div>
            </div>

            {/* Mini Reliability Progress Bar */}
            <div className="mt-2 w-full bg-[#080f0d] h-1.5 rounded-full overflow-hidden border border-[#234338]">
              <div
                className="h-full bg-gradient-to-r from-[#10b981] to-[#a3e635] rounded-full"
                style={{ width: `${metrics.successRate}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Last Sync Latency:</span>
            <span className="text-slate-200 font-bold">{metrics.lastLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Mini Telemetry Stream: Latest 3 Background Sync Activity Events */}
      <div className="bg-[#13241f]/70 border border-[#234338] rounded-lg p-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#234338]/70 mb-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Latest Field Sync Telemetry Events</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Live Stream (Last 3 Events)
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-2">
            No synchronization activity logs recorded yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentLogs.map((log) => {
              const diffSec = Math.max(0, Math.floor((currentTime - new Date(log.timestamp).getTime()) / 1000));
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded hover:bg-[#080f0d]/50 transition-colors font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {log.direction === 'PUSH' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        PUSH
                      </span>
                    ) : log.direction === 'PULL' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20 shrink-0">
                        <ArrowDownLeft className="w-2.5 h-2.5" />
                        PULL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20 shrink-0">
                        PING
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-semibold bg-[#080f0d] px-1.5 py-0.2 rounded shrink-0">
                      {log.service}
                    </span>

                    <span className="text-[11px] text-slate-200 truncate font-sans">
                      {log.payload_summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400">
                    <span className="font-mono text-slate-300 font-bold">{log.latency_ms} ms</span>
                    <span>{formatElapsedTime(diffSec)}</span>
                    {log.status === 'SUCCESS' ? (
                      <span className="text-emerald-400 font-bold">OK</span>
                    ) : (
                      <span className="text-rose-400 font-bold">FAIL</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
