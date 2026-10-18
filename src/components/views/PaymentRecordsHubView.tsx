import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../layout/Sidebar';
import {
  PaymentRecord,
  PaymentRecordStatus,
  PaymentModule,
  SitePaymentBatchSummary,
  Employee,
  Site,
} from '../../types';
import {
  QrCode,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ShieldCheck,
  Building,
  Users,
  Search,
  Filter,
  Eye,
  Upload,
  Plus,
  FileCheck2,
  X,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  CreditCard,
  Lock,
  ArrowRight,
  RefreshCw,
  Send,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Info,
  Calendar,
} from 'lucide-react';

interface PaymentRecordsHubViewProps {
  onNavigate?: (page: PageId) => void;
  initialRecordId?: string;
}

export const PaymentRecordsHubView: React.FC<PaymentRecordsHubViewProps> = ({
  onNavigate,
  initialRecordId,
}) => {
  const {
    currentUser,
    sites,
    employees,
    dtrWeeks,
    paymentRecords,
    createPaymentRecord,
    uploadPaymentReceipt,
    reviewPaymentRecord,
    getSiteBatchSummary,
    checkDuplicateReference,
    gcashOnboardingStatus,
    addAuditLog,
  } = useApp();

  // Active view tab: 'records' | 'site_batches' | 'official_api_roadmap'
  const [activeTab, setActiveTab] = useState<'records' | 'site_batches' | 'official_api_roadmap'>('records');

  // Filters for Records Ledger
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Batch for Site Dashboard QR Tab
  const [batchSiteId, setBatchSiteId] = useState<string>(sites[0]?.site_id || 'SITE-001');
  const [batchWeekKey, setBatchWeekKey] = useState<string>(dtrWeeks[0]?.week_key || 'Week 41');

  // Modals
  const [activeVoucherRecord, setActiveVoucherRecord] = useState<PaymentRecord | null>(() => {
    if (initialRecordId) {
      return paymentRecords.find((p) => p.id === initialRecordId) || null;
    }
    return null;
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetRecord, setUploadTargetRecord] = useState<PaymentRecord | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetRecord, setReviewTargetRecord] = useState<PaymentRecord | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Create Form State
  const [createModule, setCreateModule] = useState<PaymentModule>('WEEKLY_PAYROLL');
  const [createRecipientType, setCreateRecipientType] = useState<'EMPLOYEE' | 'VENDOR_CUSTOM'>('EMPLOYEE');
  const [createEmployeeId, setCreateEmployeeId] = useState<string>(employees[0]?.employee_id || '');
  const [createCustomName, setCreateCustomName] = useState<string>('');
  const [createCustomMobile, setCreateCustomMobile] = useState<string>('');
  const [createSiteId, setCreateSiteId] = useState<string>(sites[0]?.site_id || 'SITE-001');
  const [createPeriodRef, setCreatePeriodRef] = useState<string>('Week 41 (Oct 05 - Oct 11, 2026)');
  const [createExpectedAmount, setCreateExpectedAmount] = useState<number>(4500);

  // Upload Form State
  const [uploadRefNumber, setUploadRefNumber] = useState<string>('');
  const [uploadAmountPaid, setUploadAmountPaid] = useState<number>(0);
  const [uploadPayerName, setUploadPayerName] = useState<string>('');
  const [uploadPayerMobile, setUploadPayerMobile] = useState<string>('0917-582-9104');
  const [uploadTransferDate, setUploadTransferDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [uploadReceiptUrl, setUploadReceiptUrl] = useState<string>('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Review Decision State
  const [reviewDecision, setReviewDecision] = useState<PaymentRecordStatus>('PAID_VERIFIED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewRejectionReason, setReviewRejectionReason] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Role permissions
  const userRole = currentUser?.access_point || 'ceo';
  const isCeo = userRole === 'ceo';
  const isHr = userRole === 'admin 1';
  const isSiteHead = userRole === 'admin 2';
  const canReview = isCeo || isHr || isSiteHead;

  // Filtered payment records
  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((rec) => {
      // Role scope restriction (Section 5)
      if (isSiteHead && currentUser?.assigned_sites && !currentUser.assigned_sites.includes('ALL')) {
        if (!currentUser.assigned_sites.includes(rec.site_id)) return false;
      }

      if (selectedSiteFilter !== 'ALL' && rec.site_id !== selectedSiteFilter) return false;
      if (selectedModuleFilter !== 'ALL' && rec.module !== selectedModuleFilter) return false;
      if (selectedStatusFilter !== 'ALL' && rec.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = rec.recipient_name.toLowerCase().includes(query);
        const matchesMobile = rec.recipient_mobile.toLowerCase().includes(query);
        const matchesId = rec.id.toLowerCase().includes(query);
        const matchesRef = rec.receipt_evidence?.reference_number?.toLowerCase().includes(query);
        const matchesPeriod = rec.period_reference.toLowerCase().includes(query);
        if (!matchesName && !matchesMobile && !matchesId && !matchesRef && !matchesPeriod) {
          return false;
        }
      }
      return true;
    });
  }, [paymentRecords, selectedSiteFilter, selectedModuleFilter, selectedStatusFilter, searchQuery, isSiteHead, currentUser]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalObligations = 0;
    let totalAmount = 0;
    let verifiedCount = 0;
    let verifiedAmount = 0;
    let awaitingCount = 0;
    let awaitingAmount = 0;
    let underReviewCount = 0;
    let needsReviewCount = 0;
    let rejectedCount = 0;

    for (const p of paymentRecords) {
      totalObligations++;
      totalAmount += p.expected_amount;
      if (p.status === 'PAID_VERIFIED') {
        verifiedCount++;
        verifiedAmount += p.expected_amount;
      } else if (p.status === 'AWAITING_PAYMENT') {
        awaitingCount++;
        awaitingAmount += p.expected_amount;
      } else if (p.status === 'RECEIPT_UPLOADED' || p.status === 'UNDER_REVIEW') {
        underReviewCount++;
      } else if (p.status === 'NEEDS_REVIEW') {
        needsReviewCount++;
      } else if (p.status === 'PAYMENT_REJECTED') {
        rejectedCount++;
      }
    }

    return {
      totalObligations,
      totalAmount,
      verifiedCount,
      verifiedAmount,
      awaitingCount,
      awaitingAmount,
      underReviewCount,
      needsReviewCount,
      rejectedCount,
    };
  }, [paymentRecords]);

  // Site batch summary for Tab 2
  const currentBatchSummary = useMemo(() => {
    return getSiteBatchSummary(batchSiteId, batchWeekKey);
  }, [batchSiteId, batchWeekKey, getSiteBatchSummary, paymentRecords]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Open Receipt Upload Modal
  const handleOpenUploadModal = (rec: PaymentRecord) => {
    setUploadTargetRecord(rec);
    setUploadRefNumber(rec.receipt_evidence?.reference_number || '');
    setUploadAmountPaid(rec.expected_amount);
    setUploadPayerName(currentUser?.name || 'De Rueda Construction Finance');
    setUploadPayerMobile('0917-582-9104');
    setUploadTransferDate(new Date().toISOString().slice(0, 16));
    setUploadNotes('');
    setUploadError(null);
    setDuplicateWarning(null);
    setIsUploadModalOpen(true);
  };

  // Check duplicate reference as user types
  const handleRefNumberChange = (val: string) => {
    setUploadRefNumber(val);
    if (!val || val.length < 5) {
      setDuplicateWarning(null);
      return;
    }
    const dupCheck = checkDuplicateReference(val, uploadTargetRecord?.id);
    if (dupCheck.isDuplicate) {
      setDuplicateWarning(`Warning: Reference ${val} was already registered for payment record ${dupCheck.conflictingRecordId}. This will be flagged as NEEDS_REVIEW.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Submit Receipt Upload
  const handleSubmitReceiptUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetRecord) return;
    if (!uploadRefNumber.trim()) {
      setUploadError('GCash Transaction Reference Number is strictly required.');
      return;
    }

    const res = uploadPaymentReceipt(uploadTargetRecord.id, {
      reference_number: uploadRefNumber.trim(),
      receipt_url: uploadReceiptUrl,
      amount_paid: uploadAmountPaid,
      transfer_date: uploadTransferDate,
      payer_name: uploadPayerName,
      payer_mobile: uploadPayerMobile,
      notes: uploadNotes,
    });

    if (res.success) {
      setIsUploadModalOpen(false);
      setUploadTargetRecord(null);
      if (activeVoucherRecord && activeVoucherRecord.id === uploadTargetRecord.id && res.record) {
        setActiveVoucherRecord(res.record);
      }
    } else {
      setUploadError(res.message);
    }
  };

  // Open Review Modal
  const handleOpenReviewModal = (rec: PaymentRecord) => {
    setReviewTargetRecord(rec);
    setReviewDecision('PAID_VERIFIED');
    setReviewNotes('');
    setReviewRejectionReason('');
    setIsReviewModalOpen(true);
  };

  // Submit Review Decision
  const handleSubmitReviewDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetRecord) return;
    setReviewSubmitting(true);

    try {
      const res = await reviewPaymentRecord(
        reviewTargetRecord.id,
        reviewDecision,
        reviewNotes,
        reviewDecision === 'PAYMENT_REJECTED' ? reviewRejectionReason : undefined
      );

      if (res.success) {
        setIsReviewModalOpen(false);
        setReviewTargetRecord(null);
        if (activeVoucherRecord && activeVoucherRecord.id === reviewTargetRecord.id && res.record) {
          setActiveVoucherRecord(res.record);
        }
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Submit Create Payment Record
  const handleCreatePaymentRecord = (e: React.FormEvent) => {
    e.preventDefault();
    let recipientName = createCustomName;
    let recipientMobile = createCustomMobile;
    let recipientId = 'VEND-CUSTOM';
    let recipientVerified = false;
    let recipientQrUrl: string | undefined = undefined;

    if (createRecipientType === 'EMPLOYEE') {
      const emp = employees.find((e) => e.employee_id === createEmployeeId);
      if (emp) {
        recipientName = emp.name;
        recipientMobile = emp.gcash_number || emp.contact_number || '0917-000-0000';
        recipientId = emp.employee_id;
        recipientVerified = true;
        recipientQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GCASH-RECEIVE-${recipientMobile}-${encodeURIComponent(emp.name)}`;
      }
    }

    const siteObj = sites.find((s) => s.site_id === createSiteId);
    const siteName = siteObj?.name || createSiteId;

    const newRecord = createPaymentRecord({
      module: createModule,
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_mobile: recipientMobile,
      recipient_verified: recipientVerified,
      recipient_qr_url: recipientQrUrl,
      site_id: createSiteId,
      site_name: siteName,
      period_reference: createPeriodRef,
      expected_amount: createExpectedAmount,
      currency: 'PHP',
      status: 'AWAITING_PAYMENT',
      approved_by: currentUser?.name || 'HR Department',
      approved_at: new Date().toISOString(),
    });

    setIsCreateModalOpen(false);
    setActiveVoucherRecord(newRecord);
  };

  // Status Badge Component
  const renderStatusBadge = (status: PaymentRecordStatus) => {
    switch (status) {
      case 'PAID_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PAID VERIFIED
          </span>
        );
      case 'RECEIPT_UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            RECEIPT UPLOADED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            UNDER REVIEW
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            NEEDS REVIEW (FLAGGED)
          </span>
        );
      case 'PAYMENT_REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            PAYMENT REJECTED
          </span>
        );
      case 'AWAITING_PAYMENT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            AWAITING PAYMENT
          </span>
        );
    }
  };

  // Module Label Helper
  const getModuleLabel = (mod: PaymentModule) => {
    switch (mod) {
      case 'WEEKLY_PAYROLL':
        return 'Weekly Payroll';
      case 'CASH_ADVANCE':
        return 'Cash Advance';
      case 'CANTEEN_SETTLEMENT':
        return 'Canteen Settlement';
      case 'SUPPLIER_PAYMENT':
        return 'Supplier / Materials';
      case 'CONTRACTOR_PAYMENT':
        return 'Contractor Payout';
      case 'EMPLOYEE_REIMBURSEMENT':
        return 'Reimbursement';
      default:
        return 'Authorized Disbursement';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Upgrade & Change Specification Architecture */}
      <div className="bg-gradient-to-r from-[#0d231e] via-[#102a24] to-[#0a1814] border border-[#1f4a3c] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/30">
                Official Settlement Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                DOLE D.O. 13 &amp; BIR Compliant
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Idempotent Receipt Verification
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <QrCode className="w-8 h-8 text-[#a3e635]" />
              Payment Records &amp; QR Settlement Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              In accordance with executive change specifications, automated wallet control and simulated mock payouts are retired. All disbursements operate through verified individual payment records, secure voucher QR pages, manual receipt reconciliation with duplicate detection, and authoritative SMS notifications once verified.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col items-end gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl flex items-center gap-2 text-sm shadow-lg hover:bg-[#bef264] transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Payment Voucher
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              Role: <span className="text-white font-bold uppercase">{userRole}</span> ({currentUser?.name || 'User'})
            </div>
          </div>
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#1f4a3c]/60">
          <div className="bg-[#081512]/60 p-3 rounded-xl border border-[#1f4a3c]/40">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Obligations</span>
            <div className="text-lg font-black text-white mt-1">₱{metrics.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-slate-400">{metrics.totalObligations} records in ledger</span>
          </div>

          <div className="bg-[#081512]/60 p-3 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Paid Verified
            </span>
            <div className="text-lg font-black text-emerald-300 mt-1">₱{metrics.verifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-emerald-400/80">{metrics.verifiedCount} confirmed &amp; sealed</span>
          </div>

          <div className="bg-[#081512]/60 p-3 rounded-xl border border-yellow-500/30">
            <span className="text-xs text-yellow-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Awaiting Payment
            </span>
            <div className="text-lg font-black text-yellow-300 mt-1">₱{metrics.awaitingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-yellow-400/80">{metrics.awaitingCount} pending transfer</span>
          </div>

          <div className="bg-[#081512]/60 p-3 rounded-xl border border-blue-500/30">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <Upload className="w-3 h-3" /> Under Review
            </span>
            <div className="text-lg font-black text-blue-300 mt-1">{metrics.underReviewCount}</div>
            <span className="text-[11px] text-blue-400/80">Receipt attached</span>
          </div>

          <div className="bg-[#081512]/60 p-3 rounded-xl border border-amber-500/30">
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Flagged / Rejected
            </span>
            <div className="text-lg font-black text-amber-300 mt-1">{metrics.needsReviewCount + metrics.rejectedCount}</div>
            <span className="text-[11px] text-amber-400/80">{metrics.needsReviewCount} duplicate/review, {metrics.rejectedCount} rejected</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#234338] pb-3">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'records'
              ? 'bg-[#a3e635] text-[#080f0d] shadow-md'
              : 'bg-[#13241f] text-slate-300 hover:bg-[#1a332c]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Payment Records &amp; Verification Ledger
        </button>

        <button
          onClick={() => setActiveTab('site_batches')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'site_batches'
              ? 'bg-[#a3e635] text-[#080f0d] shadow-md'
              : 'bg-[#13241f] text-slate-300 hover:bg-[#1a332c]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Site Batch Dashboard &amp; Site QRs
        </button>

        <button
          onClick={() => setActiveTab('official_api_roadmap')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'official_api_roadmap'
              ? 'bg-[#a3e635] text-[#080f0d] shadow-md'
              : 'bg-[#13241f] text-slate-300 hover:bg-[#1a332c]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Official GCash API Integration Roadmap
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-900 uppercase">
            Phase A/B
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYMENT RECORDS & VERIFICATION LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#10201b] border border-[#234338] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1 lg:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search recipient, ref #, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              {/* Site Filter */}
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#a3e635]"
              >
                <option value="ALL">All Operational Sites</option>
                {sites.map((s) => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              {/* Module Filter */}
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#a3e635]"
              >
                <option value="ALL">All Modules</option>
                <option value="WEEKLY_PAYROLL">Weekly Payroll</option>
                <option value="CASH_ADVANCE">Cash Advances</option>
                <option value="CANTEEN_SETTLEMENT">Canteen Settlements</option>
                <option value="SUPPLIER_PAYMENT">Supplier / Materials</option>
                <option value="CONTRACTOR_PAYMENT">Contractor Payments</option>
                <option value="EMPLOYEE_REIMBURSEMENT">Reimbursements</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#a3e635]"
              >
                <option value="ALL">All Statuses</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="RECEIPT_UPLOADED">Receipt Uploaded</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PAID_VERIFIED">Paid Verified</option>
                <option value="NEEDS_REVIEW">Needs Review (Flagged)</option>
                <option value="PAYMENT_REJECTED">Payment Rejected</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredRecords.length}</span> of {paymentRecords.length} records
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-[#10201b] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#0a1512] text-xs uppercase tracking-wider text-slate-400 border-b border-[#234338]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Voucher / ID</th>
                    <th className="py-3.5 px-4 font-semibold">Module &amp; Period</th>
                    <th className="py-3.5 px-4 font-semibold">Recipient &amp; GCash #</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Expected (PHP)</th>
                    <th className="py-3.5 px-4 font-semibold">Evidence / Ref #</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f3b31]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                        No payment records matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#162c25]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            {rec.id}
                          </div>
                          <div className="text-[11px] text-slate-400">{rec.site_name}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1a362d] text-slate-200">
                            {getModuleLabel(rec.module)}
                          </span>
                          <div className="text-xs text-slate-400 mt-0.5">{rec.period_reference}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {rec.recipient_name}
                            {rec.recipient_verified && (
                              <span title="GCash registered number verified during onboarding">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                            {rec.recipient_mobile}
                            <button
                              onClick={() => handleCopy(rec.recipient_mobile, rec.id)}
                              className="text-slate-500 hover:text-white p-0.5"
                              title="Copy mobile number"
                            >
                              {copiedText === rec.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-base text-white">
                            ₱{rec.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">Currency: {rec.currency}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {rec.receipt_evidence ? (
                            <div className="space-y-1">
                              <div className="font-mono text-xs text-white font-semibold flex items-center gap-1">
                                {rec.receipt_evidence.reference_number}
                                {rec.receipt_evidence.is_duplicate_ref && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500 text-white" title="Duplicate reference number detected!">
                                    DUPLICATE
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Paid: ₱{rec.receipt_evidence.amount_paid?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No receipt attached</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {renderStatusBadge(rec.status)}
                          {rec.sms_dispatched && (
                            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" /> SMS Dispatched
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setActiveVoucherRecord(rec)}
                              className="px-2.5 py-1 bg-[#1a362d] text-slate-200 hover:text-white hover:bg-[#234b3e] rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                              title="View Individual Voucher & QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#a3e635]" />
                              Voucher
                            </button>

                            {rec.status === 'AWAITING_PAYMENT' && (
                              <button
                                onClick={() => handleOpenUploadModal(rec)}
                                className="px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                title="Upload Actual GCash Receipt"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Upload
                              </button>
                            )}

                            {canReview && (rec.status === 'RECEIPT_UPLOADED' || rec.status === 'UNDER_REVIEW' || rec.status === 'NEEDS_REVIEW') && (
                              <button
                                onClick={() => handleOpenReviewModal(rec)}
                                className="px-2.5 py-1 bg-[#a3e635]/20 text-[#a3e635] hover:bg-[#a3e635]/30 border border-[#a3e635]/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title="Review and Verify Payment"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SITE BATCH DASHBOARD & SITE QRS */}
      {/* ========================================================================= */}
      {activeTab === 'site_batches' && (
        <div className="space-y-6">
          {/* Site Batch Controls */}
          <div className="bg-[#10201b] border border-[#234338] p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Select Construction Site</label>
                <select
                  value={batchSiteId}
                  onChange={(e) => setBatchSiteId(e.target.value)}
                  className="px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-[#a3e635]"
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Select Payroll / Cycle Week</label>
                <select
                  value={batchWeekKey}
                  onChange={(e) => setBatchWeekKey(e.target.value)}
                  className="px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-[#a3e635]"
                >
                  {dtrWeeks.map((w) => (
                    <option key={w.week_key} value={w.week_key}>
                      {w.week_key} ({w.date_start} to {w.date_end})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-lg max-w-md text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Specification Clause:</strong> The Site QR is an authenticated administrative dashboard link for site oversight — NOT a bulk GCash payment QR and not proof of payment. Employees are paid individually in official GCash.
              </span>
            </div>
          </div>

          {/* Site Batch Visual Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Site QR Card */}
            <div className="bg-[#10201b] border border-[#234338] p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-xl">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/30">
                Site Oversight QR Code
              </span>

              <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-[#234338]">
                <img
                  src={currentBatchSummary.batch_qr_url}
                  alt="Site Batch Dashboard QR"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">{currentBatchSummary.site_name}</h3>
                <div className="text-xs text-slate-400 font-mono">Cycle: {currentBatchSummary.week_key}</div>
              </div>

              <div className="p-3 bg-[#0a1411] rounded-xl border border-[#1f3b31] text-xs text-slate-300 w-full text-left space-y-1">
                <div className="font-semibold text-white">Scan Link Target:</div>
                <div className="font-mono text-[11px] text-[#a3e635] break-all">
                  https://emybuilder.pages.dev/batch/{batchSiteId}/{batchWeekKey}
                </div>
              </div>

              <button
                onClick={() => handleCopy(`https://emybuilder.pages.dev/batch/${batchSiteId}/${batchWeekKey}`, 'batch_url')}
                className="w-full py-2 bg-[#1a362d] text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {copiedText === 'batch_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy Site Dashboard Link
              </button>
            </div>

            {/* Batch Metrics & Progress */}
            <div className="lg:col-span-2 bg-[#10201b] border border-[#234338] p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#a3e635]" />
                    Site Payroll Batch Progress
                  </h3>
                  {currentBatchSummary.is_fully_verified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> BATCH FULLY SEALED
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                      SETTLEMENT IN PROGRESS
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Verified Payout Amount</span>
                    <span className="text-[#a3e635]">
                      ₱{currentBatchSummary.total_verified_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ₱{currentBatchSummary.total_expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {' '}({currentBatchSummary.total_expected_amount > 0 ? Math.round((currentBatchSummary.total_verified_amount / currentBatchSummary.total_expected_amount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#0a1411] rounded-full overflow-hidden border border-[#234338]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#a3e635] rounded-full transition-all duration-500"
                      style={{
                        width: `${currentBatchSummary.total_expected_amount > 0 ? Math.min(100, (currentBatchSummary.total_verified_amount / currentBatchSummary.total_expected_amount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-[#0a1411] rounded-xl border border-yellow-500/30">
                    <span className="text-[11px] text-yellow-400 font-semibold block">Awaiting Payout</span>
                    <div className="text-lg font-black text-white mt-1">{currentBatchSummary.status_counts.AWAITING_PAYMENT}</div>
                  </div>

                  <div className="p-3 bg-[#0a1411] rounded-xl border border-blue-500/30">
                    <span className="text-[11px] text-blue-400 font-semibold block">Receipt Uploaded</span>
                    <div className="text-lg font-black text-white mt-1">{currentBatchSummary.status_counts.RECEIPT_UPLOADED}</div>
                  </div>

                  <div className="p-3 bg-[#0a1411] rounded-xl border border-purple-500/30">
                    <span className="text-[11px] text-purple-400 font-semibold block">Under Review</span>
                    <div className="text-lg font-black text-white mt-1">{currentBatchSummary.status_counts.UNDER_REVIEW}</div>
                  </div>

                  <div className="p-3 bg-[#0a1411] rounded-xl border border-emerald-500/30">
                    <span className="text-[11px] text-emerald-400 font-semibold block">Paid &amp; Verified</span>
                    <div className="text-lg font-black text-white mt-1">{currentBatchSummary.status_counts.PAID_VERIFIED}</div>
                  </div>
                </div>
              </div>

              {/* Batch Payment Records List */}
              <div className="space-y-3 pt-4 border-t border-[#234338]">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Workers in this Site Batch ({currentBatchSummary.records.length})
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {currentBatchSummary.records.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No payment records generated for this site and week key yet.
                    </div>
                  ) : (
                    currentBatchSummary.records.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-[#0a1411] border border-[#1f3b31] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{r.recipient_name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{r.id} · {r.recipient_mobile}</div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono font-bold text-white">₱{r.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            {renderStatusBadge(r.status)}
                          </div>

                          <button
                            onClick={() => setActiveVoucherRecord(r)}
                            className="p-2 bg-[#1a362d] text-[#a3e635] hover:bg-[#254f42] rounded-lg"
                            title="Open Voucher"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFICIAL GCASH API INTEGRATION & ONBOARDING ROADMAP */}
      {/* ========================================================================= */}
      {activeTab === 'official_api_roadmap' && (
        <div className="space-y-6">
          {/* Engineering Boundary Notice */}
          <div className="bg-[#10201b] border border-[#234338] p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Official GCash for Business Integration Architecture
                  </h3>
                  <div className="text-xs text-slate-400">
                    Target Enterprise Products: <strong className="text-[#a3e635]">GCash PowerPay+ / Funds Disbursement Service</strong>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Live API Flag: DISABLED (Manual Receipt Mode Active)
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Per Section 4 of the Upgrade &amp; Change Specification, automated disbursement or authoritative automatic payment confirmation must remain disabled until business verification, contracts, and official sandbox tests are complete. All money movement is tracked through individual payment records, verified recipient details, and manual receipt reconciliation.
            </p>
          </div>

          {/* 3-Phase Implementation Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase A */}
            <div className="bg-[#10201b] border border-[#234338] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Phase A</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  In Progress
                </span>
              </div>
              <h4 className="font-black text-white text-base">Eligibility &amp; Official Onboarding</h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Business Verification (SEC Reg CS201844920, TIN registered)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>DOLE D.O. 13 Construction Safety &amp; Wage Compliance verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>GCash for Business Corporate Partner agreement execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>PowerPay+ corporate wage disbursement sandbox credentials</span>
                </li>
              </ul>
            </div>

            {/* Phase B */}
            <div className="bg-[#10201b] border border-[#234338] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Phase B</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Engine Ready
                </span>
              </div>
              <h4 className="font-black text-white text-base">Server-Side Provider Adapter</h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Adapter boundary established in <code className="text-[#a3e635]">src/server/gcashAdapter.ts</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero credentials exposed in client bundles (server-side only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Idempotency store to eliminate duplicate payout attempts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Global duplicate reference registry active</span>
                </li>
              </ul>
            </div>

            {/* Phase C */}
            <div className="bg-[#10201b] border border-[#234338] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase C</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Pending Sandbox
                </span>
              </div>
              <h4 className="font-black text-white text-base">Test, Cutover &amp; Rollback</h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>Sandbox end-to-end tests for partial batches and timeouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>Controlled live pilot with initial ₱5,000 threshold</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Emergency killswitch and instant fallback to manual QR mode</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Active Duplicate Reference Registry Ledger */}
          <div className="bg-[#10201b] border border-[#234338] rounded-xl overflow-hidden shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#a3e635]" />
                  Registered GCash References &amp; Idempotency Ledger
                </h4>
                <div className="text-xs text-slate-400">
                  Every reference number uploaded is locked in an immutable audit registry to prevent replay attacks and duplicate claims.
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0a1512] uppercase tracking-wider text-slate-400 border-b border-[#234338]">
                  <tr>
                    <th className="py-2.5 px-3">Reference Number</th>
                    <th className="py-2.5 px-3">Associated Voucher</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f3b31]">
                  {paymentRecords
                    .filter((p) => p.receipt_evidence?.reference_number)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-[#162c25]/60 font-mono">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          {p.receipt_evidence?.reference_number}
                          {p.receipt_evidence?.is_duplicate_ref && (
                            <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black">
                              CONFLICT
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#a3e635]">{p.id}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-200">{p.recipient_name}</td>
                        <td className="py-2.5 px-3 text-white">₱{p.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3">{renderStatusBadge(p.status)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INDIVIDUAL PAYMENT PAGE & QR VOUCHER MODAL */}
      {/* ========================================================================= */}
      {activeVoucherRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#10201b] border border-[#234338] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#234338] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/30">
                  {getModuleLabel(activeVoucherRecord.module)}
                </span>
                <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  Official Payment Voucher
                  <span className="font-mono text-xs font-normal text-slate-400">({activeVoucherRecord.id})</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveVoucherRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a332a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payer Guidance Disclaimer (Section 2 Page 2) */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Payer Instructions &amp; Verification Protocol
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                <li>Open official GCash application on your mobile device.</li>
                <li>Transfer exact expected amount (<strong>₱{activeVoucherRecord.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>) to verified recipient below.</li>
                <li>Take a screenshot of the official transfer confirmation with reference number.</li>
                <li>Upload the receipt evidence below. Authorized executive reviewer verifies and marks <code>PAID_VERIFIED</code>.</li>
              </ol>
            </div>

            {/* QR Codes & Recipient Details Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: ERP Payment Record QR */}
              <div className="bg-[#0a1411] border border-[#1f3b31] p-4 rounded-xl flex flex-col items-center text-center space-y-2">
                <span className="text-[11px] font-bold text-slate-300">Secure ERP Payment Voucher QR</span>
                <div className="bg-white p-2 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `https://emybuilder.pages.dev/payment/${activeVoucherRecord.id}`
                    )}`}
                    alt="ERP Payment Voucher QR"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Opens this verified ERP voucher page for site auditing
                </div>
              </div>

              {/* Right: Recipient Receiving Details */}
              <div className="bg-[#0a1411] border border-[#1f3b31] p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#a3e635] uppercase tracking-wider block">
                    Verified Recipient Account
                  </span>
                  <div>
                    <div className="text-base font-black text-white">{activeVoucherRecord.recipient_name}</div>
                    <div className="text-xs text-slate-400">{activeVoucherRecord.site_name}</div>
                  </div>

                  <div className="p-2.5 bg-[#12241f] rounded-lg border border-[#234a3e] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">GCash Mobile</span>
                      <span className="font-mono font-bold text-sm text-white">{activeVoucherRecord.recipient_mobile}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeVoucherRecord.recipient_mobile, 'modal_mobile')}
                      className="px-2.5 py-1 bg-[#1f4a3c] text-[#a3e635] rounded text-xs font-bold flex items-center gap-1 hover:bg-[#285e4d]"
                    >
                      {copiedText === 'modal_mobile' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#12241f] rounded-lg border border-[#234a3e]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Exact Expected Amount</span>
                    <span className="font-mono font-black text-xl text-[#a3e635]">
                      ₱{activeVoucherRecord.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1f3b31]">
                  <span className="text-xs text-slate-400">Current Status:</span>
                  {renderStatusBadge(activeVoucherRecord.status)}
                </div>
              </div>
            </div>

            {/* Recipient External QR Code if Provided (Section 2 Page 2) */}
            {activeVoucherRecord.recipient_qr_url && (
              <div className="p-3 bg-[#0a1411] border border-[#1f3b31] rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={activeVoucherRecord.recipient_qr_url}
                    alt="Recipient GCash QR"
                    className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Recipient's External GCash Receiving QR
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Provided by worker during HR onboarding. Scan inside GCash app to direct-transfer.
                    </span>
                  </div>
                </div>
                <a
                  href={activeVoucherRecord.recipient_qr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#1a362d] text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" /> Full QR
                </a>
              </div>
            )}

            {/* Attached Receipt Evidence */}
            {activeVoucherRecord.receipt_evidence ? (
              <div className="bg-[#0a1411] border border-[#1f3b31] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#a3e635]" />
                    Attached Transaction Evidence
                  </span>
                  <span className="text-xs text-slate-400">
                    Uploaded: {new Date(activeVoucherRecord.receipt_evidence.uploaded_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Reference Number</span>
                    <span className="font-mono font-bold text-white">
                      {activeVoucherRecord.receipt_evidence.reference_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Amount Transferred</span>
                    <span className="font-mono font-bold text-white">
                      ₱{activeVoucherRecord.receipt_evidence.amount_paid?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Payer Account</span>
                    <span className="text-white">{activeVoucherRecord.receipt_evidence.payer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Evidence Image</span>
                    <a
                      href={activeVoucherRecord.receipt_evidence.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#a3e635] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Eye className="w-3 h-3" /> View Receipt
                    </a>
                  </div>
                </div>

                {activeVoucherRecord.receipt_evidence.notes && (
                  <div className="p-2.5 bg-[#12241f] rounded text-[11px] text-slate-300">
                    <strong>Payer Note:</strong> {activeVoucherRecord.receipt_evidence.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#0a1411] border border-[#1f3b31] rounded-xl text-center space-y-2">
                <span className="text-xs text-slate-400 block">
                  No transfer receipt proof has been attached to this obligation yet.
                </span>
                <button
                  onClick={() => handleOpenUploadModal(activeVoucherRecord)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 mx-auto shadow"
                >
                  <Upload className="w-4 h-4" />
                  Attach GCash Receipt Screenshot
                </button>
              </div>
            )}

            {/* Audit Trail History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Immutable Voucher Audit Trail
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeVoucherRecord.audit_trail.map((aud) => (
                  <div key={aud.id} className="p-2 bg-[#0a1411] rounded border border-[#1f3b31] text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-mono text-[#a3e635] font-bold">{aud.action}</span>
                      <span>{new Date(aud.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-200 mt-0.5">{aud.details}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">By: {aud.performed_by}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#234338]">
              <div className="flex items-center gap-2">
                {canReview && (
                  <button
                    onClick={() => handleOpenReviewModal(activeVoucherRecord)}
                    className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#bef264]"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Review &amp; Verify Payment
                  </button>
                )}
                <button
                  onClick={() => handleOpenUploadModal(activeVoucherRecord)}
                  className="px-4 py-2 bg-[#1a362d] text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  {activeVoucherRecord.receipt_evidence ? 'Replace Evidence' : 'Attach Evidence'}
                </button>
              </div>

              <button
                onClick={() => setActiveVoucherRecord(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE PAYMENT RECORD MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePaymentRecord}
            className="bg-[#10201b] border border-[#234338] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#234338] pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#a3e635]" />
                Create Payment Obligation
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Payment Module</label>
                <select
                  value={createModule}
                  onChange={(e) => setCreateModule(e.target.value as PaymentModule)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                >
                  <option value="WEEKLY_PAYROLL">Weekly Payroll Salary</option>
                  <option value="CASH_ADVANCE">Cash Advance Disbursement</option>
                  <option value="CANTEEN_SETTLEMENT">Canteen Deduction Settlement</option>
                  <option value="SUPPLIER_PAYMENT">Supplier / Materials Invoice</option>
                  <option value="CONTRACTOR_PAYMENT">Subcontractor Spot Payment</option>
                  <option value="EMPLOYEE_REIMBURSEMENT">Employee Expense Reimbursement</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Recipient Category</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-white cursor-pointer">
                    <input
                      type="radio"
                      checked={createRecipientType === 'EMPLOYEE'}
                      onChange={() => setCreateRecipientType('EMPLOYEE')}
                      className="accent-[#a3e635]"
                    />
                    Registered Employee
                  </label>
                  <label className="flex items-center gap-1.5 text-white cursor-pointer">
                    <input
                      type="radio"
                      checked={createRecipientType === 'VENDOR_CUSTOM'}
                      onChange={() => setCreateRecipientType('VENDOR_CUSTOM')}
                      className="accent-[#a3e635]"
                    />
                    Custom Vendor / Contractor
                  </label>
                </div>
              </div>

              {createRecipientType === 'EMPLOYEE' ? (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Select Employee</label>
                  <select
                    value={createEmployeeId}
                    onChange={(e) => setCreateEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.name} ({emp.employee_id}) · GCash: {emp.gcash_number || emp.contact_number}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Vendor / Payee Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Holcim Cement"
                      value={createCustomName}
                      onChange={(e) => setCreateCustomName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">GCash Mobile #</label>
                    <input
                      type="text"
                      required
                      placeholder="0917-XXX-XXXX"
                      value={createCustomMobile}
                      onChange={(e) => setCreateCustomMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Operational Site</label>
                  <select
                    value={createSiteId}
                    onChange={(e) => setCreateSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Expected Amount (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={createExpectedAmount}
                    onChange={(e) => setCreateExpectedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Period / Invoice / Contract Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 41 (Oct 05 - Oct 11, 2026) or PO-2026-088"
                  value={createPeriodRef}
                  onChange={(e) => setCreatePeriodRef(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#234338]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs shadow hover:bg-[#bef264]"
              >
                Save &amp; Generate Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD RECEIPT EVIDENCE MODAL */}
      {/* ========================================================================= */}
      {isUploadModalOpen && uploadTargetRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReceiptUpload}
            className="bg-[#10201b] border border-[#234338] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#234338] pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Attach GCash Transfer Receipt
                </h3>
                <span className="text-xs text-slate-400 font-mono">Voucher: {uploadTargetRecord.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {uploadError}
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  GCash Transaction Reference Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GCASH-9021481029 or 9012 345 6789"
                  value={uploadRefNumber}
                  onChange={(e) => handleRefNumberChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Enforces global uniqueness. Duplicate reference numbers will trigger automated review flagging.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Amount Actually Paid (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={uploadAmountPaid}
                    onChange={(e) => setUploadAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">
                    Expected: ₱{uploadTargetRecord.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date &amp; Time of Transfer</label>
                  <input
                    type="datetime-local"
                    value={uploadTransferDate}
                    onChange={(e) => setUploadTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payer Account Name</label>
                  <input
                    type="text"
                    value={uploadPayerName}
                    onChange={(e) => setUploadPayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payer Mobile #</label>
                  <input
                    type="text"
                    value={uploadPayerMobile}
                    onChange={(e) => setUploadPayerMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Receipt Screenshot URL / Proof</label>
                <input
                  type="url"
                  required
                  value={uploadReceiptUrl}
                  onChange={(e) => setUploadReceiptUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Payer Notes / Memo</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes for reviewer..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#234338]">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow hover:bg-blue-500"
              >
                Upload &amp; Submit for Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REVIEW DECISION MODAL */}
      {/* ========================================================================= */}
      {isReviewModalOpen && reviewTargetRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReviewDecision}
            className="bg-[#10201b] border border-[#234338] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#234338] pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#a3e635]" />
                  Executive Review &amp; Settlement Decision
                </h3>
                <span className="text-xs text-slate-400 font-mono">Voucher: {reviewTargetRecord.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Cards */}
            <div className="p-3 bg-[#0a1411] border border-[#1f3b31] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Expected Obligation</span>
                <span className="font-mono font-bold text-white block">
                  ₱{reviewTargetRecord.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-slate-300">{reviewTargetRecord.recipient_name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Receipt Proof Attached</span>
                <span className="font-mono font-bold text-white block">
                  ₱{reviewTargetRecord.receipt_evidence?.amount_paid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 'N/A'}
                </span>
                <span className="text-slate-300 font-mono">
                  Ref: {reviewTargetRecord.receipt_evidence?.reference_number || 'None'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Review Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as PaymentRecordStatus)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-bold"
                >
                  <option value="PAID_VERIFIED">✓ PAID VERIFIED (Dispatches Employee SMS Notification)</option>
                  <option value="NEEDS_REVIEW">⚠ Flag for Detailed Audit (NEEDS_REVIEW)</option>
                  <option value="PAYMENT_REJECTED">✗ Reject Payment Evidence (PAYMENT_REJECTED)</option>
                  <option value="UNDER_REVIEW">⏳ Keep Under Review (UNDER_REVIEW)</option>
                </select>
              </div>

              {reviewDecision === 'PAID_VERIFIED' && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-[11px] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Marking this payment <strong>PAID_VERIFIED</strong> will trigger an automated SMS notification to the employee ({reviewTargetRecord.recipient_mobile}).
                  </span>
                </div>
              )}

              {reviewDecision === 'PAYMENT_REJECTED' && (
                <div>
                  <label className="text-rose-400 font-semibold block mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reference number does not match bank record / amount mismatch"
                    value={reviewRejectionReason}
                    onChange={(e) => setReviewRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-rose-500/40 rounded-lg text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Review Notes / Compliance Comments</label>
                <textarea
                  rows={2}
                  placeholder="Enter audit notes for the permanent ledger..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#234338]">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-5 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs shadow hover:bg-[#bef264] disabled:opacity-50"
              >
                {reviewSubmitting ? 'Confirming...' : 'Confirm Decision & Update Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
