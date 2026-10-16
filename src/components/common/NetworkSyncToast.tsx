import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Wifi, WifiOff, X, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ToastData {
  id: string;
  type: 'online' | 'offline';
  title: string;
  message: string;
  details?: string;
  timestamp: string;
  pendingCount?: number;
}

export const NetworkSyncToast: React.FC = () => {
  const { isOnline, offlineStats, totalPendingChanges, syncAllPendingChanges } = useApp();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const hasMountedRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip toast on initial app mount if status has not transitioned
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevOnlineRef.current = isOnline;
      return;
    }

    // Only fire when there is an actual transition between online and offline states
    if (prevOnlineRef.current !== isOnline) {
      const isNowOnline = isOnline;
      prevOnlineRef.current = isOnline;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (isNowOnline) {
        // Transitioned from Offline to Online
        const pendingCount = totalPendingChanges ?? ((offlineStats.pendingQueueCount || 0));
        setToast({
          id: `toast-online-${Date.now()}`,
          type: 'online',
          title: 'Online Synchronized',
          message: pendingCount > 0
            ? `Connection restored. Auto-synchronizing ${pendingCount} remote site queued change${pendingCount > 1 ? 's' : ''}...`
            : 'Turnstile attendance & meal disbursements are now synchronizing in real time with the central database.',
          details: `Cached Masterlist: ${offlineStats.cachedAttendanceCount} records · Server link operational`,
          timestamp: timeStr,
          pendingCount,
        });

        // If there were pending records, automatically trigger sync
        if (pendingCount > 0) {
          setIsSyncing(true);
          syncAllPendingChanges().finally(() => {
            setIsSyncing(false);
          });
        }

        // Auto-dismiss after 6 seconds
        timeoutRef.current = setTimeout(() => {
          setToast(null);
        }, 6000);
      } else {
        // Transitioned from Online to Offline
        setToast({
          id: `toast-offline-${Date.now()}`,
          type: 'offline',
          title: 'Remote Site Offline Mode',
          message: 'Internet connection lost. Offline attendance engine enabled. Scans & meal chits are securely cached on device.',
          details: `${offlineStats.cachedAttendanceCount} cached employees available · Zero downtime turnstile operation`,
          timestamp: timeStr,
          pendingCount: offlineStats.pendingQueueCount,
        });

        // Auto-dismiss after 7 seconds
        timeoutRef.current = setTimeout(() => {
          setToast(null);
        }, 7000);
      }
    }
  }, [isOnline, offlineStats, totalPendingChanges, syncAllPendingChanges]);

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast(null);
  };

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      await syncAllPendingChanges();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!toast) return null;

  const isOnlineToast = toast.type === 'online';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 right-5 z-50 max-w-sm w-full mx-auto sm:mx-0 transition-all duration-300 transform translate-y-0"
    >
      <div
        className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
          isOnlineToast
            ? 'bg-[#0a1813]/95 border-emerald-500/60 shadow-emerald-950/40 text-slate-100'
            : 'bg-[#181106]/95 border-amber-500/60 shadow-amber-950/40 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Status Indicator Icon with Pulse */}
          <div className="relative shrink-0 mt-0.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                isOnlineToast
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}
            >
              {isOnlineToast ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnlineToast ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isOnlineToast ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-black text-xs uppercase tracking-wider ${
                    isOnlineToast ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {toast.timestamp}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors -mr-1"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-200 mt-1 leading-snug font-medium">
              {toast.message}
            </p>

            {toast.details && (
              <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                {isOnlineToast ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{toast.details}</span>
              </div>
            )}

            {/* Quick Actions if Queued Items Exist */}
            {isOnlineToast && (toast.pendingCount || 0) > 0 && (
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-300">
                  {toast.pendingCount} pending queue item{toast.pendingCount! > 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-[#080f0d] font-bold text-[10px] rounded flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            )}

            {!isOnlineToast && (
              <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center gap-1.5 text-[10px] text-amber-300 font-semibold">
                <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Local transactions will sync automatically upon reconnection.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
