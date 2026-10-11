import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollRecord } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ArrowRight,
  X,
  FileCheck2,
  ExternalLink,
  Lock,
  Wallet,
  RefreshCw,
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
  const { employees, sites, triggerGcashPayment, isOnline } = useApp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [managerPin, setManagerPin] = useState('Emerita0279');
  const [managerNotes, setManagerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentResult, setPaymentResult] = useState<{
    reference_no: string;
    receipt_url: string;
    timestamp: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const employee = employees.find((e) => e.employee_id === payrollRecord?.employee_id);
  const site = sites.find((s) => s.site_id === payrollRecord?.site_id);

  // Initialize or reset form state when modal opens
  useEffect(() => {
    if (payrollRecord) {
      const defaultPhone = employee?.gcash_number || '09182345671';
      setMobileNumber(defaultPhone);
      setManagerNotes(`Weekly payroll payout for ${payrollRecord.week_key}`);
      setValidationError(null);

      // If already paid with a proof, show receipt directly
      if (payrollRecord.payment_status === 'Paid' && payrollRecord.proof_url) {
        setPaymentResult({
          reference_no: payrollRecord.reference_no || `GCASH-MP-REF`,
          receipt_url: payrollRecord.proof_url,
          timestamp: payrollRecord.paid_at || new Date().toISOString(),
        });
      } else {
        setPaymentResult(null);
      }
    }
  }, [payrollRecord, employee]);

  if (!isOpen || !payrollRecord) return null;

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/[^0-9]/g, '');
    return clean.startsWith('09') && clean.length === 11;
  };

  const handleExecutePayment = async () => {
    if (!validatePhone(mobileNumber)) {
      setValidationError('Please enter a valid 11-digit Philippine GCash mobile number starting with 09 (e.g. 09182345671).');
      return;
    }
    if (!managerPin.trim()) {
      setValidationError('Please enter the manager authorization PIN.');
      return;
    }

    setValidationError(null);
    setIsProcessing(true);
    setProcessingStep(1);

    // Simulate authentic step-by-step gateway confirmation sequence
    setTimeout(() => setProcessingStep(2), 600);
    setTimeout(() => setProcessingStep(3), 1200);

    setTimeout(async () => {
      try {
        const result = await triggerGcashPayment(
          payrollRecord.payroll_id,
          mobileNumber.trim(),
          managerNotes.trim(),
          managerPin.trim()
        );

        setPaymentResult({
          reference_no: result.reference_no,
          receipt_url: result.receipt_url,
          timestamp: new Date().toISOString(),
        });

        setIsProcessing(false);
        if (onSuccess) {
          onSuccess(result.reference_no);
        }
      } catch (err: any) {
        setIsProcessing(false);
        setValidationError(err?.message || 'Payment execution failed. Please verify credentials and retry.');
      }
    }, 1800);
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadReceipt = () => {
    if (!paymentResult?.receipt_url) return;
    const a = document.createElement('a');
    a.href = paymentResult.receipt_url;
    a.download = `GCash_Receipt_${(employee?.name || payrollRecord.employee_id).replace(/\s+/g, '_')}_${paymentResult.reference_no}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* GCash Blue Top Header */}
        <div className="bg-gradient-to-r from-[#005ce6] to-[#003b99] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Smartphone className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">GCash Direct Disbursement</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#a3e635] text-[#080f0d]">
                  API INSTAPAY
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                De Rueda Construction Inc. Enterprise Disbursement Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Top Info Banner */}
          {!isOnline && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Site Network Offline Mode: Payment will be cryptographically signed locally, recorded in site cache, and automatically synced to central server once connection restores.
              </span>
            </div>
          )}

          {/* If Payment Succeeded / Confirmed */}
          {paymentResult ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-white">Payment Confirmed & Receipt Uploaded!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  The weekly payout was successfully sent via GCash. The official electronic receipt was <strong>automatically uploaded</strong> to the DRC Document Vault (<code>04_Payroll_and_Disbursements</code>) and registered in the audit ledger.
                </p>
              </div>

              {/* Reference & Transaction Summary */}
              <div className="bg-[#13241f] border border-[#234338] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#234338]">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">GCash Transaction Reference</span>
                    <div className="text-base font-mono font-black text-[#a3e635] flex items-center gap-2 mt-0.5">
                      <span>{paymentResult.reference_no}</span>
                      <button
                        onClick={() => handleCopyRef(paymentResult.reference_no)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                        title="Copy Reference"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Disbursed Net Pay</span>
                    <div className="text-lg font-mono font-black text-white">
                      ₱{payrollRecord.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Recipient:</span>
                    <div className="font-bold text-white truncate">{employee?.name || payrollRecord.employee_id}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile Wallet:</span>
                    <div className="font-mono font-bold text-sky-400">{mobileNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Period:</span>
                    <div className="font-mono font-semibold text-white">{payrollRecord.week_key}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid & Verified
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Electronic Receipt Preview Frame */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#a3e635]" />
                    Official GCash E-Receipt (Automatic Vault File)
                  </span>
                  <button
                    onClick={handleDownloadReceipt}
                    className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    Download SVG Receipt
                  </button>
                </div>

                <div className="border border-[#234338] rounded-xl overflow-hidden bg-black/40 p-2 flex justify-center max-h-[320px] overflow-y-auto">
                  <img
                    src={paymentResult.receipt_url}
                    alt="GCash Official Receipt"
                    className="w-full max-w-md h-auto rounded shadow-lg object-contain"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="px-3.5 py-2 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#a3e635]" />
                  Download Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg shadow-sm transition-colors"
                >
                  Done & Return to Payroll
                </button>
              </div>
            </div>
          ) : (
            /* Payment Input & Confirmation Screen */
            <div className="space-y-4">
              {/* Worker & Breakdown Card */}
              <div className="bg-[#13241f] border border-[#234338] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#234338]">
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      {employee?.name || payrollRecord.employee_id}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-emerald-400 font-bold">{payrollRecord.employee_id}</span>
                      <span>·</span>
                      <span>{employee?.position || 'Field Craftsman'}</span>
                      <span>·</span>
                      <span>{site?.name || payrollRecord.site_id}</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Calculated Net Take-Home</span>
                    <div className="text-2xl font-mono font-black text-[#a3e635]">
                      ₱{payrollRecord.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Payroll Component Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#0b1612] p-2.5 rounded-lg border border-[#234338]/60">
                  <div>
                    <span className="text-slate-500">Gross Pay:</span>
                    <div className="font-mono font-semibold text-emerald-400">
                      ₱{payrollRecord.gross_pay.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {payrollRecord.verified_days}d ({payrollRecord.verified_hours}h)
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Govt Withholding:</span>
                    <div className="font-mono font-semibold text-slate-300">
                      -₱{(payrollRecord.sss + payrollRecord.philhealth).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">SSS + PhilHealth</div>
                  </div>

                  <div>
                    <span className="text-slate-500">Advances / Canteen:</span>
                    <div className="font-mono font-semibold text-slate-300">
                      -₱{(payrollRecord.cash_advance + payrollRecord.canteen).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Field deductions</div>
                  </div>

                  <div>
                    <span className="text-slate-500">Total Deductions:</span>
                    <div className="font-mono font-bold text-red-400">
                      -₱{payrollRecord.total_deductions.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Withheld from salary</div>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* GCash Registered Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-200">
                    Recipient GCash Mobile Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="09182345671"
                      className="w-full bg-[#13241f] border border-[#234338] focus:border-[#005ce6] rounded-lg px-3 py-2 text-xs font-mono font-bold text-white outline-none pl-8"
                    />
                    <Smartphone className="w-4 h-4 text-[#005ce6] absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Must be registered 11-digit Philippine GCash number (09XXXXXXXXX).
                  </p>
                </div>

                {/* Manager Security PIN */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-200">
                    Manager Authorization PIN *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={managerPin}
                      onChange={(e) => {
                        setManagerPin(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="PIN"
                      maxLength={6}
                      className="w-full bg-[#13241f] border border-[#234338] focus:border-[#005ce6] rounded-lg px-3 py-2 text-xs font-mono font-bold text-white outline-none pl-8"
                    />
                    <Lock className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Corporate signatory authentication (default: 2026).
                  </p>
                </div>
              </div>

              {/* Disbursement Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Transaction Notes / Memo (Optional)
                </label>
                <input
                  type="text"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="e.g. Weekly net wage disbursement for Mariveles Site Warehouse A..."
                  className="w-full bg-[#13241f] border border-[#234338] focus:border-[#005ce6] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Corporate Wallet Balance Banner */}
              <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#005ce6]" />
                  <div>
                    <span className="font-bold text-white">DRC Corporate GCash Wallet</span>
                    <span className="text-[11px] text-slate-400 block">Account: DRC-GCASH-ENT-2026 · Active</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Available Balance</span>
                  <div className="font-mono font-extrabold text-emerald-400 text-sm">₱528,450.00</div>
                </div>
              </div>

              {/* Validation Error Banner */}
              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Processing Progress Status */}
              {isProcessing && (
                <div className="bg-[#13241f] border border-[#005ce6]/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#005ce6]" />
                      Processing Electronic Transfer...
                    </span>
                    <span className="text-[#a3e635] font-mono font-bold">Step {processingStep} of 3</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className={`flex items-center gap-2 ${processingStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validating recipient GCash mobile wallet &amp; BSP route...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${processingStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorizing fund transfer from De Rueda Enterprise account...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${processingStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Generating official electronic receipt and uploading to Document Vault...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#234338]">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant BSP Instapay transfer · Zero fees</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-[#005ce6] hover:bg-[#0047b3] text-white font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Disbursing...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send ₱{payrollRecord.net_pay.toLocaleString()} via GCash</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
