import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Building,
  Clock,
  BadgePercent,
  Banknote,
  TrendingDown,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  FileBarChart,
  MessageSquare,
  FolderGit2,
  Inbox,
  Settings,
  History,
  X,
  HardHat,
  Globe,
  LogOut,
  Shield,
  Lock,
  Wallet,
  UtensilsCrossed,
  QrCode,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'ceo_monitoring'
  | 'ceo_gcash'
  | 'employees'
  | 'sites'
  | 'attendance'
  | 'deductions'
  | 'canteen'
  | 'payroll'
  | 'cashflow'
  | 'payslips'
  | 'materials'
  | 'expenses'
  | 'reports'
  | 'messages'
  | 'documents'
  | 'intake'
  | 'landing_preview'
  | 'settings'
  | 'audit';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenLogout?: () => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  onOpenLogout,
  onOpenAuth,
}) => {
  const { currentUser } = useApp();
  const navSections = [
    {
      title: 'Restricted CEO Vault',
      items: [
        {
          id: 'ceo_monitoring' as PageId,
          label: 'CEO Monitoring Hub',
          icon: Shield,
          badge: 'EMERITA',
        },
        {
          id: 'ceo_gcash' as PageId,
          label: currentUser?.access_point === 'admin 1' ? 'Executive Payment Operations' : currentUser?.access_point === 'admin 2' ? 'Site Payment & Batch QR Hub' : 'Payment Records & Settlement',
          icon: QrCode,
          badge: currentUser?.access_point === 'admin 1' ? 'VOUCHERS' : currentUser?.access_point === 'admin 2' ? 'SITE OPS' : 'OFFICIAL QR',
        },
      ],
    },
    {
      title: 'Executive & Operations',
      items: [
        { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'employees' as PageId, label: 'Employees / HR', icon: Users },
        { id: 'sites' as PageId, label: 'Sites & Projects', icon: Building },
        ...(currentUser?.access_point === 'admin 1'
          ? [{ id: 'ceo_gcash' as PageId, label: 'Executive Payment Operations', icon: QrCode, badge: 'VOUCHERS' }]
          : []),
      ],
    },
    {
      title: 'Time & Payroll Engine',
      items: [
        { id: 'attendance' as PageId, label: 'Attendance / DTR', icon: Clock },
        { id: 'deductions' as PageId, label: 'Deductions & Advances', icon: BadgePercent },
        { id: 'canteen' as PageId, label: 'Canteen Weekly Stipend', icon: UtensilsCrossed, badge: 'GCASH' },
        { id: 'payroll' as PageId, label: 'Weekly Payroll', icon: Banknote },
        ...(currentUser?.access_point === 'admin 2'
          ? [{ id: 'ceo_gcash' as PageId, label: 'Site Payment & Batch QR Hub', icon: QrCode, badge: 'SITE OPS' }]
          : []),
        { id: 'cashflow' as PageId, label: 'Cash Flow Disbursements', icon: TrendingDown },
        { id: 'payslips' as PageId, label: 'Payslips Hub (6/Page)', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Site Control & Procurement',
      items: [
        { id: 'materials' as PageId, label: 'Materials & Delivery', icon: PackageCheck },
        { id: 'expenses' as PageId, label: 'Project Expenses', icon: Receipt },
      ],
    },
    {
      title: 'Intelligence & Comms',
      items: [
        { id: 'reports' as PageId, label: 'Reports & Aggregator', icon: FileBarChart, badge: 'NEW' },
        { id: 'messages' as PageId, label: 'De Rueda Messages', icon: MessageSquare },
        { id: 'documents' as PageId, label: 'Documents & Drive Vault', icon: FolderGit2 },
        { id: 'intake' as PageId, label: 'Public Intake Leads', icon: Inbox },
        { id: 'landing_preview' as PageId, label: 'Landing Page Preview', icon: Globe },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings' as PageId, label: 'System Settings', icon: Settings },
        { id: 'audit' as PageId, label: 'Audit Activity Log', icon: History },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0e1a16] border-r border-[#234338] z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-[#234338] px-4 flex items-center justify-between bg-[#0e1a16]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#10b981] to-[#a3e635] flex items-center justify-center font-black text-[#080f0d] text-base shadow-[0_0_12px_rgba(163,230,53,0.3)]">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white leading-tight">DE RUEDA</div>
              <div className="text-[9px] text-[#a3e635] font-bold tracking-wider uppercase leading-tight">CONSTRUCTION MANAGEMENT SYSTEM</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navSections.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-[#13241f] text-[#a3e635] font-semibold border-l-2 border-[#a3e635]'
                          : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#a3e635]' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Session & Logout in Sidebar */}
        <div className="p-3 border-t border-[#234338] bg-[#0c1613]">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#13241f] border border-[#234338] flex items-center justify-center text-[#a3e635] font-black text-xs uppercase shrink-0">
                    {currentUser.access_point[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white uppercase leading-tight truncate">
                      {currentUser.access_point}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px] leading-tight font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active Session" />
              </div>

              <button
                onClick={() => {
                  if (onOpenLogout) onOpenLogout();
                  onClose();
                }}
                className="w-full py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Log out of current session"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                onClose();
              }}
              className="w-full py-2 px-3 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#234338] text-[11px] text-slate-400 flex items-center justify-between bg-[#0e1a16]">
          <span>Central Luzon &bull; Bataan</span>
          <span className="text-emerald-400 font-mono text-[10px]">ISO 9001</span>
        </div>
      </aside>
    </>
  );
};
