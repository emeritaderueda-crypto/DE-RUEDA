import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  WifiOff,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  UtensilsCrossed,
  Building,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface CanteenOfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanteenOfflineQueueModal: React.FC<CanteenOfflineQueueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOnline,
    pendingOfflineCanteenQueue,
    removePendingOfflineRecord,
    syncPendingCanteenQueue,
    toggleSimulateOffline,
    offlineStats,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPendingAmount = pendingOfflineCanteenQueue.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const handleExecuteSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    setShowConfirmSync(false);

    try {
      const res = await syncPendingCanteenQueue();
      setIsSyncing(false);
      setSyncFeedback(res.message);
    } catch (err) {
      setIsSyncing(false);
      setSyncFeedback('Synchronization failed. Please check network connectivity and retry.');
    }
  };

  const handleConfirmDelete = (id: string) => {
    removePendingOfflineRecord(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#13241f] border-b border-[#234338] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  Field Canteen Stipend Offline Queue Drawer
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}
                >
                  {isOnline ? 'SITE ONLINE' : 'FIELD OFFLINE QUEUE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Local durable storage for weekly canteen stipend records collected when site connectivity is unstable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue Overview Summary */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* IndexedDB & AutoSync Status Banner */}
          <div className="p-3 bg-[#13241f] border border-lime-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
              <div>
                <span className="font-bold text-white">IndexedDB Persistent Engine: </span>
                <span className="text-lime-400 font-mono font-semibold">Active (DRC_ERP_INDEXED_DB)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Auto-Sync on Connectivity Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">IndexedDB Queued Records</span>
              <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                {pendingOfflineCanteenQueue.length}
              </div>
              <span className="text-[10px] text-slate-500">Stored in browser IndexedDB</span>
            </div>

            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Total (₱)</span>
              <div className="text-xl font-black font-mono text-white mt-0.5">
                ₱{totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500">Awaiting automatic sync</span>
            </div>

            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Network Status</span>
              <div
                className={`text-sm font-black mt-1 flex items-center justify-center gap-1.5 ${
                  isOnline ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button
                onClick={toggleSimulateOffline}
                className="text-[10px] text-slate-400 hover:text-white underline mt-0.5 cursor-pointer"
              >
                {offlineStats.isSimulatedOffline ? 'End Outage Sim' : 'Simulate Drop'}
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {syncFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Confirmation Dialog Overlay when Sync is clicked */}
          {showConfirmSync && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Confirm Batch Synchronization
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    You are about to synchronize{' '}
                    <strong className="text-white">{pendingOfflineCanteenQueue.length}</strong> offline
                    meal chits totaling{' '}
                    <strong className="text-emerald-400">
                      ₱{totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    into official employee deductions. Affected weekly payroll registers will be recalculated immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
                <button
                  onClick={() => setShowConfirmSync(false)}
                  className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteSync}
                  className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Synchronize Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Queued Records Table */}
          <div className="border border-[#234338] rounded-xl overflow-hidden bg-[#0e1a16]">
            <div className="p-3 bg-[#13241f] border-b border-[#234338] flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Pending Offline Meal Chits ({pendingOfflineCanteenQueue.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Auto-syncs automatically when network reconnects
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#234338]/40">
              {pendingOfflineCanteenQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <span>Queue is empty. All site canteen transactions are synchronized with central ERP.</span>
                </div>
              ) : (
                pendingOfflineCanteenQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#13241f]/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#a3e635]">
                          {item.employee_id}
                        </span>
                        <span className="font-bold text-xs text-white">
                          {item.employee_name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-[#13241f] px-1.5 py-0.2 rounded border border-[#234338]">
                          {item.site_id}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {item.week_key}
                        </span>
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          item.payment_method === 'Cash'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        }`}>
                          {item.payment_method || 'GCash'}
                        </span>
                        <span className="font-mono text-[9px] text-lime-400 bg-lime-500/10 px-1 rounded border border-lime-500/20">
                          IndexedDB
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{item.notes || 'Weekly canteen stipend collection'}</span>
                        <span>·</span>
                        <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-white">
                          ₱{item.amount.toFixed(2)}
                        </span>
                        <div className="text-[9px] font-mono text-amber-400 uppercase font-bold">
                          PENDING SYNC
                        </div>
                      </div>

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1 bg-[#13241f] p-1 rounded-lg border border-[#234338]">
                          <button
                            onClick={() => handleConfirmDelete(item.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Purge / Remove mistaken offline entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#13241f] border-t border-[#234338] p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Drawer
          </button>

          <button
            onClick={() => setShowConfirmSync(true)}
            disabled={isSyncing || pendingOfflineCanteenQueue.length === 0}
            className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSyncing
                ? 'Synchronizing Queue...'
                : `Batch Sync Now (${pendingOfflineCanteenQueue.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
