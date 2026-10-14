import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Building2,
  UserCheck,
  LogOut,
  Globe,
  Menu,
  Shield,
  Wifi,
  WifiOff,
  UtensilsCrossed,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { OfflineSyncModal } from '../modals/OfflineSyncModal';
import { CanteenOfflineQueueModal } from '../modals/CanteenOfflineQueueModal';
import { RoadmapComplianceModal } from '../modals/RoadmapComplianceModal';
import { SyncActivityLogModal } from '../modals/SyncActivityLogModal';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenLogout: () => void;
  onToggleSidebar: () => void;
  onViewPublic: () => void;
  onNavigateLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenAuth,
  onOpenLogout,
  onToggleSidebar,
  onViewPublic,
  onNavigateLanding,
}) => {
  const {
    currentUser,
    currentSite,
    setCurrentSite,
    sites,
    isOnline,
    offlineStats,
    pendingOfflineCanteenQueue,
  } = useApp();
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isCanteenQueueModalOpen, setIsCanteenQueueModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isSyncLogModalOpen, setIsSyncLogModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-[#0e1a16] border-b border-[#234338] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 gap-4 no-print">
        {/* Left: Mobile hamburger & Site selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg border border-[#234338] text-slate-400 hover:text-white hover:bg-[#13241f] lg:hidden"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-[#13241f] border border-[#234338] px-3 py-1.5 rounded-lg text-xs">
            <Building2 className="w-4 h-4 text-[#a3e635] shrink-0" />
            <span className="text-slate-400 font-medium hidden sm:inline">Project Site:</span>
            <select
              value={currentSite}
              onChange={(e) => setCurrentSite(e.target.value)}
              className="bg-transparent text-[#a3e635] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#13241f] text-white">All Active Sites (Consolidated)</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id} className="bg-[#13241f] text-white">
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Data Synchronization State Indicator (Remote Construction Sites) */}
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400'
                : 'bg-amber-950/35 border-amber-500 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
            }`}
            title={
              isOnline
                ? `Attendance Data: Synchronized Online · Turnstile scans & biometric logs synced in real-time with central server (${offlineStats.cachedAttendanceCount} cached records available).`
                : `Attendance Data: Offline Mode · Working at remote construction site. ${offlineStats.cachedAttendanceCount} attendance logs stored in device storage (${offlineStats.pendingQueueCount} pending auto-sync).`
            }
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {isOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </>
              )}
            </span>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="text-[11px] font-bold whitespace-nowrap flex items-center gap-1">
              <span className="hidden sm:inline">Attendance:</span>
              <span className={isOnline ? 'text-emerald-300' : 'text-amber-300'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </span>
            {!isOnline && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono text-[9px] font-bold">
                {offlineStats.pendingQueueCount > 0 ? `${offlineStats.pendingQueueCount} Queued` : 'Site Cache'}
              </span>
            )}
          </button>

          {/* Detailed Synchronization Service Activity Log Button */}
          <button
            onClick={() => setIsSyncLogModalOpen(true)}
            className="px-2.5 py-1 rounded-lg border border-[#234338] bg-[#13241f] hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold hidden md:flex items-center gap-1.5 transition-all cursor-pointer"
            title="Inspect Push/Pull Synchronization Activity Log"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">Sync Log</span>
          </button>

          {/* Canteen Offline Pending Queue Badge Button */}
          {pendingOfflineCanteenQueue.length > 0 && (
            <button
              onClick={() => setIsCanteenQueueModalOpen(true)}
              className="px-2.5 py-1 rounded-lg border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
              title="Inspect pending offline canteen meal chits"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Canteen Queue</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/40 text-[10px] font-mono font-black">
                {pendingOfflineCanteenQueue.length}
              </span>
            </button>
          )}

          {/* Roadmap Governance & Sandbox Compliance Badge */}
          <button
            onClick={() => setIsRoadmapModalOpen(true)}
            className="px-2.5 py-1 rounded-lg border border-[#a3e635]/30 bg-[#a3e635]/5 text-[#a3e635] hover:bg-[#a3e635]/15 text-xs font-semibold hidden xl:flex items-center gap-1.5 transition-all cursor-pointer"
            title="View Phase 0–1 Roadmap & Simulation Containment safeguards"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px]">Phase 0–1 Sandbox Active</span>
          </button>
        </div>

      {/* Center: Global Search trigger */}
      <div
        onClick={onOpenSearch}
        className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-[#13241f] border border-[#234338] hover:border-[#10b981] px-3 py-1.5 rounded-lg cursor-pointer text-xs text-slate-400 transition-colors"
      >
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="flex-1 truncate">Search workers, projects, payroll refs, materials, expenses...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] bg-[#0e1a16] border border-[#234338] rounded text-slate-500 font-mono">
          Ctrl+K
        </kbd>
      </div>

      {/* Right: User Identity, Switch Account, Public Site, Logout */}
      <div className="flex items-center gap-2.5">
        {currentUser ? (
          <div className="flex items-center gap-2 bg-[#13241f] border border-[#234338] px-3 py-1 rounded-full text-xs">
            <span className="bg-[#a3e635] text-[#080f0d] font-extrabold px-1.5 py-0.5 rounded-full text-[10px] uppercase">
              {currentUser.access_point}
            </span>
            <span className="text-slate-200 font-medium hidden sm:inline truncate max-w-[150px]">
              {currentUser.email}
            </span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 bg-[#10b981] text-white text-xs font-semibold rounded-lg hover:bg-[#059669] flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}

        {currentUser && (
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1.5 border border-[#234338] text-slate-300 hover:text-white hover:bg-[#13241f] rounded-lg text-xs font-medium flex items-center gap-1"
            title="Switch User Access Point"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        )}

        {onNavigateLanding && (
          <button
            onClick={onNavigateLanding}
            className="px-2.5 py-1.5 border border-[#10b981]/40 text-[#a3e635] hover:bg-[#10b981]/15 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            title="Preview Landing Page Inside Software"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Preview</span>
          </button>
        )}

        <button
          onClick={onViewPublic}
          className="px-2.5 py-1.5 border border-[#234338] text-slate-300 hover:text-[#a3e635] hover:bg-[#13241f] rounded-lg text-xs font-medium flex items-center gap-1"
          title="Open Standalone Public Website"
        >
          <span className="hidden sm:inline">Public Site</span>
        </button>

        {currentUser && (
          <button
            onClick={onOpenLogout}
            className="px-2.5 py-1.5 border border-rose-500/30 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Log out of current session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>

    {/* Construction Site Network / Offline Cache Modal */}
    <OfflineSyncModal
      isOpen={isOfflineModalOpen}
      onClose={() => setIsOfflineModalOpen(false)}
    />

    {/* Canteen Offline Queue Drawer / Modal */}
    <CanteenOfflineQueueModal
      isOpen={isCanteenQueueModalOpen}
      onClose={() => setIsCanteenQueueModalOpen(false)}
    />

    {/* System Roadmap Governance & Sandbox Compliance Modal */}
    <RoadmapComplianceModal
      isOpen={isRoadmapModalOpen}
      onClose={() => setIsRoadmapModalOpen(false)}
    />

    {/* Detailed Synchronization Service Activity Log Modal */}
    <SyncActivityLogModal
      isOpen={isSyncLogModalOpen}
      onClose={() => setIsSyncLogModalOpen(false)}
    />
  </>
  );
};
