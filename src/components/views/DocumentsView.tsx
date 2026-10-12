import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleDrivePlan, DriveSubscription } from '../../types';
import {
  FolderGit2,
  Plus,
  ExternalLink,
  FileText,
  X,
  FolderOpen,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Clock,
  Banknote,
  Package,
  Building,
  Receipt,
  Inbox,
  Sparkles,
  Bot,
  Send,
  Loader2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Lock,
  Crown,
  Mail,
  KeyRound,
} from 'lucide-react';

interface OrganicFolder {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultModule: string;
}

const ORGANIC_FOLDERS: OrganicFolder[] = [
  {
    id: 'f1',
    code: '01_Executive_and_Compliance',
    name: '01. Executive & Compliance',
    description: 'Corporate safety manuals, DOLE registrations, ISO protocols, municipal permits',
    icon: ShieldCheck,
    color: '#a3e635',
    defaultModule: 'Company',
  },
  {
    id: 'f2',
    code: '02_Workforce_and_HR',
    name: '02. Workforce & HR Files',
    description: '201 worker profiles, SSS & PhilHealth registrations, printable ID cards, trade certs',
    icon: Users,
    color: '#10b981',
    defaultModule: 'Employees',
  },
  {
    id: 'f3',
    code: '03_Timekeeping_and_DTR',
    name: '03. Timekeeping & Weekly DTR',
    description: 'Weekly DTR archives, daily turnstile clockings, attendance adjustment audit slips',
    icon: Clock,
    color: '#34d399',
    defaultModule: 'Timekeeping',
  },
  {
    id: 'f4',
    code: '04_Payroll_and_Disbursements',
    name: '04. Payroll & Disbursements',
    description: 'Signed consolidated payrolls, 6-per-page worker payslips, GCash receipts, cash vouchers',
    icon: Banknote,
    color: '#60a5fa',
    defaultModule: 'Payroll',
  },
  {
    id: 'f5',
    code: '05_Materials_and_Procurement',
    name: '05. Materials & Delivery Receipts',
    description: 'SteelAsia rebar mill test certs, Holcim delivery receipts (DR), concrete test logs',
    icon: Package,
    color: '#f59e0b',
    defaultModule: 'Materials',
  },
  {
    id: 'f6',
    code: '06_Project_Sites_and_Blueprints',
    name: '06. Sites & Blueprints',
    description: 'Site 001 Warehouse A, Site 002 Subic, Site 003 Balanga CAD blueprints & civil permits',
    icon: Building,
    color: '#ec4899',
    defaultModule: 'Sites',
  },
  {
    id: 'f7',
    code: '07_Expenses_and_Equipment',
    name: '07. Equipment & Expenses',
    description: 'Heavy equipment 25-ton crane rentals, diesel fuel receipts, electric coop utility bills',
    icon: Receipt,
    color: '#8b5cf6',
    defaultModule: 'Expenses',
  },
  {
    id: 'f8',
    code: '08_Public_Intake_and_Tenders',
    name: '08. Intake Leads & Tenders',
    description: 'Client commercial tenders, subcontracting proposals, field trades hiring submissions',
    icon: Inbox,
    color: '#14b8a6',
    defaultModule: 'Intake',
  },
];

interface DrivePlanOption {
  plan: GoogleDrivePlan;
  name: string;
  storage: string;
  description: string;
  geminiModel: string;
  badge: string;
}

