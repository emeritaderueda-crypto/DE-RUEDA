import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { generateSvgQRCode, generateQrDataUrl } from '../../utils/qrGenerator';
import {
  UserPlus,
  QrCode,
  Search,
  Filter,
  Edit,
  Archive,
  RefreshCw,
  Printer,
  Download,
  X,
  CreditCard,
  HardHat,
  ExternalLink,
  CheckCircle2,
  UserCheck,
  Eye,
  Phone,
  Mail,
  Building,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  DollarSign,
  Calendar,
  Camera,
  Clock,
  AlertTriangle,
  ArrowRight,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { EmployeeQrBadgeExportModal } from '../modals/EmployeeQrBadgeExportModal';
import { BulkQrExportModal } from '../modals/BulkQrExportModal';
import { HrEmployeePhotoCaptureModal } from '../modals/HrEmployeePhotoCaptureModal';
import { EmployeesPayoutSummaryDashboard } from '../employees/EmployeesPayoutSummaryDashboard';
import { SecurityInvitationsModal } from '../modals/SecurityInvitationsModal';
import {
  ArrowRightLeft,
  UserX,
  FileBadge,
  History,
  MoreVertical,
  Briefcase,
  Layers,
  Award,
  ChevronDown,
  Ticket,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    sites,
    currentSite,
    addEmployee,
    updateEmployee,
    archiveEmployee,
    rehireEmployee,
    transferEmployee,
    terminateEmployee,
    reactivateEmployee,
    paymentRecords,
    payroll,
    verifyPayrollProof,
    addAuditLog,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'archived' | 'inactive' | 'terminated' | 'transferred'>('ALL');
  const [hrSubTab, setHrSubTab] = useState<'ALL' | 'ACTIVE' | 'TRANSFERRED' | 'INACTIVE'>('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [badgeEmp, setBadgeEmp] = useState<Employee | null>(null);
  const [selectedProfileEmp, setSelectedProfileEmp] = useState<Employee | null>(null);
  const [transferModalEmp, setTransferModalEmp] = useState<Employee | null>(null);
  const [terminateModalEmp, setTerminateModalEmp] = useState<Employee | null>(null);
  const [reactivateModalEmp, setReactivateModalEmp] = useState<Employee | null>(null);
  const [coeModalEmp, setCoeModalEmp] = useState<Employee | null>(null);
  const [historyModalEmp, setHistoryModalEmp] = useState<Employee | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [isQrExportModalOpen, setIsQrExportModalOpen] = useState(false);
  const [exportModalInitialEmpId, setExportModalInitialEmpId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
  const [photoCaptureTarget, setPhotoCaptureTarget] = useState<'NEW' | 'EDIT'>('NEW');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const fetchPendingApprovalsCount = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/accounts/pending', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPendingApprovalsCount(data.count || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchPendingApprovalsCount();
  }, [fetchPendingApprovalsCount]);

  // Transfer Form State (HR Layout Reference Page 3 & 5)
  const [transferForm, setTransferForm] = useState({
    to_site_id: sites[0]?.site_id || '',
    transfer_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    reason: 'Project Requirement',
    remarks: '',
  });

  // Terminate Form State (HR Layout Reference Page 3)
  const [terminateForm, setTerminateForm] = useState({
    termination_date: new Date().toISOString().split('T')[0],
    reason: 'End of Contract',
    remarks: '',
  });

  // Reactivate Form State (HR Layout Reference Page 3)
  const [reactivateForm, setReactivateForm] = useState({
    reactivation_date: new Date().toISOString().split('T')[0],
    reason: 'Rehire / New Project',
    remarks: '',
  });

  // Add form state with permanent unique ID validation
  const nextEmployeeSeq = String(employees.length + 1).padStart(4, '0');
  const [customIdInput, setCustomIdInput] = useState(`EMP-2026-${nextEmployeeSeq}`);
  const [idValidationError, setIdValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    position: 'Lead Mason / Foreman',
    department: 'Construction Operations',
    employment_type: 'Project-Based' as 'Regular' | 'Project-Based' | 'Contractual' | 'Probationary',
    daily_rate: 750,
    site_id: sites[0]?.site_id || '',
    category: 'Site-Based' as 'Site-Based' | 'Office-Based',
    photo_url: '',
    email: '',
    contact_number: '',
    date_hired: new Date().toISOString().split('T')[0],
    birth_date: '1992-05-15',
    tin_number: '',
    blood_type: 'O+',
    civil_status: 'Single',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    sss_number: '',
    philhealth_number: '',
    gcash_number: '',
    drive_link: '',
  });

  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'ALL' | 'PENDING' | 'RELEASED' | 'OVERDUE_48H'>('ALL');
  const [quickPayoutEmp, setQuickPayoutEmp] = useState<Employee | null>(null);
  const [quickPayoutRef, setQuickPayoutRef] = useState<string>('');
  const [isQuickPayoutProcessing, setIsQuickPayoutProcessing] = useState<boolean>(false);
  const [quickPayoutToast, setQuickPayoutToast] = useState<string | null>(null);

  // Compute unique positions and departments for multi-dropdowns
  const availablePositions = Array.from(new Set(employees.map((e) => e.position).filter(Boolean)));
  const availableDepartments = [
    'Construction Operations',
    'Engineering & Surveying',
    'Administration & HR',
    'Finance & Accounting',
    'Safety & Compliance',
    'Logistics & Fleet',
  ];

  // Top Statistics per HR Employee Reference Layout
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter((e) => e.status === 'active').length;
  const transferredEmployeesCount = employees.filter(
    (e) => (e.transfer_history && e.transfer_history.length > 0) || e.status === 'transferred'
  ).length;
  const inactiveEmployeesCount = employees.filter(
    (e) => e.status === 'archived' || e.status === 'inactive' || e.status === 'terminated'
  ).length;

  const filtered = employees.filter((emp) => {
    // 1. Text search
    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      (emp.site_id && emp.site_id.toLowerCase().includes(q));

    // 2. HR Sub Tab Filter (All, Active, Transferred, Inactive / Terminated)
    let matchesTab = true;
    if (hrSubTab === 'ACTIVE') {
      matchesTab = emp.status === 'active';
    } else if (hrSubTab === 'TRANSFERRED') {
      matchesTab = (emp.transfer_history && emp.transfer_history.length > 0) || emp.status === 'transferred';
    } else if (hrSubTab === 'INACTIVE') {
      matchesTab = emp.status === 'archived' || emp.status === 'inactive' || emp.status === 'terminated';
    }

    // 3. Multi-dropdowns
    const matchesSite = siteFilter === 'ALL' || emp.site_id === siteFilter;
    const matchesPosition = positionFilter === 'ALL' || emp.position === positionFilter;
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    let matchesPayout = true;
    if (payoutStatusFilter !== 'ALL') {
      const payRec = paymentRecords.find(
        (p) => p.recipient_id === emp.employee_id && p.module === 'WEEKLY_PAYROLL'
      );
      const payrollItem = payroll.find((pr) => pr.employee_id === emp.employee_id);
      const isReleased =
        payRec?.status === 'PAID_VERIFIED' ||
        payrollItem?.payment_status === 'Verified' ||
        payrollItem?.payment_status === 'Paid';

      if (payoutStatusFilter === 'RELEASED') {
        matchesPayout = isReleased;
      } else if (payoutStatusFilter === 'PENDING') {
        matchesPayout = !isReleased;
      } else if (payoutStatusFilter === 'OVERDUE_48H') {
        if (isReleased) {
          matchesPayout = false;
        } else {
          const createdTime = new Date(payRec?.created_at || payrollItem?.created_at || emp.created_at).getTime();
          const ageHours = (Date.now() - createdTime) / (1000 * 60 * 60);
          matchesPayout = ageHours >= 48;
        }
      }
    }

    return matchesQ && matchesTab && matchesSite && matchesPosition && matchesDept && matchesStatus && matchesPayout;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = customIdInput.trim();
    if (!finalId) {
      setIdValidationError('Employee ID is required.');
      return;
    }
    const exists = employees.some((emp) => emp.employee_id.toLowerCase() === finalId.toLowerCase());
    if (exists) {
      setIdValidationError(`Permanent Employee ID "${finalId}" already exists. Duplicate IDs are strictly rejected.`);
      return;
    }

    try {
      const created = addEmployee({
        employee_id: finalId,
        name: formData.name.trim(),
        position: formData.position.trim(),
        department: formData.department,
        employment_type: formData.employment_type,
        daily_rate: Number(formData.daily_rate),
        site_id: formData.site_id,
        category: formData.category,
        photo_url: formData.photo_url.trim() || undefined,
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim(),
        date_hired: formData.date_hired,
        birth_date: formData.birth_date,
        tin_number: formData.tin_number.trim(),
        blood_type: formData.blood_type,
        civil_status: formData.civil_status,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        sss_number: formData.sss_number.trim(),
        philhealth_number: formData.philhealth_number.trim(),
        gcash_number: formData.gcash_number.trim(),
        drive_link: formData.drive_link.trim(),
        status: 'active',
      });
      setIsAddOpen(false);
      setBadgeEmp(created);
      setFeedbackToast(`Successfully onboarded ${created.name} (${created.employee_id})`);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      setIdValidationError(err?.message || 'Failed to onboard employee.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    updateEmployee(editingEmp.employee_id, editingEmp);
    setEditingEmp(null);
  };

  const [isExportingQr, setIsExportingQr] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Generates a high-resolution, print-ready image file of the employee's unique QR code
  const handleExportQr = async (emp: Employee) => {
    setIsExportingQr(true);
    setExportFeedback(null);
    try {
      const site = sites.find((s) => s.site_id === emp.site_id);
      const siteName = site ? `${site.code} - ${site.name}` : emp.site_id;
      const payload = JSON.stringify({
        employee_id: emp.employee_id,
        qr_version: emp.qr_version || 1,
      });
      const qrDataUrl = await generateQrDataUrl(payload, 500);

      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // Card Background
      ctx.fillStyle = '#080f0d';
      ctx.fillRect(0, 0, 650, 920);

      // Card Outer Border
      ctx.strokeStyle = '#234338';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 626, 896);

      // Header Banner
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(15, 15, 620, 130);

      // Lime Accent Line
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(15, 142, 620, 5);

      // Title & DOLE certification
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION', 36, 62);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('OFFICIAL TURNSTILE ATTENDANCE BADGE · DOLE COMPLIANT', 36, 96);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('High-Resolution Print-Ready Biometric ID Credential', 36, 120);

      // Worker Avatar / Photo
      const avatarX = 36;
      const avatarY = 175;
      const avatarSize = 100;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (emp.photo_url) {
        try {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            photoImg.onload = () => {
              ctx.drawImage(photoImg, avatarX, avatarY, avatarSize, avatarSize);
              resolve();
            };
            photoImg.onerror = () => reject();
            photoImg.src = emp.photo_url!;
          });
        } catch {
          ctx.fillStyle = '#13241f';
          ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
          ctx.fillStyle = '#a3e635';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
        }
      } else {
        ctx.fillStyle = '#13241f';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
      }
      ctx.restore();

      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Worker Text Details
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(emp.name, 160, 210);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(emp.employee_id, 160, 240);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(emp.position || 'Construction Laborer', 160, 266);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Site: ${siteName}`, 36, 310);
      ctx.fillText(`Category: ${emp.category || 'Site-Based'} · QR Ver: ${emp.qr_version || 1}`, 36, 332);

      // QR Code Container Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 360, 350, 350);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(150, 360, 350, 350);

      // Draw high-resolution QR
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 165, 375, 320, 320);
          resolve();
        };
        qrImg.src = qrDataUrl;
      });

      // Scanner instructions
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD TO TURNSTILE SCANNER AT SITE GATE', 325, 750);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`PAYLOAD: ${emp.employee_id} (VER: ${emp.qr_version || 1})`, 325, 778);
      ctx.fillText('DOLE 5-STAR SAFETY VERIFIED · PRINT-READY RESOLUTION', 325, 798);

      // Bottom Footer
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(15, 830, 620, 75);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION PHILIPPINES · CORPORATE ERP SYSTEM', 325, 872);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `DRC-QR-${emp.employee_id}-${emp.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportFeedback(`Exported print-ready QR image file for ${emp.name} (${emp.employee_id})`);
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to export QR image:', err);
    } finally {
      setIsExportingQr(false);
    }
  };

  const handleDownloadRawQr = async (emp: Employee) => {
    try {
      const payload = JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version });
      const dataUrl = await generateQrDataUrl(payload, 600);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `DRC_RAW_QR_${emp.employee_id}_v${emp.qr_version}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('QR download error:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header (HR Layout Specification Page 2 & 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Employee Management
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Manage your workforce, records, and site assignments.</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold font-mono">DOLE 5-Star Accredited</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBulkExportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Generate a single PDF containing multiple employee QR codes, formatted for easier batch printing"
          >
            <FileText className="w-4 h-4" />
            <span>Bulk Export QR</span>
            <span className="px-1.5 py-0.2 bg-black/25 rounded text-[10px] font-mono">PDF</span>
          </button>
          <button
            onClick={() => {
              setExportModalInitialEmpId(null);
              setIsQrExportModalOpen(true);
            }}
            className="px-3 py-2 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Full QR Badge Export Suite"
          >
            <QrCode className="w-4 h-4 text-[#a3e635]" />
            Export QR Badges
          </button>
          <button
            onClick={() => setIsBatchOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#a3e635]" />
            Print Batch Badges
          </button>
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Manage Enterprise Invitations, Access Control, and Approve Pending Accounts"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Access &amp; Invitations</span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setCustomIdInput(`EMP-2026-${String(employees.length + 1).padStart(4, '0')}`);
              setIdValidationError(null);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-[#005ce6] hover:bg-[#0047b3] text-white font-black text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards per HR Employee Reference Layout (Page 2 & 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Employees</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5">
            {totalEmployeesCount}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
            <span>&uarr; +12%</span>
            <span className="text-slate-500 font-normal">vs last month</span>
          </span>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Workers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            {activeEmployeesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            On site / active workforce
          </span>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Transferred</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1.5">
            {transferredEmployeesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Reassigned to new sites
          </span>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Inactive / Terminated</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1.5">
            {inactiveEmployeesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Resigned / ended contracts
          </span>
        </div>
      </div>

      {/* Visual Summary Dashboard: Payout Pending versus Payout Released Statuses */}
      <EmployeesPayoutSummaryDashboard
        selectedSiteFilter={siteFilter}
        onSelectSiteFilter={(s) => setSiteFilter(s)}
        payoutStatusFilter={payoutStatusFilter}
        onSelectPayoutStatusFilter={(st) => setPayoutStatusFilter(st)}
      />

      {/* 4 HR Sub-View Filter Tabs (Reference Layout Page 3) */}
      <div className="flex items-center gap-1 border-b border-[#234338] pb-1">
        <button
          onClick={() => setHrSubTab('ALL')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            hrSubTab === 'ALL'
              ? 'bg-[#10b981] text-[#080f0d] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <span>All Employees</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {totalEmployeesCount}
          </span>
        </button>

        <button
          onClick={() => setHrSubTab('ACTIVE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            hrSubTab === 'ACTIVE'
              ? 'bg-[#10b981] text-[#080f0d] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <span>Active</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {activeEmployeesCount}
          </span>
        </button>

        <button
          onClick={() => setHrSubTab('TRANSFERRED')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            hrSubTab === 'TRANSFERRED'
              ? 'bg-[#10b981] text-[#080f0d] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <span>Transferred</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {transferredEmployeesCount}
          </span>
        </button>

        <button
          onClick={() => setHrSubTab('INACTIVE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            hrSubTab === 'INACTIVE'
              ? 'bg-[#10b981] text-[#080f0d] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
          }`}
        >
          <span>Inactive / Terminated</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {inactiveEmployeesCount}
          </span>
        </button>
      </div>

      {/* Filter and Multi-Dropdown Search Bar (Reference Layout Page 2 & 3) */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, position, or site..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        {/* Dropdown 1: All Sites */}
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: All Positions */}
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer max-w-[150px]"
          >
            <option value="ALL">All Positions</option>
            {availablePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 3: All Departments */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer max-w-[150px]"
          >
            <option value="ALL">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 4: All Statuses */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="transferred">Transferred</option>
            <option value="archived">Archived / Terminated</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {filtered.length} of {totalEmployeesCount}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Employee</th>
                <th className="p-3">Category</th>
                <th className="p-3">Trade / Position</th>
                <th className="p-3">Site</th>
                <th className="p-3 text-right">Daily Rate</th>
                <th className="p-3">Govt & GCash IDs</th>
                <th className="p-3 text-center">QR Ver</th>
                <th className="p-3">Status</th>
                <th className="p-3">Salary Payout Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center mx-auto text-[#a3e635]">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-white text-sm">
                        {employees.length === 0 ? 'Pristine Factory Default: No Workers Registered' : 'No employees matching the search filters'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {employees.length === 0
                          ? 'Your ERP is clean and ready for real operations. Click "+ Add New Employee" to enroll real workers with authentic Philippine GCash mobile numbers.'
                          : 'Try adjusting your search terms, site filter, or category filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div
                        onClick={() => setSelectedProfileEmp(emp)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                        title="Click to view full Employee Profile & Export QR Code"
                      >
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#234338] group-hover:border-[#a3e635] shrink-0 transition-colors"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] group-hover:border-[#a3e635] flex items-center justify-center font-bold text-slate-300 group-hover:text-white text-[11px] shrink-0 transition-colors">
                            {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white group-hover:text-[#a3e635] transition-colors flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-[#a3e635] font-mono">{emp.employee_id}</div>
                          <div className="text-[10px] text-slate-400">{emp.contact_number || emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {(emp.category || '').toLowerCase().includes('office') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Office-Based (HQ)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Site-Based (Field)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-200">{emp.position}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-300">{emp.site_id}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₱{emp.daily_rate.toFixed(2)}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 space-y-0.5 font-mono">
                      <div>SSS: {emp.sss_number || 'N/A'}</div>
                      <div>PhilHealth: {emp.philhealth_number || 'N/A'}</div>
                      <div className="text-slate-300">GCash: {emp.gcash_number || 'None'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-[#a3e635]">v{emp.qr_version}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          emp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    {/* Salary Payout Status Column */}
                    {(() => {
                      const payRec = paymentRecords.find(
                        (p) => p.recipient_id === emp.employee_id && p.module === 'WEEKLY_PAYROLL'
                      );
                      const payrollItem = payroll.find((pr) => pr.employee_id === emp.employee_id);
                      const isReleased =
                        payRec?.status === 'PAID_VERIFIED' ||
                        payrollItem?.payment_status === 'Verified' ||
                        payrollItem?.payment_status === 'Paid';
                      const amount = payRec?.expected_amount || payrollItem?.net_pay || emp.daily_rate * 6 * 0.85;

                      const createdTime = new Date(payRec?.created_at || payrollItem?.created_at || emp.created_at).getTime();
                      const ageHours = Math.max(0, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60)));
                      const isOverdue48h = !isReleased && ageHours >= 48;

                      return (
                        <td className="p-3 whitespace-nowrap">
                          {isReleased ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Payout Released
                              </span>
                              <div className="text-[10px] text-emerald-400 font-mono font-bold">
                                ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Payout Pending
                                </span>
                                {isOverdue48h && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500 text-white shadow-xs" title={`Pending for ${ageHours} hours`}>
                                    &gt;48h
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-amber-300 font-mono font-bold">
                                ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              <button
                                onClick={() => {
                                  setQuickPayoutEmp(emp);
                                  setQuickPayoutRef(`GCASH-${Date.now().toString().slice(-8)}`);
                                }}
                                className="px-2 py-0.5 bg-[#a3e635]/20 hover:bg-[#a3e635] text-[#a3e635] hover:text-[#080f0d] border border-[#a3e635]/40 rounded text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Wallet className="w-2.5 h-2.5" />
                                Release Payout
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })()}
                    <td className="p-3 text-right whitespace-nowrap relative">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedProfileEmp(emp)}
                          className="px-2 py-1 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-300 hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Employee Profile Dossier & 7 Tabs"
                        >
                          <Eye className="w-3 h-3 text-[#10b981]" />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={() => setBadgeEmp(emp)}
                          className="px-2 py-1 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="View & Print Turnstile ID Badge"
                        >
                          <CreditCard className="w-3 h-3 text-[#a3e635]" />
                          <span>ID</span>
                        </button>

                        {/* More Actions Dropdown Menu Trigger (Reference Layout Page 2 & 3) */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveActionMenuId(activeActionMenuId === emp.employee_id ? null : emp.employee_id)}
                            className="p-1.5 hover:bg-[#13241f] border border-transparent hover:border-[#234338] rounded-md text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Open Employee Actions Menu"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeActionMenuId === emp.employee_id && (
                            <div className="absolute right-0 top-8 z-40 w-56 bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl py-1 text-left animate-in fade-in zoom-in-95">
                              <div className="px-3 py-1.5 border-b border-[#234338] text-[10px] text-slate-400 font-mono font-bold">
                                {emp.employee_id} &bull; {emp.name}
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedProfileEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-400" />
                                <span>View Full Profile</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-400" />
                                <span>Edit Information</span>
                              </button>

                              <button
                                onClick={() => {
                                  setTransferForm({
                                    to_site_id: sites.find((s) => s.site_id !== emp.site_id)?.site_id || sites[0]?.site_id || '',
                                    transfer_date: new Date().toISOString().split('T')[0],
                                    effective_date: new Date().toISOString().split('T')[0],
                                    reason: 'Project Requirement',
                                    remarks: '',
                                  });
                                  setTransferModalEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Transfer to Another Site</span>
                              </button>

                              {emp.status === 'active' ? (
                                <button
                                  onClick={() => {
                                    setTerminateForm({
                                      termination_date: new Date().toISOString().split('T')[0],
                                      reason: 'End of Contract',
                                      remarks: 'Contract completed as scheduled.',
                                    });
                                    setTerminateModalEmp(emp);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Terminate / Set to Inactive</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReactivateForm({
                                      reactivation_date: new Date().toISOString().split('T')[0],
                                      reason: 'Rehire / New Project',
                                      remarks: 'Restored for active project mobilization.',
                                    });
                                    setReactivateModalEmp(emp);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Reactivate (Set to Active)</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setBadgeEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-[#a3e635]" />
                                <span>Print ID Card</span>
                              </button>

                              <button
                                onClick={() => {
                                  setCoeModalEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Certificate of Employment (COE)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setHistoryModalEmp(emp);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2 cursor-pointer"
                              >
                                <History className="w-3.5 h-3.5 text-purple-400" />
                                <span>Site &amp; Transfer History</span>
                              </button>

                              {emp.drive_link && (
                                <a
                                  href={emp.drive_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#13241f] flex items-center gap-2"
                                  onClick={() => setActiveActionMenuId(null)}
                                >
                                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                                  <span>View Documents Folder</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#a3e635]" />
                <span>Register New Construction Employee</span>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* Guidance & Duplicate Prevention Banner (HR Layout Reference Page 3) */}
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-3 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
                <strong>Onboarding Protocol:</strong> Assign a permanent unique Employee ID. <em>Employee names may repeat; Employee IDs may not.</em> All fields are validated before activation.
              </div>

              {idValidationError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{idValidationError}</span>
                </div>
              )}

              {/* Permanent Unique Employee ID */}
              <div className="bg-[#13241f] border border-[#234338] p-3 rounded-xl space-y-1">
                <label className="block text-[#a3e635] font-mono font-bold text-xs uppercase tracking-wider">
                  Permanent Employee ID *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customIdInput}
                    onChange={(e) => {
                      const val = e.target.value.trim().toUpperCase();
                      setCustomIdInput(val);
                      if (employees.some((emp) => emp.employee_id.toLowerCase() === val.toLowerCase())) {
                        setIdValidationError(`Duplicate ID alert: "${val}" is already assigned to another employee.`);
                      } else {
                        setIdValidationError(null);
                      }
                    }}
                    className={`w-full bg-[#080f0d] border rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm ${
                      idValidationError ? 'border-rose-500' : 'border-[#a3e635]/60'
                    }`}
                    placeholder="e.g. EMP-2026-0042 or DRC-EMP-2026-000042"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gen = `EMP-2026-${String(employees.length + Math.floor(Math.random() * 900 + 100)).padStart(4, '0')}`;
                      setCustomIdInput(gen);
                      setIdValidationError(null);
                    }}
                    className="px-2.5 py-1.5 bg-[#0e1a16] border border-[#234338] hover:border-slate-400 text-slate-300 text-[11px] font-mono rounded-lg shrink-0 cursor-pointer"
                    title="Generate unique sequential ID"
                  >
                    Auto-Gen
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  Permanent identifier. Cannot be altered or reused after employee separation.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Ramon Bautista"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Skilled Worker / Mason"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-semibold"
                  >
                    <option value="Project-Based">Project-Based</option>
                    <option value="Regular">Regular</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Probationary">Probationary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Project Site *</label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
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
                  <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (PHP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Workforce Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Site-Based">Site-Based Personnel (Field)</option>
                    <option value="Office-Based">Office-Based Staff (HQ)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Worker ID Photo (DOLE Compliant)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCaptureTarget('NEW');
                        setIsPhotoCaptureOpen(true);
                      }}
                      className="px-2 py-0.5 bg-[#a3e635]/15 hover:bg-[#a3e635]/25 text-[#a3e635] border border-[#a3e635]/30 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Open live camera to capture high-res ID badge photo"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Open Camera</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Preview"
                        className="w-8 h-8 rounded-full object-cover border border-[#a3e635] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white text-[11px]"
                      placeholder="Use Open Camera or paste photo URL / base64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="+63 917 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gmail / Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="worker@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SSS Number</label>
                  <input
                    type="text"
                    value={formData.sss_number}
                    onChange={(e) => setFormData({ ...formData, sss_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="34-XXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PhilHealth Number</label>
                  <input
                    type="text"
                    value={formData.philhealth_number}
                    onChange={(e) => setFormData({ ...formData, philhealth_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="12-XXXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">TIN (Tax ID Number)</label>
                  <input
                    type="text"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="123-456-789-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date Hired *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_hired}
                    onChange={(e) => setFormData({ ...formData, date_hired: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GCash Registered No.</label>
                  <input
                    type="tel"
                    value={formData.gcash_number}
                    onChange={(e) => setFormData({ ...formData, gcash_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="0917XXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Maria Bautista (Spouse)"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="0918 761 4321"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee Drive Folder / Docs Link</label>
                <input
                  type="url"
                  value={formData.drive_link}
                  onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Generate ID & Print Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="font-bold text-white text-sm">
                Edit Employee Record: <span className="text-[#a3e635] font-mono">{editingEmp.employee_id}</span>
              </div>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-lg text-emerald-300 text-[11px]">
                <strong>Site Reassignment Rule:</strong> If you change the assigned site, the QR code version automatically increments and the previous QR becomes inactive.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.name}
                    onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Position *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.position}
                    onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Project Site *</label>
                  <select
                    value={editingEmp.site_id}
                    onChange={(e) => setEditingEmp({ ...editingEmp, site_id: e.target.value })}
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
                  <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (PHP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingEmp.daily_rate}
                    onChange={(e) => setEditingEmp({ ...editingEmp, daily_rate: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Workforce Category</label>
                  <select
                    value={editingEmp.category || 'Site-Based'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, category: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Site-Based">Site-Based Personnel (Field)</option>
                    <option value="Office-Based">Office-Based Staff (HQ)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Worker ID Photo (DOLE Compliant)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCaptureTarget('EDIT');
                        setIsPhotoCaptureOpen(true);
                      }}
                      className="px-2 py-0.5 bg-[#a3e635]/15 hover:bg-[#a3e635]/25 text-[#a3e635] border border-[#a3e635]/30 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Open live camera to capture high-res ID badge photo"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Open Camera</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingEmp.photo_url ? (
                      <img
                        src={editingEmp.photo_url}
                        alt="Preview"
                        className="w-8 h-8 rounded-full object-cover border border-[#a3e635] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={editingEmp.photo_url || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, photo_url: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white text-[11px]"
                      placeholder="Use Open Camera or paste photo URL / base64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editingEmp.contact_number}
                    onChange={(e) => setEditingEmp({ ...editingEmp, contact_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GCash Number</label>
                  <input
                    type="tel"
                    value={editingEmp.gcash_number}
                    onChange={(e) => setEditingEmp({ ...editingEmp, gcash_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ID Card & QR Badge Preview Modal */}
      {badgeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setBadgeEmp(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white no-print"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 no-print">
              <h2 className="text-lg font-bold text-white">Official Worker Badge & QR Matrix</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Physical Turnstile Card &bull; Formatted for High-Contrast Direct Thermal/Color ID Card Printers
              </div>
            </div>

            {/* Printable Cards (Front and Back) */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* Front Badge */}
              <div className="w-[260px] h-[380px] bg-white text-[#0f291e] border-2 border-[#1b4332] rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="bg-[#0f291e] p-3 text-center border-b-2 border-[#a3e635]">
                  <div className="font-black text-xs text-[#a3e635] tracking-wider">DE RUEDA CONSTRUCTION</div>
                  <div className="text-[8px] text-emerald-200 uppercase font-semibold">Authorized Field Identification</div>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-between">
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-[#0f291e] flex items-center justify-center text-slate-500 font-bold text-2xl">
                    <HardHat className="w-10 h-10 text-emerald-800" />
                  </div>

                  <div className="text-center">
                    <div className="font-extrabold text-sm text-slate-900 leading-tight">{badgeEmp.name}</div>
                    <div className="text-xs text-emerald-800 font-bold mt-0.5">{badgeEmp.position}</div>
                  </div>

                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
                    <div className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold">Employee ID Key</div>
                    <div className="font-mono font-bold text-xs text-slate-900">{badgeEmp.employee_id}</div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] text-slate-600 border-t border-slate-200 pt-2 font-medium">
                    <span>Site: <strong>{badgeEmp.site_id}</strong></span>
                    <span>Valid: <strong>2027</strong></span>
                  </div>
                </div>
              </div>

              {/* Back Badge with QR */}
              <div className="w-[260px] h-[380px] bg-white text-[#0f291e] border-2 border-[#1b4332] rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="bg-[#0f291e] p-2 text-center border-b-2 border-[#a3e635]">
                  <div className="font-extrabold text-[11px] text-[#a3e635]">TIMEKEEPING QR CODE</div>
                  <div className="text-[8px] text-emerald-200">Version {badgeEmp.qr_version} &bull; Turnstile Scanner</div>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-between">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQRCode(
                        JSON.stringify({ employee_id: badgeEmp.employee_id, qr_version: badgeEmp.qr_version }),
                        150
                      ),
                    }}
                  />

                  <div className="text-center text-[9px] text-slate-600 px-2 leading-relaxed">
                    Scan on site entry tablet or turnstile camera for Time In and Time Out.
                  </div>

                  <div className="w-full text-center font-mono text-[8px] text-slate-400 border-t border-slate-100 pt-1.5 truncate">
                    PAYLOAD: {badgeEmp.employee_id}-v{badgeEmp.qr_version}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Physical Badge
              </button>
              <button
                onClick={() => handleExportQr(badgeEmp)}
                disabled={isExportingQr}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title="Generates a high-resolution, print-ready image file of their unique QR code for physical badge printing"
              >
                <Download className="w-4 h-4" />
                {isExportingQr ? 'Exporting QR...' : 'Export QR'}
              </button>
              <button
                onClick={() => handleDownloadRawQr(badgeEmp)}
                className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                title="Download raw QR matrix only (PNG)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Raw QR Matrix
              </button>
              <button
                onClick={() => setBadgeEmp(null)}
                className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Employee Profile & Credentials Modal */}
      {selectedProfileEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#10b981]/20 border border-[#10b981]/30 rounded-lg text-[#a3e635]">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Employee Profile & Credentials</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                      DOLE Verified
                    </span>
                  </h2>
                  <div className="text-xs text-slate-400">
                    Official Personnel Dossier & Biometric Turnstile Access Pass
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileEmp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0e1a16] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Hero Header Card */}
              <div className="bg-[#13241f]/70 border border-[#234338] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedProfileEmp.photo_url ? (
                    <img
                      src={selectedProfileEmp.photo_url}
                      alt={selectedProfileEmp.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#a3e635] shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#080f0d] border-2 border-[#a3e635] flex items-center justify-center font-bold text-[#a3e635] text-xl shrink-0 shadow-md">
                      {selectedProfileEmp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-white">{selectedProfileEmp.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          selectedProfileEmp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {selectedProfileEmp.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedProfileEmp.category || 'Site-Based'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-0.5">
                      {selectedProfileEmp.position}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>ID: <strong className="text-[#a3e635]">{selectedProfileEmp.employee_id}</strong></span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedProfileEmp.employee_id);
                          setCopiedId(selectedProfileEmp.employee_id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        title="Copy Employee ID"
                      >
                        {copiedId === selectedProfileEmp.employee_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setEditingEmp(selectedProfileEmp);
                      setSelectedProfileEmp(null);
                    }}
                    className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    Edit Info
                  </button>
                  <button
                    onClick={() => {
                      setBadgeEmp(selectedProfileEmp);
                      setSelectedProfileEmp(null);
                    }}
                    className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-[#a3e635] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#a3e635]" />
                    Badge Preview
                  </button>
                </div>
              </div>

              {/* 2-Column Content Grid: Left = Info & Statutory, Right = QR & Export */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Employment & Government Details */}
                <div className="space-y-4">
                  <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#234338] pb-2">
                      <Building className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span>Assignment & Compensation</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Site</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.site_id}</div>
                        <div className="text-[10px] text-slate-500">
                          {sites.find((s) => s.site_id === selectedProfileEmp.site_id)?.name || 'Active Project Site'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Wage Rate</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">
                          ₱{selectedProfileEmp.daily_rate.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">DOLE Standard 8h Shift</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#234338]/60">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Contact Phone</div>
                        <div className="text-slate-200 mt-0.5">{selectedProfileEmp.contact_number || 'No phone recorded'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</div>
                        <div className="text-slate-200 mt-0.5 truncate">{selectedProfileEmp.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Philippine Statutory Registrations */}
                  <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#234338] pb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Statutory Benefit IDs & Disbursement</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Social Security (SSS)</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.sss_number || 'Pending'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">PhilHealth (PhilHealth)</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.philhealth_number || 'Pending'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">GCash Disbursement</div>
                        <div className="text-[#a3e635] font-bold mt-0.5">{selectedProfileEmp.gcash_number || 'Unlinked'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">QR Version Key</div>
                        <div className="text-white font-bold mt-0.5">v{selectedProfileEmp.qr_version || 1} Active</div>
                      </div>
                    </div>

                    {selectedProfileEmp.drive_link && (
                      <div className="pt-1">
                        <a
                          href={selectedProfileEmp.drive_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#a3e635] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Personnel Google Drive Documents Folder
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: High-Resolution QR Code & Export Controls */}
                <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#234338] pb-2 mb-3">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#a3e635]" />
                        <span>Biometric Turnstile QR Matrix</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-[#13241f] px-2 py-0.5 rounded border border-[#234338]">
                        v{selectedProfileEmp.qr_version || 1}
                      </span>
                    </div>

                    {/* QR Code Graphic Box */}
                    <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center shadow-inner border border-slate-200">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateSvgQRCode(
                            JSON.stringify({
                              employee_id: selectedProfileEmp.employee_id,
                              qr_version: selectedProfileEmp.qr_version || 1,
                            }),
                            180
                          ),
                        }}
                      />
                      <div className="text-center font-mono text-[9px] text-slate-700 font-bold mt-2">
                        {selectedProfileEmp.employee_id} · v{selectedProfileEmp.qr_version || 1}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                      Encoded for high-speed offline scan at turnstile gate tablets. Auto-validates anti-duplicate clock-ins and records GPS site tags.
                    </div>
                  </div>

                  {/* Export and Print Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#234338]">
                    {/* Primary 'Export QR' button requested by user */}
                    <button
                      onClick={() => handleExportQr(selectedProfileEmp)}
                      disabled={isExportingQr}
                      className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50"
                      title="Generates a high-resolution, print-ready image file of their unique QR code for physical badge printing"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>{isExportingQr ? 'Generating Print-Ready Image...' : 'Export QR'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownloadRawQr(selectedProfileEmp)}
                        className="py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Download bare 600x600 QR code PNG matrix"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Raw QR Matrix</span>
                      </button>

                      <button
                        onClick={() => {
                          setBadgeEmp(selectedProfileEmp);
                          setSelectedProfileEmp(null);
                        }}
                        className="py-2 bg-[#13241f] border border-[#a3e635]/40 hover:bg-[#a3e635]/10 text-[#a3e635] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Open Physical ID Card Template & Direct Thermal Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Badge</span>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-500 text-center pt-0.5">
                      Outputs print-ready 300 DPI image file with DOLE 5-star safety accreditation header.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#234338] bg-[#0e1a16] flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                DRC Autonomous ERP &bull; Biometric Badge Key Management
              </div>
              <button
                onClick={() => setSelectedProfileEmp(null)}
                className="px-4 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Export Feedback Toast */}
      {exportFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10b981] text-[#080f0d] px-4 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#080f0d] shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Full QR Export Modal Suite */}
      <EmployeeQrBadgeExportModal
        isOpen={isQrExportModalOpen}
        onClose={() => setIsQrExportModalOpen(false)}
        initialEmployeeId={exportModalInitialEmpId}
      />

      {/* Bulk QR Export PDF Modal */}
      <BulkQrExportModal
        isOpen={isBulkExportModalOpen}
        onClose={() => setIsBulkExportModalOpen(false)}
        employees={employees}
        sites={sites}
        currentSite={currentSite}
      />

      {/* Batch Badges Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#234338] no-print">
              <div>
                <h2 className="text-base font-bold text-white">Batch Printable ID Badges</h2>
                <div className="text-xs text-slate-400">All {filtered.length} currently filtered workers ready for batch printing</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsBatchOpen(false);
                    setIsBulkExportModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Generate single PDF containing multiple employee QR codes for batch printing"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bulk Export QR (PDF)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Badges
                </button>
                <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((emp) => (
                <div
                  key={emp.employee_id}
                  className="bg-white text-slate-900 border border-slate-300 rounded-lg p-3 text-center flex flex-col items-center justify-between shadow-xs"
                >
                  <div className="w-full bg-[#0f291e] text-[#a3e635] font-black text-[10px] py-1 rounded-sm">
                    DE RUEDA CONSTRUCTION
                  </div>
                  <div className="mt-2 font-extrabold text-xs text-slate-900">{emp.name}</div>
                  <div className="text-[10px] text-emerald-800 font-semibold">{emp.position}</div>
                  <div className="font-mono text-[9px] text-slate-500 font-bold">{emp.employee_id}</div>
                  <div
                    className="my-2"
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQRCode(
                        JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version }),
                        100
                      ),
                    }}
                  />
                  <div className="text-[8px] text-slate-500">QR Version {emp.qr_version} &bull; {emp.site_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HR Employee ID Photo Capture Modal (Priority 4 / Section 6) */}
      <HrEmployeePhotoCaptureModal
        isOpen={isPhotoCaptureOpen}
        onClose={() => setIsPhotoCaptureOpen(false)}
        employeeName={photoCaptureTarget === 'NEW' ? formData.name : (editingEmp?.name || '')}
        currentPhotoUrl={photoCaptureTarget === 'NEW' ? formData.photo_url : editingEmp?.photo_url}
        onPhotoSaved={(photoDataUrl) => {
          if (photoCaptureTarget === 'NEW') {
            setFormData((prev) => ({ ...prev, photo_url: photoDataUrl }));
          } else if (editingEmp) {
            setEditingEmp((prev) => (prev ? { ...prev, photo_url: photoDataUrl } : null));
          }
        }}
      />

      {/* 1. Transfer Employee to Another Site Modal (HR Layout Specification Page 3 & 5) */}
      {transferModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Transfer Employee to Another Site/Project</h2>
                  <div className="text-[11px] text-slate-400">Assign this employee to a different site or project</div>
                </div>
              </div>
              <button onClick={() => setTransferModalEmp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Employee Badge Card */}
            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center gap-3 mb-4">
              {transferModalEmp.photo_url ? (
                <img src={transferModalEmp.photo_url} alt={transferModalEmp.name} className="w-10 h-10 rounded-full object-cover border border-[#a3e635]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#080f0d] border border-[#a3e635] flex items-center justify-center font-bold text-[#a3e635] text-xs">
                  {transferModalEmp.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white truncate">{transferModalEmp.name}</div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {transferModalEmp.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono">{transferModalEmp.employee_id} &bull; {transferModalEmp.position}</div>
                <div className="text-[10px] text-[#a3e635]">Current Site: {transferModalEmp.site_id}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = transferEmployee(
                  transferModalEmp.employee_id,
                  transferForm.to_site_id,
                  transferForm.transfer_date,
                  transferForm.effective_date,
                  transferForm.reason,
                  transferForm.remarks
                );
                setTransferModalEmp(null);
                setFeedbackToast(res.message);
                setTimeout(() => setFeedbackToast(null), 4000);
              }}
              className="space-y-3.5 text-xs overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Site / Project *</label>
                <select
                  required
                  value={transferForm.to_site_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_site_id: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id} disabled={s.site_id === transferModalEmp.site_id}>
                      {s.code} - {s.name} {s.site_id === transferModalEmp.site_id ? '(Current Site)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.transfer_date}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Effective Start Date *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.effective_date}
                    onChange={(e) => setTransferForm({ ...transferForm, effective_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Transfer *</label>
                <select
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-semibold"
                >
                  <option value="Project Requirement">Project Requirement</option>
                  <option value="Manpower Balancing">Manpower Balancing</option>
                  <option value="Skills Request">Specialized Skills Request</option>
                  <option value="Site Reassignment">Site Reassignment / Demobilization</option>
                  <option value="Client Request">Client Request</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g. Reassigned to Site B for next phase of structural steel works."
                />
              </div>

              <div className="p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-lg text-[11px] text-sky-200 leading-relaxed">
                ℹ️ <strong>Transfer Integrity Rule:</strong> This updates the employee's current site assignment, turnstile tablet routing, and payroll group without modifying historical attendance records or past payroll site references.
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalEmp(null)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005ce6] hover:bg-[#0047b3] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transfer Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Terminate / Set to Inactive Modal (HR Layout Specification Page 3) */}
      {terminateModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Terminate / Set to Inactive</h2>
                  <div className="text-[11px] text-slate-400">Mark this employee as inactive or separated</div>
                </div>
              </div>
              <button onClick={() => setTerminateModalEmp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#080f0d] border border-rose-500 flex items-center justify-center font-bold text-rose-400 text-xs">
                {terminateModalEmp.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{terminateModalEmp.name}</div>
                <div className="text-[10px] text-slate-300 font-mono">{terminateModalEmp.employee_id} &bull; {terminateModalEmp.position}</div>
                <div className="text-[10px] text-slate-400">Site: {terminateModalEmp.site_id}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = terminateEmployee(
                  terminateModalEmp.employee_id,
                  terminateForm.termination_date,
                  terminateForm.reason,
                  terminateForm.remarks
                );
                setTerminateModalEmp(null);
                setFeedbackToast(res.message);
                setTimeout(() => setFeedbackToast(null), 4000);
              }}
              className="space-y-3.5 text-xs overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Termination / Inactive Date *</label>
                  <input
                    type="date"
                    required
                    value={terminateForm.termination_date}
                    onChange={(e) => setTerminateForm({ ...terminateForm, termination_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason *</label>
                  <select
                    required
                    value={terminateForm.reason}
                    onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-semibold"
                  >
                    <option value="End of Contract">End of Contract</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Project Completion">Project Completion</option>
                    <option value="Disciplinary">Disciplinary Separation</option>
                    <option value="Medical">Medical Grounds</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={terminateForm.remarks}
                  onChange={(e) => setTerminateForm({ ...terminateForm, remarks: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g. Contract ended as scheduled. Final wages and deductions fully settled."
                />
              </div>

              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 leading-relaxed">
                ⚠️ <strong>Non-Destructive Archiving:</strong> This sets the employee's status to Inactive. Historical attendance, payroll, and deductions records are preserved in full compliance with DOLE guidelines and can be reactivated anytime.
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTerminateModalEmp(null)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  <span>Set to Inactive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reactivate Employee Modal (HR Layout Specification Page 3) */}
      {reactivateModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Reactivate Employee</h2>
                  <div className="text-[11px] text-slate-400">Set this employee back to active workforce</div>
                </div>
              </div>
              <button onClick={() => setReactivateModalEmp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#080f0d] border border-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-xs">
                {reactivateModalEmp.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{reactivateModalEmp.name}</div>
                <div className="text-[10px] text-slate-300 font-mono">{reactivateModalEmp.employee_id} &bull; {reactivateModalEmp.position}</div>
                <div className="text-[10px] text-slate-400">Previous Site: {reactivateModalEmp.site_id}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = reactivateEmployee(
                  reactivateModalEmp.employee_id,
                  reactivateForm.reactivation_date,
                  reactivateForm.reason,
                  reactivateForm.remarks
                );
                setReactivateModalEmp(null);
                setFeedbackToast(res.message);
                setTimeout(() => setFeedbackToast(null), 4000);
              }}
              className="space-y-3.5 text-xs overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reactivate Date *</label>
                  <input
                    type="date"
                    required
                    value={reactivateForm.reactivation_date}
                    onChange={(e) => setReactivateForm({ ...reactivateForm, reactivation_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason *</label>
                  <select
                    required
                    value={reactivateForm.reason}
                    onChange={(e) => setReactivateForm({ ...reactivateForm, reason: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-semibold"
                  >
                    <option value="Rehire / New Project">Rehire / New Project Mobilization</option>
                    <option value="Contract Extension">Contract Extension</option>
                    <option value="Appeal Approved">Administrative Appeal Approved</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={reactivateForm.remarks}
                  onChange={(e) => setReactivateForm({ ...reactivateForm, remarks: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g. Rehired for new construction phase."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReactivateModalEmp(null)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reactivate Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Certificate of Employment (COE) Modal (HR Layout Specification Page 2) */}
      {coeModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0f291e] text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#a3e635]" />
                <span className="font-bold text-sm">Official Certificate of Employment (COE)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print COE</span>
                </button>
                <button
                  onClick={() => setCoeModalEmp(null)}
                  className="text-slate-300 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 leading-relaxed font-serif">
              {/* Company Header */}
              <div className="text-center border-b-2 border-[#1b4332] pb-4">
                <h1 className="text-xl font-black text-[#1b4332] tracking-wider font-sans">
                  DE RUEDA CONSTRUCTION
                </h1>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                  General Engineering &amp; Building Contractor &bull; DOLE &amp; PCAB Registered
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Subic-Clark Expressway Extension &bull; Mariveles &bull; Orion Project HQ
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center pt-2">
                <h2 className="text-lg font-black tracking-widest uppercase font-sans text-slate-900 underline decoration-[#1b4332] decoration-2 underline-offset-4">
                  CERTIFICATE OF EMPLOYMENT
                </h2>
              </div>

              <div className="space-y-4 text-xs font-sans text-justify pt-2">
                <p className="font-bold text-slate-900">TO WHOM IT MAY CONCERN:</p>
                <p>
                  This is to certify that <strong>{coeModalEmp.name}</strong>, holding permanent employee identification number <strong>{coeModalEmp.employee_id}</strong>, has been employed with <strong>DE RUEDA CONSTRUCTION</strong> as <strong>{coeModalEmp.position}</strong> assigned under the <strong>{coeModalEmp.department || 'Construction Operations'}</strong> division.
                </p>
                <p>
                  Their service with the company commenced on <strong>{coeModalEmp.date_hired ? new Date(coeModalEmp.date_hired).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'June 1, 2024'}</strong> and concluded / remains current as of <strong>{coeModalEmp.termination_date ? new Date(coeModalEmp.termination_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                </p>
                <p>
                  During their employment tenure, they performed their assigned duties with diligence, technical competence, and strict observance of occupational health, safety, and operational standards.
                </p>
                <p>
                  This certification is issued upon the request of the above-named employee for whatever legal purpose it may serve.
                </p>
              </div>

              {/* Seal & Signatures */}
              <div className="pt-8 flex items-end justify-between">
                <div className="text-center space-y-1">
                  <div className="w-20 h-20 rounded-full border-2 border-[#1b4332] p-1 mx-auto flex items-center justify-center text-[9px] font-sans font-bold text-[#1b4332] uppercase tracking-tighter">
                    OFFICIAL SEAL<br />DE RUEDA<br />CONST.
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Document Verified</div>
                </div>

                <div className="text-center space-y-1 min-w-[200px]">
                  <div className="font-serif italic text-base text-[#1b4332] font-black pb-1">
                    Emma Emy Villar De Rueda
                  </div>
                  <div className="border-t border-slate-900 pt-1 font-sans font-bold text-xs text-slate-900">
                    EMMA EMY VILLAR DE RUEDA
                  </div>
                  <div className="text-[10px] text-slate-600 font-sans">
                    Authorized Signatory &bull; Chief Executive
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    REF: DRC-COE-{coeModalEmp.employee_id}-{new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between no-print">
              <span className="text-[11px] text-slate-500 font-sans">
                Official Company Records &bull; DOLE Labor Code Compliant
              </span>
              <button
                onClick={() => setCoeModalEmp(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Site & Transfer History Timeline Modal */}
      {historyModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Site Assignment &amp; Transfer History</h2>
                  <div className="text-[11px] text-slate-400">
                    {historyModalEmp.name} ({historyModalEmp.employee_id}) &bull; Current Site: <strong>{historyModalEmp.site_id}</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setHistoryModalEmp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {(!historyModalEmp.transfer_history || historyModalEmp.transfer_history.length === 0) ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-[#234338] rounded-xl text-xs">
                  No site transfers recorded yet. Employee has remained continuously assigned to original site ({historyModalEmp.site_id}).
                </div>
              ) : (
                <div className="space-y-3">
                  {historyModalEmp.transfer_history.map((record, index) => (
                    <div key={record.transfer_id || index} className="p-3.5 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{record.from_site_id}</span>
                          <span className="text-[#a3e635]">&rarr;</span>
                          <span className="text-emerald-400">{record.to_site_id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {record.reason}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                        <div>Effective Date: <strong className="text-slate-200">{record.effective_date}</strong></div>
                        <div>Transfer Date: <strong className="text-slate-200">{record.transfer_date}</strong></div>
                      </div>
                      {record.remarks && (
                        <div className="text-xs text-slate-300 bg-[#0e1a16] p-2 rounded-lg border border-[#234338]">
                          {record.remarks}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-[#234338]/40">
                        <span>Authorized By: {record.approved_by}</span>
                        <span>{new Date(record.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#234338] flex items-center justify-end">
              <button
                onClick={() => setHistoryModalEmp(null)}
                className="px-4 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Security & Access Control Modal */}
      <SecurityInvitationsModal
        isOpen={isSecurityModalOpen}
        onClose={() => {
          setIsSecurityModalOpen(false);
          fetchPendingApprovalsCount();
        }}
      />
    </div>
  );
};
