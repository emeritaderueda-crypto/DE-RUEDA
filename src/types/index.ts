export type AccessPointRole = 'ceo' | 'admin 1' | 'admin 2';

export interface UserSession {
  session_id: string;
  access_point: AccessPointRole;
  email: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  is_active: number;
}

export interface Employee {
  employee_id: string;
  name: string;
  position: string;
  email: string;
  contact_number: string;
  sss_number: string;
  philhealth_number: string;
  gcash_number: string;
  daily_rate: number;
  site_id: string;
  status: 'active' | 'archived' | 'on_leave';
  qr_version: number;
  documents?: string;
  drive_link?: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  site_id: string;
  code: string;
  name: string;
  location: string;
  project_status: 'Active' | 'In Progress' | 'On Hold' | 'Completed';
  supervisor: string;
  start_date: string;
  end_date: string;
  notes: string;
  documents?: string;
  created_at: string;
  canteen_vendor_name?: string;
  canteen_gcash_number?: string;
  canteen_contact_person?: string;
}

export interface AttendanceRecord {
  attendance_id: string;
  employee_id: string;
  site_id: string;
  work_date: string; // YYYY-MM-DD
  time_in: string; // HH:MM
  time_out?: string | null;
  elapsed_minutes: number;
  break_minutes: number;
  work_minutes: number;
  work_hours: number;
  source: 'QR' | 'MANUAL';
  qr_version: number;
  created_at: string;
  updated_at: string;
}

export interface DtrWeek {
  week_key: string; // e.g. 2026-W41
  site_id: string;
  date_start: string;
  date_end: string;
  date_today: string;
  last_updated: string;
  status: 'active' | 'finalized';
}

export interface DtrChange {
  change_id: string;
  attendance_id: string;
  week_key: string;
  employee_id: string;
  field_name: string;
  before_value: string;
  after_value: string;
  reason: string;
  changed_by: string;
  changed_at: string;
}

