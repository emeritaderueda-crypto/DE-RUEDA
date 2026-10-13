import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PendingOfflineCanteenRecord } from '../../types';
import {
  Bell,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';

export const CanteenNotificationCenter: React.FC = () => {
  const {
    isOnline,
    canteenSyncStatus,
    pendingOfflineCanteenQueue,
    syncPendingCanteenQueue,
    retryFailedCanteenRecords,
    resolveFailedCanteenRecord,
    simulateFailedUploadForTesting,
    removePendingOfflineRecord,
    employees,
    sites,
  } = useApp();

  const [isOpen, setIsOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Resolution Modal State
  const [resolvingRecord, setResolvingRecord] = useState<PendingOfflineCanteenRecord | null>(null);
  const [reassignedEmpId, setReassignedEmpId] = useState('');
  const [reassignedAmount, setReassignedAmount] = useState<number>(0);
  const [reassignedNotes, setReassignedNotes] = useState('');

  const failedRecords = pendingOfflineCanteenQueue.filter((r) => r.status === 'FAILED');
  const pendingCount = pendingOfflineCanteenQueue.filter((r) => r.status === 'PENDING_SYNC').length;
  const failedCount = failedRecords.length;
  const manualActionRequired = failedRecords.some((r) => r.requires_manual_action || r.status === 'FAILED');

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const res = await syncPendingCanteenQueue();
      setSyncToast(res.message || `Successfully synced ${res.syncedCount} records.`);
    } catch (err: any) {
      setSyncToast(`Sync error: ${err?.message || 'Network sync failed'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsSyncing(true);
    try {
      const res = await retryFailedCanteenRecords();
      setSyncToast(res.message || 'Retried failed records.');
    } catch (err: any) {
      setSyncToast(`Retry failed: ${err?.message || 'Failed to retry'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const openResolutionModal = (rec: PendingOfflineCanteenRecord) => {
    setResolvingRecord(rec);
    setReassignedEmpId(rec.employee_id.startsWith('EMP-99') ? (employees[0]?.employee_id || '') : rec.employee_id);
    setReassignedAmount(rec.amount);
    setReassignedNotes(rec.notes || '');
  };

  const handleSaveResolution = async () => {
    if (!resolvingRecord) return;
    const emp = employees.find((e) => e.employee_id === reassignedEmpId);
    await resolveFailedCanteenRecord(resolvingRecord.id, {
      employee_id: reassignedEmpId,
      employee_name: emp ? emp.name : resolvingRecord.employee_name,
      amount: reassignedAmount,
      notes: `${reassignedNotes} [Manually Reconciled: ${new Date().toLocaleDateString()}]`,
      error_reason: undefined,
    });
    setResolvingRecord(null);
    setSyncToast(`Record ${resolvingRecord.id} reconciled and queued for upload.`);
  };

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Header Bar */}
      <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2 rounded-lg ${manualActionRequired ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Bell className="w-4 h-4" />
            </div>
            {(pendingCount > 0 || failedCount > 0) && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-black rounded-full font-mono ${manualActionRequired ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>
                {pendingCount + failedCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight">
                Canteen Transaction Sync & Alert Center
              </h2>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  <Wifi className="w-3 h-3" /> Online Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  <WifiOff className="w-3 h-3" /> Field Offline Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live status for offline meal chits, background upload retries, and manual reconciliation alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || pendingOfflineCanteenQueue.length === 0}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              pendingOfflineCanteenQueue.length > 0
                ? 'bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] cursor-pointer shadow-sm'
                : 'bg-[#1a332b] text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Pending Queue'}</span>
          </button>

          <button
            onClick={() => simulateFailedUploadForTesting()}
            className="px-2.5 py-1.5 bg-[#182b24] hover:bg-[#203a31] text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
            title="Simulate a failed upload scenario to test manual reconciliation alert UI"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Anomaly</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-400 hover:text-white bg-[#182b24] rounded-lg transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 space-y-3.5">
          {/* Toast message if any */}
          {syncToast && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncToast}</span>
              </div>
              <button
                onClick={() => setSyncToast(null)}
                className="text-slate-400 hover:text-white text-xs ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Uploads</div>
              <div className="text-xl font-black font-mono text-white mt-1">{pendingCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Queued in IndexedDB/Storage</div>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Failed Records</div>
              <div className={`text-xl font-black font-mono mt-1 ${failedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {failedCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Require inspection</div>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Value</div>
              <div className="text-xl font-black font-mono text-[#a3e635] mt-1">
                ₱{canteenSyncStatus.totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Total unposted deductions</div>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Last Network Sync</div>
              <div className="text-xs font-mono text-emerald-400 font-bold mt-2">
                {canteenSyncStatus.lastSyncAt ? new Date(canteenSyncStatus.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Auto background active</div>
            </div>
          </div>

          {/* CRITICAL ALERT: Manual Action Required for Failed Uploads */}
          {manualActionRequired && (
            <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 border-y border-r border-[#234338] rounded-lg space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Manual Action Required — {failedCount} Failed Upload{failedCount > 1 ? 's' : ''} Detected
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      The network reconnected, but one or more canteen records failed automated upload due to validation or masterlist mismatch. Timekeeper or Admin must manually reassign or reconcile these entries before posting to payroll.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRetryFailed}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] rounded transition-colors shrink-0"
                >
                  Retry All ({failedCount})
                </button>
              </div>

              {/* List of Failed Records */}
              <div className="space-y-2 mt-2">
                {failedRecords.map((failRec) => (
                  <div
                    key={failRec.id}
                    className="p-2.5 bg-[#13241f] border border-amber-500/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{failRec.employee_id}</span>
                        <span className="font-bold text-white">{failRec.employee_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({failRec.site_id})</span>
                      </div>
                      <div className="text-[11px] text-rose-300 font-medium">
                        Reason: {failRec.error_reason || 'Validation mismatch during upload.'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Amount: ₱{failRec.amount}</span>
                        <span>·</span>
                        <span>Failed at: {failRec.failed_at ? new Date(failRec.failed_at).toLocaleTimeString() : 'Recent'}</span>
                        <span>·</span>
                        <span>Retries: {failRec.retry_count || 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openResolutionModal(failRec)}
                        className="px-2.5 py-1 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[11px] rounded transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Reconcile / Reassign</span>
                      </button>
                      <button
                        onClick={() => removePendingOfflineRecord(failRec.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Discard invalid record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Queue Summary when no failures */}
          {!manualActionRequired && pendingCount > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  All {pendingCount} queued records are verified and ready for automatic background sync upon next scheduled heartbeat.
                </span>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="text-xs text-[#a3e635] hover:underline font-bold"
              >
                Upload Now →
              </button>
            </div>
          )}

          {!manualActionRequired && pendingCount === 0 && (
            <div className="p-2.5 bg-[#13241f]/70 border border-[#234338] rounded-lg text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All field canteen records are fully synchronized with the central payroll ledger. Zero pending items.</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Reconciliation Modal */}
      {resolvingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#234338] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Manual Record Reconciliation</h3>
              </div>
              <button
                onClick={() => setResolvingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
              <div className="font-bold">Original Error:</div>
              <div className="text-[11px] mt-0.5">{resolvingRecord.error_reason || 'Masterlist validation error'}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reassign to Registered Employee *</label>
                <select
                  value={reassignedEmpId}
                  onChange={(e) => setReassignedEmpId(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none focus:border-[#a3e635]"
                >
                  {employees
                    .filter((e) => e.status !== 'archived')
                    .map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_id} — {emp.name} ({emp.position} · {emp.site_id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Meal Charge Amount (₱) *</label>
                <input
                  type="number"
                  value={reassignedAmount}
                  onChange={(e) => setReassignedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none focus:border-[#a3e635] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Auditor Reconciliation Notes</label>
                <input
                  type="text"
                  value={reassignedNotes}
                  onChange={(e) => setReassignedNotes(e.target.value)}
                  placeholder="e.g. Corrected typo in timekeeper handwritten meal sheet"
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#234338]">
              <button
                onClick={() => setResolvingRecord(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResolution}
                className="px-4 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg transition-colors shadow-sm"
              >
                Save & Queue for Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
