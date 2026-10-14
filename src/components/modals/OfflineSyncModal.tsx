import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  HardDrive,
  Users,
  CheckCircle2,
  Clock,
  Building,
  Calculator,
  X,
  AlertTriangle,
  Send,
  Trash2,
  Activity,
} from 'lucide-react';
import { SyncActivityLogModal } from './SyncActivityLogModal';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    offlineStats,
    syncOfflineQueue,
    toggleSimulateOffline,
    forceRefreshOfflineCache,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncOfflineQueue();
      setIsSyncing(false);
      setSyncMessage(`Successfully synchronized ${res.syncedCount} queued actions to server database.`);
    } catch {
      setIsSyncing(false);
      setSyncMessage('Sync failed. Please check network connectivity.');
    }
  };

  const handleRefreshCache = () => {
    forceRefreshOfflineCache();
    setSyncMessage('Local cache refreshed with latest attendance and project site rosters.');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
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
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Construction Site Offline &amp; Cache Manager</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'CACHED MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensures critical attendance, employee rosters, and project milestones remain accessible during site network instability
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            {isOnline ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-white">
                {isOnline ? 'Central Database Connected' : 'Site Network Disconnected · Offline Cache Active'}
              </div>
              <p className="text-slate-300">
                {isOnline
                  ? 'Real-time synchronization with De Rueda Construction master cloud vault is active.'
                  : 'All turnstile QR scans, daily timekeeping, and milestone updates are cached locally on this device. Actions will automatically sync when connection is restored.'}
              </p>
            </div>
          </div>

          {/* Cache Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#13241f] border border-[#234338] p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold text-[11px]">Workers Cached</span>
                <Users className="w-3.5 h-3.5 text-[#10b981]" />
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {offlineStats.cachedEmployeesCount}
              </div>
              <span className="text-[10px] text-slate-500">201 profiles &amp; QR</span>
            </div>

            <div className="bg-[#13241f] border border-[#234338] p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold text-[11px]">DTR Scans</span>
                <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
              </div>
              <div className="text-lg font-mono font-bold text-[#a3e635] mt-1">
                {offlineStats.cachedAttendanceCount}
              </div>
              <span className="text-[10px] text-slate-500">Attendance logs</span>
            </div>

            <div className="bg-[#13241f] border border-[#234338] p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold text-[11px]">Project Sites</span>
                <Building className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {offlineStats.cachedSitesCount}
              </div>
              <span className="text-[10px] text-slate-500">Bataan / Subic</span>
            </div>

            <div className="bg-[#13241f] border border-[#234338] p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold text-[11px]">Pending Sync</span>
                <Send className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                {offlineStats.pendingQueueCount}
              </div>
              <span className="text-[10px] text-slate-500">Queued actions</span>
            </div>
          </div>

          {/* Technical Diagnostics */}
          <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-[#a3e635]" />
                Offline Storage Volume:
              </span>
              <span className="font-mono font-bold text-white">
                {formatBytes(offlineStats.storageUsageBytes)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last Cache Refresh:
              </span>
              <span className="font-mono text-slate-300 text-[11px]">
                {new Date(offlineStats.lastSyncTimestamp).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Service Worker Status:
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                Active (drc-erp-cache-v1)
              </span>
            </div>
          </div>

          {/* Simulation Toggle for Site Field Testing */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                Simulate Construction Site Network Outage
              </span>
              <span className="text-[11px] text-slate-400">
                Forces app into offline cached mode to test timekeeping and DTR when signal drops in remote areas
              </span>
            </div>

            <button
              onClick={toggleSimulateOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                offlineStats.isSimulatedOffline
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white'
              }`}
            >
              {offlineStats.isSimulatedOffline ? 'Simulating Offline' : 'Simulate Offline'}
            </button>
          </div>

          {syncMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#234338]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshCache}
                className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#a3e635]" />
                Refresh Cache
              </button>

              <button
                onClick={() => setIsLogModalOpen(true)}
                className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-cyan-400 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sync Activity Log</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing || offlineStats.pendingQueueCount === 0}
                className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSyncing ? 'Syncing...' : `Flush Sync Queue (${offlineStats.pendingQueueCount})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Push/Pull Activity Log Modal */}
      <SyncActivityLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};
