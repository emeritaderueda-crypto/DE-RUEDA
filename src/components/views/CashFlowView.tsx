import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadCSV, downloadExcelXML, downloadWordDoc } from '../../utils/exporters';
import { TrendingDown, Banknote, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';

export const CashFlowView: React.FC = () => {
  const { payroll, deductions, dtrWeeks, gcashTransactions } = useApp();
  const [selectedWeek, setSelectedWeek] = useState(dtrWeeks[0]?.week_key || '2026-W40');

  const filteredPayroll = payroll.filter((p) => selectedWeek === 'ALL' || p.week_key === selectedWeek);
  const filteredDeductions = deductions.filter(
    (d) => (selectedWeek === 'ALL' || d.week_key === selectedWeek) && !d.is_void
  );

  const totalDisbursement = filteredPayroll.reduce((sum, p) => sum + p.net_pay, 0);
  const gcashDisbursement = filteredPayroll
    .filter((p) => p.payment_method === 'GCash')
    .reduce((sum, p) => sum + p.net_pay, 0);
  const cashDisbursement = filteredPayroll
    .filter((p) => p.payment_method === 'Cash')
    .reduce((sum, p) => sum + p.net_pay, 0);

  const totalCanteen = filteredDeductions.reduce((sum, d) => sum + Number(d.canteen || 0), 0);
  const siteCanteenDisbursed = gcashTransactions
    .filter((tx) => tx.category === 'Site Canteen Payout' && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalSss = filteredDeductions.reduce((sum, d) => sum + Number(d.sss || 0), 0);
  const totalPhilhealth = filteredDeductions.reduce((sum, d) => sum + Number(d.philhealth || 0), 0);
  const totalAdvances = filteredDeductions.reduce((sum, d) => sum + Number(d.cash_advance || 0), 0);
  const totalOther = filteredDeductions.reduce((sum, d) => sum + Number(d.other_deduction || 0), 0);
  const totalWithheld = totalCanteen + totalSss + totalPhilhealth + totalAdvances + totalOther;

  const handleExportCSV = () => {
    const rows = [
      ['Cash Flow Category', 'Classification', 'Amount (PHP)', 'Accounting Note'],
      ['Canteen & Commissary', 'Internal Withholding', totalCanteen.toFixed(2), 'Reimburses site commissary caterer'],
      ['SSS Contributions', 'Statutory Remittance', totalSss.toFixed(2), 'Social security monthly employer/employee remittance'],
      ['PhilHealth Contributions', 'Statutory Remittance', totalPhilhealth.toFixed(2), 'Healthcare insurance remittance'],
      ['Recovered Cash Advances', 'Treasury Recoup', totalAdvances.toFixed(2), 'Recouped emergency worker advance cash'],
      ['Safety & PPE Gear', 'Tools Accountability', totalOther.toFixed(2), 'Replacement gloves & safety gear charge'],
      ['GCash Electronic Transfers', 'Worker Outflow', gcashDisbursement.toFixed(2), 'Direct verified mobile wallet transfers'],
      ['Cash Envelope Disbursements', 'Worker Outflow', cashDisbursement.toFixed(2), 'Signed physical cash vouchers'],
      ['TOTAL NET DISBURSEMENT', 'Company Outflow', totalDisbursement.toFixed(2), 'Final audited payroll payout'],
    ];
    downloadCSV(`DRC_CashFlow_${selectedWeek}`, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Category', 'Type', 'Amount (PHP)', 'Operational Notes'];
    const rows = [
      ['Canteen & Commissary', 'Internal Withholding', totalCanteen, 'Reimburses site commissary caterer'],
      ['SSS Contributions', 'Statutory Remittance', totalSss, 'Social security monthly remittance'],
      ['PhilHealth Contributions', 'Statutory Remittance', totalPhilhealth, 'Healthcare insurance remittance'],
      ['Recovered Cash Advances', 'Treasury Recoup', totalAdvances, 'Recouped emergency worker advance cash'],
      ['Safety & PPE Gear', 'Tools Accountability', totalOther, 'Replacement gloves & safety gear charge'],
      ['GCash Transfers', 'Direct Outflow', gcashDisbursement, 'Direct verified mobile wallet transfers'],
      ['Cash Envelopes', 'Physical Outflow', cashDisbursement, 'Signed physical cash vouchers'],
      ['TOTAL OUTFLOW', 'Final Outflow', totalDisbursement, 'Final audited payroll payout'],
    ];
    downloadExcelXML(`DRC_CashFlow_${selectedWeek}`, 'Cash Flow', headers, rows);
  };

  const handleExportWord = () => {
    const html = `
      <h3>Cash Flow Disbursements Summary — Week ${selectedWeek}</h3>
      <table>
        <tr><th>Category</th><th>Type</th><th>Amount (PHP)</th><th>Accounting Treatment</th></tr>
        <tr><td>Canteen Withholding</td><td>Internal</td><td>₱${totalCanteen.toLocaleString()}</td><td>Commissary caterer payout</td></tr>
        <tr><td>SSS Contributions</td><td>Statutory</td><td>₱${totalSss.toLocaleString()}</td><td>Monthly remittance</td></tr>
        <tr><td>PhilHealth Contributions</td><td>Statutory</td><td>₱${totalPhilhealth.toLocaleString()}</td><td>Medical health remittance</td></tr>
        <tr><td>Recovered Cash Advances</td><td>Recoup</td><td>₱${totalAdvances.toLocaleString()}</td><td>Returned to company treasury</td></tr>
        <tr><td>GCash Outflow</td><td>Electronic</td><td>₱${gcashDisbursement.toLocaleString()}</td><td>Verified mobile transfers</td></tr>
        <tr><td>Cash Outflow</td><td>Physical</td><td>₱${cashDisbursement.toLocaleString()}</td><td>Signed vouchers</td></tr>
        <tr><td><strong>TOTAL OUTFLOW</strong></td><td>Company Outflow</td><td><strong>₱${totalDisbursement.toLocaleString()}</strong></td><td>Net worker disbursements</td></tr>
      </table>
    `;
    downloadWordDoc(`DRC_CashFlow_${selectedWeek}`, 'Weekly Cash Flow Report', html);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Weekly Cash Flow & Disbursements
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Derived strictly from verified attendance and finalized payroll</span>
            <span>·</span>
            <span>Zero manually-fabricated numbers</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print View
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#a3e635]" />
            Excel
          </button>
          <button
            onClick={handleExportWord}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Word
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-semibold">TARGET WORK WEEK:</span>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-xs text-[#a3e635] font-mono font-bold outline-none cursor-pointer"
        >
          <option value="ALL">All Consolidated Weeks</option>
          {dtrWeeks.map((w) => (
            <option key={w.week_key} value={w.week_key}>
              {w.week_key} ({w.date_start} to {w.date_end})
            </option>
          ))}
        </select>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Net Disbursement</span>
          <div className="text-2xl font-black font-mono text-[#a3e635] mt-1 tabular-nums">
            ₱{totalDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total worker cash outflow</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">GCash Mobile Payouts</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
            ₱{gcashDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Electronic transfer receipts</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Cash Envelopes</span>
          <div className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
            ₱{cashDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Signed voucher payments</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Withheld Deductions</span>
          <div className="text-2xl font-black font-mono text-red-400 mt-1 tabular-nums">
            ₱{totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Canteen, SSS, PhilHealth & CA</div>
        </div>
      </div>

      {/* Cash Flow Ledger Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="text-xs font-bold text-white">Consolidated Disbursement & Withholding Ledger</div>
          <span className="text-[11px] font-mono text-slate-400">{selectedWeek}</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="p-3">Cash Flow Line Item</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Amount (₱)</th>
              <th className="p-3">Accounting Treatment & Operational Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#234338]/40">
            <tr>
              <td className="p-3 font-bold text-white">Canteen & Commissary Deductions</td>
              <td className="p-3"><span className="text-slate-400 font-semibold">Internal Withholding</span></td>
              <td className="p-3 text-right font-mono font-bold">₱{totalCanteen.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Withheld from worker wages to reimburse site canteen meals.</td>
            </tr>
            <tr>
              <td className="p-3 font-bold text-lime-300">Canteen Concessionaire Settlements (GCash)</td>
              <td className="p-3"><span className="text-lime-400 font-semibold">Vendor Outflow</span></td>
              <td className="p-3 text-right font-mono font-bold text-emerald-400">₱{siteCanteenDisbursed.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Direct automated electronic GCash payments disbursed to accredited canteen concessionaires.</td>
            </tr>
            <tr>
              <td className="p-3 font-bold text-white">SSS Mandatory Contributions</td>
              <td className="p-3"><span className="text-emerald-400 font-semibold">Statutory Remittance</span></td>
              <td className="p-3 text-right font-mono font-bold">₱{totalSss.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Withheld for statutory monthly SSS employer-employee remittance.</td>
            </tr>
            <tr>
              <td className="p-3 font-bold text-white">PhilHealth Contributions</td>
              <td className="p-3"><span className="text-emerald-400 font-semibold">Statutory Remittance</span></td>
              <td className="p-3 text-right font-mono font-bold">₱{totalPhilhealth.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Withheld for statutory medical insurance remittance.</td>
            </tr>
            <tr>
              <td className="p-3 font-bold text-white">Recovered Cash Advances (CA)</td>
              <td className="p-3"><span className="text-amber-400 font-semibold">Loan Recoup</span></td>
              <td className="p-3 text-right font-mono font-bold text-amber-400">₱{totalAdvances.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Recouped emergency worker advance cash returned to company treasury box.</td>
            </tr>
            <tr>
              <td className="p-3 font-bold text-white">Other Deductions (PPE & Safety Gear)</td>
              <td className="p-3"><span className="text-slate-400 font-semibold">Tools Accountability</span></td>
              <td className="p-3 text-right font-mono font-bold">₱{totalOther.toFixed(2)}</td>
              <td className="p-3 text-slate-400 text-[11px]">Replacement heavy-duty gloves, helmets, and safety harness charges.</td>
            </tr>
            <tr className="bg-[#13241f] border-t-2 border-[#234338]">
              <td className="p-3.5 font-extrabold text-sm text-[#a3e635]">TOTAL NET PAYOUT DISBURSEMENT</td>
              <td className="p-3.5 font-bold text-xs text-white">Company Outflow</td>
              <td className="p-3.5 text-right font-mono font-black text-base text-[#a3e635]">
                ₱{totalDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="p-3.5 text-xs text-slate-300 font-medium">
                Consolidated payroll net payout (GCash ₱{gcashDisbursement.toLocaleString()} + Cash ₱{cashDisbursement.toLocaleString()}).
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