const DRIVE_PLAN_OPTIONS: DrivePlanOption[] = [
  {
    plan: 'google_workspace_starter',
    name: 'Google Workspace Business Starter',
    storage: '30 GB Pooled / User',
    description: 'Essential cloud drive storage with Gemini 3.8 Flash core file indexing and classification.',
    geminiModel: 'Gemini 3.8 Flash Core',
    badge: 'Standard Starter',
  },
  {
    plan: 'google_workspace_standard',
    name: 'Google Workspace Business Standard',
    storage: '2 TB Pooled / User',
    description: 'Full enterprise drive capacity with Gemini 3.8 Flash Copilot, blueprint analysis, and DOLE audit checks.',
    geminiModel: 'Gemini 3.8 Flash Copilot',
    badge: 'Most Popular',
  },
  {
    plan: 'google_workspace_enterprise',
    name: 'Google Workspace Enterprise Plus',
    storage: '5 TB+ Pooled / User',
    description: 'Unlimited scalable vault storage with high-speed Gemini AI document processing and forensic compliance.',
    geminiModel: 'Gemini 3.8 Flash Advanced',
    badge: 'Enterprise Grade',
  },
  {
    plan: 'google_one_business',
    name: 'Google One Organization Storage',
    storage: '100 GB – 2 TB Shared',
    description: 'Direct organizational Google account storage with attached Gemini Assistant and organic 8-folder synchronization.',
    geminiModel: 'Gemini 3.8 Flash',
    badge: 'Direct Google One',
  },
  {
    plan: 'custom_gdrive',
    name: 'Custom Team Drive / Shared Vault',
    storage: 'Custom Enterprise Quota',
    description: 'Company-administered Google Shared Drive with dedicated Gemini AI indexing across construction project files.',
    geminiModel: 'Gemini 3.8 Flash Enterprise',
    badge: 'Custom Cloud',
  },
];

