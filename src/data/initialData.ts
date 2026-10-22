import {
  Employee,
  Site,
  AttendanceRecord,
  DtrWeek,
  DtrChange,
  DeductionRecord,
  PayrollRecord,
  MaterialRecord,
  ExpenseRecord,
  Conversation,
  MessageItem,
  DocumentItem,
  AuditLogItem,
  SystemSettings,
  PublicInquiry,
  PublicHiring,
  UserSession,
  LoginDirectoryRecord,
  EquipmentResource,
  InternalPurchaseOrder,
  WeeklyPayrollApprovalDoc,
  GCashTransactionRecord,
  QrScanLogItem,
  PaymentRecord,
} from '../types';
import {
  FIFTEEN_EMPLOYEES_PER_SITE,
  FIFTEEN_PAYROLLS_PER_SITE,
  FIFTEEN_PAYMENT_RECORDS_PER_SITE,
  FIFTEEN_ATTENDANCE_PER_SITE,
} from './fifteenEmployeesPerSite';

export const INITIAL_SETTINGS: SystemSettings = {
  company_name: 'De Rueda Construction',
  company_profile:
    'Premier General Contractor & Engineering Builder specializing in commercial, industrial, and infrastructure development across Central Luzon and Greater Manila.',
  company_address: 'Roman Superhighway, Mariveles, Bataan, Philippines 2105',
  contact_email: 'operations@deruedaconstruction.com',
  contact_phone: '+63 917 582 9104 / (047) 935-1288',
  master_drive_link: 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy?usp=sharing',
  drive_subscription: {
    is_registered: true,
    plan: 'google_workspace_standard',
    plan_name: 'Google Workspace Business Standard',
    storage_quota: '2 TB Pooled / User',
    account_email: 'emeritaderueda@gmail.com',
    drive_folder_url: 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy?usp=sharing',
    registered_at: '2026-10-06T08:00:00+08:00',
    gemini_enabled: true,
    gemini_model: 'gemini-3.8-flash',
    gemini_features: [
      'Gemini 3.8 Flash Organic 8-Folder Auto-Classifier',
      'DOLE D.O. 13 Safety & OSHC Compliance Advisor',
      'Blueprint & Materials Delivery Receipt Scanner',
      'Executive Project Documentation Intelligence Briefing',
    ],
  },
  anti_duplicate_minutes: 5,
  break_minutes: 90,
  work_hours_standard: 8,
  break_schedule: '10:00-10:15, 12:00-13:00, 15:00-15:15',
  sss_default_rate: 0.045,
  philhealth_default_rate: 0.025,
  week_start_day: 'Monday',
  week_end_day: 'Sunday',
  timezone: 'Asia/Manila',
  payroll_payment_methods: 'GCash, Cash',
};

export const INITIAL_SITES: Site[] = [];

// Pristine Clean ERP Architecture: Zero sample employees
export const INITIAL_EMPLOYEES: Employee[] = [];

// Optional sample template reference for testing/benchmarking
export const SAMPLE_EMPLOYEE_TEMPLATES: Employee[] = [];


export const INITIAL_DTR_WEEKS: DtrWeek[] = [];

// Verified turnstile biometric attendance logs for all 60 employees
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_QR_SCAN_LOGS: QrScanLogItem[] = [];


export const INITIAL_DEDUCTIONS: DeductionRecord[] = [];

// 15 employees per site with calculated salary awaiting release of payout
export const INITIAL_PAYROLL: PayrollRecord[] = [];

export const INITIAL_MATERIALS: MaterialRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_MESSAGES: MessageItem[] = [];

export const INITIAL_DOCUMENTS: DocumentItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    audit_id: 'AUDIT-INIT-001',
    actor: 'System Admin',
    action: 'FACTORY_START',
    entity: 'SYSTEM',
    entity_id: 'ROOT',
    after_value: 'Factory Default: Clean ERP instance ready for real operations.',
    timestamp: '2026-10-16T23:30:00+08:00',
  },
];

export const INITIAL_INQUIRIES: PublicInquiry[] = [];

export const INITIAL_HIRING: PublicHiring[] = [];

export const INITIAL_DTR_CHANGES: DtrChange[] = [];

