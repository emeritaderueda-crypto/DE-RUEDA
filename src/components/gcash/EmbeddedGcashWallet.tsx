import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GcashHubType, GCashTransactionRecord, PayrollRecord, Employee } from '../../types';
import { playSuccessChime, playFailureChime } from '../../utils/audioChime';
import {
  Smartphone,
  Wallet,
  Send,
  ArrowDownLeft,
  PiggyBank,
  PhoneCall,
  TreePine,
  CreditCard,
  Receipt,
  QrCode,
  ShoppingBag,
  Building2,
  ShieldCheck,
  MoreHorizontal,
  Plus,
  Eye,
  EyeOff,
  Bell,
  Mail,
  Menu,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Lock,
  Download,
  ExternalLink,
  Users,
  Shield,
  Fingerprint,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface EmbeddedGcashWalletProps {
  hubId: GcashHubType;
  onClose?: () => void;
  className?: string;
  isEmbeddedCard?: boolean;
}

type WalletScreen =
  | 'LOGIN'
  | 'HOME'
  | 'SEND_SELECT'
  | 'SEND_FORM'
  | 'SEND_CONFIRM'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILURE'
  | 'PENDING'
  | 'TRANSACTIONS'
  | 'CASH_IN'
  | 'PROFILE'
  | 'CREDIT';

export const EmbeddedGcashWallet: React.FC<EmbeddedGcashWalletProps> = ({
  hubId,
  onClose,
  className = '',
  isEmbeddedCard = false,
}) => {
  const {
    currentUser,
    currentSite,
    sites,
    employees,
    payroll,
    gcashWalletBalance,
    gcashTransactions,
    sendGcashDisbursement,
    topUpGcashWallet,
    isOnline,
    addAuditLog,
  } = useApp();

  // Hub specific account metadata
  const hubAccounts = useMemo(() => {
    return {
      ceo_hub: {
        accountName: 'Engr. Emerita De Rueda',
        accountTitle: 'CEO & Managing Director',
        mobileNumber: '0917-582-9104',
        maskedMobile: '+63 917 ••• 9104',
        tier: 'Corporate Enterprise Plus',
        defaultMpin: '0279',
        badge: 'CEO VAULT',
        limit: 1000000,
        allowedSite: 'ALL',
      },
      exec_distribution_hub: {
        accountName: 'Admin 1 (HR Lead)',
        accountTitle: 'Executive Payroll Director',
        mobileNumber: '0917-889-4321',
        maskedMobile: '+63 917 ••• 4321',
        tier: 'HR Payroll Distribution Float',
        defaultMpin: '1122',
        badge: 'HR EXECUTIVE',
        limit: 500000,
        allowedSite: 'ALL',
      },
      admin2_distribution_hub: {
        accountName: 'Admin 2 (Site Ops)',
        accountTitle: 'Field Operations Timekeeper',
        mobileNumber: '0918-771-0022',
        maskedMobile: '+63 918 ••• 0022',
        tier: 'Site Operations Petty Cash Float',
        defaultMpin: '2233',
        badge: 'SITE OPS (ISOLATED)',
        limit: 200000,
        allowedSite: currentUser?.assigned_sites?.[0] || 'SITE-001',
      },
    };
  }, [currentUser]);

  const activeAccount = hubAccounts[hubId] || hubAccounts.ceo_hub;

  // Wallet Navigation & Security State
  const [currentScreen, setCurrentScreen] = useState<WalletScreen>('HOME');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [mpinInput, setMpinInput] = useState<string>('');
  const [mpinError, setMpinError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'credit'>('balance');

  // Bottom navigation state
  const [bottomNav, setBottomNav] = useState<'home' | 'activity' | 'inbox' | 'profile'>('home');

  // Payout Form States
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientMobile, setRecipientMobile] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendPurpose, setSendPurpose] = useState<string>('Weekly Salary Payroll');
  const [sendCategory, setSendCategory] = useState<GCashTransactionRecord['category']>('Weekly Salary');
  const [paymentPin, setPaymentPin] = useState<string>('');
  const [isQuickPayrollModal, setIsQuickPayrollModal] = useState<boolean>(false);

  // Transaction execution outcomes
  const [processingStatusText, setProcessingStatusText] = useState<string>('Verifying GCash Gateway...');
  const [lastSuccessTx, setLastSuccessTx] = useState<{
    referenceNo: string;
    receiptUrl: string;
    amount: number;
    recipientName: string;
    recipientMobile: string;
    timestamp: string;
  } | null>(null);
  const [lastErrorMsg, setLastErrorMsg] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Cash In state
  const [cashInAmount, setCashInAmount] = useState<number>(50000);
  const [cashInSource, setCashInSource] = useState<string>('BDO Corporate Online');

  // Transaction Ledger Filters
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [txFilterType, setTxFilterType] = useState<string>('ALL');
  const [selectedLedgerTx, setSelectedLedgerTx] = useState<GCashTransactionRecord | null>(null);

  // Live time for status bar
  const [liveTime, setLiveTime] = useState<string>('11:29');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s[AP]M/, ''));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter payroll records applicable to this hub
  const hubPendingPayroll = useMemo(() => {
    return payroll.filter((p) => {
      if (p.payment_status !== 'Pending') return false;
      if (hubId === 'admin2_distribution_hub') {
        const assigned = currentUser?.assigned_sites || ['SITE-001'];
        if (!assigned.includes('ALL')) {
          return assigned.includes(p.site_id);
        }
      }
      return true;
    });
  }, [payroll, hubId, currentUser]);

  // Handle MPIN Keypad Input
  const handleKeypadPress = (val: string) => {
    setMpinError(null);
    if (val === 'BACKSPACE') {
      setMpinInput((prev) => prev.slice(0, -1));
      return;
    }
    if (mpinInput.length < 4) {
      const nextPin = mpinInput + val;
      setMpinInput(nextPin);
      if (nextPin.length === 4) {
        verifyMpin(nextPin);
      }
    }
  };

  const verifyMpin = (pin: string) => {
    const valid =
      pin === activeAccount.defaultMpin ||
      pin === '0279' ||
      pin === '1122' ||
      pin === '2233' ||
      pin === '1234';

    if (valid) {
      playSuccessChime();
      setIsLoggedIn(true);
      setCurrentScreen('HOME');
      setMpinInput('');
      setMpinError(null);
      addAuditLog('GCASH_WALLET_LOGIN', 'GCASH_SESSION', activeAccount.mobileNumber, `Logged into GCash wallet for ${hubId}`);
    } else {
      playFailureChime();
      setMpinError('Invalid MPIN. Please try again or tap Quick Demo Access.');
      setMpinInput('');
    }
  };

  const handleQuickDemoLogin = () => {
    setMpinInput(activeAccount.defaultMpin);
    setTimeout(() => {
      verifyMpin(activeAccount.defaultMpin);
    }, 150);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('LOGIN');
    setMpinInput('');
    setMpinError(null);
    addAuditLog('GCASH_WALLET_LOGOUT', 'GCASH_SESSION', activeAccount.mobileNumber, `Logged out of GCash wallet session for ${hubId}`);
  };

  // Pre-fill recipient when selecting a worker from payroll list
  const handleSelectWorkerForSend = (p: PayrollRecord) => {
    const emp = employees.find((e) => e.employee_id === p.employee_id);
    setSelectedPayroll(p);
    setRecipientName(emp?.name || p.employee_id);
    setRecipientMobile(emp?.gcash_number || '0918-234-5671');
    setSendAmount(String(p.net_pay));
    setSendPurpose(`Weekly Salary (${p.week_key}) - ${emp?.name || p.employee_id}`);
    setSendCategory('Weekly Salary');
    setCurrentScreen('SEND_FORM');
  };

  // Submit send money form
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(sendAmount);
    if (!recipientName.trim() || !recipientMobile.trim() || numAmount <= 0) {
      alert('Please provide a valid recipient name, mobile number, and payout amount.');
      return;
    }
    if (numAmount > gcashWalletBalance) {
      alert(`Insufficient GCash balance. Available: ₱${gcashWalletBalance.toLocaleString()}. Please cash in first.`);
      return;
    }
    setCurrentScreen('SEND_CONFIRM');
  };

  // Execute payment transaction
  const handleExecutePayment = async () => {
    const numAmount = Number(sendAmount);
    setCurrentScreen('PROCESSING');
    setProcessingStatusText('Connecting to GCash Payment Gateway...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStatusText('Verifying recipient mobile & token...');
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStatusText('Finalizing cryptographic transaction seal...');

      const targetSite = selectedPayroll ? selectedPayroll.site_id : (currentSite === 'ALL' ? 'SITE-001' : currentSite);

      const res = await sendGcashDisbursement({
        category: sendCategory,
        site_id: targetSite,
        recipient_name: recipientName.trim(),
        recipient_mobile: recipientMobile.trim(),
        amount: numAmount,
        purpose: sendPurpose.trim(),
        payroll_id: selectedPayroll?.payroll_id,
        user_pin: activeAccount.defaultMpin,
      });

      playSuccessChime();
      setLastSuccessTx({
        referenceNo: res.reference_no,
        receiptUrl: res.receipt_url,
        amount: numAmount,
        recipientName: recipientName.trim(),
        recipientMobile: recipientMobile.trim(),
        timestamp: new Date().toLocaleString(),
      });

      if (!isOnline) {
        setCurrentScreen('PENDING');
      } else {
        setCurrentScreen('SUCCESS');
      }
    } catch (err: any) {
      playFailureChime();
      setLastErrorMsg(err?.message || 'Transaction could not be completed. Please check wallet balance.');
      setCurrentScreen('FAILURE');
    }
  };

  // Execute Cash In / Top-Up
  const handleExecuteCashIn = () => {
    if (cashInAmount <= 0) return;
    topUpGcashWallet(cashInAmount, cashInSource);
    playSuccessChime();
    setCurrentScreen('HOME');
    alert(`Successfully credited ₱${cashInAmount.toLocaleString()} to GCash wallet via ${cashInSource}.`);
  };

  // Copy reference number helper
  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // ==========================================
  // RENDER: LOGIN SCREEN
  // ==========================================
  if (!isLoggedIn || currentScreen === 'LOGIN') {
    return (
      <div className={`flex items-center justify-center p-2 sm:p-4 ${className}`}>
        <div className="w-full max-w-sm rounded-[36px] bg-[#005ce6] p-4 text-white shadow-2xl border-4 border-slate-900 relative overflow-hidden flex flex-col min-h-[640px]">
          {/* Mobile phone notch & status bar */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 px-3 pt-1 pb-3">
            <span>{liveTime}</span>
            <div className="w-24 h-4 bg-black/30 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">4G</span>
              <div className="w-4 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Logo & Welcome */}
          <div className="text-center pt-4 pb-6 space-y-1">
            <div className="inline-flex items-center justify-center gap-1.5 text-2xl font-black tracking-tight">
              <span className="bg-white text-[#005ce6] px-2 py-0.5 rounded-lg text-lg font-black">G))</span>
              <span>GCash</span>
            </div>
            <p className="text-xs text-blue-100 font-medium">De Rueda Construction Enterprise Wallet</p>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-mono font-bold tracking-wider uppercase border border-white/20">
              {activeAccount.badge}
            </div>
          </div>

          {/* Account Profile Card */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className="text-xs font-bold text-slate-900">{activeAccount.accountName}</div>
                <div className="text-[10px] text-slate-500 font-medium">{activeAccount.accountTitle}</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-[#005ce6] text-[10px] font-mono font-bold">
                🇵🇭 {activeAccount.mobileNumber}
              </span>
            </div>

            <div className="text-center pt-1">
              <div className="text-xs font-bold text-slate-700">Enter 4-Digit MPIN</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Authorized corporate disbursement access</p>

              {/* 4 Pin Dots */}
              <div className="flex items-center justify-center gap-3.5 my-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      mpinInput.length > idx
                        ? 'bg-[#005ce6] border-[#005ce6] scale-110 shadow-sm'
                        : 'border-slate-300 bg-white'
                    }`}
                  />
                ))}
              </div>

              {mpinError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-600 font-semibold mb-2 animate-shake">
                  {mpinError}
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 pb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-100 text-slate-800 font-bold text-lg flex items-center justify-center shadow-xs transition-colors cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleQuickDemoLogin}
                className="h-11 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ce6] font-bold text-xs flex flex-col items-center justify-center shadow-xs cursor-pointer select-none"
                title="Quick Demo MPIN"
              >
                <Fingerprint className="w-4 h-4" />
                <span className="text-[9px]">Demo</span>
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-100 text-slate-800 font-bold text-lg flex items-center justify-center shadow-xs transition-colors cursor-pointer select-none"
              >
                0
              </button>
              <button
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-rose-100 text-slate-600 font-bold text-sm flex items-center justify-center shadow-xs transition-colors cursor-pointer select-none"
              >
                ⌫
              </button>
            </div>

            {/* Quick Demo Access Button */}
            <button
              onClick={handleQuickDemoLogin}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-[#005ce6] hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock with MPIN ({activeAccount.defaultMpin})</span>
            </button>
          </div>

          {/* Footer notice */}
          <div className="mt-auto text-center pt-3 text-[10px] text-blue-200">
            Regulated by Bangko Sentral ng Pilipinas &bull; De Rueda ERP Security Shield
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN WALLET APPLICATION
  // ==========================================
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Smartphone Shell Frame */}
      <div className="w-full max-w-sm rounded-[38px] bg-slate-900 p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800 relative overflow-hidden flex flex-col min-h-[680px]">
        {/* Mobile Status Bar */}
        <div className="bg-[#005ce6] rounded-t-[30px] pt-2 px-4 pb-1 text-white flex items-center justify-between text-[11px] font-semibold">
          <span>{liveTime}</span>
          <div className="w-20 h-3.5 bg-black/35 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">LTE</span>
            <div className="w-4 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-2xs" />
            </div>
            <span className="text-[9px]">49%</span>
          </div>
        </div>

        {/* GCash Top Navigation Bar (Matches user's image.png exactly) */}
        <div className="bg-[#005ce6] px-4 pt-1 pb-3 text-white flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('PROFILE')}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors relative cursor-pointer"
            title="Menu & Profile"
          >
            <Menu className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#005ce6]" />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="bg-white text-[#005ce6] px-1.5 py-0.2 rounded font-black text-sm tracking-tighter">G))</span>
            <span className="text-lg font-black tracking-tight">GCash</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setBottomNav('inbox');
                setCurrentScreen('TRANSACTIONS');
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors relative cursor-pointer"
              title="Inbox & Notifications"
            >
              <Mail className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#005ce6]" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white cursor-pointer ml-1"
                title="Close GCash Wallet View"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Interactive Screen Container */}
        <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto max-h-[580px]">
          {/* ==================================================== */}
          {/* SCREEN: WALLET HOME (Exact Layout of uploaded image) */}
          {/* ==================================================== */}
          {currentScreen === 'HOME' && (
            <div>
              {/* Blue Header Section with Balance Display */}
              <div className="bg-[#005ce6] px-5 pt-1 pb-6 text-white text-center rounded-b-[24px] shadow-md relative">
                {/* Balance vs Credit Tabs */}
                <div className="flex items-center justify-center gap-8 text-xs font-bold border-b border-white/20 pb-2 mb-3">
                  <button
                    onClick={() => setActiveTab('balance')}
                    className={`pb-1 relative cursor-pointer transition-colors ${
                      activeTab === 'balance' ? 'text-white' : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    <span>Balance</span>
                    {activeTab === 'balance' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('credit')}
                    className={`pb-1 relative cursor-pointer transition-colors ${
                      activeTab === 'credit' ? 'text-white' : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    <span>Credit</span>
                    {activeTab === 'credit' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                    )}
                  </button>
                </div>

                {activeTab === 'balance' ? (
                  <div>
                    {/* Big Bold Balance display */}
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-xs font-bold tracking-wider text-blue-100 mt-1">PHP</span>
                      <span className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
                        {showBalance
                          ? gcashWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '••••••••'}
                      </span>
                      <button
                        onClick={() => setCurrentScreen('CASH_IN')}
                        className="w-7 h-7 rounded-full bg-white text-[#005ce6] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer ml-1"
                        title="Cash In / Top Up Float"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-blue-100 font-medium">
                      <span>Available Balance</span>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-1 hover:text-white transition-colors cursor-pointer"
                        title={showBalance ? 'Hide Balance' : 'Show Balance'}
                      >
                        {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-xs font-bold tracking-wider text-blue-100 mt-1">PHP</span>
                      <span className="text-3xl font-black tracking-tight">500,000.00</span>
                    </div>
                    <div className="text-xs text-blue-100 mt-1">Approved GCredit Line &bull; 0% Interest Promo</div>
                  </div>
                )}
              </div>

              {/* 12 Feature Buttons Grid (Exact 3x4 Grid from uploaded image.png) */}
              <div className="mx-3 -mt-3 bg-white rounded-2xl p-4 shadow-md border border-slate-100">
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                  {/* 1. Cash In */}
                  <button
                    onClick={() => setCurrentScreen('CASH_IN')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Cash In</span>
                  </button>

                  {/* 2. Send Money */}
                  <button
                    onClick={() => setCurrentScreen('SEND_SELECT')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <Send className="w-5 h-5 -rotate-45" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Send Money</span>
                  </button>

                  {/* 3. Save Money */}
                  <button
                    onClick={() => alert('GSave: Corporate contingency reserve fund yields 4.5% annual interest.')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Save Money</span>
                  </button>

                  {/* 4. Buy Load */}
                  <button
                    onClick={() => {
                      setRecipientName('Site Engineer Field Pack');
                      setRecipientMobile('0917-123-4567');
                      setSendAmount('500');
                      setSendPurpose('Mobile Load All-Net Promo 500');
                      setSendCategory('Site Operations (Fuel/Emergency)');
                      setCurrentScreen('SEND_CONFIRM');
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Buy Load</span>
                  </button>

                  {/* 5. GCash Forest */}
                  <button
                    onClick={() => alert('GCash Forest: Paperless payroll has saved 420kg of CO2 and protected 35 Bataan trees!')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
                      <TreePine className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">GCash Forest</span>
                  </button>

                  {/* 6. Manage Credit */}
                  <button
                    onClick={() => setActiveTab('credit')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Manage Credit</span>
                  </button>

                  {/* 7. Pay Bills */}
                  <button
                    onClick={() => {
                      setRecipientName('Subic Bay Electric / Meralco');
                      setRecipientMobile('0918-999-1122');
                      setSendAmount('12500');
                      setSendPurpose('Site Power & Water Utility Bill');
                      setSendCategory('Materials & Vendor Payout');
                      setCurrentScreen('SEND_CONFIRM');
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Pay Bills</span>
                  </button>

                  {/* 8. Pay QR */}
                  <button
                    onClick={() => {
                      alert('Pay QR: Turnstile QR Scanner or Canteen Concessionaire QR code ready for instant scan.');
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Pay QR</span>
                  </button>

                  {/* 9. GLife */}
                  <button
                    onClick={() => alert('GLife: Corporate construction equipment supplier discounts.')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer relative"
                  >
                    <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white text-[8px] font-black px-1 rounded-full">New</span>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">GLife</span>
                  </button>

                  {/* 10. Bank Transfer */}
                  <button
                    onClick={() => {
                      setRecipientName('BDO Corporate Payroll Account');
                      setRecipientMobile('0917-889-4321');
                      setSendAmount('25000');
                      setSendPurpose('InstaPay Bank Transfer Settlement');
                      setSendCategory('Materials & Vendor Payout');
                      setCurrentScreen('SEND_CONFIRM');
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Bank Transfer</span>
                  </button>

                  {/* 11. GInsure */}
                  <button
                    onClick={() => alert('GInsure: DOLE Mandatory Construction Safety & Personal Accident Insurance Coverage.')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer relative"
                  >
                    <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white text-[8px] font-black px-1 rounded-full">New</span>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">GInsure</span>
                  </button>

                  {/* 12. Show More */}
                  <button
                    onClick={() => setCurrentScreen('TRANSACTIONS')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ce6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">Show More</span>
                  </button>
                </div>
              </div>

              {/* Quick Payroll Payout Banner (Exclusive DRC Construction Feature) */}
              <div className="mx-3 mt-3 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Weekly Laborer Payouts</span>
                    <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono font-bold">
                      {hubPendingPayroll.length} Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-white/90 mt-0.5">
                    Instant 1-tap GCash salary disbursement with DOLE receipt
                  </p>
                </div>
                <button
                  onClick={() => setCurrentScreen('SEND_SELECT')}
                  className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs font-black rounded-xl shadow-xs transition-transform cursor-pointer shrink-0"
                >
                  Pay Workers
                </button>
              </div>

              {/* Recent Activity Mini-Feed */}
              <div className="mx-3 mt-3 mb-4 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Recent Disbursements</span>
                  <button
                    onClick={() => setCurrentScreen('TRANSACTIONS')}
                    className="text-[11px] text-[#005ce6] font-bold hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-1">
                  {gcashTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.transaction_id}
                      onClick={() => {
                        setSelectedLedgerTx(tx);
                        setCurrentScreen('TRANSACTIONS');
                      }}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg px-1 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#005ce6] flex items-center justify-center font-bold text-xs">
                          {tx.category === 'Treasury Top-Up' ? '+' : '₱'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                            {tx.recipient_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.reference_no}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold font-mono ${
                          tx.category === 'Treasury Top-Up' ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {tx.category === 'Treasury Top-Up' ? '+' : '-'}₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[9px] text-emerald-600 font-semibold">● Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: SEND MONEY - CHOOSE WORKER OR NUMBER        */}
          {/* ==================================================== */}
          {currentScreen === 'SEND_SELECT' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Express Send &amp; Payout</h3>
                <div className="w-10" />
              </div>

              {/* Express Send Custom Number Card */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Send to Any GCash Number</div>
                <p className="text-[11px] text-slate-500">Spot emergency payment, supplier fuel, or custom number</p>
                <button
                  onClick={() => {
                    setSelectedPayroll(null);
                    setRecipientName('');
                    setRecipientMobile('09');
                    setSendAmount('');
                    setSendPurpose('Site Field Operations Voucher');
                    setSendCategory('Site Operations (Fuel/Emergency)');
                    setCurrentScreen('SEND_FORM');
                  }}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-[#005ce6] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enter Custom Mobile Number</span>
                </button>
              </div>

              {/* Quick Laborer Selection List */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">
                    Pending Laborer Salaries ({hubPendingPayroll.length})
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">1-Click Payout</span>
                </div>

                {hubPendingPayroll.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                    All weekly laborer salaries for this hub are paid!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                    {hubPendingPayroll.map((p) => {
                      const emp = employees.find((e) => e.employee_id === p.employee_id);
                      return (
                        <div
                          key={p.payroll_id}
                          onClick={() => handleSelectWorkerForSend(p)}
                          className="py-2.5 flex items-center justify-between hover:bg-blue-50/60 p-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{emp?.name || p.employee_id}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {emp?.position || 'Laborer'} &bull; {emp?.gcash_number || '0918-234-5671'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-[#005ce6] font-mono">
                              ₱{p.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              Pay via GCash
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: SEND MONEY - INPUT FORM                      */}
          {/* ==================================================== */}
          {currentScreen === 'SEND_FORM' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('SEND_SELECT')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Express Send Details</h3>
                <div className="w-10" />
              </div>

              <form onSubmit={handleProceedToConfirm} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#005ce6] font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">GCash Mobile Number</label>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#005ce6]">
                    <span className="px-2.5 py-2 bg-slate-50 text-xs font-bold text-slate-600 border-r border-slate-300">
                      🇵🇭 +63
                    </span>
                    <input
                      type="text"
                      required
                      value={recipientMobile.replace(/^\+63\s?/, '')}
                      onChange={(e) => setRecipientMobile(e.target.value)}
                      placeholder="917 123 4567"
                      className="w-full px-3 py-2 text-xs outline-none font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">Amount (PHP)</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Max: ₱{gcashWalletBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₱</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="1"
                      max={gcashWalletBalance}
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-base font-black font-mono border border-slate-300 rounded-xl outline-none focus:border-[#005ce6] text-slate-900"
                    />
                  </div>

                  {/* Fast Preset Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[500, 1000, 5000, 10000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setSendAmount(String(amt))}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-[#005ce6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        +₱{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Message / Purpose</label>
                  <input
                    type="text"
                    value={sendPurpose}
                    onChange={(e) => setSendPurpose(e.target.value)}
                    placeholder="e.g. Weekly Wage or Emergency Site Fund"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#005ce6] text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#005ce6] hover:bg-blue-600 active:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
                >
                  Review Payout &bull; Next
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: SEND CONFIRMATION                           */}
          {/* ==================================================== */}
          {currentScreen === 'SEND_CONFIRM' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('SEND_FORM')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Confirm Payment</h3>
                <div className="w-10" />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4 text-center">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">You are sending</div>
                  <div className="text-3xl font-black text-[#005ce6] font-mono mt-0.5">
                    ₱{Number(sendAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">From Account:</span>
                    <span className="font-bold text-slate-800">{activeAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Recipient:</span>
                    <span className="font-bold text-slate-900">{recipientName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Mobile No:</span>
                    <span className="font-mono font-bold text-slate-900">{recipientMobile}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{sendPurpose}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Convenience Fee:</span>
                    <span className="font-bold text-emerald-600">₱0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between pt-0.5 text-sm font-black text-slate-900">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#005ce6]">
                      ₱{Number(sendAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleExecutePayment}
                  className="w-full py-3 bg-[#005ce6] hover:bg-blue-600 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform cursor-pointer"
                >
                  Send PHP {Number(sendAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: PROCESSING LOADING STATE                    */}
          {/* ==================================================== */}
          {currentScreen === 'PROCESSING' && (
            <div className="p-8 flex flex-col items-center justify-center my-auto text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-[#005ce6] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#005ce6]">
                  G))
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Processing Disbursement</h4>
                <p className="text-xs text-slate-500 mt-1 animate-pulse font-medium">
                  {processingStatusText}
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Encrypted via DRC Corporate GCash Enterprise Bridge
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: SUCCESS CONFIRMATION RECEIPT                */}
          {/* ==================================================== */}
          {currentScreen === 'SUCCESS' && lastSuccessTx && (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-3xl p-5 text-center shadow-lg border border-slate-100 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                    Payment Successful
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₱{lastSuccessTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Sent to <strong>{lastSuccessTx.recipientName}</strong>
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 text-left text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-sans">Reference No.</span>
                    <button
                      onClick={() => handleCopyRef(lastSuccessTx.referenceNo)}
                      className="font-bold text-[#005ce6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{lastSuccessTx.referenceNo}</span>
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">Mobile Number</span>
                    <span className="text-slate-700 font-bold">{lastSuccessTx.recipientMobile}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">Timestamp</span>
                    <span className="text-slate-700">{lastSuccessTx.timestamp}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">SMS Payslip</span>
                    <span className="text-emerald-600 font-bold font-sans">● Automated Link Sent</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={lastSuccessTx.receiptUrl}
                    download={`GCash_Receipt_${lastSuccessTx.referenceNo}.svg`}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </a>

                  <button
                    onClick={() => {
                      setCurrentScreen('HOME');
                      setSelectedPayroll(null);
                    }}
                    className="flex-1 py-2.5 bg-[#005ce6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: PENDING / OFFLINE QUEUED                    */}
          {/* ==================================================== */}
          {currentScreen === 'PENDING' && lastSuccessTx && (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-3xl p-5 text-center shadow-lg border border-amber-200 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Offline Queued &bull; Local Cache Sealed
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₱{lastSuccessTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Stored on device for <strong>{lastSuccessTx.recipientName}</strong>
                  </p>
                </div>

                <div className="bg-amber-50/60 rounded-2xl p-3 text-left text-xs space-y-1.5 text-amber-900">
                  <p className="leading-relaxed text-[11px]">
                    Site network connection is currently offline. This disbursement is secured in IndexedDB &amp; Service Worker queue. It will automatically upload to the central database as soon as connection is detected.
                  </p>
                  <div className="font-mono text-[10px] text-amber-700 pt-1">
                    Reference: {lastSuccessTx.referenceNo}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Return to Wallet
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: FAILURE STATE                                */}
          {/* ==================================================== */}
          {currentScreen === 'FAILURE' && (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-3xl p-5 text-center shadow-lg border border-rose-200 space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded-full">
                    Payment Failed
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">Disbursement Declined</h4>
                  <p className="text-xs text-rose-700 font-medium mt-1 leading-relaxed">
                    {lastErrorMsg || 'The transaction could not be authorized by GCash.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setCurrentScreen('SEND_FORM')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => setCurrentScreen('HOME')}
                    className="flex-1 py-2.5 bg-[#005ce6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Back to Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: TRANSACTION HISTORY & LEDGER                */}
          {/* ==================================================== */}
          {currentScreen === 'TRANSACTIONS' && (
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Transaction History</h3>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#005ce6] px-2 py-0.5 rounded">
                  {gcashTransactions.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  placeholder="Search recipient or reference..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#005ce6]"
                />
              </div>

              {/* Transaction List */}
              <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100">
                {gcashTransactions
                  .filter((tx) => {
                    if (txSearchQuery.trim()) {
                      const q = txSearchQuery.toLowerCase();
                      return (
                        tx.recipient_name.toLowerCase().includes(q) ||
                        tx.reference_no.toLowerCase().includes(q) ||
                        tx.recipient_mobile.includes(q)
                      );
                    }
                    return true;
                  })
                  .map((tx) => (
                    <div
                      key={tx.transaction_id}
                      onClick={() => setSelectedLedgerTx(tx)}
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                          {tx.recipient_name}
                        </span>
                        <span className={`text-xs font-black font-mono ${
                          tx.category === 'Treasury Top-Up' ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {tx.category === 'Treasury Top-Up' ? '+' : '-'}₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{tx.reference_no}</span>
                        <span>{tx.timestamp.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Selected Transaction Detail View Modal */}
              {selectedLedgerTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl max-w-xs w-full p-4 space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-slate-800">Official GCash Receipt</span>
                      <button onClick={() => setSelectedLedgerTx(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="text-center space-y-1 py-1">
                      <div className="text-xs text-slate-500 font-semibold">{selectedLedgerTx.category}</div>
                      <div className="text-2xl font-black text-[#005ce6] font-mono">
                        ₱{selectedLedgerTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs font-bold text-slate-900">{selectedLedgerTx.recipient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{selectedLedgerTx.recipient_mobile}</div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ref No:</span>
                        <span className="font-bold text-[#005ce6]">{selectedLedgerTx.reference_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span>{selectedLedgerTx.timestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-emerald-600 font-bold">COMPLETED</span>
                      </div>
                    </div>

                    <a
                      href={selectedLedgerTx.receipt_url}
                      download={`Receipt_${selectedLedgerTx.reference_no}.svg`}
                      className="w-full py-2 bg-[#005ce6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: CASH IN (TOP UP FLOAT)                      */}
          {/* ==================================================== */}
          {currentScreen === 'CASH_IN' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Cash In Float</h3>
                <div className="w-10" />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Cash In Amount</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[20000, 50000, 100000, 250000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setCashInAmount(amt)}
                        className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                          cashInAmount === amt
                            ? 'bg-[#005ce6] text-white border-[#005ce6] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₱{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Funding Bank / Channel</label>
                  <select
                    value={cashInSource}
                    onChange={(e) => setCashInSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                  >
                    <option value="BDO Corporate Online">BDO Corporate Online Banking</option>
                    <option value="BPI Direct Corporate Link">BPI Direct Corporate Link</option>
                    <option value="UnionBank Corporate Treasury">UnionBank Corporate Treasury</option>
                    <option value="7-Eleven Barcode / OTC">7-Eleven Barcode Cash Float</option>
                    <option value="Metrobank Direct Transfer">Metrobank Direct Transfer</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-[#005ce6] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Instant Float Liquidity</span>
                  </div>
                  <p className="text-slate-600">
                    Will instantly credit ₱{cashInAmount.toLocaleString()} to this hub's merchant balance.
                  </p>
                </div>

                <button
                  onClick={handleExecuteCashIn}
                  className="w-full py-2.5 bg-[#005ce6] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Cash In ₱{cashInAmount.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN: PROFILE & LOGOUT                             */}
          {/* ==================================================== */}
          {currentScreen === 'PROFILE' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="flex items-center gap-1 text-xs font-bold text-[#005ce6] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800">Account &amp; Security</h3>
                <div className="w-10" />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#005ce6] text-white flex items-center justify-center font-black text-lg">
                    {activeAccount.accountName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{activeAccount.accountName}</div>
                    <div className="text-xs text-slate-500">{activeAccount.accountTitle}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">● Fully Verified Plus</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile No:</span>
                    <span className="font-mono font-bold text-slate-800">{activeAccount.mobileNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Tier:</span>
                    <span className="font-semibold text-[#005ce6]">{activeAccount.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Payout Limit:</span>
                    <span className="font-mono font-bold text-slate-800">₱{activeAccount.limit.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance:</span>
                    <span className="font-mono font-bold text-emerald-600">₱{gcashWalletBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200 mt-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of GCash Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Mobile App Bar (Home, Activity, Scan QR, Inbox, Profile) */}
        <div className="bg-white border-t border-slate-200 rounded-b-[30px] px-4 py-2 flex items-center justify-around text-slate-400">
          <button
            onClick={() => {
              setBottomNav('home');
              setCurrentScreen('HOME');
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              bottomNav === 'home' && currentScreen === 'HOME' ? 'text-[#005ce6]' : 'hover:text-slate-600'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button
            onClick={() => {
              setBottomNav('activity');
              setCurrentScreen('TRANSACTIONS');
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              currentScreen === 'TRANSACTIONS' ? 'text-[#005ce6]' : 'hover:text-slate-600'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] font-bold">Activity</span>
          </button>

          {/* QR Center Button */}
          <button
            onClick={() => {
              alert('Pay QR / Scan QR Scanner: Ready to scan employee biometric QR badge.');
            }}
            className="-mt-5 w-11 h-11 rounded-full bg-[#005ce6] text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Scan QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setBottomNav('inbox');
              setCurrentScreen('TRANSACTIONS');
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              bottomNav === 'inbox' ? 'text-[#005ce6]' : 'hover:text-slate-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span className="text-[9px] font-bold">Inbox</span>
          </button>

          <button
            onClick={() => {
              setBottomNav('profile');
              setCurrentScreen('PROFILE');
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              currentScreen === 'PROFILE' ? 'text-[#005ce6]' : 'hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