export const DocumentsView: React.FC = () => {
  const {
    documents,
    settings,
    updateSettings,
    addDocument,
    addAuditLog,
    sites,
    currentUser,
    loginDirectory,
  } = useApp();

  const isCeo = currentUser?.access_point === 'ceo';

  const [selectedFolderCode, setSelectedFolderCode] = useState<string>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Gemini Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  // Gemini Auto-classify state
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationTip, setClassificationTip] = useState<string | null>(null);

  // Gemini Audit state
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Drive subscription
  const driveSub = settings.drive_subscription;
  const isRegistered = Boolean(driveSub?.is_registered && settings.master_drive_link);
  const masterDriveUrl = settings.master_drive_link;

  // Registration Form
  const [regForm, setRegForm] = useState<{
    plan: GoogleDrivePlan;
    account_email: string;
    drive_folder_url: string;
  }>({
    plan: (driveSub?.plan && driveSub.plan !== 'unregistered') ? driveSub.plan : 'google_workspace_standard',
    account_email: driveSub?.account_email || 'emeritaderueda@gmail.com',
    drive_folder_url: settings.master_drive_link || 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy?usp=sharing',
  });

  // Add Document Form
  const [form, setForm] = useState({
    file_name: '',
    folder_code: '01_Executive_and_Compliance',
    module: 'Company',
    record_id: 'GLOBAL',
    file_type: 'PDF',
    drive_url: '',
    notes: '',
  });

  const handleCopyMasterLink = () => {
    if (!masterDriveUrl) return;
    navigator.clipboard.writeText(masterDriveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRegisterSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPlan = DRIVE_PLAN_OPTIONS.find((p) => p.plan === regForm.plan) || DRIVE_PLAN_OPTIONS[1];

    const newSub: DriveSubscription = {
      is_registered: true,
      plan: chosenPlan.plan,
      plan_name: chosenPlan.name,
      storage_quota: chosenPlan.storage,
      account_email: regForm.account_email.trim(),
      drive_folder_url: regForm.drive_folder_url.trim(),
      registered_at: new Date().toISOString(),
      gemini_enabled: true,
      gemini_model: chosenPlan.geminiModel,
      gemini_features: [
        'Gemini 3.8 Flash Organic 8-Folder Auto-Classifier',
        'DOLE D.O. 13 Safety & OSHC Compliance Advisor',
        'Blueprint, Mill Cert & Delivery DR Intelligence',
        'Executive Project Documentation Audit',
      ],
    };

    updateSettings({
      master_drive_link: regForm.drive_folder_url.trim(),
      drive_subscription: newSub,
    });

    addAuditLog(
      'REGISTER_GDRIVE_SUBSCRIPTION',
      'GOOGLE_DRIVE',
      chosenPlan.plan,
      `Registered ${chosenPlan.name} with Gemini AI enabled for ${regForm.account_email}`
    );

    setIsRegisterModalOpen(false);
  };

  const handleDisconnectDrive = () => {
    updateSettings({
      master_drive_link: '',
      drive_subscription: {
        is_registered: false,
        plan: 'unregistered',
        plan_name: 'Self-Service Registration Required',
        storage_quota: 'Not registered',
        account_email: '',
        drive_folder_url: '',
        gemini_enabled: false,
        gemini_model: 'gemini-3.8-flash',
        gemini_features: [],
      },
    });
    addAuditLog('DISCONNECT_GDRIVE', 'GOOGLE_DRIVE', 'DISCONNECTED', 'Cleared drive link');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFolder = ORGANIC_FOLDERS.find((f) => f.code === form.folder_code);
    addDocument({
      file_name: form.file_name.trim(),
      module: targetFolder ? targetFolder.defaultModule : form.module,
      record_id: form.record_id.trim() || 'GLOBAL',
      file_type: form.file_type,
      drive_url: form.drive_url.trim() || masterDriveUrl,
      notes: form.notes.trim() ? `[${form.folder_code}] ${form.notes.trim()}` : `[${form.folder_code}]`,
      uploaded_by: 'admin 1',
    });
    setIsAddOpen(false);
    setForm({
      file_name: '',
      folder_code: '01_Executive_and_Compliance',
      module: 'Company',
      record_id: 'GLOBAL',
      file_type: 'PDF',
      drive_url: '',
      notes: '',
    });
    setClassificationTip(null);
  };

  // Gemini Auto-classify for new file
  const handleAutoClassify = async () => {
    if (!form.file_name.trim()) return;
    setIsClassifying(true);
    setClassificationTip(null);

    try {
      const res = await fetch('/api/gemini/classify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: form.file_name,
          notes: form.notes,
          file_type: form.file_type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.folder_code) {
          setForm((prev) => ({
            ...prev,
            folder_code: data.folder_code,
            module: data.default_module || prev.module,
            record_id: data.suggested_record_id || prev.record_id,
          }));
          setClassificationTip(
            `Gemini Classified to "${data.folder_name}". Tip: ${data.compliance_tip || data.summary}`
          );
        }
      }
    } catch (err) {
      console.warn('Gemini classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Ask Gemini Assistant
  const handleAskGemini = async (promptText?: string) => {
    const textToAsk = promptText || aiQuestion;
    if (!textToAsk.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToAsk,
          context: {
            drive_plan: driveSub?.plan_name || 'Unregistered',
            documents_count: documents.length,
            sites_count: sites.length,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.reply);
      } else {
        setAiResponse('Unable to fetch AI response at this moment. Please check server status.');
      }
    } catch (err) {
      console.error('Gemini query error:', err);
      setAiResponse('Error contacting Gemini service. Please verify your connection.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run Gemini Drive Vault Audit
  const handleRunAudit = async () => {
    setIsAuditModalOpen(true);
    setIsAuditLoading(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/gemini/audit-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentsCount: documents.length,
          registeredPlan: driveSub?.plan_name || 'Google Workspace',
          siteNames: sites.map((s) => s.name),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      }
    } catch (err) {
      console.error('Audit run error:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    // Confidential documents are viewed ONLY by CEOs account
    if (doc.is_ceo_only && !isCeo) return false;

    if (selectedFolderCode === 'ALL') return true;
    if (selectedFolderCode === 'CEO_LOGIN_DIR') return Boolean(doc.is_ceo_only);

    const folder = ORGANIC_FOLDERS.find((f) => f.code === selectedFolderCode);
    if (!folder) return true;
    return (
      (doc.notes && doc.notes.includes(selectedFolderCode)) ||
      doc.module.toLowerCase() === folder.defaultModule.toLowerCase()
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Documents & Google Drive Vault</span>
            {isRegistered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#a3e635] border border-[#10b981]/40 font-bold">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Gemini 3.8 Flash Active
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Standard 8-Folder Organic Architecture</span>
            <span>·</span>
            <span>Self-Registered Cloud Workspace</span>
            <span>·</span>
            <span className="text-[#a3e635] font-semibold">Gemini AI Integrated</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRegistered && (
            <button
              onClick={handleRunAudit}
              className="px-3 py-2 bg-[#13241f] border border-[#a3e635]/40 text-[#a3e635] hover:bg-[#a3e635]/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-4 h-4" />
              Gemini Vault Audit
            </button>
          )}

          <button
            onClick={() => {
              setRegForm({
                plan: (driveSub?.plan && driveSub.plan !== 'unregistered') ? driveSub.plan : 'google_workspace_standard',
                account_email: driveSub?.account_email || settings.contact_email || '',
                drive_folder_url: settings.master_drive_link || '',
              });
              setIsRegisterModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white hover:border-[#10b981] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HardDrive className="w-4 h-4 text-[#a3e635]" />
            {isRegistered ? 'Manage Drive Subscription' : 'Register Google Drive'}
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Link New Document
          </button>
        </div>
      </div>

      {/* Main Drive Banner: Self-Registration State vs Registered State */}
      {!isRegistered ? (
        /* Unregistered State: Prompt user to register their own subscription */
        <div className="bg-linear-to-r from-[#13241f] via-[#0e1a16] to-[#13241f] border-2 border-dashed border-[#234338] hover:border-[#10b981] rounded-xl p-6 transition-colors shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-[#a3e635] bg-[#0e1a16] border border-[#234338] px-2.5 py-1 rounded-full">
                <HardDrive className="w-3.5 h-3.5" />
                <span>SELF-SERVICE GOOGLE DRIVE REGISTRATION CENTER</span>
              </div>
              <h2 className="text-lg font-black text-white">
                Register Your Google Drive Subscription & Unlock Gemini AI
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your organization's Google Drive workspace (Google Workspace Starter, Standard, Enterprise, or Google One). When you register, <strong>Gemini 3.8 Flash</strong> is automatically added to organize your 8 organic project folders, auto-classify worker files and delivery receipts, and provide instant DOLE safety compliance checks.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-[#a3e635]">
                  <Check className="w-3.5 h-3.5" /> Organic 8-Folder Filing
                </span>
                <span className="flex items-center gap-1 text-[#a3e635]">
                  <Check className="w-3.5 h-3.5" /> Gemini 3.8 Flash Document Classifier
                </span>
                <span className="flex items-center gap-1 text-[#a3e635]">
                  <Check className="w-3.5 h-3.5" /> DOLE D.O. 13 Safety Copilot
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-5 py-3 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Register Google Drive Subscription
              </button>
              <div className="text-[10px] text-center text-slate-500 font-mono">
                No fixed lock-in &bull; Fully customizable per company
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Registered State: Active Drive Subscription with Gemini AI Included */
        <div className="bg-linear-to-r from-[#10b981]/15 via-[#13241f] to-[#a3e635]/10 border-2 border-[#10b981] rounded-xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#a3e635] bg-[#0e1a16] border border-[#234338] px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>ACTIVE DRIVE SUBSCRIPTION</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-300 bg-[#0e1a16] border border-[#10b981]/40 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#a3e635] animate-pulse" />
                  <span>GEMINI 3.8 FLASH CONNECTED</span>
                </div>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {driveSub?.plan_name || 'Google Workspace Business Standard'}
                </h2>
                <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-3">
                  <span>Quota: <strong className="text-white font-mono">{driveSub?.storage_quota || '2 TB Pooled'}</strong></span>
                  <span>&bull;</span>
                  <span>Registered Account: <strong className="text-[#a3e635] font-mono">{driveSub?.account_email || settings.contact_email}</strong></span>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-mono break-all max-w-2xl bg-[#0e1a16]/80 p-2 rounded-lg border border-[#234338]">
                Vault URL: {masterDriveUrl}
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0">
              <a
                href={masterDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                Open Google Drive Vault <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleCopyMasterLink}
                className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Vault Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDisconnectDrive}
                className="text-[11px] text-slate-500 hover:text-red-400 text-center transition-colors pt-1"
              >
                Disconnect Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Gemini AI Drive & Construction Copilot Hub */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#10b981] to-[#a3e635] flex items-center justify-center text-[#080f0d]">
              <Sparkles className="w-4 h-4 font-black" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Gemini AI Construction & Drive Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#10b981]/20 text-[#a3e635] rounded font-semibold">
                  gemini-3.8-flash
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                DOLE D.O. 13 Safety &bull; Organic Folder Classifier &bull; Blueprint & DR Intelligence
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-[#0e1a16] border border-[#234338]"
          >
            {isAiPanelOpen ? 'Collapse Copilot' : 'Expand Copilot'}
          </button>
        </div>

        {isAiPanelOpen && (
          <div className="p-4 space-y-4">
            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Audit mandatory DOLE D.O. 13 requirements for Site 001',
                'What are statutory retention requirements for weekly payroll and DTR?',
                'How do we file SteelAsia rebar mill test certificates and DRs?',
                'Check if 25-ton crane rentals need special safety inspection permits',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiQuestion(pill);
                    handleAskGemini(pill);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-slate-300 hover:text-[#a3e635] text-[11px] transition-colors"
                >
                  &bull; {pill}
                </button>
              ))}
            </div>

            {/* Input query bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskGemini()}
                placeholder="Ask Gemini about project blueprints, delivery receipts, DOLE compliance, or organic folders..."
                className="flex-1 bg-[#13241f] border border-[#234338] focus:border-[#a3e635] rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
              <button
                onClick={() => handleAskGemini()}
                disabled={isAiLoading || !aiQuestion.trim()}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] disabled:opacity-50 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask Gemini</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Response Box */}
            {aiResponse && (
              <div className="bg-[#13241f] border border-[#234338] rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#234338]/60">
                  <span className="text-[11px] font-bold text-[#a3e635] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini 3.8 Flash Intelligence Output
                  </span>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-slate-200 leading-relaxed whitespace-pre-line text-[11px]">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CEO-Only Confidential Identity Vault & Login Directory */}
      {isCeo ? (
        <div className="bg-[#0e1a16] border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    CEO Confidential: Login Directory & GDrive Vault
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    CEO CLEARANCE ONLY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Universal authentication directory: Every newly detected identity is logged and backed up to Google Drive. Viewable exclusively by the CEO's account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold text-[#a3e635] bg-[#13241f] border border-[#234338] px-2.5 py-1 rounded-lg">
                {loginDirectory.length} Authenticated Identities
              </span>
            </div>
          </div>

          {/* Identity Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-2.5">Identity Email</th>
                  <th className="p-2.5">Access Point</th>
                  <th className="p-2.5">First Detected</th>
                  <th className="p-2.5">Last Login</th>
                  <th className="p-2.5">Sessions</th>
                  <th className="p-2.5">Google Drive Vault File</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#234338]/40">
                {loginDirectory.map((record) => (
                  <tr key={record.id} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="p-2.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{record.email}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                        {record.device_info}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#13241f] border border-[#234338] text-[#a3e635]">
                        {record.access_point}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 font-mono text-[11px]">{record.first_login_at}</td>
                    <td className="p-2.5 text-slate-300 font-mono text-[11px]">{record.last_login_at}</td>
                    <td className="p-2.5 font-bold text-white font-mono">{record.login_count}x</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px]">{record.gdrive_folder}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {record.gdrive_file_id}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <a
                        href={record.gdrive_file_url || masterDriveUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#13241f] hover:bg-[#234338] border border-[#234338] hover:border-[#10b981] text-[#a3e635] rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                        title="Open identity backup in Google Drive"
                      >
                        <span>GDrive File</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Login Directory & Google Drive Vault: <strong>Restricted to CEO Account Only</strong></span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#13241f] border border-[#234338] px-2 py-0.5 rounded text-slate-400">
            Current: {currentUser ? currentUser.access_point.toUpperCase() : 'GUEST'}
          </span>
        </div>
      )}

      {/* Organic Folder Hierarchy Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#a3e635]" />
            <span>Organic Folder Directory (8 Standard Categories)</span>
          </div>
          <button
            onClick={() => setSelectedFolderCode('ALL')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              selectedFolderCode === 'ALL'
                ? 'bg-[#a3e635] text-[#080f0d]'
                : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
            }`}
          >
            Show All Folders
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {ORGANIC_FOLDERS.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFolderCode === f.code;
            const fileCount = documents.filter(
              (d) =>
                (d.notes && d.notes.includes(f.code)) ||
                d.module.toLowerCase() === f.defaultModule.toLowerCase()
            ).length;

            return (
              <div
                key={f.id}
                onClick={() => setSelectedFolderCode(isSelected ? 'ALL' : f.code)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#13241f] border-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.15)]'
                    : 'bg-[#0e1a16] border-[#234338] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${f.color}15`,
                        borderColor: `${f.color}40`,
                        color: f.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {fileCount} files
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-white leading-snug">{f.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#234338] flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                    {f.code}
                  </span>
                  {masterDriveUrl && (
                    <a
                      href={masterDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1"
                    >
                      Drive <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered Document Index Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#a3e635]" />
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {selectedFolderCode === 'ALL'
                ? 'All Registered Vault Documents'
                : `Filtered Folder: ${selectedFolderCode}`}
            </div>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {filteredDocuments.length} files indexed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">File Name</th>
                <th className="p-3">Organic Folder / Module</th>
                <th className="p-3">Record Key</th>
                <th className="p-3">Type</th>
                <th className="p-3">Destination Link</th>
                <th className="p-3">Recorded By</th>
                <th className="p-3">Classification Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No documents currently linked for this folder filter.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((d) => (
                  <tr key={d.document_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{d.file_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-mono bg-[#13241f] border border-[#234338] px-2 py-0.5 rounded text-slate-300">
                        {d.module}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#a3e635]">{d.record_id}</td>
                    <td className="p-3 uppercase text-[10px] font-bold text-slate-400">{d.file_type}</td>
                    <td className="p-3">
                      <a
                        href={d.drive_url || masterDriveUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        Open in Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{d.uploaded_by}</td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">{d.notes || 'None'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Drive Subscription Self-Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HardDrive className="w-5 h-5 text-[#a3e635]" />
                <span>Register Google Drive Subscription & Activate Gemini AI</span>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubscription} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Choose your organization's Google Drive plan. Each registered subscription automatically integrates <strong>Gemini 3.8 Flash</strong> for construction document indexing, safety checks, and organic folder management.
              </p>

              {/* Plan Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2 uppercase tracking-wider text-[11px]">
                  1. Select Google Drive Subscription Tier *
                </label>
                <div className="space-y-2">
                  {DRIVE_PLAN_OPTIONS.map((opt) => (
                    <label
                      key={opt.plan}
                      className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                        regForm.plan === opt.plan
                          ? 'bg-[#13241f] border-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.15)]'
                          : 'bg-[#0e1a16] border-[#234338] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="drive_plan"
                          checked={regForm.plan === opt.plan}
                          onChange={() => setRegForm({ ...regForm, plan: opt.plan })}
                          className="mt-0.5 accent-[#a3e635]"
                        />
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{opt.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                              {opt.storage}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{opt.description}</div>
                          <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#a3e635]" />
                            <span>Includes: {opt.geminiModel}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 bg-[#0e1a16] rounded border border-[#234338] shrink-0">
                        {opt.badge}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Email */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  2. Organization Google Account Email *
                </label>
                <input
                  type="email"
                  required
                  value={regForm.account_email}
                  onChange={(e) => setRegForm({ ...regForm, account_email: e.target.value })}
                  placeholder="e.g. operations@deruedaconstruction.com"
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              {/* Drive Folder Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  3. Your Master Google Drive Folder Share Link *
                </label>
                <input
                  type="url"
                  required
                  value={regForm.drive_folder_url}
                  onChange={(e) => setRegForm({ ...regForm, drive_folder_url: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  This is the root Google Drive directory where your 8 organic folders (01 Executive to 08 Intake) will be synchronized.
                </div>
              </div>

              {/* Gemini Included Features Overview */}
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Gemini AI Features Automatically Activated on Registration:</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Gemini 3.8 Flash Document Classifier:</strong> 1-click categorizing to the 8 organic folders.</li>
                  <li><strong>Construction Copilot:</strong> DOLE D.O. 13, OSHC safety, and DPWH standards advisor.</li>
                  <li><strong>Vault Intelligence Audit:</strong> Periodic check for missing permits and signed payroll registers.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Save Subscription & Enable Gemini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link New Document Modal with Gemini Auto-Classifier */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#a3e635]" />
                Link File to Google Drive Vault
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Document Title / File Name *</label>
                  <button
                    type="button"
                    onClick={handleAutoClassify}
                    disabled={isClassifying || !form.file_name.trim()}
                    className="text-[11px] font-bold text-[#a3e635] hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isClassifying ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Classifying...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Classify with Gemini</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.file_name}
                  onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g. Holcim Delivery Receipt DR-11029 for Site 001.pdf"
                />
              </div>

              {classificationTip && (
                <div className="p-2.5 bg-[#10b981]/15 border border-[#10b981]/40 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#a3e635] shrink-0 mt-0.5" />
                  <span>{classificationTip}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Organic Drive Folder *</label>
                <select
                  value={form.folder_code}
                  onChange={(e) => setForm({ ...form, folder_code: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white font-semibold"
                >
                  {ORGANIC_FOLDERS.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Associated Record Key / ID</label>
                  <input
                    type="text"
                    value={form.record_id}
                    onChange={(e) => setForm({ ...form, record_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="e.g. SITE-001 or 2026-W41"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Format</label>
                  <select
                    value={form.file_type}
                    onChange={(e) => setForm({ ...form, file_type: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="XLSX">Excel (.xlsx)</option>
                    <option value="DOCX">Word (.docx)</option>
                    <option value="Folder">Drive Folder</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Google Drive Direct Link (Optional)</label>
                <input
                  type="url"
                  value={form.drive_url}
                  onChange={(e) => setForm({ ...form, drive_url: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder={masterDriveUrl || 'https://drive.google.com/file/d/...'}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classification Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="Description of contents, inspection approval notes..."
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
                  Save to Vault Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini Vault Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-5 h-5 text-[#a3e635]" />
                <span>Executive Gemini Vault Audit Report</span>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAuditLoading ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#a3e635] mx-auto" />
                <div className="text-xs text-white font-semibold">Gemini 3.8 Flash auditing 8 organic folders...</div>
                <div className="text-[11px] text-slate-400">Verifying DOLE compliance, blueprint logs, and signed payroll records.</div>
              </div>
            ) : auditResult ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-[#13241f] border border-[#234338] rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Compliance Score</div>
                    <div className="text-2xl font-black text-[#a3e635] font-mono">{auditResult.compliance_score || 96}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</div>
                    <div className="text-xs font-bold text-emerald-400">{auditResult.status}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-lg">
                  <div className="font-bold text-white mb-1">Executive Summary:</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{auditResult.audit_summary}</p>
                </div>

                {auditResult.key_findings && (
                  <div>
                    <div className="font-bold text-slate-300 mb-1 text-[11px]">Key Findings:</div>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px]">
                      {auditResult.key_findings.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {auditResult.action_items && (
                  <div>
                    <div className="font-bold text-amber-300 mb-1 text-[11px]">Recommended Actions:</div>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px]">
                      {auditResult.action_items.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-[#234338] flex justify-end">
                  <button
                    onClick={() => setIsAuditModalOpen(false)}
                    className="px-4 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
