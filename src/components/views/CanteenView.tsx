import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Site, Employee, DeductionRecord, GCashTransactionRecord } from '../../types';
import { PageId } from '../layout/Sidebar';
import { CanteenGcashPayoutModal } from '../modals/CanteenGcashPayoutModal';
import { CanteenOfflineQueueModal } from '../modals/CanteenOfflineQueueModal';
import { TurnstileQrScannerModal } from '../modals/TurnstileQrScannerModal';
import { CanteenNotificationCenter } from '../canteen/CanteenNotificationCenter';
import { CanteenGeminiCopilot } from '../canteen/CanteenGeminiCopilot';
import {
  UtensilsCrossed,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Building,
  Users,
  DollarSign,
  Wallet,
  Send,
  Receipt,
  Download,
  Edit,
  Save,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Lock,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  X,
  Clock,
  Printer,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  QrCode,
  Trash2,
  Calculator,
  Camera,
} from 'lucide-react';
import { generateSvgQRCode } from '../../utils/qrGenerator';

interface CanteenViewProps {
  onNavigate?: (page: PageId) => void;
}

export const CanteenView: React.FC<CanteenViewProps> = ({ onNavigate }) => {
  const {
    sites,
    employees,
    deductions,
    payroll,
    gcashTransactions,
    gcashWalletBalance,
    currentSite,
    setCurrentSite,
    updateSite,
    addDeduction,
    addBatchDeductions,
    sendGcashDisbursement,
    dtrWeeks,
    isOnline,
    pendingOfflineCanteenQueue,
    addOfflineCanteenCharge,
    removePendingOfflineRecord,
    syncPendingCanteenQueue,
    currentUser,
  } = useApp();

  const [isOfflineQueueModalOpen, setIsOfflineQueueModalOpen] = useState(false);

  // Site Filter State (defaults to current active site or first site)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    currentSite !== 'ALL' ? currentSite : sites[0]?.site_id || 'SITE-001'
  );

  // Selected Payroll Week Filter
  const [selectedWeek, setSelectedWeek] = useState<string>('2026-W41');

  // Search in worker table
  const [searchWorker, setSearchWorker] = useState<string>('');

  // Toast Notification
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modal States
  const [isCanteenPayoutModalOpen, setIsCanteenPayoutModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  // Section 4 Requirement: GCash-only checkout (no cash or card options)
  const collectionPaymentMethod: 'GCash' = 'GCash';
  const [editingWorkerDeduction, setEditingWorkerDeduction] = useState<{
    employee: Employee;
    existingDeduction?: DeductionRecord;
    amount: number;
    notes?: string;
  } | null>(null);

  // Individual Worker Canteen Meal Chit / Pass Modal State
  const [mealPassWorker, setMealPassWorker] = useState<Employee | null>(null);

  // Worker table category filter tab
  const [workerFilterTab, setWorkerFilterTab] = useState<'all' | 'with_meals' | 'no_meals'>('all');

  // Batch Meal Allocation Modal State
  const [isBatchMealModalOpen, setIsBatchMealModalOpen] = useState(false);
  const [batchMealAmount, setBatchMealAmount] = useState<number>(350);
  const [batchTargetGroup, setBatchTargetGroup] = useState<'all' | 'zero_only' | 'selected'>('all');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());
  const [batchMemo, setBatchMemo] = useState<string>('Standard Weekly Canteen Meal Pack');

  // Printable Physical Concessionaire Billing Voucher Modal State
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Concessionaire Configuration Form State
  const selectedSite = useMemo(
    () => sites.find((s) => s.site_id === selectedSiteId) || sites[0],
    [sites, selectedSiteId]
  );

  const [vendorNameInput, setVendorNameInput] = useState<string>('');
  const [gcashNumberInput, setGcashNumberInput] = useState<string>('');
  const [contactPersonInput, setContactPersonInput] = useState<string>('');
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);

  // GCash Destination Audit History (Section 4 Requirement)
  interface CanteenAuditEntry {
    id: string;
    timestamp: string;
    changed_by: string;
    vendor: string;
    gcash: string;
    contact: string;
  }
  const [auditHistory, setAuditHistory] = useState<CanteenAuditEntry[]>([]);

  // Synchronize inputs & load audit history when selectedSite changes
  React.useEffect(() => {
    if (selectedSite) {
      setVendorNameInput(selectedSite.canteen_vendor_name || `${selectedSite.name} Canteen Concessionaire`);
      setGcashNumberInput(selectedSite.canteen_gcash_number || '09171234567');
      setContactPersonInput(selectedSite.canteen_contact_person || 'Canteen Manager');
      setIsEditingConfig(false);

      try {
        const stored = localStorage.getItem(`DERUEDA_CANTEEN_AUDIT_${selectedSite.site_id}`);
        if (stored) {
          setAuditHistory(JSON.parse(stored));
        } else {
          setAuditHistory([
            {
              id: 'init-audit-1',
              timestamp: '2026-10-15 08:30',
              changed_by: 'Emerita De Rueda (CEO)',
              vendor: selectedSite.canteen_vendor_name || `${selectedSite.name} Concessionaire`,
              gcash: selectedSite.canteen_gcash_number || '09171234567',
              contact: selectedSite.canteen_contact_person || 'Concessionaire Manager',
            },
          ]);
        }
      } catch {
        setAuditHistory([]);
      }
    }
  }, [selectedSite]);

  // Direct Settlement Form State
  const [directPayoutSiteId, setDirectPayoutSiteId] = useState<string>(
    sites[0]?.site_id || 'SITE-001'
  );
  const [directAmount, setDirectAmount] = useState<number>(0);
  const [directMemo, setDirectMemo] = useState<string>('');
  const [directPin, setDirectPin] = useState<string>('');
  const [isDirectSubmitting, setIsDirectSubmitting] = useState<boolean>(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Calculations for Selected Site
  const isAllSites = selectedSiteId === 'ALL';

  // Target Payout Site (allows picking specific site when in consolidated ALL view)
  const targetPayoutSite = useMemo(
    () => (isAllSites ? sites.find((s) => s.site_id === directPayoutSiteId) || selectedSite : selectedSite),
    [isAllSites, sites, directPayoutSiteId, selectedSite]
  );

  // Outstanding balance specifically for targetPayoutSite
  const targetPayoutOutstanding = useMemo(() => {
    if (!targetPayoutSite) return 0;
    const coll = deductions
      .filter((d) => d.site_id === targetPayoutSite.site_id && (selectedWeek === 'ALL' || d.week_key === selectedWeek) && !d.is_void)
      .reduce((sum, d) => sum + Number(d.canteen || 0), 0);
    const pd = gcashTransactions
      .filter((tx) => tx.category === 'Site Canteen Payout' && tx.site_id === targetPayoutSite.site_id && tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return Math.max(0, coll - pd);
  }, [targetPayoutSite, deductions, gcashTransactions, selectedWeek]);

  // 1. Worker meal deductions collected for this site (filtered by week or ALL)
  const siteDeductions = useMemo(() => {
    return deductions.filter((d) => {
      const matchSite = isAllSites ? true : d.site_id === selectedSiteId;
      const matchWeek = selectedWeek === 'ALL' ? true : d.week_key === selectedWeek;
      return matchSite && matchWeek && !d.is_void;
    });
  }, [deductions, isAllSites, selectedSiteId, selectedWeek]);

  const siteTotalCanteenDeductions = useMemo(() => {
    return siteDeductions.reduce((sum, d) => sum + Number(d.canteen || 0), 0);
  }, [siteDeductions]);

  // Cumulative all-time deductions for this site
  const siteAllTimeCanteenDeductions = useMemo(() => {
    return deductions
      .filter((d) => (isAllSites ? true : d.site_id === selectedSiteId) && !d.is_void)
      .reduce((sum, d) => sum + Number(d.canteen || 0), 0);
  }, [deductions, isAllSites, selectedSiteId]);

  // 2. GCash payouts already settled for this site's canteen
  const siteCanteenTransactions = useMemo(() => {
    return gcashTransactions.filter((tx) => {
      const matchCategory = tx.category === 'Site Canteen Payout';
      const matchSite = isAllSites ? true : tx.site_id === selectedSiteId;
      return matchCategory && matchSite;
    });
  }, [gcashTransactions, isAllSites, selectedSiteId]);

  const siteTotalCanteenPaid = useMemo(() => {
    return siteCanteenTransactions
      .filter((tx) => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [siteCanteenTransactions]);

  // 3. Outstanding balance owed to canteen concessionaire
  const siteOutstandingBalance = Math.max(0, siteAllTimeCanteenDeductions - siteTotalCanteenPaid);

  // Update directAmount default when balance changes
  React.useEffect(() => {
    if (siteOutstandingBalance > 0) {
      setDirectAmount(siteOutstandingBalance);
    } else if (siteTotalCanteenDeductions > 0) {
      setDirectAmount(siteTotalCanteenDeductions);
    } else {
      setDirectAmount(0);
    }
    if (selectedSite) {
      setDirectMemo(`Canteen Meal Settlement (${selectedWeek}) - ${selectedSite.code}`);
    }
  }, [siteOutstandingBalance, siteTotalCanteenDeductions, selectedSite, selectedWeek]);

  // Workers assigned to this site
  const baseSiteWorkers = useMemo(() => {
    return employees.filter((e) => {
      const matchSite = isAllSites ? true : e.site_id === selectedSiteId;
      const matchStatus = e.status === 'active';
      if (!matchSite || !matchStatus) return false;
      if (searchWorker.trim()) {
        const q = searchWorker.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employees, isAllSites, selectedSiteId, searchWorker]);

  // Workers filtered by category tab (All / With Meal Charges / Zero Deduction)
  const siteWorkers = useMemo(() => {
    if (workerFilterTab === 'all') return baseSiteWorkers;
    return baseSiteWorkers.filter((emp) => {
      const d = deductions.find(
        (x) =>
          x.employee_id === emp.employee_id &&
          (selectedWeek === 'ALL' || x.week_key === selectedWeek) &&
          !x.is_void
      );
      const hasMeal = (d?.canteen || 0) > 0;
      return workerFilterTab === 'with_meals' ? hasMeal : !hasMeal;
    });
  }, [baseSiteWorkers, workerFilterTab, deductions, selectedWeek]);

  // Workforce stats for badges
  const workersWithMealsCount = useMemo(() => {
    return baseSiteWorkers.filter((emp) => {
      const d = deductions.find(
        (x) =>
          x.employee_id === emp.employee_id &&
          (selectedWeek === 'ALL' || x.week_key === selectedWeek) &&
          !x.is_void
      );
      return (d?.canteen || 0) > 0;
    }).length;
  }, [baseSiteWorkers, deductions, selectedWeek]);

  const workersWithoutMealsCount = baseSiteWorkers.length - workersWithMealsCount;
  const avgMealPerWorker = workersWithMealsCount > 0 ? siteTotalCanteenDeductions / workersWithMealsCount : 0;

  // Save Concessionaire Configuration
  const handleSaveConfig = () => {
    if (!selectedSite || isAllSites) return;

    let cleanMobile = gcashNumberInput.trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    if (!cleanMobile.startsWith('09') || cleanMobile.length !== 11) {
      setNotificationMsg('Please provide a valid 11-digit Philippine GCash mobile number (09XXXXXXXXX).');
      return;
    }

    const newVendor = vendorNameInput.trim() || `${selectedSite.name} Canteen Concessionaire`;
    const newContact = contactPersonInput.trim() || 'Canteen Manager';

    updateSite(selectedSite.site_id, {
      canteen_vendor_name: newVendor,
      canteen_gcash_number: cleanMobile,
      canteen_contact_person: newContact,
    });

    // Record change to audit history
    const auditEntry: CanteenAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      changed_by: currentUser ? `${currentUser.name} (${currentUser.access_point.toUpperCase()})` : 'Authorized Supervisor',
      vendor: newVendor,
      gcash: cleanMobile,
      contact: newContact,
    };

    const updatedHistory = [auditEntry, ...auditHistory.slice(0, 9)];
    setAuditHistory(updatedHistory);
    try {
      localStorage.setItem(`DERUEDA_CANTEEN_AUDIT_${selectedSite.site_id}`, JSON.stringify(updatedHistory));
    } catch {}

    setIsEditingConfig(false);
    setNotificationMsg(`Saved Canteen GCash configuration for ${selectedSite.code}: ${selectedSite.name}. Logged to compliance audit.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Direct Payout Handler
  const handleExecuteDirectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayoutSite) return;
    setDirectError(null);

    const gcashNum = (targetPayoutSite.canteen_gcash_number || gcashNumberInput).trim();
    let cleanMobile = gcashNum.replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    if (!cleanMobile.startsWith('09') || cleanMobile.length !== 11) {
      setDirectError('Invalid Canteen GCash mobile number. Must be 11 digits starting with 09 (e.g. 09171234567).');
      return;
    }

    if (directAmount <= 0) {
      setDirectError('Disbursement amount must be greater than ₱0.00.');
      return;
    }

    if (directAmount > gcashWalletBalance) {
      setDirectError(`Insufficient corporate GCash balance (₱${gcashWalletBalance.toLocaleString()}) for payout of ₱${directAmount.toLocaleString()}.`);
      return;
    }

    setIsDirectSubmitting(true);

    try {
      const vendor = targetPayoutSite.canteen_vendor_name || vendorNameInput.trim() || `${targetPayoutSite.name} Canteen`;
      const res = await sendGcashDisbursement({
        category: 'Site Canteen Payout',
        site_id: targetPayoutSite.site_id,
        recipient_name: vendor,
        recipient_mobile: cleanMobile,
        amount: Number(directAmount),
        purpose: directMemo.trim() || `Canteen Meal Settlement (${selectedWeek}) - ${targetPayoutSite.code}`,
        user_pin: directPin.trim(),
      });

      setNotificationMsg(
        `Disbursed ₱${Number(directAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} to ${vendor} (${targetPayoutSite.code}) via GCash. Reference: ${res.reference_no}. Accounting expense and document vault updated!`
      );

      // Reset direct form amount to remaining balance if any
      setDirectAmount(0);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDirectError(e?.message || 'Failed to process GCash canteen disbursement.');
    } finally {
      setIsDirectSubmitting(false);
      setTimeout(() => setNotificationMsg(null), 8000);
    }
  };

  // Save Worker Weekly Canteen Stipend Collection
  const handleSaveWorkerMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkerDeduction) return;

    const { employee, existingDeduction, amount, notes } = editingWorkerDeduction;
    const targetWeek = existingDeduction ? existingDeduction.week_key : (selectedWeek === 'ALL' ? '2026-W41' : selectedWeek);
    const notesText = notes?.trim() || `Weekly canteen stipend (${collectionPaymentMethod}) - ${targetWeek}`;

    // If offline, store locally in IndexedDB with auto-sync capability
    if (!isOnline) {
      addOfflineCanteenCharge({
        employee_id: employee.employee_id,
        employee_name: employee.name,
        site_id: employee.site_id,
        week_key: targetWeek,
        amount: Math.max(0, Number(amount || 0)),
        payment_method: collectionPaymentMethod,
        notes: notesText,
      });

      setEditingWorkerDeduction(null);
      setNotificationMsg(
        `Offline weekly canteen stipend (₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) saved locally to IndexedDB for ${employee.name}. Will automatically sync once connectivity is detected!`
      );
      setTimeout(() => setNotificationMsg(null), 6000);
      return;
    }

    if (existingDeduction) {
      // addDeduction automatically updates and replaces existing record for the same employee and week
      addDeduction({
        employee_id: employee.employee_id,
        week_key: existingDeduction.week_key,
        site_id: employee.site_id,
        canteen: Math.max(0, Number(amount || 0)),
        sss: existingDeduction.sss,
        philhealth: existingDeduction.philhealth,
        other_deduction: existingDeduction.other_deduction,
        cash_advance: existingDeduction.cash_advance,
        notes: notesText,
      });
    } else {
      // Create new deduction record for this week
      addDeduction({
        employee_id: employee.employee_id,
        week_key: targetWeek,
        site_id: employee.site_id,
        canteen: Math.max(0, Number(amount || 0)),
        sss: 0,
        philhealth: 0,
        other_deduction: 0,
        cash_advance: 0,
        notes: notesText,
      });
    }

    setEditingWorkerDeduction(null);
    setNotificationMsg(
      `Updated weekly canteen stipend for ${employee.name} (₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) via ${collectionPaymentMethod}.`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Toggle single worker selection for batch meal charges
  const handleToggleSelectWorker = (empId: string) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  // Toggle all visible workers selection
  const handleSelectAllWorkers = () => {
    const allIds = siteWorkers.map((e) => e.employee_id);
    const areAll = allIds.length > 0 && allIds.every((id) => selectedWorkerIds.has(id));
    if (areAll) {
      setSelectedWorkerIds(new Set());
    } else {
      setSelectedWorkerIds(new Set(allIds));
    }
  };

  // Execute Batch Meal Deduction Allocation
  const handleApplyBatchMeals = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchMealAmount < 0) return;

    let targetWorkers = baseSiteWorkers;
    if (batchTargetGroup === 'zero_only') {
      targetWorkers = baseSiteWorkers.filter((emp) => {
        const d = deductions.find(
          (x) =>
            x.employee_id === emp.employee_id &&
            (selectedWeek === 'ALL' || x.week_key === selectedWeek) &&
            !x.is_void
        );
        return !(d && Number(d.canteen || 0) > 0);
      });
    } else if (batchTargetGroup === 'selected') {
      targetWorkers = baseSiteWorkers.filter((emp) => selectedWorkerIds.has(emp.employee_id));
    }

    if (targetWorkers.length === 0) {
      setNotificationMsg('No workers matched the batch meal allocation criteria.');
      return;
    }

    const weekToUse = selectedWeek === 'ALL' ? '2026-W41' : selectedWeek;

    const batchPayload = targetWorkers.map((emp) => {
      const existing = deductions.find(
        (d) => d.employee_id === emp.employee_id && d.week_key === weekToUse && !d.is_void
      );
      return {
        employee_id: emp.employee_id,
        week_key: weekToUse,
        site_id: emp.site_id,
        canteen: Number(batchMealAmount),
        sss: existing?.sss || 0,
        philhealth: existing?.philhealth || 0,
        other_deduction: existing?.other_deduction || 0,
        cash_advance: existing?.cash_advance || 0,
        notes: `${batchMemo.trim() || 'Batch Canteen Meal charge'} (${weekToUse})`,
      };
    });

    addBatchDeductions(batchPayload);

    setIsBatchMealModalOpen(false);
    setSelectedWorkerIds(new Set());
    setNotificationMsg(
      `Batch recorded ₱${Number(batchMealAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} meal charges for ${targetWorkers.length} workers in ${weekToUse}. All financial records updated!`
    );
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Export Canteen Data to CSV

  const handleExportCSV = () => {
    const rows = [
      ['DE RUEDA CONSTRUCTION - SITE CANTEEN & MEAL SETTLEMENT LEDGER'],
      ['Site', selectedSite ? `${selectedSite.code} - ${selectedSite.name}` : 'All Sites'],
      ['Cycle Week', selectedWeek],
      ['Concessionaire', selectedSite?.canteen_vendor_name || 'N/A'],
      ['Canteen GCash', selectedSite?.canteen_gcash_number || 'N/A'],
      ['Total Collected', siteTotalCanteenDeductions.toString()],
      ['Total Settled via GCash', siteTotalCanteenPaid.toString()],
      ['Outstanding Balance', siteOutstandingBalance.toString()],
      [],
      ['Employee ID', 'Employee Name', 'Position', 'Site', 'Week', 'Canteen Deduction (PHP)', 'Notes'],
    ];

    siteWorkers.forEach((emp) => {
      const d = deductions.find(
        (x) => x.employee_id === emp.employee_id && (selectedWeek === 'ALL' || x.week_key === selectedWeek) && !x.is_void
      );
      rows.push([
        emp.employee_id,
        emp.name,
        emp.position,
        emp.site_id,
        selectedWeek,
        (d?.canteen || 0).toString(),
        d?.notes || '',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `DRC_Canteen_Report_${selectedSite?.code || 'ALL'}_${selectedWeek}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Canteen Transaction Sync & Notification Center */}
      <CanteenNotificationCenter />

      {/* Offline Site Network Alert Banner */}
      {!isOnline && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 no-print animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white">Site Offline — Local Stipend Queue Active.</span>{' '}
              <span className="text-amber-300/90">
                Stipend collections are cached via Service Worker. Stipend entries are safely stored in local queue ({pendingOfflineCanteenQueue.length} pending) and will auto-sync upon reconnection.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOfflineQueueModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
          >
            View Queue ({pendingOfflineCanteenQueue.length})
          </button>
        </div>
      )}

      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-400 shadow-inner">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Weekly Canteen Stipend Collection &amp; GCash Payout
                <span className="text-[10px] font-mono font-bold bg-[#a3e635] text-[#080f0d] px-2 py-0.5 rounded-full uppercase">
                  GCASH-ONLY SETTLEMENT
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly canteen stipend collection (GCash direct) per site and automated concessionaire disbursement
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Offline Pending Queue Button */}
          <button
            onClick={() => setIsOfflineQueueModalOpen(true)}
            className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              pendingOfflineCanteenQueue.length > 0
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white'
            }`}
            title="Inspect pending offline canteen meal records"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Offline Queue ({pendingOfflineCanteenQueue.length})</span>
          </button>

          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] hover:border-lime-400 text-lime-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Scan Worker QR Badge with device camera to record weekly stipend collection"
          >
            <Camera className="w-3.5 h-3.5 text-lime-400" />
            <span>Scan Worker QR</span>
          </button>

          <button
            onClick={() => setIsBatchMealModalOpen(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] hover:border-lime-400 text-lime-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Batch Apply Weekly Canteen Stipend Collection"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>Batch Stipend Entry</span>
          </button>

          <button
            onClick={() => setIsPrintSheetOpen(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] hover:border-sky-400 text-sky-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Print Physical Stipend Signoff Voucher for Site Concessionaire"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print Stipend Sheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Canteen Stipend Ledger to CSV"
          >
            <Download className="w-3.5 h-3.5 text-lime-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCanteenPayoutModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-black rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Payout Modal</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls Bar: Site Selector & Cycle Week */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Site Dropdown Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <Building className="w-4 h-4 text-[#a3e635]" />
            <span>Target Construction Site:</span>
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              if (e.target.value !== 'ALL') {
                setCurrentSite(e.target.value);
              }
            }}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-xs text-[#a3e635] font-mono font-bold outline-none cursor-pointer focus:border-[#a3e635]"
          >
            <option value="ALL">All Construction Sites (Consolidated)</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} &bull; {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>

        {/* Cycle Week Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Payroll Week:</span>
          </div>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-xs text-sky-300 font-mono font-bold outline-none cursor-pointer focus:border-sky-400"
          >
            <option value="ALL">All Payroll Weeks (Cumulative)</option>
            {dtrWeeks.map((w) => (
              <option key={w.week_key} value={w.week_key}>
                {w.week_key} ({w.date_start} &rarr; {w.date_end})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Financial Executive Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Worker Deductions Collected */}
        <div className="p-4 bg-[#0e1a16] border border-[#234338] rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Weekly Canteen Stipend Collected</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              ₱{siteTotalCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Cycle: <strong className="text-slate-300">{selectedWeek}</strong></span>
              <span className="font-mono text-slate-500">All-time: ₱{siteAllTimeCanteenDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: GCash Disbursements Settled */}
        <div className="p-4 bg-[#0e1a16] border border-[#234338] rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Settled via GCash</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ₱{siteTotalCanteenPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{siteCanteenTransactions.length} GCash Payouts</span>
              <span className="text-emerald-400 font-semibold">100% Tax Receipted</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Net Outstanding Balance */}
        <div className="p-4 bg-[#0e1a16] border border-[#234338] rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Outstanding to Pay</span>
            <DollarSign className="w-4 h-4 text-lime-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-lime-400">
              ₱{siteOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] mt-1 flex items-center justify-between">
              <span className={siteOutstandingBalance > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {siteOutstandingBalance > 0 ? '● Settlement Pending' : '✓ Fully Settled'}
              </span>
              <span className="text-slate-500 font-mono">Concessionaire Account</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Corporate GCash Reserve */}
        <div className="p-4 bg-[#0e1a16] border border-[#234338] rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Corporate GCash Balance</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              ₱{gcashWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Master Float Reserve</span>
              <span className="text-amber-400 font-semibold">BSP Regulated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Canteen GCash Configuration & Quick Disbursement Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Canteen Concessionaire & GCash Setup */}
        <div className="lg:col-span-5 bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Canteen GCash Profile
                </h3>
              </div>
              {!isAllSites && (
                <button
                  type="button"
                  onClick={() => setIsEditingConfig((v) => !v)}
                  className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingConfig ? 'Cancel' : 'Edit GCash'}</span>
                </button>
              )}
            </div>

            {isEditingConfig && !isAllSites ? (
              /* Editable Configuration Form */
              <div className="space-y-3 pt-3 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Concessionaire / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorNameInput}
                    onChange={(e) => setVendorNameInput(e.target.value)}
                    placeholder="e.g. Ate Maria's Mariveles Site Canteen"
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                    <span>Canteen GCash Mobile Number *</span>
                    <span className="text-[10px] text-sky-400 font-mono">09XXXXXXXXX</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={gcashNumberInput}
                      onChange={(e) => setGcashNumberInput(e.target.value)}
                      placeholder="09171234567"
                      maxLength={12}
                      className="w-full pl-8 pr-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white font-mono font-bold text-xs outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Concessionaire Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPersonInput}
                    onChange={(e) => setContactPersonInput(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none focus:border-lime-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full py-2.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Canteen GCash Information</span>
                </button>
              </div>
            ) : (
              /* Display Current Configuration Card */
              <div className="pt-3 space-y-3.5 text-xs">
                <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Site Assignment</span>
                    <span className="font-mono text-[#a3e635] font-bold text-xs">
                      {selectedSite ? selectedSite.code : 'ALL SITES'}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {selectedSite ? selectedSite.name : 'Consolidated Project Overview'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Location: {selectedSite?.location || 'Central Luzon Sites'} &bull; Supervisor: {selectedSite?.supervisor || 'Site Management'}
                  </div>
                </div>

                <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Canteen Operator / Concessionaire
                  </div>
                  <div className="text-sm font-bold text-lime-300">
                    {selectedSite?.canteen_vendor_name || 'Site Mess & Worker Canteen'}
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Contact: <strong>{selectedSite?.canteen_contact_person || 'Canteen In-charge'}</strong></span>
                  </div>

                  <div className="pt-2 border-t border-[#234338]/60 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">GCash Mobile:</span>
                    <div className="flex items-center gap-1.5 bg-[#080f0d] px-2.5 py-1 rounded border border-[#234338]">
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-mono font-bold text-white text-xs">
                        {selectedSite?.canteen_gcash_number || '09171234567'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedSite?.canteen_gcash_number || '09171234567', 'site-gcash')}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-0.5"
                        title="Copy GCash Number"
                      >
                        {copiedRef === 'site-gcash' ? (
                          <Check className="w-3.5 h-3.5 text-lime-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4: Concessionaire QR Preview */}
                <div className="flex items-center gap-3 p-3 bg-[#080f0d] border border-[#234338] rounded-xl">
                  <div
                    className="shrink-0 bg-white p-1 rounded-lg"
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQRCode(selectedSite?.canteen_gcash_number || '09171234567', 68),
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-slate-400">GCash Concessionaire QR</div>
                    <div className="text-xs font-bold text-white truncate">{selectedSite?.canteen_vendor_name || 'Site Canteen'}</div>
                    <div className="text-[11px] font-mono text-[#a3e635]">{selectedSite?.canteen_gcash_number || '09171234567'}</div>
                    <div className="text-[10px] text-slate-400">Account: {selectedSite?.canteen_contact_person || 'Accredited Operator'}</div>
                  </div>
                </div>

                {/* Section 4: Financial Settlement Warning */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">Financial Settlement Warning</div>
                    <p className="text-[10px] text-amber-200/90 mt-0.5 leading-relaxed">
                      PayMongo gateway processing is strictly dedicated to customer project milestones and client progress invoicing. On-site canteen meal stipends are independent field allowances disbursed exclusively via verified GCash direct mobile wallet settlement.
                    </p>
                  </div>
                </div>

                {/* Section 4: Short Change History / Audit Trail */}
                <div className="space-y-1.5 pt-2 border-t border-[#234338]">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>GCash Destination Change History</span>
                    <span className="text-[9px] font-mono text-emerald-400">Logged</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {auditHistory.length === 0 ? (
                      <div className="text-[10px] text-slate-500 italic p-1">No modifications recorded yet.</div>
                    ) : (
                      auditHistory.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="p-2 rounded bg-[#080f0d] border border-[#234338] text-[10px] flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">
                              {entry.vendor} &bull; <span className="font-mono text-[#a3e635]">{entry.gcash}</span>
                            </div>
                            <div className="text-slate-400 text-[9px] truncate">By {entry.changed_by}</div>
                          </div>
                          <span className="text-slate-500 font-mono text-[9px] shrink-0 ml-2">{entry.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#234338] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Automated Accounting Linkage</span>
            <span className="font-mono text-emerald-400">ACTIVE &bull; EXP-CANTEEN</span>
          </div>
        </div>

        {/* Right Column (7 Cols): Direct Automated Concessionaire Payout Terminal */}
        <div className="lg:col-span-7 bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-lime-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Disburse Concessionaire Payout via GCash
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                REAL-TIME SETTLEMENT
              </span>
            </div>

            <form onSubmit={handleExecuteDirectPayout} className="pt-3 space-y-3.5 text-xs">
              {isAllSites && (
                <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-lg space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span>Select Target Site Concessionaire for Payout *</span>
                    </span>
                    <span className="text-[10px] text-lime-400 font-mono font-bold">
                      Pending: ₱{targetPayoutOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </label>
                  <select
                    value={directPayoutSiteId}
                    onChange={(e) => setDirectPayoutSiteId(e.target.value)}
                    className="w-full bg-[#080f0d] border border-[#234338] rounded-lg px-3 py-2 text-xs text-lime-300 font-bold outline-none cursor-pointer focus:border-lime-400"
                  >
                    {sites.map((s) => {
                      const coll = deductions
                        .filter((d) => d.site_id === s.site_id && (selectedWeek === 'ALL' || d.week_key === selectedWeek) && !d.is_void)
                        .reduce((sum, d) => sum + Number(d.canteen || 0), 0);
                      const pd = gcashTransactions
                        .filter((tx) => tx.category === 'Site Canteen Payout' && tx.site_id === s.site_id && tx.status === 'COMPLETED')
                        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
                      const out = Math.max(0, coll - pd);
                      return (
                        <option key={s.site_id} value={s.site_id}>
                          {s.code}: {s.name} &bull; Outstanding: ₱{out.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Vendor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Concessionaire Payee
                  </label>
                  <input
                    type="text"
                    disabled
                    value={targetPayoutSite?.canteen_vendor_name || `${targetPayoutSite?.name} Canteen`}
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-slate-300 font-semibold cursor-not-allowed text-xs"
                  />
                </div>

                {/* Target GCash Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Canteen GCash Account
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled
                      value={targetPayoutSite?.canteen_gcash_number || '09171234567'}
                      className="w-full pl-8 pr-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white font-mono font-bold cursor-not-allowed text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase">
                      Payout Amount (₱ PHP) *
                    </label>
                    {(isAllSites ? targetPayoutOutstanding : siteOutstandingBalance) > 0 && (
                      <button
                        type="button"
                        onClick={() => setDirectAmount(isAllSites ? targetPayoutOutstanding : siteOutstandingBalance)}
                        className="text-[10px] text-lime-400 hover:underline font-mono cursor-pointer"
                      >
                        Set to Balance (₱{(isAllSites ? targetPayoutOutstanding : siteOutstandingBalance).toLocaleString()})
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
                      value={directAmount}
                      onChange={(e) => setDirectAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                {/* CEO Authorization Passkey */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                    <span>CEO Passkey PIN *</span>
                    <span className="text-[9px] text-slate-500 font-mono">Confidential Authorization</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={directPin}
                      onChange={(e) => setDirectPin(e.target.value)}
                      placeholder="Enter CEO authorization passkey..."
                      className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Settlement Cycle Memo
                </label>
                <input
                  type="text"
                  value={directMemo}
                  onChange={(e) => setDirectMemo(e.target.value)}
                  placeholder="e.g. Weekly Canteen Payout for Site 001"
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              {directError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDirectSubmitting || directAmount <= 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {isDirectSubmitting
                    ? 'Processing GCash Disbursement...'
                    : `Disburse ₱${Number(directAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} to Canteen`}
                </span>
              </button>
            </form>
          </div>

          <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Direct debit from Corporate GCash Float &bull; Automatic Expense Entry Created
            </span>
            <span className="font-mono text-lime-400 font-bold">100% AUDIT READY</span>
          </div>
        </div>
      </div>

      {/* Section 3: Automated Employee Meal Deductions Ledger for Selected Site */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-md space-y-0">
        {/* Table Header & Search Filter */}
        <div className="p-4 bg-[#13241f] border-b border-[#234338] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a3e635]" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Worker Weekly Canteen Stipend Collection Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                {siteWorkers.length} workers shown of {baseSiteWorkers.length} active on {selectedSite ? selectedSite.name : 'All Sites'} ({selectedWeek})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Filter Tabs */}
            <div className="flex items-center bg-[#080f0d] p-0.5 rounded-lg border border-[#234338] text-[11px]">
              <button
                type="button"
                onClick={() => setWorkerFilterTab('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  workerFilterTab === 'all'
                    ? 'bg-[#a3e635] text-[#080f0d]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({baseSiteWorkers.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkerFilterTab('with_meals')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  workerFilterTab === 'with_meals'
                    ? 'bg-lime-400 text-[#080f0d]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                With Meals ({workersWithMealsCount})
              </button>
              <button
                type="button"
                onClick={() => setWorkerFilterTab('no_meals')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  workerFilterTab === 'no_meals'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Zero Charge ({workersWithoutMealsCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchWorker}
                onChange={(e) => setSearchWorker(e.target.value)}
                placeholder="Search worker by name or ID..."
                className="pl-8 pr-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs outline-none focus:border-lime-400 w-52"
              />
            </div>
          </div>
        </div>

        {/* Workforce KPI Metrics Bar */}
        <div className="bg-[#0c1613] px-4 py-2 border-b border-[#234338] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Workforce: <strong className="text-white font-mono">{baseSiteWorkers.length}</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">
              Workers Charged: <strong className="text-lime-400 font-mono">{workersWithMealsCount}</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">
              Total Deduction: <strong className="text-white font-mono">₱{siteTotalCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">
              Average / Worker: <strong className="text-sky-300 font-mono">₱{avgMealPerWorker.toFixed(2)}</strong>
            </span>
          </div>

          {selectedWorkerIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-lime-400">
                {selectedWorkerIds.size} worker{selectedWorkerIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => {
                  setBatchTargetGroup('selected');
                  setIsBatchMealModalOpen(true);
                }}
                className="px-2.5 py-1 bg-[#a3e635] text-[#080f0d] font-bold text-[11px] rounded-md hover:bg-[#84cc16] cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Batch Apply ({selectedWorkerIds.size})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedWorkerIds(new Set())}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Workers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0c1613] text-[10px] uppercase font-bold text-slate-400 border-b border-[#234338]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAllWorkers}
                    className="p-1 text-slate-400 hover:text-lime-400 cursor-pointer inline-flex items-center justify-center"
                    title="Select All / Deselect All Visible Workers"
                  >
                    {siteWorkers.length > 0 && siteWorkers.every((e) => selectedWorkerIds.has(e.employee_id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="p-3">Employee ID &amp; Name</th>
                <th className="p-3">Position</th>
                <th className="p-3">Site</th>
                <th className="p-3 text-right">Daily Rate</th>
                <th className="p-3 text-right">Week Deduction ({selectedWeek})</th>
                <th className="p-3 text-right">Cumulative Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/60">
              {siteWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 text-xs">
                    No active employees found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                siteWorkers.map((emp) => {
                  // Find current week deduction record
                  const currentWeekDed = deductions.find(
                    (d) =>
                      d.employee_id === emp.employee_id &&
                      (selectedWeek === 'ALL' || d.week_key === selectedWeek) &&
                      !d.is_void
                  );
                  const currentMealDeduction = currentWeekDed?.canteen || 0;

                  // Find all-time meal deductions for this worker
                  const cumulativeMealDeductions = deductions
                    .filter((d) => d.employee_id === emp.employee_id && !d.is_void)
                    .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

                  const isChecked = selectedWorkerIds.has(emp.employee_id);

                  return (
                    <tr
                      key={emp.employee_id}
                      className={`hover:bg-[#13241f]/50 transition-colors ${
                        isChecked ? 'bg-lime-500/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectWorker(emp.employee_id)}
                          className="p-1 text-slate-400 hover:text-lime-400 cursor-pointer inline-flex items-center justify-center"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{emp.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{emp.employee_id}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-300">{emp.position}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] text-[#a3e635] bg-[#13241f] px-1.5 py-0.5 rounded border border-[#234338]">
                          {emp.site_id}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        ₱{emp.daily_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {currentMealDeduction > 0 ? (
                          <span className="text-lime-400">₱{currentMealDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-500">₱0.00</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-300">
                        ₱{cumulativeMealDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        {currentMealDeduction > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-400/15 text-lime-300 border border-lime-400/30">
                            MEAL LOGGED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400">
                            NO CHARGE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingWorkerDeduction({
                                employee: emp,
                                existingDeduction: currentWeekDed,
                                amount: currentMealDeduction,
                                notes: currentWeekDed?.notes || '',
                              })
                            }
                            className="px-2 py-1 bg-[#13241f] hover:bg-[#1a332a] border border-[#234338] hover:border-lime-400 text-xs text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                            title="Edit / Calculate Weekly Meal Charge"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setMealPassWorker(emp)}
                            className="px-2 py-1 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 text-lime-300 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate / Print Digital Canteen Stipend Pass"
                          >
                            <QrCode className="w-3 h-3 text-lime-400" />
                            <span>Stipend Pass</span>
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

      {/* Section 4: Site Canteen GCash Disbursements Ledger / Audit History */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-md">
        <div className="p-4 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Site Canteen GCash Disbursement History
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {siteCanteenTransactions.length} Completed Disbursements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0c1613] text-[10px] uppercase font-bold text-slate-400 border-b border-[#234338]">
              <tr>
                <th className="p-3">Reference No</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Concessionaire Payee</th>
                <th className="p-3">Mobile GCash</th>
                <th className="p-3">Purpose / Settlement Memo</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/60">
              {siteCanteenTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                    No GCash canteen disbursements recorded for this site yet.
                  </td>
                </tr>
              ) : (
                siteCanteenTransactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.reference_no}</span>
                        <button
                          onClick={() => handleCopy(tx.reference_no, tx.transaction_id)}
                          className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                          title="Copy Reference"
                        >
                          {copiedRef === tx.transaction_id ? (
                            <Check className="w-3 h-3 text-lime-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {tx.timestamp}
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      {tx.recipient_name}
                    </td>
                    <td className="p-3 font-mono text-sky-400">
                      {tx.recipient_mobile}
                    </td>
                    <td className="p-3 text-slate-400">
                      {tx.purpose}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {tx.receipt_url && (
                        <a
                          href={tx.receipt_url}
                          download={`GCash_Receipt_${tx.reference_no}.svg`}
                          className="p-1 rounded bg-[#13241f] hover:bg-[#1f3830] text-lime-400 hover:text-lime-300 inline-flex items-center gap-1 text-[10px] border border-[#234338]"
                          title="Download Official SVG Receipt"
                        >
                          <Download className="w-3 h-3" />
                          <span>Receipt</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Meal Deduction Edit Modal */}
      {editingWorkerDeduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-lime-400" />
                <h3 className="text-sm font-bold text-white">Record Weekly Canteen Stipend Collection</h3>
              </div>
              <button
                onClick={() => setEditingWorkerDeduction(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg text-xs space-y-1">
              <div className="font-bold text-white">{editingWorkerDeduction.employee.name}</div>
              <div className="text-[11px] text-slate-400">
                {editingWorkerDeduction.employee.position} &bull; {editingWorkerDeduction.employee.employee_id}
              </div>
              <div className="text-[11px] text-lime-400 font-mono">
                Cycle: {selectedWeek === 'ALL' ? '2026-W41' : selectedWeek}
              </div>
            </div>

            <form onSubmit={handleSaveWorkerMeal} className="space-y-3.5 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Weekly Canteen Stipend Presets
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { amount: 150, label: 'Partial Stipend' },
                    { amount: 350, label: 'Standard 5-Day' },
                    { amount: 420, label: '6-Day Shift' },
                    { amount: 500, label: 'Extended Shift' },
                    { amount: 600, label: 'High-Allowance' },
                    { amount: 700, label: 'Full 7-Day Pack' },
                  ].map((p) => (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() =>
                        setEditingWorkerDeduction({
                          ...editingWorkerDeduction,
                          amount: p.amount,
                          notes: `${p.label} weekly canteen stipend`,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                        editingWorkerDeduction.amount === p.amount
                          ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                          : 'bg-[#080f0d] border-[#234338] text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <div className="font-mono font-bold text-[11px]">₱{p.amount}</div>
                      <div className="text-[9px] text-slate-400 truncate">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Weekly Canteen Stipend Amount (₱ PHP) *
                  </label>
                  {editingWorkerDeduction.amount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingWorkerDeduction({
                          ...editingWorkerDeduction,
                          amount: 0,
                          notes: 'Canteen stipend cleared',
                        })
                      }
                      className="text-[10px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear (₱0.00)</span>
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
                    min="0"
                    required
                    autoFocus
                    value={editingWorkerDeduction.amount}
                    onChange={(e) =>
                      setEditingWorkerDeduction({
                        ...editingWorkerDeduction,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              {/* Collection Payment Method: GCash Only per Section 4 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Collection Channel *
                </label>
                <div className="p-2.5 bg-[#080f0d] border border-sky-500/40 rounded-lg flex items-center justify-between text-xs text-sky-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span>GCash Digital Stipend (Concessionaire QR Settlement)</span>
                  </div>
                  <span className="text-[10px] bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded border border-sky-500/30 font-mono">
                    GCASH ONLY
                  </span>
                </div>
              </div>

              {!isOnline && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[10px] text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Offline Mode: Will save locally to IndexedDB and automatically sync once connectivity is detected.</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Stipend Notes / Collection Memo
                </label>
                <input
                  type="text"
                  value={editingWorkerDeduction.notes || ''}
                  onChange={(e) =>
                    setEditingWorkerDeduction({
                      ...editingWorkerDeduction,
                      notes: e.target.value,
                    })
                  }
                  placeholder="e.g. Standard weekly canteen stipend for site mess"
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="pt-2 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWorkerDeduction(null)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] cursor-pointer shadow-md"
                >
                  Save Stipend Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Worker Digital/Printable Canteen Meal Chit Pass Modal */}
      {mealPassWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] no-print">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-lime-400" />
                <h3 className="text-sm font-bold text-white">Worker Weekly Canteen Stipend Pass</h3>
              </div>
              <button
                onClick={() => setMealPassWorker(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Pass Card */}
            <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="text-center pb-3 border-b border-slate-300">
                <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  DE RUEDA CONSTRUCTION MANAGEMENT
                </div>
                <div className="text-sm font-black text-slate-950 uppercase mt-0.5">
                  OFFICIAL WEEKLY CANTEEN STIPEND PASS
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  Cycle: {selectedWeek === 'ALL' ? '2026-W41' : selectedWeek} &bull; {mealPassWorker.site_id}
                </div>
              </div>

              <div className="py-3 flex items-center gap-4 border-b border-slate-200">
                <div
                  className="shrink-0 p-1 bg-white border border-slate-300 rounded-lg shadow-xs"
                  dangerouslySetInnerHTML={{
                    __html: generateSvgQRCode(
                      JSON.stringify({
                        type: 'CANTEEN_STIPEND_PASS',
                        employee_id: mealPassWorker.employee_id,
                        week_key: selectedWeek,
                        site_id: mealPassWorker.site_id,
                        name: mealPassWorker.name,
                      }),
                      95
                    ),
                  }}
                />

                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-sm text-slate-950">{mealPassWorker.name}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold">{mealPassWorker.position}</div>
                  <div className="font-mono text-[10px] text-slate-600">{mealPassWorker.employee_id}</div>
                  <div className="text-[10px] text-slate-500">
                    Daily Rate: ₱{mealPassWorker.daily_rate.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Meal Quota Info */}
              {(() => {
                const ded = deductions.find(
                  (d) =>
                    d.employee_id === mealPassWorker.employee_id &&
                    (selectedWeek === 'ALL' || d.week_key === selectedWeek) &&
                    !d.is_void
                );
                const mealVal = Number(ded?.canteen || 0);

                return (
                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        Weekly Canteen Stipend Collected:
                      </span>
                      <span className="font-mono font-black text-sm text-slate-950">
                        ₱{mealVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-500 leading-tight text-center">
                      Official weekly canteen stipend verification voucher. Accredited for site concessionaire settlement.
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                      <span>CONCESSIONAIRE: {selectedSite?.canteen_vendor_name || 'SITE CANTEEN'}</span>
                      <span>AUDIT COMPLIANT</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setMealPassWorker(null)}
                className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Meal Allocation Modal */}
      {isBatchMealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Batch Apply Weekly Canteen Stipend Collection</h3>
                  <p className="text-[10px] text-slate-400">
                    Quickly assign weekly canteen stipend deductions across active workers for site concessionaire payout
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchMealModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Summary */}
            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Target Site: </span>
                <strong className="text-white font-mono">{selectedSite ? selectedSite.code : 'ALL SITES'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Cycle: </span>
                <strong className="text-sky-300 font-mono">{selectedWeek}</strong>
              </div>
            </div>

            <form onSubmit={handleApplyBatchMeals} className="space-y-4 text-xs">
              {/* Standard Stipend Package Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                  Standard Weekly Stipend Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { amount: 350, label: '5-Day (₱70/day)' },
                    { amount: 420, label: '6-Day (₱70/day)' },
                    { amount: 500, label: '5-Day Extended' },
                    { amount: 700, label: '7-Day (₱100/day)' },
                  ].map((preset) => (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => setBatchMealAmount(preset.amount)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        batchMealAmount === preset.amount
                          ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold shadow-xs'
                          : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">₱{preset.amount}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stipend Calculator */}
              <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase">
                  <span>Weekly Stipend Multiplier</span>
                  <span className="text-lime-400 font-mono text-[10px]">Instant Auto-Fill</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-1">Shift Days (₱70/day):</span>
                  {[1, 2, 3, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBatchMealAmount(days * 70)}
                      className="px-2 py-1 rounded bg-[#080f0d] border border-[#234338] hover:border-lime-400 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
                      title={`${days} days stipend @ ₱70`}
                    >
                      {days}d (₱{days * 70})
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Stipend Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Or Custom Weekly Stipend Amount (₱ PHP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={batchMealAmount}
                    onChange={(e) => setBatchMealAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              {/* Target Population Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                  Apply To Which Workers?
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 bg-[#080f0d] border border-[#234338] rounded-lg cursor-pointer hover:border-slate-500">
                    <input
                      type="radio"
                      name="batchTarget"
                      checked={batchTargetGroup === 'all'}
                      onChange={() => setBatchTargetGroup('all')}
                      className="text-lime-400"
                    />
                    <span className="text-slate-200">
                      All Active Workers on this Site (<strong>{baseSiteWorkers.length} workers</strong>)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-[#080f0d] border border-[#234338] rounded-lg cursor-pointer hover:border-slate-500">
                    <input
                      type="radio"
                      name="batchTarget"
                      checked={batchTargetGroup === 'zero_only'}
                      onChange={() => setBatchTargetGroup('zero_only')}
                      className="text-lime-400"
                    />
                    <span className="text-slate-200">
                      Only Workers with Zero Stipend Currently (<strong>{workersWithoutMealsCount} workers</strong>)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-[#080f0d] border border-[#234338] rounded-lg cursor-pointer hover:border-slate-500">
                    <input
                      type="radio"
                      name="batchTarget"
                      checked={batchTargetGroup === 'selected'}
                      onChange={() => setBatchTargetGroup('selected')}
                      className="text-lime-400"
                    />
                    <span className="text-slate-200">
                      Only Checked / Selected Workers (<strong>{selectedWorkerIds.size} workers</strong>)
                    </span>
                  </label>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Batch Stipend Memo
                </label>
                <input
                  type="text"
                  value={batchMemo}
                  onChange={(e) => setBatchMemo(e.target.value)}
                  placeholder="e.g. Standard weekly canteen stipend for site mess"
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Confirmation Preview */}
              <div className="p-2.5 bg-[#080f0d] border border-lime-500/30 rounded-lg text-[11px] text-lime-300 flex items-center justify-between">
                <span>Total Expected Collection:</span>
                <span className="font-mono font-bold text-sm text-white">
                  ₱
                  {(
                    batchMealAmount *
                    (batchTargetGroup === 'all'
                      ? baseSiteWorkers.length
                      : batchTargetGroup === 'zero_only'
                      ? workersWithoutMealsCount
                      : selectedWorkerIds.size)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchMealModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] cursor-pointer shadow-md"
                >
                  Confirm &amp; Apply Batch Stipends
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Physical Concessionaire Billing Voucher Modal */}
      {isPrintSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl p-4 sm:p-6 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Controls Header (hidden during physical print) */}
            <div className="flex items-center justify-between pb-4 border-b border-[#234338] no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Printable Canteen Stipend Collection &amp; Signoff Sheet
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official weekly canteen stipend collection voucher and physical signature sheet for concessionaire payout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#13241f] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper View */}
            <div className="flex-1 overflow-y-auto mt-4 p-6 sm:p-8 bg-white text-slate-900 rounded-xl shadow-inner border border-slate-300 print:border-none print:shadow-none print:p-0">
              {/* Company & Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <div className="text-[11px] font-black tracking-widest uppercase text-emerald-800">
                  DE RUEDA CONSTRUCTION MANAGEMENT SYSTEM
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 uppercase tracking-tight">
                  WEEKLY CANTEEN STIPEND COLLECTION &amp; DISBURSEMENT SHEET
                </h1>
                <div className="text-xs text-slate-600 mt-1">
                  Central Luzon Operations &bull; Site Concessionaire Settlement Ledger
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
                <div>
                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Project Site:</span>{' '}
                    <strong className="text-slate-950 font-bold">
                      {selectedSite ? `${selectedSite.code} - ${selectedSite.name}` : 'All Construction Sites'}
                    </strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Location:</span>{' '}
                    <span className="text-slate-700">{selectedSite?.location || 'Central Luzon'}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Cycle Week:</span>{' '}
                    <strong className="text-emerald-800 font-mono font-bold">{selectedWeek}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Canteen Concessionaire:</span>{' '}
                    <strong className="text-slate-950 font-bold">
                      {selectedSite?.canteen_vendor_name || 'Site Mess Operator'}
                    </strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">GCash Mobile:</span>{' '}
                    <span className="font-mono font-bold text-sky-700">
                      {selectedSite?.canteen_gcash_number || '09171234567'}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Contact Person:</span>{' '}
                    <span className="text-slate-700">{selectedSite?.canteen_contact_person || 'Canteen Manager'}</span>
                  </div>
                </div>
              </div>

              {/* Workers Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                      <th className="p-2 border-r border-slate-300">Employee ID</th>
                      <th className="p-2 border-r border-slate-300">Worker Name</th>
                      <th className="p-2 border-r border-slate-300">Position / Trade</th>
                      <th className="p-2 border-r border-slate-300 text-right">Deduction (₱)</th>
                      <th className="p-2 text-center w-40">Worker Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {siteWorkers.map((emp, index) => {
                      const d = deductions.find(
                        (x) =>
                          x.employee_id === emp.employee_id &&
                          (selectedWeek === 'ALL' || x.week_key === selectedWeek) &&
                          !x.is_void
                      );
                      const amount = d?.canteen || 0;

                      return (
                        <tr key={emp.employee_id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-500 text-[10px]">
                            {index + 1}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono text-[10px] text-slate-700">
                            {emp.employee_id}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                            {emp.name}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-slate-600 text-[11px]">
                            {emp.position}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-slate-950">
                            ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-center border-b border-slate-200">
                            <div className="w-full border-b border-dashed border-slate-400 h-6"></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider text-slate-700">
                        Total Workers Served: {siteWorkers.length} &bull; Total Billed Amount:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-emerald-900 border-r border-slate-300">
                        ₱{siteTotalCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-center text-[10px] text-slate-500">
                        OFFICIAL TALLY
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Settlement Summary Statement */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Stipends Collected</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    ₱{siteTotalCanteenDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-semibold">Settled via GCash</div>
                  <div className="font-mono font-bold text-emerald-800 mt-0.5">
                    ₱{siteTotalCanteenPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-semibold">Outstanding Payable</div>
                  <div className="font-mono font-black text-lime-900 mt-0.5">
                    ₱{siteOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-slate-400"></div>
                  <div className="mt-1.5 font-bold text-slate-900">
                    {selectedSite?.canteen_contact_person || 'Canteen Concessionaire'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Prepared &amp; Billed By</div>
                </div>

                <div>
                  <div className="h-10 border-b border-slate-400"></div>
                  <div className="mt-1.5 font-bold text-slate-900">Site Timekeeper / HR Officer</div>
                  <div className="text-[10px] text-slate-500 uppercase">Verified &amp; Reconciled By</div>
                </div>

                <div>
                  <div className="h-10 border-b border-slate-400"></div>
                  <div className="mt-1.5 font-bold text-slate-900">
                    {selectedSite?.supervisor || 'Project Engineer / Superintendent'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Approved for GCash Payout</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canteen GCash Payout Modal Integration */}
      {selectedSite && (
        <CanteenGcashPayoutModal
          isOpen={isCanteenPayoutModalOpen}
          onClose={() => setIsCanteenPayoutModalOpen(false)}
          site={selectedSite}
          weekKey={selectedWeek}
          onSuccess={(ref) => {
            setIsCanteenPayoutModalOpen(false);
            setNotificationMsg(`Canteen payout successfully disbursed via GCash for ${selectedSite.name}. Ref: ${ref}`);
            setTimeout(() => setNotificationMsg(null), 6000);
          }}
        />
      )}



      {/* Canteen Offline Queue Drawer / Modal */}
      <CanteenOfflineQueueModal
        isOpen={isOfflineQueueModalOpen}
        onClose={() => setIsOfflineQueueModalOpen(false)}
      />

      {/* Canteen QR Badge Camera Scanner Modal */}
      <TurnstileQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        targetSiteId={selectedSiteId}
        customTitle="Scan Worker QR Badge - Weekly Canteen Stipend"
        customDescription="Point device camera at worker badge to instantly load their weekly canteen stipend record"
        onScanEmployee={(scannedEmp) => {
          setIsQrScannerOpen(false);
          const currentWeekDed = deductions.find(
            (d) =>
              d.employee_id === scannedEmp.employee_id &&
              (selectedWeek === 'ALL' || d.week_key === selectedWeek) &&
              !d.is_void
          );
          setEditingWorkerDeduction({
            employee: scannedEmp,
            existingDeduction: currentWeekDed,
            amount: currentWeekDed?.canteen || 350,
            notes: currentWeekDed?.notes || `Weekly canteen stipend (${collectionPaymentMethod})`,
          });
          setNotificationMsg(`Identified ${scannedEmp.name} (${scannedEmp.employee_id}). Ready to record weekly canteen stipend.`);
          setTimeout(() => setNotificationMsg(null), 5000);
        }}
      />

      {/* Universal Gemini Copilot for Attendance Check, Actions & File Analysis */}
      <CanteenGeminiCopilot />
    </div>
  );
};
