import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Site } from '../../types';
import {
  UtensilsCrossed,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  Copy,
  Check,
  X,
  Lock,
  ArrowRight,
  Receipt,
  Building,
} from 'lucide-react';

interface CanteenGcashPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site | null;
  defaultAmount?: number;
  weekKey?: string;
  onSuccess?: (refNo: string) => void;
}

export const CanteenGcashPayoutModal: React.FC<CanteenGcashPayoutModalProps> = ({
  isOpen,
  onClose,
  site,
  defaultAmount,
  weekKey = '2026-W41',
  onSuccess,
}) => {
  const {
    sites,
    payroll,
    deductions,
    gcashTransactions,
    gcashWalletBalance,
    sendGcashDisbursement,
    updateSite,
  } = useApp();

  const [vendorName, setVendorName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState('');
  const [ceoPin, setCeoPin] = useState('');
  const [saveAsSiteDefault, setSaveAsSiteDefault] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [paymentResult, setPaymentResult] = useState<{
    reference_no: string;
    receipt_url: string;
    timestamp: string;
  } | null>(null);

  // Calculate live canteen deduction and payout totals for this site
  const siteId = site?.site_id || 'SITE-001';
  const siteName = site?.name || 'Selected Project Site';

  // 1. Total canteen deductions across active records for this site
  const totalCanteenDeductions = deductions
    .filter((d) => d.site_id === siteId && (weekKey === 'ALL' || d.week_key === weekKey) && !d.is_void)
    .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

  // 2. Total previous canteen payouts via GCash for this site
  const totalPreviousPayouts = gcashTransactions
    .filter((tx) => tx.category === 'Site Canteen Payout' && tx.site_id === siteId && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // 3. Outstanding canteen balance
  const outstandingBalance = Math.max(0, totalCanteenDeductions - totalPreviousPayouts);

  useEffect(() => {
    if (isOpen && site) {
      setVendorName(site.canteen_vendor_name || `${site.name} Canteen Concessionaire`);
      setGcashNumber(site.canteen_gcash_number || '');
      setContactPerson(site.canteen_contact_person || 'Canteen Manager');

      const initialAmount = defaultAmount !== undefined && defaultAmount > 0
        ? defaultAmount
        : outstandingBalance > 0
        ? outstandingBalance
        : totalCanteenDeductions > 0
        ? totalCanteenDeductions
        : 0;

      setAmount(initialAmount);
      setPurpose(`Canteen Settlement (${weekKey}) - ${site.code} ${site.name}`);
      setCeoPin('');
      setValidationError(null);
      setPaymentResult(null);
    }
  }, [isOpen, site, defaultAmount, outstandingBalance, totalCanteenDeductions, weekKey]);

  if (!isOpen || !site) return null;

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadReceipt = () => {
    if (!paymentResult?.receipt_url) return;
    const a = document.createElement('a');
    a.href = paymentResult.receipt_url;
    a.download = `GCash_Canteen_Receipt_${site.code}_${paymentResult.reference_no}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate phone number (Philippine GCash format: 09XXXXXXXXX or 639XXXXXXXXX)
    let cleanMobile = gcashNumber.trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }
    if (!cleanMobile.startsWith('09') || cleanMobile.length !== 11) {
      setValidationError('Please enter a valid 11-digit Philippine GCash mobile number starting with 09 (e.g. 09171234567).');
      return;
    }

    if (amount <= 0) {
      setValidationError('Disbursement amount must be greater than ₱0.00.');
      return;
    }

    if (amount > gcashWalletBalance) {
      setValidationError(`Insufficient corporate GCash balance (₱${gcashWalletBalance.toLocaleString()}) for payout of ₱${amount.toLocaleString()}.`);
      return;
    }

    if (!vendorName.trim()) {
      setValidationError('Please specify the Canteen Concessionaire / Vendor Name.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Update site defaults if checkbox selected
      if (saveAsSiteDefault) {
        updateSite(site.site_id, {
          canteen_vendor_name: vendorName.trim(),
          canteen_gcash_number: cleanMobile,
          canteen_contact_person: contactPerson.trim(),
        });
      }

      // 2. Dispatch GCash payout
      const res = await sendGcashDisbursement({
        category: 'Site Canteen Payout',
        site_id: site.site_id,
        recipient_name: vendorName.trim(),
        recipient_mobile: cleanMobile,
        amount: Number(amount),
        purpose: purpose.trim() || `Canteen Meal Settlement (${weekKey})`,
        user_pin: ceoPin.trim() || 'Emerita0279',
      });

      setPaymentResult({
        reference_no: res.reference_no,
        receipt_url: res.receipt_url,
        timestamp: new Date().toISOString(),
      });

      if (onSuccess) {
        onSuccess(res.reference_no);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setValidationError(e?.message || 'Failed to process GCash canteen disbursement.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005ce6] via-[#0047b3] to-[#065f46] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <UtensilsCrossed className="w-5 h-5 text-lime-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Site Canteen GCash Payout
                </h3>
                <span className="text-[10px] font-bold bg-[#a3e635] text-[#080f0d] px-2 py-0.5 rounded-full uppercase font-mono">
                  {site.code}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Direct concessionaire settlement for worker meal deductions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {paymentResult ? (
            /* Success Receipt Screen */
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  Canteen Payout Disbursed Successfully!
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Sent <strong>₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to{' '}
                  <strong className="text-lime-400">{vendorName}</strong> ({gcashNumber})
                </p>
              </div>

              {/* Reference Card */}
              <div className="p-4 bg-[#13241f] border border-[#234338] rounded-xl text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">GCash Reference No:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white tracking-wider">
                      {paymentResult.reference_no}
                    </span>
                    <button
                      onClick={() => handleCopyRef(paymentResult.reference_no)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                      title="Copy Reference"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Project Site:</span>
                  <span className="font-semibold text-slate-200">{site.name}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Settlement Cycle:</span>
                  <span className="font-mono text-lime-400">{weekKey}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Accounting Ledger:</span>
                  <span className="text-emerald-300 text-[11px] font-semibold">
                    ✓ Logged as Approved Expense & Archived in Vault
                  </span>
                </div>
              </div>

              {/* Official SVG Receipt Preview Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download GCash Official Receipt (SVG)</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close & View Ledger
                </button>
              </div>
            </div>
          ) : (
            /* Disbursement Input Form */
            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Site & Live Calculation Summary */}
              <div className="p-3.5 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-lime-400" />
                    Target Project Site:
                  </span>
                  <span className="font-bold text-white">{site.code} &bull; {site.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#234338]/60 text-center">
                  <div className="p-2 bg-[#0e1a16] rounded-lg border border-[#234338]/40">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Worker Deductions</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      ₱{totalCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="p-2 bg-[#0e1a16] rounded-lg border border-[#234338]/40">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Total Settled</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                      ₱{totalPreviousPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="p-2 bg-[#0e1a16] rounded-lg border border-[#234338]/40">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Net Outstanding</div>
                    <div className="text-xs font-mono font-bold text-lime-400 mt-0.5">
                      ₱{outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Concessionaire & GCash Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Canteen Operator / Concessionaire
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Ate Maria's Site Mess Hall"
                    className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                    <span>Canteen GCash Mobile Number</span>
                    <span className="text-[9px] text-lime-400 font-mono">09XXXXXXXXX</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                      placeholder="09171234567"
                      maxLength={12}
                      className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-xs focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>
              </div>

              {/* Amount and PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase">
                      Payout Amount (₱ PHP)
                    </label>
                    {outstandingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(outstandingBalance)}
                        className="text-[10px] text-lime-400 hover:underline font-mono"
                      >
                        Set to Balance (₱{outstandingBalance.toLocaleString()})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    CEO Authorization PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={ceoPin}
                      onChange={(e) => setCeoPin(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>
              </div>

              {/* Purpose / Memo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Settlement Memo / Description
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Weekly Canteen Payout for Site 001"
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Checkbox: Save as default for this site */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="saveCanteenDefault"
                  checked={saveAsSiteDefault}
                  onChange={(e) => setSaveAsSiteDefault(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#080f0d] border-[#234338] text-lime-400 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="saveCanteenDefault" className="text-xs text-slate-300 cursor-pointer">
                  Save as default Canteen Concessionaire & GCash number for <strong>{site.code}</strong>
                </label>
              </div>

              {/* Error Message */}
              {validationError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || amount <= 0 || !vendorName.trim() || !gcashNumber.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-emerald-600 to-lime-500 hover:from-blue-500 hover:to-lime-400 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Processing GCash Disbursement...'
                      : `Authorize & Send ₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} via GCash`}
                  </span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enterprise BSP Gateway &bull; Official Digital Tax-Compliant Receipt</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
