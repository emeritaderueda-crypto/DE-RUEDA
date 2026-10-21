import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GCashTransactionRecord } from '../../types';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Send,
  Building,
  ArrowRight,
  Sparkles,
  Shield,
  Search,
  CreditCard,
} from 'lucide-react';

interface RealtimeGcashStreamWidgetProps {
  onOpenCeoGcash?: () => void;
}

export const RealtimeGcashStreamWidget: React.FC<RealtimeGcashStreamWidgetProps> = ({
  onOpenCeoGcash,
}) => {
  const { gcashTransactions, gcashWalletBalance } = useApp();
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<GCashTransactionRecord | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const totalDisbursed = gcashTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const displayedTransactions = gcashTransactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.category !== filterType) return false;
    return true;
  });

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-blue-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                Real-Time GCash Disbursements & Operational Stream
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                LIVE REAL-TIME SYNC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live reflection of CEO and site manager GCash disbursements across construction sites & weekly salaries
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#a3e635]"
          >
            <option value="ALL">All Categories</option>
            <option value="Weekly Salary">Weekly Salaries</option>
            <option value="Site Operations (Fuel/Emergency)">Site Operations & Fuel</option>
          </select>

          {onOpenCeoGcash && (
            <button
              onClick={onOpenCeoGcash}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments &amp; Transactions &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-[#0f1c3d] border border-[#1e3a8a]/50 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Corporate Payment Reserves</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            ₱{gcashWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-400">● Liquid &amp; Ready for Dispatch</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Total Outflow Disbursed</div>
          <div className="text-lg font-bold font-mono text-[#a3e635] mt-0.5">
            ₱{totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500">Across {gcashTransactions.length} recorded payouts</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400">Ledger Compliance</div>
          <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
            100% BSP & DOLE
          </div>
          <div className="text-[10px] text-slate-500">Auto-uploaded SVG receipts</div>
        </div>
      </div>

      {/* Live Transactions List */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Recent Real-Time Disbursements ({displayedTransactions.length})</span>
          <span className="text-[10px] text-slate-500 font-mono">Immediate State Synchronization</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {displayedTransactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No GCash transactions match this filter.
            </div>
          ) : (
            displayedTransactions.slice(0, 6).map((tx) => (
              <div
                key={tx.transaction_id}
                className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981]/50 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{tx.recipient_name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({tx.recipient_mobile})</span>
                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                      {tx.category}
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-[#0e1a16] text-slate-300 border border-[#234338]">
                      {tx.site_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate max-w-md">
                    {tx.purpose}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: <strong className="text-slate-300">{tx.reference_no}</strong> &bull; {tx.timestamp} &bull; Initiator: {tx.initiated_by}
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                  {tx.receipt_url && (
                    <button
                      onClick={() => setSelectedReceiptTx(tx)}
                      className="px-2 py-0.5 bg-[#0e1a16] hover:bg-[#a3e635] text-slate-300 hover:text-[#080f0d] border border-[#234338] rounded text-[10px] font-semibold transition-colors cursor-pointer inline-block"
                    >
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">GCash Official Receipt</h4>
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
                className="max-h-72 w-full object-contain"
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
    </div>
  );
};
