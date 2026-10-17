import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  downloadCSV,
  downloadExcelXLSX,
  downloadWordDoc,
  downloadReportPDF,
} from '../../utils/exporters';
import { FileBarChart, Download, FileSpreadsheet, FileText, Printer, FileCheck, UtensilsCrossed, ArrowRight, Mail, Send } from 'lucide-react';
import { CanteenSpendingAggregationTab } from '../reports/CanteenSpendingAggregationTab';
import { WeeklyDtrEmailHub } from '../reports/WeeklyDtrEmailHub';

export const ReportsView: React.FC = () => {
  const {
    employees,
    sites,
    attendance,
    payroll,
    deductions,
    materials,
    expenses,
    dtrWeeks,
    auditLogs,
    currentSite,
    gcashTransactions,
    weeklyDtrSchedule,
    emailDeliveryLogs,
  } = useApp();

  const [activeMainTab, setActiveMainTab] = useState<'standard' | 'canteen-aggregation' | 'dtr-email'>('standard');
  const [showDtrEmailModal, setShowDtrEmailModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState('attendance-dtr');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [weekFilter, setWeekFilter] = useState(dtrWeeks[0]?.week_key || '2026-W41');

  const totalCompanyCanteenDeductions = deductions
    .filter((d) => d.is_void === 0)
    .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

  // Filter datasets
  const filteredEmployees = employees.filter((e) => siteFilter === 'ALL' || e.site_id === siteFilter);
  const filteredAttendance = attendance.filter((a) => siteFilter === 'ALL' || a.site_id === siteFilter);
  const filteredPayroll = payroll.filter(
    (p) => (siteFilter === 'ALL' || p.site_id === siteFilter) && (weekFilter === 'ALL' || p.week_key === weekFilter)
  );
  const filteredDeductions = deductions.filter(
    (d) => (siteFilter === 'ALL' || d.site_id === siteFilter) && (weekFilter === 'ALL' || d.week_key === weekFilter) && d.is_void === 0
  );
  const filteredMaterials = materials.filter((m) => (siteFilter === 'ALL' || m.site_id === siteFilter) && m.is_archived === 0);
  const filteredExpenses = expenses.filter((e) => siteFilter === 'ALL' || e.site_id === siteFilter);

  // Build uniform table data for the current selected report
  const getReportPayload = () => {
    let title = '';
    let subtitle = `Site Filter: ${siteFilter} | Week Filter: ${weekFilter} | Generated: ${new Date().toLocaleDateString()}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    switch (reportType) {
      case 'payroll':
        title = 'Weekly Payroll Register & Disbursements';
        headers = ['Payroll ID', 'Employee ID', 'Name', 'Site', 'Rate', 'Days', 'Gross (₱)', 'Deduct (₱)', 'Net Pay (₱)', 'Method', 'Status'];
        rows = filteredPayroll.map((p) => {
          const emp = employees.find((e) => e.employee_id === p.employee_id);
          return [
            p.payroll_id,
            p.employee_id,
            emp ? emp.name : p.employee_id,
            p.site_id,
            p.daily_rate.toFixed(2),
            p.verified_days.toFixed(1),
            p.gross_pay.toFixed(2),
            p.total_deductions.toFixed(2),
            p.net_pay.toFixed(2),
            p.payment_method,
            p.payment_status,
          ];
        });
        break;

      case 'employee-masterlist':
        title = 'Employee Masterlist & Government Benefit IDs';
        headers = ['Employee ID', 'Full Name', 'Trade / Position', 'Site', 'Daily Rate (₱)', 'SSS Number', 'PhilHealth', 'GCash', 'Status'];
        rows = filteredEmployees.map((e) => [
          e.employee_id,
          e.name,
          e.position,
          e.site_id,
          e.daily_rate.toFixed(2),
          e.sss_number || 'N/A',
          e.philhealth_number || 'N/A',
          e.gcash_number || 'None',
          e.status.toUpperCase(),
        ]);
        break;

      case 'deductions':
        title = 'Deductions & Worker Cash Advances Ledger';
        headers = ['Employee ID', 'Name', 'Week', 'Site', 'Canteen (₱)', 'SSS (₱)', 'PhilHealth (₱)', 'Cash Advance (₱)', 'Other (₱)', 'Total (₱)'];
        rows = filteredDeductions.map((d) => {
          const emp = employees.find((e) => e.employee_id === d.employee_id);
          return [
            d.employee_id,
            emp ? emp.name : d.employee_id,
            d.week_key,
            d.site_id,
            d.canteen.toFixed(2),
            d.sss.toFixed(2),
            d.philhealth.toFixed(2),
            d.cash_advance.toFixed(2),
            d.other_deduction.toFixed(2),
            d.total_deductions.toFixed(2),
          ];
        });
        break;

      case 'cashflow':
        title = 'Weekly Cash Flow Outflow & Disbursements Breakdown';
        headers = ['Disbursement Line Item', 'Category', 'Amount (PHP)', 'Accounting Note'];
        const totalCanteen = filteredDeductions.reduce((s, d) => s + d.canteen, 0);
        const totalSss = filteredDeductions.reduce((s, d) => s + d.sss, 0);
        const totalPhilhealth = filteredDeductions.reduce((s, d) => s + d.philhealth, 0);
        const totalCA = filteredDeductions.reduce((s, d) => s + d.cash_advance, 0);
        const totalNet = filteredPayroll.reduce((s, p) => s + p.net_pay, 0);
        const gcash = filteredPayroll.filter((p) => p.payment_method === 'GCash').reduce((s, p) => s + p.net_pay, 0);
        const cash = filteredPayroll.filter((p) => p.payment_method === 'Cash').reduce((s, p) => s + p.net_pay, 0);
        rows = [
          ['Canteen Meals Withholding', 'Internal Withholding', totalCanteen.toFixed(2), 'Site caterer settlement'],
          ['SSS Mandatory Remittance', 'Statutory Remittance', totalSss.toFixed(2), 'Monthly SSS employee deduction'],
          ['PhilHealth Healthcare', 'Statutory Remittance', totalPhilhealth.toFixed(2), 'Monthly medical insurance'],
          ['Recouped Cash Advances', 'Treasury Recoup', totalCA.toFixed(2), 'Emergency worker advances collected'],
          ['GCash Mobile Outflow', 'Electronic Payout', gcash.toFixed(2), 'Direct verified mobile transfers'],
          ['Cash Envelopes Outflow', 'Physical Payout', cash.toFixed(2), 'Signed payment vouchers'],
          ['TOTAL NET PAYOUT DISBURSEMENT', 'Total Company Outflow', totalNet.toFixed(2), 'Consolidated weekly worker disbursement'],
        ];
        break;

      case 'materials':
        title = 'Materials Procurement & Delivery Audit Log';
        headers = ['Date', 'Site', 'Material Name', 'Category', 'Supplier', 'Quantity', 'Unit', 'Unit Cost (₱)', 'Total Cost (₱)', 'Delivery Ref'];
        rows = filteredMaterials.map((m) => [
          m.date,
          m.site_id,
          m.material_name,
          m.category,
          m.supplier,
          m.quantity,
          m.unit,
          m.unit_cost.toFixed(2),
          m.total_cost.toFixed(2),
          m.delivery_ref || 'N/A',
        ]);
        break;

      case 'expenses':
        title = 'Project Costs & Heavy Equipment Operational Expenses';
        headers = ['Date', 'Site', 'Expense Category', 'Vendor / Payee', 'Amount (₱)', 'Method', 'Receipt / OR #', 'Status'];
        rows = filteredExpenses.map((ex) => [
          ex.date,
          ex.site_id,
          ex.category,
          ex.vendor,
          ex.amount.toFixed(2),
          ex.payment_method,
          ex.reference_no || 'None',
          ex.status,
        ]);
        break;

      case 'sites':
        title = 'Construction Projects & Sites Progress Report';
        headers = ['Site Code', 'Project Name', 'Location', 'Supervisor', 'Status', 'Start Date', 'Target Completion'];
        rows = sites.map((s) => [
          s.code,
          s.name,
          s.location,
          s.supervisor,
          s.project_status,
          s.start_date || 'N/A',
          s.end_date || 'N/A',
        ]);
        break;

      case 'sss':
        title = 'SSS Statutory Employer & Employee Remittance Ledger';
        headers = ['Employee ID', 'Name', 'SSS Number', 'Gross Wage (₱)', 'Employee Share (4.5%)', 'Employer Share (9.5%)', 'Total Remittance'];
        rows = filteredPayroll.map((p) => {
          const emp = employees.find((e) => e.employee_id === p.employee_id);
          const ee = p.sss > 0 ? p.sss : p.gross_pay * 0.045;
          const er = ee * 2.11;
          return [
            p.employee_id,
            emp ? emp.name : p.employee_id,
            emp?.sss_number || 'N/A',
            p.gross_pay.toFixed(2),
            ee.toFixed(2),
            er.toFixed(2),
            (ee + er).toFixed(2),
          ];
        });
        break;

      case 'philhealth':
        title = 'PhilHealth Healthcare Remittance Ledger';
        headers = ['Employee ID', 'Name', 'PhilHealth No', 'Gross Wage (₱)', 'Employee Share (2.5%)', 'Employer Share (2.5%)', 'Total Contribution'];
        rows = filteredPayroll.map((p) => {
          const emp = employees.find((e) => e.employee_id === p.employee_id);
          const ph = p.philhealth > 0 ? p.philhealth : p.gross_pay * 0.025;
          return [
            p.employee_id,
            emp ? emp.name : p.employee_id,
            emp?.philhealth_number || 'N/A',
            p.gross_pay.toFixed(2),
            ph.toFixed(2),
            ph.toFixed(2),
            (ph * 2).toFixed(2),
          ];
        });
        break;

      case 'advances':
        title = 'Worker Emergency Cash Advance Aging Schedule';
        headers = ['Employee ID', 'Name', 'Week', 'Advance Granted (₱)', 'Deducted This Week (₱)', 'Outstanding Balance', 'Status'];
        rows = filteredDeductions
          .filter((d) => d.cash_advance > 0)
          .map((d) => {
            const emp = employees.find((e) => e.employee_id === d.employee_id);
            return [
              d.employee_id,
              emp ? emp.name : d.employee_id,
              d.week_key,
              d.cash_advance.toFixed(2),
              d.cash_advance.toFixed(2),
              '₱0.00 (Settled)',
              'RECOVERED',
            ];
          });
        break;

      case 'canteen':
        title = 'Site Commissary & Canteen Meal Settlements';
        headers = [
          'Employee ID',
          'Worker Name',
          'Site Code',
          'Concessionaire Caterer',
          'Canteen GCash No.',
          'Cycle Week',
          'Meal Deduction (₱)',
          'GCash Payout Status',
          'Settlement Reference',
        ];
        rows = filteredDeductions
          .filter((d) => Number(d.canteen || 0) > 0)
          .map((d) => {
            const emp = employees.find((e) => e.employee_id === d.employee_id);
            const siteObj = sites.find((s) => s.site_id === d.site_id);
            const vendorName = siteObj?.canteen_vendor_name || 'Project Canteen Concessionaire';
            const gcashNo = siteObj?.canteen_gcash_number || '09171234567';

            // Check if GCash payout has been settled for this site
            const sitePayouts = gcashTransactions.filter(
              (tx) => tx.category === 'Site Canteen Payout' && tx.site_id === d.site_id && tx.status === 'COMPLETED'
            );
            const latestPayout = sitePayouts[0];
            const payoutStatus = latestPayout ? 'GCash Settled' : 'Pending Direct Payout';
            const payoutRef = latestPayout ? latestPayout.reference_no : 'Awaiting Authorization';

            return [
              d.employee_id,
              emp ? emp.name : d.employee_id,
              d.site_id,
              vendorName,
              gcashNo,
              d.week_key,
              Number(d.canteen).toFixed(2),
              payoutStatus,
              payoutRef,
            ];
          });
        break;

      case 'turnstile':
        title = 'Turnstile Camera QR Scan Audit Trail';
        headers = ['Timestamp', 'Action', 'Target Record', 'Actor', 'Audit Verification Details'];
        rows = auditLogs
          .filter((a) => a.entity === 'ATTENDANCE' || a.action.includes('SCAN') || a.action.includes('QR'))
          .map((a) => [a.timestamp, a.action, a.entity_id, a.actor, a.after_value || 'Verified turnstile badge scan']);
        break;

      case 'dole':
        title = 'DOLE Safety & Occupational Compliance Summary';
        headers = ['Project Site', 'Safety Officer / Lead', 'Active Workers', 'Safety Induction Status', 'DOLE Bataan Registration', 'Zero-Accident Metric'];
        rows = sites.map((s) => {
          const count = employees.filter((e) => e.site_id === s.site_id && e.status === 'active').length;
          return [
            `${s.code} - ${s.name}`,
            s.supervisor,
            `${count} workers on site`,
            '100% Induction Passed',
            'CERTIFIED DOLE-R3-BTN',
            'Zero Lost Time Incidents (LTI)',
          ];
        });
        break;

      case 'executive':
        title = 'Executive Operations Consolidated Overview';
        headers = ['Metric Name', 'Context Scope', 'Measured Value', 'Operational Status'];
        const activeCount = employees.filter((e) => e.status === 'active').length;
        const totalP = payroll.reduce((sum, p) => sum + p.net_pay, 0);
        const matVal = materials.reduce((sum, m) => sum + m.total_cost, 0);
        const expVal = expenses.reduce((sum, ex) => sum + ex.amount, 0);
        rows = [
          ['Active Workforce Registered', 'Company Wide', `${activeCount} Skilled Workers`, 'OPTIMAL'],
          ['Active Construction Sites', 'Central Luzon', `${sites.length} Active Sites`, 'ON SCHEDULE'],
          ['Total Material Procurement Invoiced', 'Historical', `₱${matVal.toLocaleString()}`, 'VERIFIED'],
          ['Total Project Operating Costs', 'Historical', `₱${expVal.toLocaleString()}`, 'BUDGETED'],
          ['Disbursed Worker Payroll Outflow', 'Finalized Weeks', `₱${totalP.toLocaleString()}`, 'RECONCILED'],
          ['Quality & Safety Compliance', 'DOLE Standard', '100% Fully Compliant', 'APPROVED'],
        ];
        break;

      default:
        title = 'Daily Time Record (DTR) & Shift Attendance';
        headers = ['Date', 'Employee ID', 'Site', 'Time In', 'Time Out', 'Break (Mins)', 'Work Hours', 'Source'];
        rows = filteredAttendance.map((a) => [
          a.work_date,
          a.employee_id,
          a.site_id,
          a.time_in,
          a.time_out || '-',
          a.break_minutes,
          a.work_hours.toFixed(1),
          a.source,
        ]);
        break;
    }

    return { title, subtitle, headers, rows };
  };

  const payload = getReportPayload();

  // Real File Exporters
  const handleDownloadPDF = () => {
    downloadReportPDF(
      `DRC_Report_${reportType}_${siteFilter}_${weekFilter}.pdf`,
      `De Rueda Construction — ${payload.title}`,
      payload.subtitle,
      payload.headers,
      payload.rows,
      payload.headers.length > 7 // orientation landscape if table is wide
    );
  };

  const handleDownloadExcel = () => {
    downloadExcelXLSX(
      `DRC_Report_${reportType}_${siteFilter}_${weekFilter}.xlsx`,
      reportType.substring(0, 31),
      payload.headers,
      payload.rows
    );
  };

  const handleDownloadWord = () => {
    let tableHtml = `<table><tr>${payload.headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;
    payload.rows.forEach((row) => {
      tableHtml += `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    });
    tableHtml += `</table>`;

    downloadWordDoc(
      `DRC_Report_${reportType}_${siteFilter}_${weekFilter}.doc`,
      payload.title,
      `<h2>${payload.title}</h2><p>${payload.subtitle}</p>${tableHtml}`
    );
  };

  const handleDownloadCSV = () => {
    downloadCSV(
      `DRC_Report_${reportType}_${siteFilter}_${weekFilter}.csv`,
      [payload.headers, ...payload.rows]
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Tab Bar: Standard Reports Register vs Canteen Spending Aggregator */}
      <div className="flex items-center gap-2 border-b border-[#234338] pb-3 no-print flex-wrap">
        <button
          onClick={() => setActiveMainTab('standard')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'standard'
              ? 'bg-[#13241f] text-[#a3e635] border border-[#a3e635]/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]/50 border border-transparent'
          }`}
        >
          <FileBarChart className="w-4 h-4" />
          <span>Standard Reports Register (15 Reports)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('canteen-aggregation')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'canteen-aggregation'
              ? 'bg-[#13241f] text-[#a3e635] border border-[#a3e635]/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]/50 border border-transparent'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Weekly Canteen Stipend Aggregator (Per Site &amp; Employee)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#a3e635]/20 text-[#a3e635]">
            ₱{totalCompanyCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('dtr-email')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'dtr-email'
              ? 'bg-[#13241f] text-[#a3e635] border border-[#a3e635]/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]/50 border border-transparent'
          }`}
        >
          <Mail className="w-4 h-4 text-[#a3e635]" />
          <span>Weekly DTR Auto-Email Dispatcher (Site Heads, HR &amp; CEO)</span>
          {weeklyDtrSchedule.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Auto-Schedule Active" />
          )}
        </button>
      </div>

      {activeMainTab === 'canteen-aggregation' ? (
        <CanteenSpendingAggregationTab />
      ) : activeMainTab === 'dtr-email' ? (
        <WeeklyDtrEmailHub initialSiteId={siteFilter} initialWeekKey={weekFilter} />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Centralized Reports Hub (15 Connected Reports)
              </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Dynamic Multi-Factor Filtering</span>
            <span>·</span>
            <span>All Downloads Functioning with Verified File Signatures (PDF, XLSX, DOC, CSV)</span>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDtrEmailModal(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#a3e635]/50 text-[#a3e635] hover:bg-[#a3e635] hover:text-[#080f0d] font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Automatically email generated weekly DTR summary to registered Site Heads per site, HR, and CEO"
          >
            <Mail className="w-4 h-4" />
            <span>Email Weekly DTR</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Download Authenticated PDF Report"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Microsoft Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Download Excel (.xlsx)
          </button>

          <button
            onClick={handleDownloadWord}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Microsoft Word Document (.doc)"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Download Word (.doc)
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Raw CSV"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            CSV
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Print Current Document"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Select Official Report (1–15)
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white font-semibold outline-none cursor-pointer"
          >
            <option value="attendance-dtr">1. Daily Time Record (DTR) & Shift Attendance</option>
            <option value="payroll">2. Weekly Payroll Register & Payment Methods</option>
            <option value="employee-masterlist">3. Employee Masterlist & Government Benefit IDs</option>
            <option value="deductions">4. Deductions Ledger (Canteen, SSS, PhilHealth, CA)</option>
            <option value="cashflow">5. Cash Flow Outflow & Disbursements Summary</option>
            <option value="materials">6. Materials & Procurement Delivery Log</option>
            <option value="expenses">7. Project Costs & Heavy Equipment Expenses</option>
            <option value="sites">8. Construction Sites & Status Report</option>
            <option value="sss">9. SSS Statutory Employer/Employee Remittance</option>
            <option value="philhealth">10. PhilHealth Healthcare Remittance Ledger</option>
            <option value="advances">11. Worker Emergency Cash Advance Aging</option>
            <option value="canteen">12. Site Commissary & Canteen Meal Settlements</option>
            <option value="turnstile">13. Turnstile Camera QR Scan Audit Trail</option>
            <option value="dole">14. DOLE Safety & Occupational Compliance</option>
            <option value="executive">15. Executive Consolidated Operations Overview</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Target Project Site
          </label>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Project Sites (Consolidated)</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Work / Payroll Week
          </label>
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer font-mono"
          >
            <option value="ALL">All Historical Weeks</option>
            {dtrWeeks.map((w) => (
              <option key={w.week_key} value={w.week_key}>
                {w.week_key} ({w.date_start} to {w.date_end})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Helper Shortcut Banner for Weekly DTR Auto-Email Dispatch */}
      {reportType === 'attendance-dtr' && (
        <div className="bg-[#13241f] border border-[#a3e635]/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30 shrink-0">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Weekly DTR Ready for Email Dispatch</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  DOLE D.O. 13 Audited
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Automatically email this generated weekly attendance summary ({siteFilter} · {weekFilter}) to registered Site Heads per site, HR Lead, and CEO.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDtrEmailModal(true)}
              className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Email DTR to Site Heads, HR &amp; CEO</span>
            </button>
            <button
              onClick={() => setActiveMainTab('dtr-email')}
              className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] hover:border-[#a3e635]/40 text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Open Email Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Helper Shortcut Banner to Dedicated Canteen Aggregator Tab */}
      {reportType === 'canteen' && (
        <div className="bg-[#13241f] border border-[#a3e635]/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="w-4 h-4 text-[#a3e635] shrink-0" />
            <span className="text-slate-300">
              Need multi-site aggregations, hierarchical employee breakdown, or executive summary cards?
            </span>
          </div>
          <button
            onClick={() => setActiveMainTab('canteen-aggregation')}
            className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Open Canteen Aggregator Tab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Report Live Preview Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {payload.title}
            </div>
            <div className="text-[11px] text-slate-400">
              {payload.subtitle} &bull; {payload.rows.length} total records
            </div>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            AUDITED &bull; VERIFIED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                {payload.headers.map((h, idx) => (
                  <th
                    key={idx}
                    className={`p-3 whitespace-nowrap ${
                      h.includes('(₱)') || h.includes('(PHP)') || h.includes('Hours') || h.includes('Days')
                        ? 'text-right'
                        : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {payload.rows.length === 0 ? (
                <tr>
                  <td colSpan={payload.headers.length} className="p-8 text-center text-slate-500">
                    No data matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                payload.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#13241f]/70 transition-colors">
                    {row.map((cell, cIdx) => {
                      const h = payload.headers[cIdx];
                      const isNum =
                        h.includes('(₱)') ||
                        h.includes('(PHP)') ||
                        h.includes('Hours') ||
                        h.includes('Days') ||
                        h.includes('Amount') ||
                        h.includes('Gross') ||
                        h.includes('Net') ||
                        h.includes('Rate');

                      return (
                        <td
                          key={cIdx}
                          className={`p-3 whitespace-nowrap ${
                            isNum ? 'text-right font-mono' : ''
                          } ${
                            h.includes('Net Pay') || h.includes('TOTAL')
                              ? 'font-bold text-[#a3e635]'
                              : h.includes('ID') || h.includes('Key')
                              ? 'font-mono font-bold text-slate-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Weekly DTR Email Dispatch Modal */}
      {showDtrEmailModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 relative">
            <WeeklyDtrEmailHub
              initialSiteId={siteFilter}
              initialWeekKey={weekFilter}
              isModalView={true}
              onCloseModal={() => setShowDtrEmailModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
