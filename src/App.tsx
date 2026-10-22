import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AuthModal } from './components/modals/AuthModal';
import { LogoutModal } from './components/modals/LogoutModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { EmployeesView } from './components/views/EmployeesView';
import { SitesView } from './components/views/SitesView';
import { AttendanceView } from './components/views/AttendanceView';
import { DeductionsView } from './components/views/DeductionsView';
import { PayrollView } from './components/views/PayrollView';
import { CashFlowView } from './components/views/CashFlowView';
import { PayslipsView } from './components/views/PayslipsView';
import { MaterialsView } from './components/views/MaterialsView';
import { ExpensesView } from './components/views/ExpensesView';
import { ReportsView } from './components/views/ReportsView';
import { MessagesView } from './components/views/MessagesView';
import { DocumentsView } from './components/views/DocumentsView';
import { IntakeView } from './components/views/IntakeView';
import { SettingsView } from './components/views/SettingsView';
import { AuditView } from './components/views/AuditView';
import { PublicWebsiteView } from './components/views/PublicWebsiteView';
import { LandingPagePreviewView } from './components/views/LandingPagePreviewView';
import { CeoMonitoringView } from './components/views/CeoMonitoringView';
import { PaymentRecordsHubView } from './components/views/PaymentRecordsHubView';
import { CanteenView } from './components/views/CanteenView';
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
      <>
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
      </>
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
          {renderActiveView()}
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

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
