import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollRecord } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  X,
  FileCheck2,
  ExternalLink,
  QrCode,
  Upload,
  ShieldCheck,
} from 'lucide-react';

interface GCashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRecord: PayrollRecord | null;
  onSuccess?: (refNo: string) => void;
}

export const GCashPaymentModal: React.FC<GCashPaymentModalProps> = ({
  isOpen,
  onClose,
  payrollRecord,
  onSuccess,
}) => {
  const {
    employees,
    sites,
    paymentRecords,
    uploadPaymentReceipt,
    checkDuplicateReference,
    currentUser,
  } = useApp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [payerName, setPayerName] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 16));
  const [receiptUrl, setReceiptUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const employee = employees.find((e) => e.employee_id === payrollRecord?.employee_id);
  const site = sites.find((s) => s.site_id === payrollRecord?.site_id);

  // Check matching payment record from Upgrade & Change Specification
  const matchedPaymentRecord = paymentRecords.find(
    (p) =>
      p.recipient_id === payrollRecord?.employee_id &&
      p.period_reference.includes(payrollRecord?.week_key || '')
  );

  useEffect(() => {
    if (payrollRecord) {
      const defaultPhone = employee?.gcash_number || employee?.contact_number || '0917-000-0000';
      setMobileNumber(defaultPhone);
      setAmountPaid(payrollRecord.net_pay);
      setPayerName(currentUser?.name || 'De Rueda Construction Finance');
      setReferenceNo(matchedPaymentRecord?.receipt_evidence?.reference_number || payrollRecord.reference_no || '');
      setNotes(`Weekly payroll payout for ${payrollRecord.week_key} - ${employee?.name || payrollRecord.employee_id}`);
      setValidationError(null);
      setDuplicateWarning(null);
      setUploadSuccessMessage(null);
    }
  }, [payrollRecord, employee, matchedPaymentRecord, currentUser]);

  if (!isOpen || !payrollRecord) return null;

  const handleRefChange = (val: string) => {
    setReferenceNo(val);
    if (!val || val.length < 5) {
      setDuplicateWarning(null);
      return;
    }
    const dupCheck = checkDuplicateReference(val, matchedPaymentRecord?.id);
    if (dupCheck.isDuplicate) {
      setDuplicateWarning(
        `Warning: GCash Reference #${val} was already uploaded for record ${dupCheck.conflictingRecordId}. This upload will be flagged as NEEDS_REVIEW.`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo.trim()) {
      setValidationError('GCash Transaction Reference Number is required.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      if (matchedPaymentRecord) {
        const uploadRes = uploadPaymentReceipt(matchedPaymentRecord.id, {
          reference_number: referenceNo.trim(),
          receipt_url: receiptUrl,
          amount_paid: amountPaid,
          transfer_date: transferDate,
          payer_name: payerName,
          notes: notes,
        });

        if (uploadRes.success) {
          setUploadSuccessMessage(uploadRes.message);
          if (onSuccess) {
            onSuccess(referenceNo.trim());
          }
        } else {
          setValidationError(uploadRes.message);
        }
      } else {
        setUploadSuccessMessage(
          `Receipt proof attached for ${employee?.name || payrollRecord.employee_id}. Reference ${referenceNo.trim()} registered.`
        );
        if (onSuccess) {
          onSuccess(referenceNo.trim());
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyPaid =
    payrollRecord.payment_status === 'Paid' ||
    matchedPaymentRecord?.status === 'PAID_VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#005ce6] to-[#003b99] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <QrCode className="w-5 h-5 text-[#a3e635]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Employee Payment Voucher &amp; QR
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#a3e635] text-[#080f0d]">
                  OFFICIAL PROTOCOL
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                De Rueda Construction ERP · Receipt-Backed Settlement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Specification Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Manual Receipt-Backed Disbursement Workflow
            </div>
            <p className="text-[11px] text-amber-200/90">
              Transfer exact salary in the official GCash app to the verified employee details below, then enter the genuine transaction reference and attach the receipt screenshot. An authorized reviewer verifies and seals the payment.
            </p>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {validationError}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {uploadSuccessMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              {uploadSuccessMessage}
            </div>
          )}

          {/* Recipient & Payout Info Strip */}
          <div className="bg-[#13241f] border border-[#234338] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Verified Recipient Employee
              </span>
              <div className="text-base font-black text-white flex items-center gap-1.5">
                {employee?.name || payrollRecord.employee_id}
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-slate-400">
                Site: {site?.name || payrollRecord.site_id} · Week: {payrollRecord.week_key}
              </div>

              <div className="p-2 bg-[#0a1411] rounded-lg border border-[#234338] flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">GCash Mobile</span>
                  <span className="font-mono font-bold text-white text-xs">{mobileNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(mobileNumber)}
                  className="px-2 py-1 bg-[#1a362d] text-[#a3e635] rounded text-xs font-bold hover:bg-[#234b3e] flex items-center gap-1"
                >
                  {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Net Salary to Transfer
                </span>
                <div className="text-2xl font-mono font-black text-[#a3e635] mt-1">
                  ₱{payrollRecord.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400">Gross: ₱{payrollRecord.gross_pay.toLocaleString()} · Deds: ₱{payrollRecord.total_deductions.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#234338]">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  isAlreadyPaid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                }`}>
                  {isAlreadyPaid ? 'PAID VERIFIED' : 'AWAITING TRANSFER'}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Upload Form */}
          {!isAlreadyPaid ? (
            <form onSubmit={handleSubmitReceipt} className="space-y-3 pt-2">
              <div className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-400" />
                Upload Official GCash Receipt Evidence
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    GCash Reference Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GCASH-9021481029"
                    value={referenceNo}
                    onChange={(e) => handleRefChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Amount Transferred (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payer Account Name</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Transfer Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-slate-300 font-semibold block mb-1">Receipt Screenshot Proof URL</label>
                <input
                  type="url"
                  required
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a1411] border border-[#234338] rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Attach Receipt Proof'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-white text-sm">Disbursement Verified &amp; Sealed</div>
              <div className="text-xs text-slate-300 font-mono">
                GCash Ref: {referenceNo || 'VERIFIED-01'}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs mt-2"
              >
                Close Voucher
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
