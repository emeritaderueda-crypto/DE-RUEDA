import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, QrScanLogItem } from '../../types';
import {
  Clock,
  QrCode,
  Plus,
  RefreshCw,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
  FileSpreadsheet,
  FileText,
  Download,
  BarChart3,
  Search,
  Filter,
  Check,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  User,
  ShieldCheck,
  TrendingUp,
  Table,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { WeeklyDTRReportModal } from '../modals/WeeklyDTRReportModal';
import { TurnstileQrScannerModal } from '../modals/TurnstileQrScannerModal';
import { AttendanceCalendarHeatmap } from '../attendance/AttendanceCalendarHeatmap';
import { downloadReportPDF } from '../../utils/exporters';
import { EmployeeQrBadgeExportModal } from '../modals/EmployeeQrBadgeExportModal';
import { SyncActivityLogModal } from '../modals/SyncActivityLogModal';

export const AttendanceView: React.FC = () => {
  const {
    employees,
    sites,
    attendance,
    dtrWeeks,
    dtrChanges,
    currentSite,
    qrScanLogs,
    scanAttendanceQr,
    recordManualAttendance,
    correctAttendance,
    rolloverWeek,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'matrix' | 'weekly_summary' | 'scan_logs'>('matrix');
  const [selectedWeekKey, setSelectedWeekKey] = useState(dtrWeeks[0]?.week_key || '2026-W42');
  const [siteFilter, setSiteFilter] = useState(currentSite);

  // Administrative QR Scan Logs Filter
  const [scanLogSearch, setScanLogSearch] = useState('');
  const [scanLogTypeFilter, setScanLogTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDTRReportModalOpen, setIsDTRReportModalOpen] = useState(false);
  const [dtrTargetEmployeeId, setDtrTargetEmployeeId] = useState<string | undefined>(undefined);
  const [isQrBadgeExportModalOpen, setIsQrBadgeExportModalOpen] = useState<boolean>(false);
  const [selectedQrExportEmpId, setSelectedQrExportEmpId] = useState<string | null>(null);
  const [isSyncLogModalOpen, setIsSyncLogModalOpen] = useState<boolean>(false);

  // Selected item for correction
  const [correctingRecord, setCorrectingRecord] = useState<{
    attendance_id: string;
    employee_id: string;
    work_date: string;
    time_in: string;
    time_out: string;
  } | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Manual form state
  const [manualForm, setManualForm] = useState({
    employee_id: employees[0]?.employee_id || '',
    site_id: 'SITE-001',
    work_date: '2026-10-16',
    time_in: '07:00',
    time_out: '16:30',
    break_minutes: 90,
  });

  // Rollover form state
  const [rolloverForm, setRolloverForm] = useState({
    next_week: '2026-W43',
    date_start: '2026-10-19',
    date_end: '2026-10-25',
  });

  const activeWeek = dtrWeeks.find((w) => w.week_key === selectedWeekKey) || dtrWeeks[0];

  // Calculate the 7 calendar days of the week starting from date_start
  const startDate = new Date(activeWeek ? activeWeek.date_start : '2026-10-12');
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().substring(0, 10));
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredEmployees = employees
    .filter((e) => e.status !== 'archived')
    .filter((e) => siteFilter === 'ALL' || e.site_id === siteFilter);

  // Compute 7-day Weekly Summary per employee
  const weeklySummaryRoster = useMemo(() => {
    return filteredEmployees.map((emp, index) => {
      let daysWorked = 0;
      let totalHours = 0;
      let regularHours = 0;
      let otHours = 0;

      weekDates.forEach((date) => {
        const att = attendance.find(
          (a) => a.employee_id === emp.employee_id && a.work_date === date
        );
        if (att && (att.work_hours || 0) > 0) {
          daysWorked += 1;
          const hrs = att.work_hours || 0;
          totalHours += hrs;
          if (hrs > 8) {
            regularHours += 8;
            otHours += hrs - 8;
          } else {
            regularHours += hrs;
          }
        }
      });

      const estGross = (totalHours / 8) * emp.daily_rate;
      let complianceStatus = 'Standard Shift';
      if (daysWorked >= 5) complianceStatus = 'Full Attendance';
      else if (daysWorked >= 3) complianceStatus = 'Standard Shift';
      else if (daysWorked >= 1) complianceStatus = 'Partial Shift';
      else complianceStatus = 'Rest / Absent';

      return {
        seq: index + 1,
        employee: emp,
        daysWorked,
        totalHours: Math.round(totalHours * 10) / 10,
        regularHours: Math.round(regularHours * 10) / 10,
        otHours: Math.round(otHours * 10) / 10,
        estGross: Math.round(estGross),
        complianceStatus,
      };
    });
  }, [filteredEmployees, attendance, weekDates]);

  // Aggregate Recharts 7-Day QR Scan Frequency Data
  const scanFrequencyChartData = useMemo(() => {
    return weekDates.map((dateStr, idx) => {
      // Find scan logs on this date or attendance records
      const dateLogs = (qrScanLogs || []).filter((l) => l.timestamp.startsWith(dateStr));
      let inCount = dateLogs.filter((l) => l.type === 'IN').length;
      let outCount = dateLogs.filter((l) => l.type === 'OUT').length;

      // Also count from actual attendance records for historical accuracy
      const attsOnDate = attendance.filter((a) => {
        if (a.work_date !== dateStr) return false;
        if (siteFilter !== 'ALL' && a.site_id !== siteFilter) return false;
        return true;
      });

      if (attsOnDate.length > 0) {
        inCount = Math.max(inCount, attsOnDate.filter((a) => Boolean(a.time_in)).length);
        outCount = Math.max(outCount, attsOnDate.filter((a) => Boolean(a.time_out)).length);
      }

      return {
        date: dateStr,
        dayLabel: `${dayNames[idx]} ${dateStr.substring(5)}`,
        inScans: inCount,
        outScans: outCount,
        totalScans: inCount + outCount,
      };
    });
  }, [weekDates, qrScanLogs, attendance, siteFilter]);

  // Derive on-time arrival rate from authoritative attendance records (Section 2 & 10)
  const onTimeArrivalMetrics = useMemo(() => {
    const relevant = attendance.filter((a) => {
      if (siteFilter !== 'ALL' && a.site_id !== siteFilter) return false;
      return weekDates.includes(a.work_date);
    });

    if (relevant.length === 0) {
      return { text: 'No data', sub: 'Zero attendance records logged' };
    }

    const withTimeIn = relevant.filter((a) => Boolean(a.time_in));
    if (withTimeIn.length === 0) {
      return { text: 'No data', sub: 'Zero clock-in timestamps' };
    }

    const onTimeCount = withTimeIn.filter((a) => {
      const [h, m] = a.time_in.split(':').map(Number);
      return (h < 8) || (h === 8 && m <= 5);
    }).length;

    const rate = ((onTimeCount / withTimeIn.length) * 100).toFixed(1);
    return { text: `${rate}%`, sub: `${onTimeCount} of ${withTimeIn.length} clock-ins on time` };
  }, [attendance, siteFilter, weekDates]);

  // Filtered last 20 QR scan logs for administrative reference
  const displayedScanLogs = useMemo(() => {
    const list = (qrScanLogs || []).slice(0, 20);
    return list.filter((item) => {
      if (scanLogTypeFilter !== 'ALL' && item.type !== scanLogTypeFilter) return false;
      if (siteFilter !== 'ALL' && item.site_id !== siteFilter) return false;
      if (scanLogSearch.trim()) {
        const q = scanLogSearch.toLowerCase();
        const matchesName = item.employee_name?.toLowerCase().includes(q);
        const matchesId = item.employee_id?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesDevice = item.device_id?.toLowerCase().includes(q);
        const matchesLocation = item.location_tag?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNotes && !matchesDevice && !matchesLocation) return false;
      }
      return true;
    });
  }, [qrScanLogs, scanLogTypeFilter, siteFilter, scanLogSearch]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordManualAttendance(manualForm);
    setIsManualOpen(false);
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord || !correctionReason.trim()) return;
    correctAttendance(
      correctingRecord.attendance_id,
      correctingRecord.time_in,
      correctingRecord.time_out,
      correctionReason.trim()
    );
    setIsCorrectionOpen(false);
    setCorrectingRecord(null);
    setCorrectionReason('');
  };

  const handleRolloverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rolloverWeek(rolloverForm.next_week, rolloverForm.date_start, rolloverForm.date_end);
    setSelectedWeekKey(rolloverForm.next_week);
    setIsRolloverOpen(false);
  };

  // Export Weekly Summary to CSV
  const handleDownloadSummaryCSV = () => {
    const siteObj = sites.find((s) => s.site_id === siteFilter);
    const siteLabel = siteFilter === 'ALL' ? 'All_Sites' : siteObj?.code || siteFilter;
    const filename = `DRC_Weekly_Attendance_Summary_${selectedWeekKey}_${siteLabel}.csv`;

    const lines: string[] = [];
    lines.push('DE RUEDA CONSTRUCTION BUILDERS - WEEKLY ATTENDANCE SUMMARY & 7-DAY AGGREGATION');
    lines.push(`Exported At,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`);
    lines.push(`Payroll Week Key,${selectedWeekKey} (${activeWeek?.date_start} to ${activeWeek?.date_end})`);
    lines.push(`Project Site Filter,${siteFilter === 'ALL' ? 'ALL PROJECT SITES' : `${siteObj?.code} - ${siteObj?.name}`}`);
    lines.push('');
    lines.push('Seq,Employee ID,Employee Name,Category,Position,Site Code,Days Worked,Regular Hours,Overtime Hours,Total Hours Logged,Daily Rate,Est Gross Wage,Attendance Status');

    weeklySummaryRoster.forEach((r) => {
      lines.push(
        [
          r.seq,
          r.employee.employee_id,
          `"${r.employee.name.replace(/"/g, '""')}"`,
          r.employee.category || 'Site-Based',
          `"${r.employee.position}"`,
          r.employee.site_id,
          `${r.daysWorked}/7`,
          r.regularHours,
          r.otHours,
          r.totalHours,
          r.employee.daily_rate,
          r.estGross,
          r.complianceStatus,
        ].join(',')
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Weekly Summary Table to Formatted PDF
  const handleExportSummaryPDF = () => {
    const siteObj = sites.find((s) => s.site_id === siteFilter);
    const siteLabel = siteFilter === 'ALL' ? 'All Active Project Sites (Consolidated)' : `${siteObj?.code} - ${siteObj?.name}`;
    const filename = `DRC_Weekly_Attendance_Summary_${selectedWeekKey}_${siteFilter === 'ALL' ? 'ALL_SITES' : siteObj?.code || siteFilter}.pdf`;

    const headers = [
      '#',
      'Worker ID',
      'Employee Name',
      'Category',
      'Position / Trade',
      'Site',
      'Days Worked',
      'Regular Hrs',
      'OT Hrs',
      'Total Hrs',
      'Daily Rate',
      'Est. Gross Wage',
      'Status',
    ];

    const rows: (string | number)[][] = weeklySummaryRoster.map((r) => [
      r.seq,
      r.employee.employee_id,
      r.employee.name,
      r.employee.category || 'Site-Based',
      r.employee.position,
      r.employee.site_id,
      `${r.daysWorked} days`,
      r.regularHours.toFixed(1),
      r.otHours.toFixed(1),
      r.totalHours.toFixed(1),
      `P${r.employee.daily_rate.toLocaleString()}`,
      `P${r.estGross.toLocaleString()}`,
      r.complianceStatus,
    ]);

    // Compute aggregation summary totals for the footer row
    const totalDaysWorked = weeklySummaryRoster.reduce((sum, r) => sum + r.daysWorked, 0);
    const totalRegHours = weeklySummaryRoster.reduce((sum, r) => sum + r.regularHours, 0);
    const totalOtHours = weeklySummaryRoster.reduce((sum, r) => sum + r.otHours, 0);
    const totalGrossPayout = weeklySummaryRoster.reduce((sum, r) => sum + r.estGross, 0);

    rows.push([
      'TOTALS',
      '-',
      `${filteredEmployees.length} Workers (${activeWorkersCount} Active)`,
      '-',
      '-',
      '-',
      `${totalDaysWorked} shifts`,
      totalRegHours.toFixed(1),
      totalOtHours.toFixed(1),
      totalWeeklyHoursSum.toFixed(1),
      '-',
      `P${totalGrossPayout.toLocaleString()}`,
      'AUDITED',
    ]);

    const title = 'WEEKLY ATTENDANCE SUMMARY & 7-DAY AGGREGATION REPORT';
    const subtitle = `Cycle Week: ${selectedWeekKey} (${activeWeek?.date_start} to ${activeWeek?.date_end}) | Project: ${siteLabel} | Active Personnel: ${activeWorkersCount} of ${filteredEmployees.length} | Exported: ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`;

    downloadReportPDF(filename, title, subtitle, headers, rows, true);
  };

  // Export Last 20 QR Scan Logs to CSV
  const handleDownloadScanLogsCSV = () => {
    const filename = `DRC_QR_Scan_Logs_AdminRef_${new Date().toISOString().substring(0, 10)}.csv`;
    const lines: string[] = [];
    lines.push('DE RUEDA CONSTRUCTION BUILDERS - ADMINISTRATIVE QR SCAN LOG AUDIT');
    lines.push(`Exported At,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`);
    lines.push('Log ID,Scan Timestamp,Scan Type,Employee ID,Employee Name,Site ID,Device ID / Terminal,Location Tag / Checkpoint,Location / Terminal Notes,Verification Status,Anti-Duplicate Check');

    displayedScanLogs.forEach((item) => {
      lines.push(
        [
          item.id,
          item.timestamp,
          item.type === 'IN' ? 'TIME IN (CLOCK IN)' : 'TIME OUT (CLOCK OUT)',
          item.employee_id,
          `"${item.employee_name.replace(/"/g, '""')}"`,
          item.site_id,
          `"${(item.device_id || 'TURNSTILE-GATE-01A').replace(/"/g, '""')}"`,
          `"${(item.location_tag || 'Main Gate Turnstile 1').replace(/"/g, '""')}"`,
          `"${(item.notes || 'Turnstile Scanner').replace(/"/g, '""')}"`,
          item.verified ? 'Verified Active QR' : 'Unverified',
          item.duplicate_prevented ? 'DUPLICATE PREVENTED' : 'UNIQUE SCAN VERIFIED',
        ].join(',')
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current site attendance data & D3 30-day heatmap metrics to CSV
  const handleDownloadAttendanceCSV = () => {
    const siteObj = sites.find((s) => s.site_id === siteFilter);
    const siteLabel = siteFilter === 'ALL' ? 'All_Sites' : siteObj?.code || siteFilter;
    const nowIso = new Date().toISOString().substring(0, 10);
    const filename = `Attendance_${siteLabel}_${nowIso}.csv`;

    const lines: string[] = [];
    lines.push('DE RUEDA CONSTRUCTION BUILDERS - SITE ATTENDANCE & HEATMAP EXPORT');
    lines.push(`Generated At,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`);
    lines.push(`Selected Site Filter,${siteFilter === 'ALL' ? 'ALL SITES' : `${siteObj?.code} - ${siteObj?.name}`}`);
    lines.push(`Active Week Key,${selectedWeekKey} (${activeWeek?.date_start} to ${activeWeek?.date_end})`);
    lines.push('');
    lines.push('Attendance ID,Employee ID,Employee Name,Site Code,Work Date,Time In,Time Out,Break Mins,Hours Logged,Source,QR Version');

    const filteredRecords = attendance.filter((a) => {
      if (siteFilter !== 'ALL' && a.site_id !== siteFilter) return false;
      return true;
    });

    filteredRecords.forEach((r) => {
      const emp = employees.find((e) => e.employee_id === r.employee_id);
      const s = sites.find((st) => st.site_id === r.site_id);
      const empName = emp ? `"${emp.name.replace(/"/g, '""')}"` : r.employee_id;
      const siteCode = s?.code || r.site_id;

      lines.push(
        [
          r.attendance_id,
          r.employee_id,
          empName,
          siteCode,
          r.work_date,
          r.time_in || 'N/A',
          r.time_out || 'N/A',
          r.break_minutes || 0,
          r.work_hours || 0,
          r.source || 'QR',
          r.qr_version || 1,
        ].join(',')
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalWeeklyHoursSum = weeklySummaryRoster.reduce((sum, r) => sum + r.totalHours, 0);
  const activeWorkersCount = weeklySummaryRoster.filter((r) => r.daysWorked > 0).length;
  const totalOtHoursSum = weeklySummaryRoster.reduce((sum, r) => sum + r.otHours, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Attendance &amp; Weekly DTR Engine
            <span className="text-[10px] font-mono font-bold bg-[#a3e635] text-[#080f0d] px-2 py-0.5 rounded-full uppercase">
              BIOMETRIC &bull; QR SCAN
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span>Asia/Manila (PHT)</span>
            <span>&middot;</span>
            <span>Break Rule: <strong className="text-white">90 mins deducted</strong> (10:00, 12:00, 15:00)</span>
            <span>&middot;</span>
            <span>Standard: <strong className="text-[#a3e635]">8.0 work hours/shift</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportSummaryPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Weekly Summary Report to formatted PDF"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Export to PDF</span>
          </button>
          <button
            onClick={() => {
              setSelectedQrExportEmpId(null);
              setIsQrBadgeExportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export individual employee QR codes as image files (.png) for physical badge printing and distribution"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Export QR Badges</span>
          </button>
          <button
            onClick={() => setIsSyncLogModalOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-cyan-400 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Inspect detailed synchronization service push/pull activity logs"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Activity Log</span>
          </button>
          <button
            onClick={activeTab === 'weekly_summary' ? handleDownloadSummaryCSV : handleDownloadAttendanceCSV}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV export"
          >
            <Download className="w-4 h-4 text-[#080f0d]" />
            <span>{activeTab === 'weekly_summary' ? 'Export Summary CSV' : 'Download CSV'}</span>
          </button>
          <button
            onClick={() => {
              setDtrTargetEmployeeId(undefined);
              setIsDTRReportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#10b981]/20 border border-[#10b981]/60 text-emerald-300 hover:text-white hover:bg-[#10b981]/30 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Generate and export weekly DTR reports as PDF or CSV files"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#a3e635]" />
            Export Weekly DTR
          </button>
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-[#a3e635] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#a3e635]" />
            Turnstile QR Scanner
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#10b981]" />
            Manual Attendance
          </button>
          <button
            onClick={() => setIsRolloverOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Sunday Rollover
          </button>
        </div>
      </div>

      {/* Mode Tab Switcher: Fulfills Requirement for Weekly Summary Tab & Scan Log Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#234338] pb-1">
        <div className="flex items-center gap-2 p-1 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly DTR Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly_summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'weekly_summary'
                ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Weekly Summary &amp; Analytics</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[10px]">
              7-Day
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scan_logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'scan_logs'
                ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Admin QR Scan Logs</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[10px]">
              Last 20
            </span>
          </button>
        </div>

        {/* Global Week & Site Selector Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 font-semibold">WEEK:</span>
            <select
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="bg-transparent text-[#a3e635] font-bold font-mono outline-none cursor-pointer"
            >
              {dtrWeeks.map((w) => (
                <option key={w.week_key} value={w.week_key} className="bg-[#13241f] text-white">
                  {w.week_key} ({w.date_start} to {w.date_end}) {w.status === 'active' ? '[ACTIVE]' : '[FINALIZED]'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 font-semibold">SITE:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#13241f]">All Project Sites</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id} className="bg-[#13241f]">
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEEKLY DTR MATRIX (Standard Grid Layout matching Appendix A)       */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Visual D3 Calendar Heatmap: 30-Day Attendance Density */}
          <AttendanceCalendarHeatmap
            currentSiteFilter={siteFilter}
            onDateClick={(dateStr) => {
              const matchingWeek = dtrWeeks.find(
                (w) => dateStr >= w.date_start && dateStr <= w.date_end
              );
              if (matchingWeek) {
                setSelectedWeekKey(matchingWeek.week_key);
              }
            }}
          />

          {/* DTR Grid Matrix */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Site</th>
                    {weekDates.map((date, idx) => (
                      <th key={date} className="p-2.5 text-center min-w-[85px]">
                        <div className="font-bold text-slate-300">{dayNames[idx]}</div>
                        <div className="text-[9px] font-mono text-slate-500">{date.substring(5)}</div>
                      </th>
                    ))}
                    <th className="p-3 text-center">Days</th>
                    <th className="p-3 text-right">Total Hours</th>
                    <th className="p-3 text-center">DTR Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/40">
                  {filteredEmployees.map((emp, index) => {
                    let empTotalHours = 0;
                    let daysPresentCount = 0;

                    return (
                      <tr key={emp.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {emp.photo_url ? (
                              <img
                                src={emp.photo_url}
                                alt={emp.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#234338] shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center font-bold text-slate-300 text-[11px] shrink-0">
                                {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                {emp.category === 'Office-Based' ? (
                                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">Office</span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Site</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                <span className="text-[#a3e635]">{emp.employee_id}</span> &bull; {emp.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {emp.site_id}
                        </td>

                        {/* Day Cells */}
                        {weekDates.map((date) => {
                          const att = attendance.find(
                            (a) => a.employee_id === emp.employee_id && a.work_date === date
                          );

                          if (att && att.time_in) {
                            empTotalHours += att.work_hours || 0;
                            daysPresentCount += 1;
                            return (
                              <td
                                key={date}
                                onClick={() => {
                                  setCorrectingRecord({
                                    attendance_id: att.attendance_id,
                                    employee_id: emp.employee_id,
                                    work_date: date,
                                    time_in: att.time_in,
                                    time_out: att.time_out || '16:30',
                                  });
                                  setCorrectionReason('');
                                  setIsCorrectionOpen(true);
                                }}
                                className="p-1.5 text-center cursor-pointer hover:bg-emerald-500/10 transition-colors"
                                title="Click to edit or correct attendance entry"
                              >
                                <div className="text-[11px] font-mono font-bold text-emerald-400">{att.time_in}</div>
                                <div className="text-[10px] font-mono text-slate-400">{att.time_out || '-'}</div>
                                <div className="text-[9px] font-mono text-slate-500">
                                  {att.work_hours ? `${att.work_hours.toFixed(1)}h` : ''}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={date}
                              onClick={() => {
                                setManualForm({
                                  employee_id: emp.employee_id,
                                  site_id: emp.site_id,
                                  work_date: date,
                                  time_in: '07:00',
                                  time_out: '16:30',
                                  break_minutes: 90,
                                });
                                setIsManualOpen(true);
                              }}
                              className="p-1.5 text-center cursor-pointer text-slate-600 hover:bg-[#13241f] text-[11px] font-mono"
                              title="Click to log attendance"
                            >
                              -
                            </td>
                          );
                        })}

                        <td className="p-3 text-center font-mono font-bold text-white whitespace-nowrap">
                          {daysPresentCount} / 7
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-[#a3e635] whitespace-nowrap">
                          {empTotalHours.toFixed(1)} hrs
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setDtrTargetEmployeeId(emp.employee_id);
                                setIsDTRReportModalOpen(true);
                              }}
                              title={`Generate & Export Weekly DTR for ${emp.name} (PDF/CSV)`}
                              className="px-2 py-1 bg-[#13241f] hover:bg-[#10b981] hover:text-white border border-[#234338] hover:border-[#10b981] text-emerald-300 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#a3e635]" />
                              <span>DTR</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQrExportEmpId(emp.employee_id);
                                setIsQrBadgeExportModalOpen(true);
                              }}
                              title={`Export QR Code Image File (.png) for ${emp.name} (${emp.employee_id})`}
                              className="px-2 py-1 bg-[#13241f] hover:bg-emerald-600 hover:text-white border border-[#234338] hover:border-emerald-500 text-[#a3e635] text-[11px] font-bold rounded-md transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR Pass</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEEKLY SUMMARY & ANALYTICS (Recharts Bar Chart & Summary Table)    */}
      {/* ========================================================================= */}
      {activeTab === 'weekly_summary' && (
        <div className="space-y-4">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Total Weekly Hours</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                {totalWeeklyHoursSum.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across {filteredEmployees.length} personnel</div>
            </div>

            <div className="p-3.5 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active On-Site</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                {activeWorkersCount} <span className="text-xs font-normal text-slate-400">workers</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Logged attendance this week</div>
            </div>

            <div className="p-3.5 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Overtime Logged</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
                {totalOtHoursSum.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">&gt;8 hrs daily threshold</div>
            </div>

            <div className="p-3.5 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-sky-400" />
                <span>On-Time Arrival</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-sky-400 mt-1">
                {onTimeArrivalMetrics.text}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{onTimeArrivalMetrics.sub}</div>
            </div>
          </div>

          {/* Recharts Bar Chart: 7-Day QR Scan Frequency (Fulfills Request 6) */}
          <div className="p-4 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#234338] pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#a3e635]" />
                  <span>7-Day QR Scan Frequency &amp; Turnstile Traffic (Recharts)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daily frequency of verified Time In (Clock In) vs Time Out (Clock Out) turnstile scans over the last week.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" />
                  <span>Time In (Clock In)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8]" />
                  <span>Time Out (Clock Out)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scanFrequencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f382f" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0e1a16',
                      borderColor: '#234338',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="inScans" name="Time In (Clock In)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outScans" name="Time Out (Clock Out)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clean Weekly Summary Table (Fulfills Request 5) */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
            <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-[#a3e635]" />
                  <span>Weekly Summary Table &mdash; 7-Day Hours Aggregation</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Consolidated work hours, regular vs overtime breakdown, and estimated payouts for week {selectedWeekKey}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSummaryPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Export Weekly Summary Report to formatted PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Export to PDF</span>
                </button>
                <button
                  onClick={handleDownloadSummaryCSV}
                  className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#080f0d]" />
                  <span>Export Summary CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#13241f]/70 border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Worker / Trade</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Site</th>
                    <th className="p-3 text-center">Days Worked</th>
                    <th className="p-3 text-right">Regular Hrs</th>
                    <th className="p-3 text-right">Overtime Hrs</th>
                    <th className="p-3 text-right">Total Hours</th>
                    <th className="p-3 text-right">Daily Rate</th>
                    <th className="p-3 text-right">Est. Gross Wage</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/40">
                  {weeklySummaryRoster.map((row) => (
                    <tr key={row.employee.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">
                        {row.seq}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {row.employee.photo_url ? (
                            <img
                              src={row.employee.photo_url}
                              alt={row.employee.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#234338] shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center font-bold text-slate-300 text-[11px] shrink-0">
                              {row.employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{row.employee.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              <span className="text-[#a3e635]">{row.employee.employee_id}</span> &bull; {row.employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {row.employee.category === 'Office-Based' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Office-Based
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Site-Based
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                        {row.employee.site_id}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-white whitespace-nowrap">
                        {row.daysWorked} / 7
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        {row.regularHours.toFixed(1)}h
                      </td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold whitespace-nowrap">
                        {row.otHours > 0 ? `+${row.otHours.toFixed(1)}h` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-[#a3e635] whitespace-nowrap">
                        {row.totalHours.toFixed(1)} hrs
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ₱{row.employee.daily_rate.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        ₱{row.estGross.toLocaleString()}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            row.complianceStatus === 'Full Attendance'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : row.complianceStatus === 'Standard Shift'
                              ? 'bg-sky-500/20 text-sky-300'
                              : row.complianceStatus === 'Partial Shift'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {row.complianceStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setDtrTargetEmployeeId(row.employee.employee_id);
                              setIsDTRReportModalOpen(true);
                            }}
                            className="px-2 py-1 bg-[#13241f] hover:bg-[#10b981] hover:text-white border border-[#234338] text-emerald-300 text-[11px] font-bold rounded-md transition-all cursor-pointer"
                          >
                            DTR Card
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQrExportEmpId(row.employee.employee_id);
                              setIsQrBadgeExportModalOpen(true);
                            }}
                            title={`Export QR Code Image File for ${row.employee.name}`}
                            className="px-2 py-1 bg-[#13241f] hover:bg-emerald-600 hover:text-white border border-[#234338] text-[#a3e635] text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Pass</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#13241f] border-t border-[#234338] font-bold text-white">
                    <td colSpan={7} className="p-3 text-right uppercase text-[10px] text-slate-400">
                      Total Workforce Hours &amp; Gross Payout:
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-[#a3e635]">
                      {totalWeeklyHoursSum.toFixed(1)} hrs
                    </td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right font-mono font-black text-sm text-white">
                      ₱{weeklySummaryRoster.reduce((sum, r) => sum + r.estGross, 0).toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADMINISTRATIVE QR SCAN LOG SECTION (Fulfills Request 4: Last 20)  */}
      {/* ========================================================================= */}
      {activeTab === 'scan_logs' && (
        <div className="space-y-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
            {/* Log Header and Search Toolbar */}
            <div className="p-4 bg-[#13241f] border-b border-[#234338] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-[#a3e635]" />
                    <span>Administrative QR Scan Log (Last 20 Successful Scans)</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Turnstile Stream
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Forensic audit trail storing the latest 20 verified turnstile and mobile QR badge scans with exact PHT timestamps.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={scanLogSearch}
                    onChange={(e) => setScanLogSearch(e.target.value)}
                    placeholder="Search worker ID, name, gate..."
                    className="w-full bg-[#0e1a16] border border-[#234338] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635]"
                  />
                </div>

                {/* Scan Type Filter */}
                <select
                  value={scanLogTypeFilter}
                  onChange={(e) => setScanLogTypeFilter(e.target.value as any)}
                  className="bg-[#0e1a16] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Scan Types (IN &amp; OUT)</option>
                  <option value="IN">Time In Only (Clock In)</option>
                  <option value="OUT">Time Out Only (Clock Out)</option>
                </select>

                <button
                  onClick={handleDownloadScanLogsCSV}
                  className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Export all 20 verified scan logs to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#080f0d]" />
                  <span>Export Logs CSV</span>
                </button>
              </div>
            </div>

            {/* Scan Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#13241f]/80 border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Exact Timestamp (PHT)</th>
                    <th className="p-3 text-center">Scan Type</th>
                    <th className="p-3">Worker ID &amp; Name</th>
                    <th className="p-3">Device ID &amp; Terminal</th>
                    <th className="p-3">Location Tag / Checkpoint</th>
                    <th className="p-3">Assigned Site</th>
                    <th className="p-3 text-center">Accountability &amp; Anti-Duplicate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/40">
                  {displayedScanLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No QR scan logs matched the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedScanLogs.map((log, index) => {
                      const emp = employees.find((e) => e.employee_id === log.employee_id);
                      return (
                        <tr key={log.id} className="hover:bg-[#13241f]/70 transition-colors">
                          <td className="p-3 text-center font-mono text-slate-500">
                            {index + 1}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-mono text-white font-bold">
                              {new Date(log.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              &bull;{' '}
                              <span className="text-[#a3e635]">
                                {new Date(log.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Ref: {log.id}
                            </div>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {log.type === 'IN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                <span>TIME IN (CLOCK IN)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                <ArrowDownRight className="w-3 h-3 text-sky-400" />
                                <span>TIME OUT (CLOCK OUT)</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {emp?.photo_url ? (
                                <img
                                  src={emp.photo_url}
                                  alt={log.employee_name}
                                  className="w-7 h-7 rounded-full object-cover border border-[#234338] shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center font-bold text-slate-300 text-[10px] shrink-0">
                                  {log.employee_name?.slice(0, 2) || 'DR'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{log.employee_name}</div>
                                <div className="text-[10px] font-mono text-[#a3e635]">
                                  {log.employee_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-[#13241f] border border-[#234338] text-[#a3e635] font-mono font-bold text-[11px]">
                                {log.device_id || 'TURNSTILE-GATE-01A'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{log.notes || 'Biometric Sensor'}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-slate-200 font-semibold text-xs">
                              {log.location_tag || 'Main Gate Turnstile 1'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">Geofenced Site Checkpoint</div>
                          </td>
                          <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                            {log.site_name || log.site_id}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {log.duplicate_prevented ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Duplicate Prevented</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Unique Registered</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#13241f] border-t border-[#234338] flex items-center justify-between text-xs text-slate-400">
              <span>Showing {displayedScanLogs.length} of last 20 successful scans</span>
              <button
                onClick={() => setIsQrScannerOpen(true)}
                className="text-xs text-[#a3e635] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Launch Camera Scanner &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turnstile Camera QR Scanner Modal */}
      <TurnstileQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        targetSiteId={siteFilter === 'ALL' ? undefined : siteFilter}
      />

      {/* Manual Attendance Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white">Manual Attendance Entry</h2>
              <button onClick={() => setIsManualOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                <select
                  value={manualForm.employee_id}
                  onChange={(e) => {
                    const emp = employees.find((em) => em.employee_id === e.target.value);
                    setManualForm({
                      ...manualForm,
                      employee_id: e.target.value,
                      site_id: emp?.site_id || manualForm.site_id,
                    });
                  }}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                >
                  {employees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.name} ({e.employee_id}) - {e.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site *</label>
                  <select
                    value={manualForm.site_id}
                    onChange={(e) => setManualForm({ ...manualForm, site_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.work_date}
                    onChange={(e) => setManualForm({ ...manualForm, work_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time In *</label>
                  <input
                    type="time"
                    required
                    value={manualForm.time_in}
                    onChange={(e) => setManualForm({ ...manualForm, time_in: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Out</label>
                  <input
                    type="time"
                    value={manualForm.time_out}
                    onChange={(e) => setManualForm({ ...manualForm, time_out: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Break Duration (Minutes)</label>
                <input
                  type="number"
                  value={manualForm.break_minutes}
                  onChange={(e) => setManualForm({ ...manualForm, break_minutes: Number(e.target.value) })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <div className="text-[10px] text-slate-500 mt-1">Standard: 90 mins (1.5h) deducted automatically</div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {isCorrectionOpen && correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Correct DTR Record</h2>
                <div className="text-[11px] text-[#a3e635] font-mono">
                  {correctingRecord.employee_id} ({correctingRecord.work_date})
                </div>
              </div>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3.5 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-amber-300 text-[11px]">
                <strong>Forensic Audit Requirement:</strong> Every manual correction requires an explicit justification reason which is logged in the permanent audit trail.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time In</label>
                  <input
                    type="time"
                    required
                    value={correctingRecord.time_in}
                    onChange={(e) => setCorrectingRecord({ ...correctingRecord, time_in: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Out</label>
                  <input
                    type="time"
                    required
                    value={correctingRecord.time_out}
                    onChange={(e) => setCorrectingRecord({ ...correctingRecord, time_out: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for DTR Correction *</label>
                <textarea
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-20 placeholder-slate-500"
                  placeholder="e.g. Turnstile scanner jammed during site gate rush; time verified with site safety supervisor..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669] cursor-pointer"
                >
                  Save &amp; Log Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sunday Midnight Rollover Modal */}
      {isRolloverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Sunday Midnight Weekly Rollover
              </h2>
              <button onClick={() => setIsRolloverOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRolloverSubmit} className="space-y-3.5 text-xs">
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-lg text-emerald-300 text-[11px]">
                Archives current week (<strong>{selectedWeekKey}</strong>) as finalized and starts a new working week. Historical records remain permanently viewable.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Working Week Key *</label>
                <input
                  type="text"
                  required
                  value={rolloverForm.next_week}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, next_week: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder="e.g. 2026-W43"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date (Monday) *</label>
                  <input
                    type="date"
                    required
                    value={rolloverForm.date_start}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, date_start: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date (Sunday) *</label>
                  <input
                    type="date"
                    required
                    value={rolloverForm.date_end}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, date_end: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRolloverOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] cursor-pointer"
                >
                  Execute Rollover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DTR Changes History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#a3e635]" />
                DTR Correction Audit Trail ({dtrChanges.length} entries)
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-2 flex-1">
              {dtrChanges.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No correction records logged yet.</div>
              ) : (
                dtrChanges.map((chg) => (
                  <div key={chg.change_id} className="p-3 bg-[#13241f] border border-[#234338] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#a3e635]">{chg.employee_id}</span>
                      <span className="font-mono text-[10px] text-slate-500">{chg.changed_at}</span>
                    </div>
                    <div className="text-slate-300">
                      Changed from <code className="text-red-400">{chg.before_value}</code> &rarr;{' '}
                      <code className="text-emerald-400 font-bold">{chg.after_value}</code> by{' '}
                      <strong className="text-white">{chg.changed_by}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 italic bg-[#080f0d] p-1.5 rounded-sm">
                      "{chg.reason}"
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#234338] text-right">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly DTR Generator & Exporter Modal */}
      <WeeklyDTRReportModal
        isOpen={isDTRReportModalOpen}
        onClose={() => setIsDTRReportModalOpen(false)}
        preselectedEmployeeId={dtrTargetEmployeeId}
        preselectedWeekKey={selectedWeekKey}
      />

      {/* Employee QR Badge & Image File Exporter Modal */}
      <EmployeeQrBadgeExportModal
        isOpen={isQrBadgeExportModalOpen}
        onClose={() => setIsQrBadgeExportModalOpen(false)}
        initialEmployeeId={selectedQrExportEmpId}
      />

      {/* Synchronization Service Push/Pull Activity Log Modal */}
      <SyncActivityLogModal
        isOpen={isSyncLogModalOpen}
        onClose={() => setIsSyncLogModalOpen(false)}
      />
    </div>
  );
};