export interface DeductionRecord {
  deduction_id: string;
  employee_id: string;
  week_key: string;
  site_id: string;
  canteen: number;
  sss: number;
  philhealth: number;
  other_deduction: number;
  cash_advance: number;
  total_deductions: number;
  notes: string;
  is_void: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  payroll_id: string;
  employee_id: string;
  week_key: string;
  site_id: string;
  daily_rate: number;
  verified_days: number;
  verified_hours: number;
  gross_pay: number;
  canteen: number;
  sss: number;
  philhealth: number;
  other_deduction: number;
  cash_advance: number;
  total_deductions: number;
  net_pay: number;
  payment_method: 'Cash' | 'GCash';
  payment_status: 'Pending' | 'Verified' | 'Paid' | 'Failed';
  reference_no: string;
  notes: string;
  proof_file_id?: string;
  proof_url?: string;
  paid_at?: string | null;
  verified_at?: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRecord {
  material_id: string;
  site_id: string;
  material_name: string;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  delivery_ref: string;
  notes: string;
  attachments?: string;
  is_archived: number;
  created_at: string;
}

export interface ExpenseRecord {
  expense_id: string;
  site_id: string;
  date: string;
  category: string;
  vendor: string;
  amount: number;
  payment_method: string;
  reference_no: string;
  notes: string;
  attachments?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  title: string;
  type: 'direct' | 'group';
  participants: string; // JSON string array of emails
  pinned: number;
  muted: number;
  last_message_at: string;
  created_at: string;
}

export interface MessageItem {
  message_id: string;
  conversation_id: string;
  sender_email: string;
  sender_name: string;
  sender_access_point: string;
  text: string;
  attachments?: string; // JSON
  reactions?: string; // JSON
  reply_to_id?: string | null;
  read_by?: string;
  is_edited?: number;
  is_deleted?: number;
  created_at: string;
}

export interface DocumentItem {
  document_id: string;
  module: string;
  record_id: string;
  file_name: string;
  file_type: string;
  drive_url: string;
  storage_ref?: string;
  notes: string;
  uploaded_by: string;
  created_at: string;
  is_ceo_only?: boolean;
}

export interface LoginDirectoryRecord {
  id: string;
  email: string;
  access_point: AccessPointRole;
  first_login_at: string;
  last_login_at: string;
  login_count: number;
  gdrive_file_id: string;
  gdrive_file_url: string;
  gdrive_folder: string;
  device_info: string;
  status: 'active' | 'flagged' | 'archived';
  is_ceo_confidential: boolean;
}

export interface AuditLogItem {
  audit_id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  before_value?: string | null;
  after_value?: string | null;
  timestamp: string;
}

export type GoogleDrivePlan =
  | 'unregistered'
  | 'google_workspace_starter'
  | 'google_workspace_standard'
  | 'google_workspace_enterprise'
  | 'google_one_business'
  | 'custom_gdrive';

export interface DriveSubscription {
  is_registered: boolean;
  plan: GoogleDrivePlan;
  plan_name: string;
  storage_quota: string;
  account_email: string;
  drive_folder_url: string;
  registered_at?: string;
  gemini_enabled: boolean;
  gemini_model: string;
  gemini_features: string[];
}

export interface SystemSettings {
  company_name: string;
  company_profile: string;
  company_address: string;
  contact_email: string;
  contact_phone: string;
  master_drive_link: string;
  drive_subscription?: DriveSubscription;
  anti_duplicate_minutes: number;
  break_minutes: number;
  work_hours_standard: number;
  break_schedule: string;
  sss_default_rate: number;
  philhealth_default_rate: number;
  week_start_day: string;
  week_end_day: string;
  timezone: string;
  payroll_payment_methods: string;
}

export interface PublicInquiry {
  inquiry_id: string;
  name: string;
  business_motive: string;
  email: string;
  contact_number: string;
  inquiry_type: string;
  status: 'New' | 'Contacted' | 'Closed';
  created_at: string;
}

export interface PublicHiring {
  hiring_id: string;
  name: string;
  age: number;
  birthdate: string;
  address: string;
  email: string;
  experience: string;
  contact_number: string;
  status: 'Under Review' | 'Interview Scheduled' | 'Hired' | 'Declined';
  created_at: string;
}

export interface GCashDisbursementRequest {
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  gcash_number: string;
  amount: number;
  week_key: string;
  site_id: string;
  site_name?: string;
  user_pin?: string;
  notes?: string;
}

export interface GCashDisbursementResponse {
  success: boolean;
  transaction_id: string;
  reference_no: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  timestamp: string;
  merchant_name: string;
  merchant_id: string;
  recipient_name: string;
  recipient_mobile: string;
  fee: number;
  receipt_url: string;
  receipt_file_name: string;
  network_response_code: string;
  message: string;
}

export interface GCashWalletStatus {
  merchant_id: string;
  account_name: string;
  available_balance: number;
  daily_disbursement_limit: number;
  daily_disbursed_today: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'LIMITED';
  settlement_currency: string;
  last_topup_date: string;
  network_provider: string;
}

export interface OfflineActionItem {
  id: string;
  type: 'ATTENDANCE_SCAN' | 'PAYROLL_VERIFY' | 'GCASH_PAY' | 'DEDUCTION_ADD' | 'NOTE_ADD';
  payload: any;
  timestamp: string;
  synced: boolean;
  retryCount: number;
}

export interface OfflineCacheStats {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  cachedEmployeesCount: number;
  cachedAttendanceCount: number;
  cachedSitesCount: number;
  cachedPayrollCount: number;
  pendingQueueCount: number;
  lastSyncTimestamp: string;
  storageUsageBytes: number;
}

export interface EquipmentResource {
  equipment_id: string;
  name: string;
  category: 'Heavy Excavation' | 'Lifting & Cranes' | 'Earthmoving & Grading' | 'Hauling & Transport' | 'Concrete & Paving' | 'Power & Utilities';
  model: string;
  plate_number: string;
  site_id: string; // 'SITE-001' | 'SITE-002' | 'SITE-003' | 'DEPOT-000'
  assigned_operator_id?: string;
  assigned_operator_name?: string;
  allocation_start: string; // YYYY-MM-DD
  allocation_end: string;   // YYYY-MM-DD
  status: 'Allocated' | 'Available' | 'Maintenance';
  fuel_level_pct: number;
  hourly_rate: number;
  notes: string;
}

export interface DigitalSignatureData {
  signed_by: string;
  signer_role: string;
  signed_at: string;
  signature_svg: string;
  verification_hash: string;
  ip_address?: string;
}

export interface InternalPurchaseOrder {
  po_id: string;
  site_id: string;
  site_name: string;
  vendor_name: string;
  category: string;
  items: Array<{
    item_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }>;
  total_amount: number;
  requested_by: string;
  date_issued: string;
  required_delivery_date: string;
  status: 'Pending Signature' | 'Approved' | 'Rejected';
  digital_signature?: DigitalSignatureData;
  notes: string;
}

export interface WeeklyPayrollApprovalDoc {
  doc_id: string;
  week_key: string;
  site_id: string;
  site_name: string;
  total_workers: number;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  prepared_by: string;
  date_prepared: string;
  status: 'Pending Signature' | 'Approved' | 'Rejected';
  digital_signature?: DigitalSignatureData;
  notes: string;
}

export interface GCashTransactionRecord {
  transaction_id: string;
  reference_no: string;
  category: 'Weekly Salary' | 'Site Operations (Fuel/Emergency)' | 'Subcontractor Spot Payment' | 'Materials Spot Cash' | 'Site Canteen Payout';
  site_id: string;
  site_name: string;
  recipient_name: string;
  recipient_mobile: string;
  amount: number;
  fee: number;
  purpose: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  receipt_url: string;
  receipt_file_name?: string;
  initiated_by: string;
  timestamp: string;
}

