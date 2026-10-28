import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AuthModal } from './components/modals/AuthModal';
import { LogoutModal } from './components/modals/LogoutModal';

import { PublicWebsiteView } from './components/views/PublicWebsiteView';
import { DashboardView } from './components/views/DashboardView';

// Helper for resilient lazy-loading with automatic retry
function safeLazy<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch {
      await new Promise((r) => setTimeout(r, 250));
      return await importFn();
    }
  });
}

// Lazy-loaded secondary views
const EmployeesView = safeLazy(() => import('./components/views/EmployeesView').then(m => ({ default: m.EmployeesView })));
const SitesView = safeLazy(() => import('./components/views/SitesView').then(m => ({ default: m.SitesView })));
const AttendanceView = safeLazy(() => import('./components/views/AttendanceView').then(m => ({ default: m.AttendanceView })));
const DeductionsView = safeLazy(() => import('./components/views/DeductionsView').then(m => ({ default: m.DeductionsView })));
const PayrollView = safeLazy(() => import('./components/views/PayrollView').then(m => ({ default: m.PayrollView })));
const CashFlowView = safeLazy(() => import('./components/views/CashFlowView').then(m => ({ default: m.CashFlowView })));
const PayslipsView = safeLazy(() => import('./components/views/PayslipsView').then(m => ({ default: m.PayslipsView })));
const MaterialsView = safeLazy(() => import('./components/views/MaterialsView').then(m => ({ default: m.MaterialsView })));
const ExpensesView = safeLazy(() => import('./components/views/ExpensesView').then(m => ({ default: m.ExpensesView })));
const ReportsView = safeLazy(() => import('./components/views/ReportsView').then(m => ({ default: m.ReportsView })));
const MessagesView = safeLazy(() => import('./components/views/MessagesView').then(m => ({ default: m.MessagesView })));
const DocumentsView = safeLazy(() => import('./components/views/DocumentsView').then(m => ({ default: m.DocumentsView })));
const IntakeView = safeLazy(() => import('./components/views/IntakeView').then(m => ({ default: m.IntakeView })));
const SettingsView = safeLazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const AuditView = safeLazy(() => import('./components/views/AuditView').then(m => ({ default: m.AuditView })));
const LandingPagePreviewView = safeLazy(() => import('./components/views/LandingPagePreviewView').then(m => ({ default: m.LandingPagePreviewView })));
const CeoMonitoringView = safeLazy(() => import('./components/views/CeoMonitoringView').then(m => ({ default: m.CeoMonitoringView })));
const PaymentRecordsHubView = safeLazy(() => import('./components/views/PaymentRecordsHubView').then(m => ({ default: m.PaymentRecordsHubView })));
const CanteenView = safeLazy(() => import('./components/views/CanteenView').then(m => ({ default: m.CanteenView })));
const ClientsView = safeLazy(() => import('./components/views/ClientsView').then(m => ({ default: m.ClientsView })));
const AdjustmentsView = safeLazy(() => import('./components/views/AdjustmentsView').then(m => ({ default: m.AdjustmentsView })));
import { NetworkSyncToast } from './components/common/NetworkSyncToast';

const MainAppContent: React.FC = () => {
  const { currentUser, logout } = useApp();

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isPublicView, setIsPublicView] = useState<boolean>(!currentUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  // Deep-link to a single payslip if navigated from Payroll view
  const [singlePayslipId, setSinglePayslipId] = useState<string | null>(null);

  // Global shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    setIsLogoutOpen(false);
    setIsPublicView(true); // Automatically heads to LANDING PAGE
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setIsAuthOpen(false);
    setIsPublicView(false);
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not authenticated or logs out, automatically enforce public view for protection
  useEffect(() => {
    if (!currentUser) {
      setIsPublicView(true);
      setIsLogoutOpen(false);
    }
  }, [currentUser]);

  const handleNavigate = (page: PageId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setIsPublicView(false);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSinglePayslip = (payrollId: string) => {
    setSinglePayslipId(payrollId);
    handleNavigate('payslips');
  };

  // If user is unauthenticated OR is viewing the public portal
  if (!currentUser || isPublicView) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#060b18] flex items-center justify-center text-slate-400 text-xs font-mono">Loading portal...</div>}>
        <NetworkSyncToast />
        <PublicWebsiteView
          onOpenLogin={() => {
            setIsAuthOpen(true);
          }}
          onGoToDashboard={() => {
            if (currentUser) {
              setIsPublicView(false);
            } else {
              setIsAuthOpen(true);
            }
          }}
          onOpenLogout={() => {
            setIsLogoutOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
          }}
          onSuccessLogin={handleLoginSuccess}
        />

        <LogoutModal
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
          onConfirmLogout={handleLogout}
        />
      </React.Suspense>
    );
  }

  // Active ERP View Renderer
  const renderActiveView = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenQrScanner={() => handleNavigate('attendance')}
          />
        );
      case 'ceo_monitoring':
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenQrScanner={() => handleNavigate('attendance')}
          />
        );
      case 'ceo_gcash':
        return <PaymentRecordsHubView onNavigate={handleNavigate} />;
      case 'clients':
        return <ClientsView />;
      case 'adjustments':
        return <AdjustmentsView />;
      case 'employees':
        return <EmployeesView />;
      case 'sites':
        return <SitesView />;
      case 'attendance':
        return <AttendanceView />;
      case 'deductions':
        return <DeductionsView />;
      case 'canteen':
        return <CanteenView onNavigate={handleNavigate} />;
      case 'payroll':
        return <PayrollView onOpenSinglePayslip={handleOpenSinglePayslip} />;
      case 'cashflow':
        return <CashFlowView />;
      case 'payslips':
        return (
          <PayslipsView
            selectedSingleId={singlePayslipId}
            onClearSingleId={() => setSinglePayslipId(null)}
          />
        );
      case 'materials':
        return <MaterialsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'messages':
        return <MessagesView />;
      case 'documents':
        return <DocumentsView />;
      case 'intake':
        return <IntakeView />;
      case 'landing_preview':
        return (
          <LandingPagePreviewView
            onNavigate={handleNavigate}
            onOpenFullscreen={() => setIsPublicView(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenLogout={() => setIsLogoutOpen(true)}
          />
        );
      case 'settings':
        return <SettingsView />;
      case 'audit':
        return <AuditView />;
      default:
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenQrScanner={() => handleNavigate('attendance')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080f0d] text-[#f3f4f6] flex">
      <NetworkSyncToast />
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenLogout={() => setIsLogoutOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenLogout={() => setIsLogoutOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onViewPublic={() => setIsPublicView(true)}
          onNavigateLanding={() => handleNavigate('landing_preview')}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <React.Suspense fallback={
            <div className="p-8 text-center bg-[#070d1f] border border-[#1e3a8a]/30 rounded-2xl animate-pulse text-xs text-slate-400 font-mono">
              Loading module...
            </div>
          }>
            {renderActiveView()}
          </React.Suspense>
        </main>
      </div>

      {/* Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={handleLoginSuccess}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirmLogout={handleLogout}
      />
    </div>
  );
};

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.warn('[AppErrorBoundary caught error]:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b18] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <span className="text-2xl font-bold">DRC</span>
          </div>
          <h2 className="text-lg font-bold mb-2">De Rueda Construction ERP Ready</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Click below to refresh the active application view.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}
