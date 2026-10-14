import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CeoPasswordModal } from '../modals/CeoPasswordModal';
import { CanteenGcashPayoutModal } from '../modals/CanteenGcashPayoutModal';
import { PageId } from '../layout/Sidebar';
import { GCashTransactionRecord, Site } from '../../types';
import {
  Wallet,
  Shield,
  Lock,
  Send,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileCheck2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Smartphone,
  Search,
  Filter,
  X,
  CreditCard,
  RefreshCw,
  ExternalLink,
  UtensilsCrossed,
  Edit,
  Save,
  Phone,
} from 'lucide-react';

interface CeoGcashDashboardViewProps {
  onNavigate: (page: PageId) => void;
}

export const CeoGcashDashboardView: React.FC<CeoGcashDashboardViewProps> = ({ onNavigate }) => {
  const {
    payroll,
    employees,
    sites,
    deductions,
    gcashTransactions,
    gcashWalletBalance,
    sendGcashDisbursement,
    updateSite,
    isCeoUnlocked,
    lockCeoVault,
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(!isCeoUnlocked);

  // Canteen Payout Modal States
  const [selectedCanteenSite, setSelectedCanteenSite] = useState<Site | null>(null);
  const [isCanteenModalOpen, setIsCanteenModalOpen] = useState(false);
  const [inlineEditingSiteId, setInlineEditingSiteId] = useState<string | null>(null);
  const [canteenVendorNameInput, setCanteenVendorNameInput] = useState('');
  const [canteenGcashInput, setCanteenGcashInput] = useState('');

  // Send GCash Form States (Site Operations & Spot Payments)
  const [recipientName, setRecipientName] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [category, setCategory] = useState<GCashTransactionRecord['category']>('Site Operations (Fuel/Emergency)');
  const [siteId, setSiteId] = useState('SITE-001');
  const [amount, setAmount] = useState<number>(5000);
  const [purpose, setPurpose] = useState('');
  const [ceoPin, setCeoPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Search & Filter for Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Receipt Modal State
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<GCashTransactionRecord | null>(null);

  // Pending payroll records
  const pendingPayroll = payroll.filter((p) => p.payment_status === 'Pending');

  // Single payroll disburse handler
  const handleDisbursePayroll = async (payrollId: string) => {
    const pRecord = payroll.find((p) => p.payroll_id === payrollId);
    if (!pRecord) return;
    const emp = employees.find((e) => e.employee_id === pRecord.employee_id);
    const empName = emp?.name || pRecord.employee_id;
    const gcashNum = emp?.gcash_number || '09182345671';

    setIsSubmitting(true);
    const res = await sendGcashDisbursement({
      category: 'Weekly Salary',
      site_id: pRecord.site_id,
      recipient_name: empName,
      recipient_mobile: gcashNum,
      amount: pRecord.net_pay,
      purpose: `Weekly Wage Payout (${pRecord.week_key}) - ${empName}`,
      payroll_id: payrollId,
      user_pin: 'Emerita0279',
    });
    setIsSubmitting(false);

    setNotificationMsg(
      `Disbursed ₱${pRecord.net_pay.toLocaleString()} to ${empName} via GCash. Reference No: ${res.reference_no}. Real-time sync complete!`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 6000);
  };

  // Batch disburse all pending payroll
  const handleBatchDisbursePayroll = async () => {
    if (pendingPayroll.length === 0) return;
    setIsSubmitting(true);

    let count = 0;
    let total = 0;

    for (const p of pendingPayroll) {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      const empName = emp?.name || p.employee_id;
      const gcashNum = emp?.gcash_number || '09182345671';

      await sendGcashDisbursement({
        category: 'Weekly Salary',
        site_id: p.site_id,
        recipient_name: empName,
        recipient_mobile: gcashNum,
        amount: p.net_pay,
        purpose: `Batch Weekly Wage (${p.week_key}) - ${empName}`,
        payroll_id: p.payroll_id,
        user_pin: 'Emerita0279',
      });
      count++;
      total += p.net_pay;
    }

    setIsSubmitting(false);
    setNotificationMsg(
      `Successfully batch-disbursed ${count} weekly employee salaries totaling ₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}. All transactions synced real-time.`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 7000);
  };

  // Custom GCash Send (Site Operations / Fuel / Materials)
  const handleCustomSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientMobile.trim() || amount <= 0) return;

    setIsSubmitting(true);
    const res = await sendGcashDisbursement({
      category,
      site_id: siteId,
      recipient_name: recipientName.trim(),
      recipient_mobile: recipientMobile.trim(),
      amount: Number(amount),
      purpose: purpose.trim() || 'Site Operations Disbursement',
      user_pin: ceoPin.trim(),
    });
    setIsSubmitting(false);

    setNotificationMsg(
      `GCash payout of ₱${Number(amount).toLocaleString()} to ${recipientName} completed. Ref: ${res.reference_no}.`
    );

    // Reset form
    setRecipientName('');
    setRecipientMobile('');
    setPurpose('');

    setTimeout(() => {
      setNotificationMsg(null);
    }, 6000);
  };

  // Canteen Concessionaire Management Handlers
  const handleStartEditCanteen = (s: Site) => {
    setInlineEditingSiteId(s.site_id);
    setCanteenVendorNameInput(s.canteen_vendor_name || `${s.name} Canteen Concessionaire`);
    setCanteenGcashInput(s.canteen_gcash_number || '09171234567');
  };

  const handleSaveCanteen = (siteId: string) => {
    let cleanMobile = canteenGcashInput.trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }
    updateSite(siteId, {
      canteen_vendor_name: canteenVendorNameInput.trim(),
      canteen_gcash_number: cleanMobile || '09171234567',
    });
    setInlineEditingSiteId(null);
    setNotificationMsg(`Updated canteen concessionaire & GCash details for ${siteId}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleOpenCanteenPayoutModal = (s: Site) => {
    setSelectedCanteenSite(s);
    setIsCanteenModalOpen(true);
  };

  // If locked, present security challenge
  if (!isCeoUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              Restricted Financial Gate
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              CEO Dedicated GCash Operations Hub
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Authorized direct execution of corporate GCash disbursements for weekly worker salaries and site operations. Access is strictly restricted.
            </p>
          </div>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#080f0d] font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Unlock GCash Terminal</span>
          </button>

          <CeoPasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSuccess={() => setIsPasswordModalOpen(false)}
            targetDashboardName="CEO GCash Operations Hub"
          />
        </div>
      </div>
    );
  }

  // Filter transactions for ledger
  const filteredTransactions = gcashTransactions.filter((tx) => {
    if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tx.recipient_name.toLowerCase().includes(q);
      const matchRef = tx.reference_no.toLowerCase().includes(q);
      const matchMobile = tx.recipient_mobile.includes(q);
      const matchSite = tx.site_name.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchMobile && !matchSite) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                CEO Dedicated GCash Operations Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                EMERITA ZERO TWO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                REAL-TIME SYNCED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct corporate disbursement terminal for weekly salaries and site operations &bull; Automatic receipt generation & immutable audit ledger
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('ceo_monitoring')}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-[#a3e635]" />
            <span>CEO Monitoring Hub</span>
          </button>

          <button
            onClick={() => lockCeoVault()}
            className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock CEO Vault immediately"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Corporate GCash Wallet & Liquidity Status Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#38bdf8]" />
            Corporate GCash Merchant Balance
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tabular-nums">
              ₱{gcashWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-400 font-bold">● Active & Regulated</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Merchant: De Rueda Construction Corp &bull; Account: 0917-582-9104 &bull; Daily Limit: ₱1,000,000.00
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto text-xs text-slate-300 font-mono">
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-lg">
            <div className="text-[10px] text-slate-400">Total Disbursements</div>
            <div className="font-bold text-white text-sm">
              {gcashTransactions.length} Executed
            </div>
          </div>
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-lg">
            <div className="text-[10px] text-slate-400">Pending Salaries</div>
            <div className="font-bold text-amber-400 text-sm">
              {pendingPayroll.length} Workers
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two Column Section: Section 1 (Weekly Salaries) & Section 2 (Site Operations & Spot Funds) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 1: Weekly Salaries Disbursement */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Weekly Worker Salaries Payout
                </h3>
                <span className="text-[10px] text-slate-400">
                  {pendingPayroll.length} pending employee disbursements
                </span>
              </div>
            </div>

            {pendingPayroll.length > 0 && (
              <button
                onClick={handleBatchDisbursePayroll}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Batch Payout All ({pendingPayroll.length})</span>
              </button>
            )}
          </div>

          {/* Pending workers list */}
          <div className="space-y-2 flex-1 max-h-96 overflow-y-auto pr-1">
            {pendingPayroll.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white">All Weekly Salaries Disbursed</div>
                <div className="text-[11px] text-slate-500">
                  Zero pending payroll payouts across Mariveles, Subic, and Balanga.
                </div>
              </div>
            ) : (
              pendingPayroll.map((p) => {
                const emp = employees.find((e) => e.employee_id === p.employee_id);
                const empName = emp?.name || p.employee_id;
                const siteObj = sites.find((s) => s.site_id === p.site_id);

                return (
                  <div
                    key={p.payroll_id}
                    className="p-3 bg-[#13241f] border border-[#234338] hover:border-amber-400/50 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{empName}</span>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                          {siteObj?.code || p.site_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {emp?.position} &bull; GCash: <strong className="text-slate-300 font-mono">{emp?.gcash_number || '09182345671'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Week: {p.week_key} &bull; Days: {p.verified_days}d ({p.verified_hours}h)
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="font-mono font-bold text-sm text-white">
                        ₱{p.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => handleDisbursePayroll(p.payroll_id)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 ml-auto disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send GCash</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[#234338] flex items-center justify-between text-[11px] text-slate-400">
            <span>Direct biometric to wage settlement</span>
            <button
              onClick={() => onNavigate('payroll')}
              className="text-[#a3e635] hover:underline font-semibold"
            >
              Full Payroll Table &rarr;
            </button>
          </div>
        </div>

        {/* Section 2: Site Operations & Emergency Field Funds */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Send GCash for Site Operations & Field Funds
                </h3>
                <span className="text-[10px] text-slate-400">Fuel allowances, crane rentals, spot emergency cash</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#13241f] text-[#38bdf8] border border-[#234338]">
              INSTANT SETTLEMENT
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleCustomSend} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Aris Valdez / Petron Fuel Station"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Recipient GCash Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="09XXXXXXXXX"
                  value={recipientMobile}
                  onChange={(e) => setRecipientMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Disbursement Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="Site Operations (Fuel/Emergency)">Site Operations (Fuel/Emergency)</option>
                  <option value="Site Canteen Payout">Site Canteen Payout</option>
                  <option value="Subcontractor Spot Payment">Subcontractor Spot Payment</option>
                  <option value="Materials Spot Cash">Materials Spot Cash</option>
                  <option value="Weekly Salary">Weekly Salary (Ad-hoc)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Target Project Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#a3e635]"
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                  <option value="HQ">Corporate Operations HQ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Disbursement Amount (₱ PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  CEO Authorization PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter CEO PIN (Emerita0279)"
                  value={ceoPin}
                  onChange={(e) => setCeoPin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Operational Memo / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Mobile Crane 200L Emergency Fuel / Spot Hardware Delivery"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0 || !recipientName.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Processing GCash...' : `Authorize & Send ₱${amount.toLocaleString()} via GCash`}
                </span>
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-[#234338] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Direct BSP Gateway Verification</span>
            <span className="font-mono text-emerald-400">REAL-TIME SYNC ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Section 2.5: Site Project Canteen GCash Payout & Settlement Hub */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
                  Site Project Canteen GCash Payout &amp; Settlement Hub
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 font-mono">
                  AUTO-CALCULATED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct GCash disbursements to site canteen concessionaires balancing worker meal deductions
              </p>
            </div>
          </div>
        </div>

        {/* Canteen Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sites.map((s) => {
            // Deductions collected for this site
            const siteCanteenCollected = deductions
              .filter((d) => d.site_id === s.site_id && !d.is_void)
              .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

            // GCash payouts already sent to this site's canteen
            const siteCanteenPaid = gcashTransactions
              .filter((tx) => tx.category === 'Site Canteen Payout' && tx.site_id === s.site_id && tx.status === 'COMPLETED')
              .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

            const outstanding = Math.max(0, siteCanteenCollected - siteCanteenPaid);
            const isEditing = inlineEditingSiteId === s.site_id;

            return (
              <div
                key={s.site_id}
                className="bg-[#13241f] border border-[#234338] hover:border-lime-500/50 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-lime-400 bg-[#0e1a16] px-2 py-0.5 rounded border border-[#234338]">
                      {s.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        outstanding > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {outstanding > 0 ? 'Settlement Pending' : 'Fully Settled'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs mt-2 truncate" title={s.name}>
                    {s.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 truncate">{s.location}</div>

                  {/* Concessionaire & GCash Details Box */}
                  <div className="mt-3 p-2.5 bg-[#0e1a16] border border-[#234338] rounded-lg space-y-1.5 text-xs">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            Canteen Concessionaire:
                          </label>
                          <input
                            type="text"
                            value={canteenVendorNameInput}
                            onChange={(e) => setCanteenVendorNameInput(e.target.value)}
                            className="w-full px-2 py-1 bg-[#13241f] border border-[#234338] rounded text-white text-xs font-medium focus:outline-none focus:border-lime-400"
                            placeholder="Vendor Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            GCash Mobile Number:
                          </label>
                          <input
                            type="text"
                            value={canteenGcashInput}
                            onChange={(e) => setCanteenGcashInput(e.target.value)}
                            className="w-full px-2 py-1 bg-[#13241f] border border-[#234338] rounded text-white font-mono text-xs font-bold focus:outline-none focus:border-lime-400"
                            placeholder="09XXXXXXXXX"
                            maxLength={12}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveCanteen(s.site_id)}
                            className="px-2.5 py-1 bg-lime-400 text-[#080f0d] font-bold text-[11px] rounded hover:bg-lime-300 cursor-pointer flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save GCash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingSiteId(null)}
                            className="px-2 py-1 bg-[#13241f] text-slate-400 hover:text-white text-[11px] rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Canteen Concessionaire</span>
                          <button
                            onClick={() => handleStartEditCanteen(s)}
                            className="text-[10px] text-lime-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Edit Canteen GCash Details"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit GCash #</span>
                          </button>
                        </div>
                        <div className="font-semibold text-slate-200 truncate">
                          {s.canteen_vendor_name || `${s.name} Canteen`}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-sky-400">
                          <Smartphone className="w-3.5 h-3.5 shrink-0" />
                          <span>{s.canteen_gcash_number || '09171234567'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Calculations row */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#080f0d] rounded-lg border border-[#234338]/60">
                      <div className="text-[10px] text-slate-400">Deductions Pool</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        ₱{siteCanteenCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2 bg-[#080f0d] rounded-lg border border-[#234338]/60">
                      <div className="text-[10px] text-slate-400">Total Settled</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        ₱{siteCanteenPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium text-[11px]">Outstanding Payout:</span>
                    <span className="font-mono font-black text-lime-300 text-sm">
                      ₱{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Payout Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenCanteenPayoutModal(s)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-bold rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Disburse Canteen Payout via GCash</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Real-Time GCash Transaction Ledger */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
                Master Real-Time GCash Disbursement Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                All transactions instantly update on both the CEO Monitoring Dashboard and the General Operational Dashboard
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#13241f] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-[#a3e635] w-48"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#a3e635]"
            >
              <option value="ALL">All Categories</option>
              <option value="Weekly Salary">Weekly Salary</option>
              <option value="Site Canteen Payout">Site Canteen Payout</option>
              <option value="Site Operations (Fuel/Emergency)">Site Operations (Fuel/Emergency)</option>
              <option value="Subcontractor Spot Payment">Subcontractor Spot Payment</option>
              <option value="Materials Spot Cash">Materials Spot Cash</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#234338] text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Reference No</th>
                <th className="py-2.5 px-3">Recipient & Mobile</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Project Site</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      {tx.reference_no}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{tx.recipient_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.recipient_mobile}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {tx.site_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                      ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-[10px] font-mono text-slate-400">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {tx.receipt_url ? (
                        <button
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="px-2.5 py-1 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-[#a3e635] rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Synced</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Official GCash Receipt</h4>
              </div>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner overflow-hidden">
              <img
                src={selectedReceiptTx.receipt_url}
                alt="GCash Electronic Receipt"
                className="max-h-80 w-full object-contain"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-300 font-mono">
              <div>Ref: <strong className="text-white">{selectedReceiptTx.reference_no}</strong></div>
              <div>Recipient: <span className="text-white">{selectedReceiptTx.recipient_name} ({selectedReceiptTx.recipient_mobile})</span></div>
              <div>Amount: <span className="text-emerald-400 font-bold">₱{selectedReceiptTx.amount.toLocaleString()}</span></div>
              <div>Timestamp: <span className="text-slate-400">{selectedReceiptTx.timestamp}</span></div>
            </div>

            <button
              onClick={() => setSelectedReceiptTx(null)}
              className="w-full py-2 bg-[#13241f] border border-[#234338] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Site Canteen GCash Payout Modal */}
      {selectedCanteenSite && (
        <CanteenGcashPayoutModal
          isOpen={isCanteenModalOpen}
          onClose={() => {
            setIsCanteenModalOpen(false);
            setSelectedCanteenSite(null);
          }}
          site={selectedCanteenSite}
          weekKey="2026-W41"
          onSuccess={(ref) => {
            setNotificationMsg(`Canteen payout successfully disbursed via GCash. Reference No: ${ref}`);
            setTimeout(() => setNotificationMsg(null), 6000);
          }}
        />
      )}
    </div>
  );
};