export const INITIAL_USER: UserSession = {
  session_id: 'SESS-2026-EXEC-01',
  access_point: 'ceo',
  email: 'operations@deruedaconstruction.com',
  created_at: '2026-10-06T08:00:00+08:00',
  updated_at: '2026-10-06T08:00:00+08:00',
  expires_at: '2026-10-07T08:00:00+08:00',
  is_active: 1,
};

export const INITIAL_LOGIN_DIRECTORY: LoginDirectoryRecord[] = [
  {
    id: 'LDIR-000',
    email: 'emeritaderueda@gmail.com',
    access_point: 'ceo',
    first_login_at: '2026-10-06 08:00:00',
    last_login_at: '2026-10-06 12:36:57',
    login_count: 8,
    gdrive_file_id: 'DOC-GDRIVE-AUTH-CEO-EMERITA',
    gdrive_file_url: 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy?usp=sharing',
    gdrive_folder: '01_Executive_and_Compliance/Master_Vault',
    device_info: 'Executive Master Station - Emerita De Rueda Terminal',
    status: 'active',
    is_ceo_confidential: true,
  },
  {
    id: 'LDIR-001',
    email: 'operations@deruedaconstruction.com',
    access_point: 'ceo',
    first_login_at: '2026-10-06 08:00:00',
    last_login_at: '2026-10-06 12:36:57',
    login_count: 5,
    gdrive_file_id: 'DOC-GDRIVE-AUTH-CEO-01',
    gdrive_file_url: 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy?usp=sharing#identity-operations',
    gdrive_folder: '08_System_Audit_Logs/CEO_Vault/Login_Directory',
    device_info: 'Enterprise Workstation - Mariveles HQ',
    status: 'active',
    is_ceo_confidential: true,
  },
  {
    id: 'LDIR-002',
    email: 'admin1@deruedaconstruction.com',
    access_point: 'admin 1',
    first_login_at: '2026-10-06 08:30:00',
    last_login_at: '2026-10-06 11:20:10',
    login_count: 3,
    gdrive_file_id: 'DOC-GDRIVE-AUTH-ADM1-02',
    gdrive_file_url: 'https://drive.google.com/drive/folders/1DeRuedaConstruction-MasterProjectVault#identity-admin1',
    gdrive_folder: '08_System_Audit_Logs/CEO_Vault/Login_Directory',
    device_info: 'Field Tablet - Freeport Area Site',
    status: 'active',
    is_ceo_confidential: true,
  },
  {
    id: 'LDIR-003',
    email: 'admin2@deruedaconstruction.com',
    access_point: 'admin 2',
    first_login_at: '2026-10-06 09:00:00',
    last_login_at: '2026-10-06 10:45:00',
    login_count: 2,
    gdrive_file_id: 'DOC-GDRIVE-AUTH-ADM2-03',
    gdrive_file_url: 'https://drive.google.com/drive/folders/1DeRuedaConstruction-MasterProjectVault#identity-admin2',
    gdrive_folder: '08_System_Audit_Logs/CEO_Vault/Login_Directory',
    device_info: 'Mobile Gate Terminal - Roman Highway',
    status: 'active',
    is_ceo_confidential: true,
  },
];

