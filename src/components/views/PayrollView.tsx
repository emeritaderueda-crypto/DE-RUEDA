import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollRecord } from '../../types';
import {
  Banknote,
  Calculator,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Camera,
  Upload,
  X,
  FileText,
  Printer,
  Smartphone,
  Wallet,
  Zap,
  Send,
  Sparkles,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  Mail,
} from 'lucide-react';
import { GCashPaymentModal } from '../modals/GCashPaymentModal';
import { SmsPayslipLogsModal } from '../modals/SmsPayslipLogsModal';
import { downloadReportPDF, downloadCSV } from '../../utils/exporters';
import { sendPayrollEmail } from '../../utils/emailService';

interface PayrollViewProps {
  onOpenSinglePayslip: (payrollId: string) => void;
}

export type WalletPayrollFilter =
  | 'TOTAL'
  | 'READY_FOR_RELEASE'
  | 'AWAITING_CONFIRMATION'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'NEEDS_REVIEW';

export const PayrollView: React.FC<PayrollViewProps> = ({ onOpenSinglePayslip }) => {
  const {
    payroll,
    dtrWeeks,
    sites,
    employees,
    currentSite,
    recalculatePayroll,
    verifyPayrollProof,
    triggerBatchGcashPayment,
    isOnline,
    smsPayslipLogs,
    masterCutoff,
  } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(dtrWeeks[0]?.week_key || '2026-W40');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [walletFilter, setWalletFilter] = useState<WalletPayrollFilter>('TOTAL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Verified' | 'Paid' | 'Failed'>('ALL');

  // SMS Payslip Delivery Logs Modal
  const [isSmsLogsOpen, setIsSmsLogsOpen] = useState(false);
  const failedSmsCount = smsPayslipLogs.filter((l) => l.status === 'FAILED').length;

  // Individual GCash Payment Modal State
  const [gcashModalRecord, setGcashModalRecord] = useState<PayrollRecord | null>(null);

  // Batch GCash Execution State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Proof Modal
  const [proofingRecord, setProofingRecord] = useState<PayrollRecord | null>(null);
  const [proofForm, setProofForm] = useState({
    payment_method: 'GCash' as 'Cash' | 'GCash',
    reference_no: '',
    status: 'Verified' as 'Verified' | 'Paid',
    proof_url: '',
    notes: '',
    employee_acknowledged: false,
    cash_receiver_witness: '',
  });

  // Base cycle items matching week and site
  const cycleRecords = payroll.filter((p) => {
    const matchW = selectedWeek === 'ALL' || p.week_key === selectedWeek;
    const matchS = siteFilter === 'ALL' || p.site_id === siteFilter;
    return matchW && matchS;
  });

  // Calculate the 7 wallet-style weekly payroll metrics per Upgrades Section 2
  const countTotal = cycleRecords.length;
  const totalAmount = cycleRecords.reduce((s, p) => s + p.net_pay, 0);

  const readyForReleaseItems = cycleRecords.filter(
    (p) => p.payment_status === 'Pending' && p.daily_rate > 0 && p.gross_pay > 0
  );
  const readyForReleaseCount = readyForReleaseItems.length;
  const readyForReleaseAmount = readyForReleaseItems.reduce((s, p) => s + p.net_pay, 0);

  const awaitingConfirmationItems = cycleRecords.filter(
    (p) => p.payment_status === 'Paid'
  );
  const awaitingConfirmationCount = awaitingConfirmationItems.length;
  const awaitingConfirmationAmount = awaitingConfirmationItems.reduce((s, p) => s + p.net_pay, 0);

  const processingItems = cycleRecords.filter(
    (p) => isBatchProcessing && p.payment_status === 'Pending' && p.payment_method === 'GCash'
  );
  const processingCount = processingItems.length;
  const processingAmount = processingItems.reduce((s, p) => s + p.net_pay, 0);

  const confirmedItems = cycleRecords.filter((p) => p.payment_status === 'Verified');
  const confirmedCount = confirmedItems.length;
  const confirmedAmount = confirmedItems.reduce((s, p) => s + p.net_pay, 0);

  const failedItems = cycleRecords.filter((p) => p.payment_status === 'Failed');
  const failedCount = failedItems.length;
  const failedAmount = failedItems.reduce((s, p) => s + p.net_pay, 0);

  const needsReviewItems = cycleRecords.filter(
    (p) =>
      p.total_deductions > p.gross_pay ||
      (p.verified_days === 0 && p.gross_pay > 0) ||
      (p.payment_status === 'Paid' && !p.proof_url)
  );
  const needsReviewCount = needsReviewItems.length;
  const needsReviewAmount = needsReviewItems.reduce((s, p) => s + p.net_pay, 0);

  // Filter records based on selected wallet pill and status dropdown
  const filtered = cycleRecords.filter((p) => {
    // 1. Wallet Filter
    let matchWallet = true;
    if (walletFilter === 'READY_FOR_RELEASE') {
      matchWallet = p.payment_status === 'Pending' && p.daily_rate > 0 && p.gross_pay > 0;
    } else if (walletFilter === 'AWAITING_CONFIRMATION') {
      matchWallet = p.payment_status === 'Paid';
    } else if (walletFilter === 'PROCESSING') {
      matchWallet = isBatchProcessing && p.payment_status === 'Pending' && p.payment_method === 'GCash';
    } else if (walletFilter === 'CONFIRMED') {
      matchWallet = p.payment_status === 'Verified';
    } else if (walletFilter === 'FAILED') {
      matchWallet = p.payment_status === 'Failed';
    } else if (walletFilter === 'NEEDS_REVIEW') {
      matchWallet =
        p.total_deductions > p.gross_pay ||
        (p.verified_days === 0 && p.gross_pay > 0) ||
        (p.payment_status === 'Paid' && !p.proof_url);
    }

    // 2. Secondary Dropdown Filter
    const matchSt = statusFilter === 'ALL' || p.payment_status === statusFilter;

    return matchWallet && matchSt;
  });

  const handleOpenProof = (p: PayrollRecord) => {
    setProofingRecord(p);
    setProofForm({
      payment_method: p.payment_method || 'GCash',
      reference_no: p.reference_no || '',
      status: 'Verified',
      proof_url: p.proof_url || '',
      notes: p.notes || '',
      employee_acknowledged: Boolean(p.proof_url && p.payment_status === 'Verified'),
      cash_receiver_witness: 'Site Cashier & Timekeeper',
    });
  };

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofingRecord) return;

    if (proofForm.payment_method === 'Cash') {
      if (!proofForm.proof_url) {
        alert('DOLE & De Rueda Compliance Enforcement: Cash wage release strictly requires an uploaded or captured photo of the recipient worker receiving the cash envelope before payment can be confirmed.');
        return;
      }
      if (!proofForm.employee_acknowledged) {
        alert('Per compliance rules, cash disbursement requires explicit employee voucher sign-off acknowledgement.');
        return;
      }
    }

    const effectiveRef = proofForm.reference_no.trim() || `VCH-${Date.now().toString().substring(6)}`;

    verifyPayrollProof(
      proofingRecord.payroll_id,
      proofForm.payment_method,
      effectiveRef,
      proofForm.status,
      proofForm.proof_url,
      `${proofForm.notes.trim()}${proofForm.employee_acknowledged ? ' [Employee Personally Acknowledged & Signed]' : ''}`
    );

    // Invoke newly created email utility service once marked as confirmed (for both cash and digital methods)
    if (proofForm.status === 'Verified' || proofForm.status === 'Paid') {
      const emp = employees.find((em) => em.employee_id === proofingRecord.employee_id);
      const empEmail = emp?.email || `${proofingRecord.employee_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@deruedaconstruction.com`;

      sendPayrollEmail({
        payroll_id: proofingRecord.payroll_id,
        employee_id: proofingRecord.employee_id,
        employee_name: emp?.name || proofingRecord.employee_id,
        employee_email: empEmail,
        pay_period: proofingRecord.week_key,
        site_id: proofingRecord.site_id,
        gross_pay: proofingRecord.gross_pay,
        deductions: {
          sss: proofingRecord.sss,
          philhealth: proofingRecord.philhealth,
          canteen: proofingRecord.canteen,
          other: (proofingRecord.other_deduction || 0) + (proofingRecord.cash_advance || 0),
          total: proofingRecord.total_deductions,
        },
        net_pay: proofingRecord.net_pay,
        payment_method: proofForm.payment_method,
        status: proofForm.payment_method === 'Cash' ? 'CASH_CONFIRMED' : 'PAID_VERIFIED',
        reference_no: effectiveRef,
        confirmed_by: proofForm.cash_receiver_witness || 'Finance Officer',
      }).then((emailResult) => {
        if (emailResult.success) {
          console.log('[PayrollView] Automated payslip email dispatched:', emailResult.message);
        } else {
          console.warn('[PayrollView] Payslip email dispatch note:', emailResult.message);
        }
      }).catch((emailErr) => {
        console.warn('[PayrollView] Payslip email dispatch error:', emailErr);
      });
    }

    setProofingRecord(null);
  };

  const handleSimulateCamera = () => {
    // Generate a realistic high-contrast camera receipt snapshot canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f291e';
    ctx.fillRect(0, 0, 400, 240);
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('DE RUEDA CONSTRUCTION', 20, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText('OFFICIAL DISBURSEMENT RECEIPT VOUCHER', 20, 65);
    ctx.fillStyle = '#d1fae5';
    ctx.font = '12px monospace';
    ctx.fillText(`EMPLOYEE: ${proofingRecord?.employee_id || 'DRC-WORKER'}`, 20, 105);
    ctx.fillText(`NET PAYOUT: PHP ${(proofingRecord?.net_pay || 0).toLocaleString()}`, 20, 130);
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString()}`, 20, 155);
    ctx.fillText(`METHOD: ${proofForm.payment_method.toUpperCase()}`, 20, 180);
    ctx.fillStyle = '#10b981';
    ctx.fillText('STATUS: AUDITED & SIGNED OFF', 20, 210);

    const dataUrl = canvas.toDataURL('image/png');
    setProofForm((prev) => ({
      ...prev,
      proof_url: dataUrl,
      employee_acknowledged: true,
      reference_no: prev.reference_no || (prev.payment_method === 'GCash' ? `GC-${Date.now().toString().substring(5)}` : `CSH-VCH-${Date.now().toString().substring(6)}`),
    }));
  };

  const totalGross = filtered.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalDeductions = filtered.reduce((sum, p) => sum + p.total_deductions, 0);
  const totalNet = filtered.reduce((sum, p) => sum + p.net_pay, 0);

  // GCash pending items in current view
  const pendingGcashItems = filtered.filter(
    (p) =>
      p.payment_status === 'Pending' &&
      (p.payment_method === 'GCash' ||
        employees.find((e) => e.employee_id === p.employee_id)?.gcash_number)
  );
  const pendingGcashTotal = pendingGcashItems.reduce((sum, p) => sum + p.net_pay, 0);

  const handleBatchDisburse = async () => {
    if (!masterCutoff.masterSwitchOn) {
      setBatchNotice('BLOCKED: Master Transaction Cut-Off is engaged (OFF). All outbound disbursements are locked by the CEO.');
      return;
    }
    if (pendingGcashItems.length === 0) return;
    setIsBatchProcessing(true);
    setBatchNotice(null);
    try {
      const ids = pendingGcashItems.map((p) => p.payroll_id);
      const res = await triggerBatchGcashPayment(ids);
      setIsBatchProcessing(false);
      setBatchNotice(res.message);
      setTimeout(() => setBatchNotice(null), 6000);
    } catch {
      setIsBatchProcessing(false);
      setBatchNotice('Batch disbursement failed. Please verify site connection.');
    }
  };

  const handleExportRegisterPDF = () => {
    const siteObj = sites.find((s) => s.site_id === siteFilter);
    const siteName = siteFilter === 'ALL' ? 'All Project Sites' : siteObj?.name || siteFilter;
    const filename = `Weekly_Payroll_Register_${selectedWeek}_${siteFilter}.pdf`;
    const headers = [
      'Emp ID',
      'Worker Name',
      'Category',
      'Position',
      'Gross Pay',
      'Canteen',
      'SSS',
      'PhilHealth',
      'Other',
      'Total Deds',
      'Net Pay',
      'Method',
      'Status',
    ];

    const rows = filtered.map((p) => {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      return [
        p.employee_id,
        emp?.name || p.employee_id,
        emp?.category || 'Site-Based',
        emp?.position || 'Worker',
        `P${p.gross_pay.toLocaleString()}`,
        `P${(p.canteen || 0).toLocaleString()}`,
        `P${(p.sss || 0).toLocaleString()}`,
        `P${(p.philhealth || 0).toLocaleString()}`,
        `P${(p.other_deduction || 0).toLocaleString()}`,
        `P${(p.total_deductions || 0).toLocaleString()}`,
        `P${(p.net_pay || 0).toLocaleString()}`,
        p.payment_method,
        p.payment_status,
      ];
    });

    // Add totals row
    rows.push([
      'TOTALS',
      `${filtered.length} Workers`,
      '-',
      '-',
      `P${totalGross.toLocaleString()}`,
      `P${filtered.reduce((s, p) => s + (p.canteen || 0), 0).toLocaleString()}`,
      `P${filtered.reduce((s, p) => s + (p.sss || 0), 0).toLocaleString()}`,
      `P${filtered.reduce((s, p) => s + (p.philhealth || 0), 0).toLocaleString()}`,
      `P${filtered.reduce((s, p) => s + (p.other_deduction || 0), 0).toLocaleString()}`,
      `P${totalDeductions.toLocaleString()}`,
      `P${totalNet.toLocaleString()}`,
      '-',
      '-',
    ]);

    downloadReportPDF(
      filename,
      'WEEKLY PAYROLL REGISTER - DE RUEDA CONSTRUCTION',
      `Payroll Week: ${selectedWeek} | Project: ${siteName} | Exported: ${new Date().toLocaleDateString()}`,
      headers,
      rows,
      true
    );
  };

  const handleExportPaymentVerificationPDF = () => {
    const filename = `Payroll_Payment_Verification_Audit_${selectedWeek}.pdf`;
    const headers = [
      'Payroll ID',
      'Employee ID',
      'Worker Name',
      'Net Amount',
      'Method',
      'Reference No',
      'Payment Status',
      'Proof of Payout',
    ];

    const rows = filtered.map((p) => {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      return [
        p.payroll_id,
        p.employee_id,
        emp?.name || p.employee_id,
        `P${p.net_pay.toLocaleString()}`,
        p.payment_method,
        p.reference_no || 'Pending Receipt',
        p.payment_status,
        p.proof_url ? 'Attached (Verified)' : 'Not Uploaded',
      ];
    });

    downloadReportPDF(
      filename,
      'PAYMENT VERIFICATION & DISBURSEMENT AUDIT LOG',
      `Verified Disbursements for Cycle: ${selectedWeek} | De Rueda Construction Executive Audit`,
      headers,
      rows,
      false
    );
  };

  const handleExportSiteOfficeSummaryPDF = () => {
    const filename = `Site_Office_Workforce_Payroll_Summary_${selectedWeek}.pdf`;
    const headers = [
      'Category',
      'Personnel Count',
      'Total Gross Wages',
      'Total Deductions',
      'Net Salary Payout',
      'Disbursement Methods',
    ];

    const siteBased = filtered.filter((p) => {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      return !((emp?.category || '').toLowerCase().includes('office'));
    });
    const officeBased = filtered.filter((p) => {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      return (emp?.category || '').toLowerCase().includes('office');
    });

    const calcGroup = (group: typeof filtered) => ({
      count: group.length,
      gross: group.reduce((s, p) => s + p.gross_pay, 0),
      deds: group.reduce((s, p) => s + p.total_deductions, 0),
      net: group.reduce((s, p) => s + p.net_pay, 0),
    });

    const siteTotals = calcGroup(siteBased);
    const officeTotals = calcGroup(officeBased);

    const rows = [
      [
        'Site-Based Personnel (Field)',
        siteTotals.count,
        `P${siteTotals.gross.toLocaleString()}`,
        `P${siteTotals.deds.toLocaleString()}`,
        `P${siteTotals.net.toLocaleString()}`,
        'Cash & GCash Mobile',
      ],
      [
        'Office-Based Staff (HQ Operations)',
        officeTotals.count,
        `P${officeTotals.gross.toLocaleString()}`,
        `P${officeTotals.deds.toLocaleString()}`,
        `P${officeTotals.net.toLocaleString()}`,
        'GCash Direct Payroll',
      ],
      [
        'GRAND TOTAL COMBINED',
        filtered.length,
        `P${totalGross.toLocaleString()}`,
        `P${totalDeductions.toLocaleString()}`,
        `P${totalNet.toLocaleString()}`,
        'Consolidated Disbursements',
      ],
    ];

    downloadReportPDF(
      filename,
      'SITE & OFFICE WORKFORCE PAYROLL SUMMARY',
      `Executive Category Breakdown | Cycle Week: ${selectedWeek} | Generated: ${new Date().toLocaleDateString()}`,
      headers,
      rows,
      false
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Weekly Payroll Register & Payment Verification
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span>Verified Attendance &times; Daily Rate &minus; Linked Deductions = Net Pay</span>
            <span>·</span>
            <span className="text-sky-300 font-semibold flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-[#005ce6]" />
              GCash Direct API Gateway Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportRegisterPDF}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-[#a3e635] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export full weekly payroll register with deductions as official PDF"
          >
            <Download className="w-4 h-4 text-[#a3e635]" />
            <span>Register (PDF)</span>
          </button>

          <button
            onClick={handleExportPaymentVerificationPDF}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-[#10b981] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export payment verification audit log as PDF"
          >
            <FileCheck2 className="w-4 h-4 text-[#10b981]" />
            <span>Verification (PDF)</span>
          </button>

          <button
            onClick={handleExportSiteOfficeSummaryPDF}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-sky-400 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export site-based vs office-based workforce payroll summary report as PDF"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Site/Office PDF</span>
          </button>

          <button
            onClick={() => setIsSmsLogsOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-emerald-400 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer relative"
            title="Inspect Automated Email & SMS Payslip Delivery Logs"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Email &amp; Payslip Logs</span>
            {failedSmsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-mono font-black animate-pulse">
                {failedSmsCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {pendingGcashItems.length > 0 && (
            <button
              onClick={handleBatchDisburse}
              disabled={isBatchProcessing || !masterCutoff.masterSwitchOn}
              className={`px-3.5 py-2 font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                !masterCutoff.masterSwitchOn
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 opacity-70'
                  : 'bg-[#005ce6] hover:bg-[#0047b3] text-white'
              }`}
              title={
                !masterCutoff.masterSwitchOn
                  ? 'Locked: CEO Master Transaction Cut-Off is Engaged (OFF)'
                  : `Disburse ${pendingGcashItems.length} weekly salaries via GCash batch`
              }
            >
              {!masterCutoff.masterSwitchOn ? (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Batch Locked (Cut-Off OFF)</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-sky-200" />
                  <span>
                    {isBatchProcessing
                      ? 'Executing GCash Batch...'
                      : `Batch Disburse ${pendingGcashItems.length} via GCash (₱${pendingGcashTotal.toLocaleString()})`}
                  </span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => recalculatePayroll(selectedWeek === 'ALL' ? '2026-W41' : selectedWeek)}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            Recalculate Week Payroll
          </button>
        </div>
      </div>

      {/* CEO Master Cut-Off Fail-Safe Warning Banner */}
      {!masterCutoff.masterSwitchOn && (
        <div className="p-4 bg-amber-950/40 border-2 border-amber-500/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-200 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-2 flex-wrap">
                <span>CEO Master Transaction Cut-Off Engaged (Lock: OFF)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/25 border border-amber-500/50 text-amber-300">
                  GLOBAL DISBURSEMENT LOCK
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                All outbound disbursements via GCash & PayMongo electronic rails are blocked at the server layer. Queued or scheduled items are stopped. In-flight transactions ({masterCutoff.inFlightCount}) remain subject to provider status reconciliation. This global lock can only be re-enabled inside the secured <strong>CEO Command Vault</strong> with authorized passkey authentication.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 bg-black/40 px-3 py-2 rounded-xl border border-amber-500/30">
            <span className="text-[11px] font-mono text-amber-300/90 block">Toggled by: {masterCutoff.lastChangedBy}</span>
            <span className="text-[10px] text-amber-400 font-mono">{new Date(masterCutoff.lastChangedAt).toLocaleString()}</span>
          </div>
        </div>
      )}

      {batchNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{batchNotice}</span>
        </div>
      )}

      {/* Wallet-Style Weekly Payroll Dashboard (7 Status Counter Pillars) - Upgrades Specification Section 2 */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Wallet-Style Weekly Payroll Status Dashboard (Cycle: {selectedWeek})</span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            Active Filter: <strong className="text-white uppercase">{walletFilter.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* 1. Total Payroll */}
          <button
            type="button"
            onClick={() => setWalletFilter('TOTAL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'TOTAL'
                ? 'bg-[#10b981]/20 border-[#10b981] shadow-lg ring-1 ring-[#10b981]/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-slate-500'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Payroll</div>
            <div className="text-base font-black font-mono text-white mt-1">{countTotal} records</div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">₱{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 2. Ready for Release */}
          <button
            type="button"
            onClick={() => setWalletFilter('READY_FOR_RELEASE')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'READY_FOR_RELEASE'
                ? 'bg-sky-500/20 border-sky-400 shadow-lg ring-1 ring-sky-400/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-sky-500/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-sky-300 tracking-wider flex items-center justify-between">
              <span>Ready Release</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{readyForReleaseCount} workers</div>
            <div className="text-[11px] font-mono font-bold text-sky-400 mt-0.5">₱{readyForReleaseAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 3. Awaiting Confirmation */}
          <button
            type="button"
            onClick={() => setWalletFilter('AWAITING_CONFIRMATION')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'AWAITING_CONFIRMATION'
                ? 'bg-amber-500/20 border-amber-400 shadow-lg ring-1 ring-amber-400/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-amber-500/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center justify-between">
              <span>Awaiting Conf.</span>
              <Clock className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{awaitingConfirmationCount} records</div>
            <div className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">₱{awaitingConfirmationAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 4. Processing */}
          <button
            type="button"
            onClick={() => setWalletFilter('PROCESSING')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'PROCESSING'
                ? 'bg-indigo-500/20 border-indigo-400 shadow-lg ring-1 ring-indigo-400/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-indigo-500/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center justify-between">
              <span>Processing</span>
              {isBatchProcessing && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>}
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{processingCount} in-flight</div>
            <div className="text-[11px] font-mono font-bold text-indigo-300 mt-0.5">₱{processingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 5. Confirmed */}
          <button
            type="button"
            onClick={() => setWalletFilter('CONFIRMED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'CONFIRMED'
                ? 'bg-emerald-500/20 border-emerald-400 shadow-lg ring-1 ring-emerald-400/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-emerald-500/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider flex items-center justify-between">
              <span>Confirmed</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{confirmedCount} settled</div>
            <div className="text-[11px] font-mono font-bold text-[#a3e635] mt-0.5">₱{confirmedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 6. Failed */}
          <button
            type="button"
            onClick={() => setWalletFilter('FAILED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'FAILED'
                ? 'bg-rose-500/20 border-rose-400 shadow-lg ring-1 ring-rose-400/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-rose-500/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider flex items-center justify-between">
              <span>Failed</span>
              <AlertCircle className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{failedCount} blocked</div>
            <div className="text-[11px] font-mono font-bold text-rose-400 mt-0.5">₱{failedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>

          {/* 7. Needs Review */}
          <button
            type="button"
            onClick={() => setWalletFilter('NEEDS_REVIEW')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              walletFilter === 'NEEDS_REVIEW'
                ? 'bg-amber-600/20 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
                : 'bg-[#0e1a16] border-[#234338] hover:border-amber-600/50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center justify-between">
              <span>Needs Review</span>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-base font-black font-mono text-white mt-1">{needsReviewCount} flagged</div>
            <div className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">₱{needsReviewAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Gross Wages</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ₱{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Earned before deductions</span>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <span className="text-[11px] font-bold uppercase text-slate-400">Withheld Deductions</span>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            -₱{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">SSS, PhilHealth, Canteen</span>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <span className="text-[11px] font-bold uppercase text-slate-400">Net Take-Home Outflow</span>
          <div className="text-xl font-bold font-mono text-[#a3e635] mt-1">
            ₱{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Total salary disbursements</span>
        </div>

        {/* GCash Corporate Master Account Card */}
        <div className="bg-[#0e1a16] border border-[#005ce6]/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sky-400 uppercase text-[11px] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#005ce6]" />
              GCash Corp Wallet
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
              masterCutoff.masterSwitchOn
                ? 'bg-[#005ce6]/20 text-sky-300 border-[#005ce6]/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {masterCutoff.masterSwitchOn ? 'ACTIVE 24/7' : 'CUT-OFF OFF'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-white">
              ₱528,450.00
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Merchant: DRC-ENT-2026</span>
              <span className="text-emerald-400 font-semibold">Zero Fee Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">WEEK:</span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-[#a3e635] font-mono font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Historical Weeks</option>
            {dtrWeeks.map((w) => (
              <option key={w.week_key} value={w.week_key}>
                {w.week_key}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Pending">Pending Payout</option>
            <option value="Verified">Verified & Paid</option>
            <option value="Paid">Paid (Pending Final Voucher Proof)</option>
            <option value="Failed">Failed / Dispute</option>
          </select>
        </div>

        {walletFilter !== 'TOTAL' && (
          <button
            onClick={() => setWalletFilter('TOTAL')}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white bg-[#13241f] border border-[#234338] rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Wallet Tab</span>
          </button>
        )}

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {filtered.length} of {countTotal} records
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Worker Key</th>
                <th className="p-3">Week / Site</th>
                <th className="p-3 text-right">Daily Rate</th>
                <th className="p-3 text-right">Work Days</th>
                <th className="p-3 text-right">Gross (₱)</th>
                <th className="p-3 text-right text-red-400">Deduct (₱)</th>
                <th className="p-3 text-right text-[#a3e635]">Net Pay (₱)</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Proof / Ref</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No payroll records found for this week. Click 'Recalculate Week Payroll' to generate from attendance.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isVerified = p.payment_status === 'Verified';

                  return (
                    <tr key={p.payroll_id} className="hover:bg-[#13241f]/70 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-white">{p.employee_id}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>{p.week_key}</div>
                        <div className="text-slate-400">{p.site_id}</div>
                      </td>
                      <td className="p-3 text-right font-mono">₱{p.daily_rate.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">
                        {p.verified_days.toFixed(1)}d <span className="text-slate-500 text-[10px]">({p.verified_hours.toFixed(1)}h)</span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                        ₱{p.gross_pay.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-400">
                        -₱{p.total_deductions.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-[#a3e635]">
                        ₱{p.net_pay.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-300">{p.payment_method}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">
                        <div>Ref: {p.reference_no || 'None'}</div>
                        <div>
                          Proof:{' '}
                          {p.proof_url ? (
                            <span className="text-emerald-400 font-bold">✓ Attached</span>
                          ) : (
                            <span className="text-amber-400">Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {p.payment_status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  if (!masterCutoff.masterSwitchOn) {
                                    alert('DISBURSEMENT BLOCKED: The CEO Master Transaction Cut-Off is engaged (OFF). Re-enable in CEO Command Vault.');
                                    return;
                                  }
                                  setGcashModalRecord(p);
                                }}
                                disabled={!masterCutoff.masterSwitchOn}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm ${
                                  !masterCutoff.masterSwitchOn
                                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
                                    : 'bg-[#005ce6] hover:bg-[#0047b3] text-white cursor-pointer'
                                }`}
                                title={
                                  !masterCutoff.masterSwitchOn
                                    ? 'Locked: CEO Master Cut-Off is OFF'
                                    : `Disburse ₱${p.net_pay.toLocaleString()} to ${p.employee_id} via GCash`
                                }
                              >
                                {!masterCutoff.masterSwitchOn ? (
                                  <>
                                    <Lock className="w-3 h-3 text-amber-400" />
                                    <span>Locked</span>
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="w-3 h-3 text-sky-200" />
                                    <span>Pay GCash</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenProof(p)}
                                className="px-2 py-1 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                title="Manual voucher verification"
                              >
                                Manual
                              </button>
                            </>
                          ) : (
                            <>
                              {p.payment_method === 'GCash' ? (
                                <button
                                  onClick={() => setGcashModalRecord(p)}
                                  className="px-2.5 py-1 bg-[#005ce6]/15 border border-[#005ce6]/40 hover:border-[#005ce6] text-sky-300 hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="View and download official GCash disbursement receipt"
                                >
                                  <Smartphone className="w-3 h-3 text-[#005ce6]" />
                                  <span>Receipt</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenProof(p)}
                                  className="px-2.5 py-1 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-slate-200 hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <FileCheck2 className="w-3 h-3 text-[#a3e635]" />
                                  <span>Proof</span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => onOpenSinglePayslip(p.payroll_id)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-[#13241f] rounded-md transition-colors cursor-pointer"
                            title="Generate Individual Payslip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Proof & Verification Modal */}
      {proofingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Payment Proof & Payout Verification</h2>
                <div className="text-[11px] text-[#a3e635] font-mono">
                  {proofingRecord.employee_id} ({proofingRecord.week_key}) &bull; Net:{' '}
                  <strong>₱{proofingRecord.net_pay.toLocaleString()}</strong>
                </div>
              </div>
              <button onClick={() => setProofingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProofSubmit} className="space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Disbursement Method *</label>
                  <select
                    value={proofForm.payment_method}
                    onChange={(e) => setProofForm({ ...proofForm, payment_method: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="GCash">GCash Mobile Transfer</option>
                    <option value="Cash">Cash Envelope (Signed Voucher)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {proofForm.payment_method === 'GCash' ? 'GCash Reference No. *' : 'Cash Voucher No. *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={proofForm.reference_no}
                    onChange={(e) => setProofForm({ ...proofForm, reference_no: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="e.g. GC-98214-001 or VCH-0021"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Verification Status *</label>
                <select
                  value={proofForm.status}
                  onChange={(e) => setProofForm({ ...proofForm, status: e.target.value as any })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-semibold"
                >
                  <option value="Verified">Verified & Confirmed Paid</option>
                  <option value="Paid">Paid (Pending Final Audit Check)</option>
                </select>
              </div>

              {/* Cash Disbursement Strict Acknowledgement & Witness Check (Section 5) */}
              {proofForm.payment_method === 'Cash' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Cash Payroll Compliance Protocol (Section 5)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Under DOLE & De Rueda ERP rules, cash wage release requires a clear photo of the worker receiving the cash envelope plus verified acknowledgement.
                  </p>

                  <div className="pt-1 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer bg-[#0e1a16] p-2.5 rounded-lg border border-[#234338]">
                      <input
                        type="checkbox"
                        checked={proofForm.employee_acknowledged}
                        onChange={(e) => setProofForm({ ...proofForm, employee_acknowledged: e.target.checked })}
                        className="mt-0.5 rounded text-[#a3e635] focus:ring-0 cursor-pointer"
                        required
                      />
                      <span className="text-white text-[11px] font-semibold">
                        Employee personally counted &amp; received full net cash of <strong className="text-[#a3e635]">₱{proofingRecord.net_pay.toLocaleString()}</strong> and signed the official paper payroll voucher.
                      </span>
                    </label>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Disbursing Officer / Site Cashier Witness *
                      </label>
                      <input
                        type="text"
                        value={proofForm.cash_receiver_witness}
                        onChange={(e) => setProofForm({ ...proofForm, cash_receiver_witness: e.target.value })}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1 text-white text-xs font-semibold"
                        placeholder="e.g. Maria Santos (Site Cashier / Timekeeper)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Attachment / Camera Capture Area */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {proofForm.payment_method === 'Cash'
                    ? 'Attach Handover Photo / Signed Paper Voucher (Mandatory) *'
                    : 'Attach GCash Electronic Screenshot / Confirmation *'}
                </label>
                <div className="border border-dashed border-[#234338] rounded-xl p-4 text-center bg-[#13241f]/50">
                  {proofForm.proof_url ? (
                    <div className="space-y-2 mb-3">
                      <img
                        src={proofForm.proof_url}
                        alt="Proof of Payment"
                        className="max-h-36 mx-auto rounded-lg border border-[#234338] shadow-sm"
                      />
                      <span className="text-[10px] text-emerald-400 font-semibold block">✓ Evidence Attachment Active</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs mb-3">
                      {proofForm.payment_method === 'Cash'
                        ? 'Take a photo of worker receiving cash envelope or upload scanned paper voucher.'
                        : 'Attach GCash transaction screenshot or official disbursement reference.'}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateCamera}
                      className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Take Camera Snapshot
                    </button>
                    <label className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setProofForm((prev) => ({
                                ...prev,
                                proof_url: event.target?.result as string,
                                employee_acknowledged: true,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Auditor Remarks</label>
                <textarea
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="e.g. Verified by Site Admin & Timekeeper; cash envelope witnessed..."
                />
              </div>

              {/* Automated SMS Payslip Notice (Section 5) */}
              <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-lg flex items-center gap-2 text-[11px] text-slate-300">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Automated SMS Payslip:</strong> Upon confirming verification as successful, an itemized SMS payslip will be dispatched to the employee's registered mobile number.
                </span>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProofingRecord(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669]"
                >
                  Confirm & Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Interactive GCash Disbursement Modal */}
      <GCashPaymentModal
        isOpen={Boolean(gcashModalRecord)}
        onClose={() => setGcashModalRecord(null)}
        payrollRecord={gcashModalRecord}
      />

      {/* Automated SMS Payslip Logs & HR Exception Queue Modal */}
      <SmsPayslipLogsModal
        isOpen={isSmsLogsOpen}
        onClose={() => setIsSmsLogsOpen(false)}
      />
    </div>
  );
};