export const INITIAL_EQUIPMENT: EquipmentResource[] = [
  {
    equipment_id: 'EQ-001',
    name: 'Caterpillar 320D Hydraulic Excavator',
    category: 'Heavy Excavation',
    model: 'CAT 320D-2',
    plate_number: 'NBX-9821',
    site_id: 'SITE-001',
    assigned_operator_id: 'DRC-EMP-2026-000003',
    assigned_operator_name: 'Efren Villanueva',
    allocation_start: '2026-10-01',
    allocation_end: '2026-10-18',
    status: 'Allocated',
    fuel_level_pct: 85,
    hourly_rate: 2200,
    notes: 'Primary foundation trenching and earth retention works for Warehouse A.',
  },
  {
    equipment_id: 'EQ-002',
    name: 'Sany SAC2500 250-Ton Mobile Crane',
    category: 'Lifting & Cranes',
    model: 'SAC2500-T',
    plate_number: 'WXD-5540',
    site_id: 'SITE-001',
    assigned_operator_id: 'DRC-EMP-2026-000004',
    assigned_operator_name: 'Michael Angelo Reyes',
    allocation_start: '2026-10-05',
    allocation_end: '2026-10-22',
    status: 'Allocated',
    fuel_level_pct: 72,
    hourly_rate: 5500,
    notes: 'Heavy structural steel truss erection and high-elevation framing.',
  },
  {
    equipment_id: 'EQ-003',
    name: 'Komatsu D65EX-16 Crawler Bulldozer',
    category: 'Earthmoving & Grading',
    model: 'D65EX-16',
    plate_number: 'KMT-3104',
    site_id: 'SITE-002',
    assigned_operator_id: 'DRC-EMP-2026-000003',
    assigned_operator_name: 'Efren Villanueva',
    allocation_start: '2026-10-02',
    allocation_end: '2026-10-15',
    status: 'Allocated',
    fuel_level_pct: 64,
    hourly_rate: 2800,
    notes: 'Subic site perimeter subbase rough grading and compaction preparation.',
  },
  {
    equipment_id: 'EQ-004',
    name: 'Isuzu Giga 10-Wheeler Dump Truck (20m³)',
    category: 'Hauling & Transport',
    model: 'Giga CYZ52',
    plate_number: 'NDZ-4412',
    site_id: 'SITE-002',
    assigned_operator_name: 'Reynaldo Santos (Subcontractor)',
    allocation_start: '2026-10-04',
    allocation_end: '2026-10-14',
    status: 'Allocated',
    fuel_level_pct: 90,
    hourly_rate: 1800,
    notes: 'Aggregates hauling from Bataan quarry to Subic commercial site.',
  },
  {
    equipment_id: 'EQ-005',
    name: 'Putzmeister 36m Concrete Boom Pump Truck',
    category: 'Concrete & Paving',
    model: 'BSF 36-4',
    plate_number: 'PZM-7711',
    site_id: 'SITE-003',
    assigned_operator_name: 'Danilo Santos Jr.',
    allocation_start: '2026-10-06',
    allocation_end: '2026-10-12',
    status: 'Allocated',
    fuel_level_pct: 80,
    hourly_rate: 4200,
    notes: 'Continuous concrete pumping for residential duplex second-floor slabs.',
  },
  {
    equipment_id: 'EQ-006',
    name: 'Sakai SV520D Single Drum Vibratory Soil Compactor',
    category: 'Concrete & Paving',
    model: 'SV520D-1',
    plate_number: 'SKI-8820',
    site_id: 'SITE-003',
    assigned_operator_name: 'Rodrigo Morales',
    allocation_start: '2026-10-01',
    allocation_end: '2026-10-10',
    status: 'Allocated',
    fuel_level_pct: 55,
    hourly_rate: 1950,
    notes: 'Subgrade soil density compaction before road concreting.',
  },
  {
    equipment_id: 'EQ-007',
    name: 'Bobcat S590 Skid Steer Loader',
    category: 'Earthmoving & Grading',
    model: 'S590 Turbo',
    plate_number: 'BBC-1290',
    site_id: 'DEPOT-000',
    allocation_start: '2026-10-12',
    allocation_end: '2026-10-25',
    status: 'Available',
    fuel_level_pct: 100,
    hourly_rate: 1500,
    notes: 'Parked in Central Depot yard. Fully tuned and available for deployment.',
  },
  {
    equipment_id: 'EQ-008',
    name: 'Denyo DCA-125 100kVA Soundproof Mobile Diesel Generator',
    category: 'Power & Utilities',
    model: 'DCA-125SPK',
    plate_number: 'DNY-6632',
    site_id: 'DEPOT-000',
    allocation_start: '2026-10-15',
    allocation_end: '2026-10-30',
    status: 'Available',
    fuel_level_pct: 95,
    hourly_rate: 1200,
    notes: 'Standby emergency site power generation. Tested and ready for dispatch.',
  },
];

export const INITIAL_PURCHASE_ORDERS: InternalPurchaseOrder[] = [];

export const INITIAL_PAYROLL_DOCS: WeeklyPayrollApprovalDoc[] = [];

export const INITIAL_GCASH_TRANSACTIONS: GCashTransactionRecord[] = [];

// =========================================================================
// UPGRADE & CHANGE SPECIFICATION: SEED PAYMENT RECORDS (Section 2, 3, 5)
// =========================================================================

export const INITIAL_PAYMENT_RECORDS: PaymentRecord[] = [];



