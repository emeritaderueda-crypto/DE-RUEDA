export type AccessPointRole = 'ceo' | 'admin 1' | 'admin 2';

export interface UserSession {
  session_id: string;
  access_point: AccessPointRole;
  email: string;
  name?: string;
  assigned_sites?: string[]; // e.g. ['SITE-001'] or ['ALL']
  mfa_verified?: boolean;
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
  category?: 'Site-Based' | 'Office-Based' | 'Office Based Staff (HQ)';
  photo_url?: string;
  status: 'active' | 'archived' | 'on_leave';
  qr_version: number;
  documents?: string;
  drive_link?: string;
  created_at: string;
  updated_at: string;
}

export interface QrScanLogItem {
  id: string;
  employee_id: string;
  employee_name: string;
  site_id: string;
  site_name: string;
  timestamp: string; // ISO string
  type: 'IN' | 'OUT';
  verified: boolean;
  notes?: string;
  device_id: string; // e.g. 'TURNSTILE-GATE-01A'
  location_tag: string; // e.g. 'Main Gate Turnstile 1'
  duplicate_prevented?: boolean;
}

export interface CanteenPdfExtractionItem {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  meal_type?: string;
  amount: number;
  is_matched: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  original_raw_text?: string;
  approved: boolean;
}

export interface CanteenPdfReviewBatch {
  batch_id: string;
  file_name: string;
  file_size?: number;
  upload_timestamp: string;
  site_id: string;
  week_key: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'POSTED' | 'DISCARDED';
  extracted_items: CanteenPdfExtractionItem[];
  total_extracted_amount: number;
  flagged_count: number;
  posted_at?: string;
  posted_by?: string;
}

export interface Site {
  site_id: string;
  code: string;
  name: string;
  location: string;
  project_status: 'Active' | 'In Progress' | 'On Hold' | 'Completed';
  supervisor: string;
  supervisor_email?: string;
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
  maxRetries?: number;
  lastError?: string;
  site_id?: string;
  device_id?: string;
  payloadSizeBytes?: number;
  status?: 'PENDING' | 'RETRYING' | 'FAILED' | 'COMMITTED';
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

export interface SyncActivityLogEntry {
  id: string;
  timestamp: string; // ISO string
  direction: 'PUSH' | 'PULL' | 'HEARTBEAT';
  service: 'ATTENDANCE_QUEUE' | 'CANTEEN_CHITS' | 'MASTERLIST_CACHE' | 'PAYROLL_VOUCHERS' | 'SYSTEM_STATE';
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'RETRY';
  records_count: number;
  payload_summary: string;
  site_id?: string;
  device_id?: string;
  latency_ms: number;
  details?: string;
  error_message?: string;
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

export type GCashCategory =
  | 'Weekly Salary'
  | 'Site Operations (Fuel/Emergency)'
  | 'Subcontractor Spot Payment'
  | 'Materials Spot Cash'
  | 'Materials & Vendor Payout'
  | 'Site Canteen Payout'
  | 'Treasury Top-Up';

export type GCashPayoutStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NEEDS_RECONCILIATION';

export interface GCashGatewayConfig {
  provider_type: 'direct_gcash_business' | 'paymongo' | 'xendit' | 'maya_business';
  environment: 'sandbox' | 'production';
  connection_status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LOCKED' | 'SESSION_EXPIRED' | 'ERROR';
  merchant_id: string;
  client_id: string;
  api_key_masked: string;
  webhook_secret_masked: string;
  live_balance: number | null;
  live_balance_last_updated: string | null;
  daily_disbursement_limit: number;
  daily_disbursed_today: number;
  last_error_message?: string | null;
  last_connected_at?: string | null;
}

export interface GCashTransactionRecord {
  transaction_id: string;
  reference_no: string;
  category: GCashCategory;
  site_id: string;
  site_name: string;
  recipient_name: string;
  recipient_mobile: string;
  amount: number;
  fee: number;
  purpose: string;
  status: GCashPayoutStatus;
  receipt_url: string;
  receipt_file_name?: string;
  initiated_by: string;
  timestamp: string;
  idempotency_key?: string;
  reconciliation_notes?: string;
  disbursement_batch_id?: string;
  provider_reference?: string;
  sms_payslip_dispatched?: boolean;
}

export interface CanteenMenuItem {
  id: string;
  name: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Heavy Pack' | 'Weekly Bundle';
  price: number;
  description: string;
  sanitary_certified: boolean;
  serving_window: string;
}

export interface PendingOfflineCanteenRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  site_id: string;
  week_key: string;
  amount: number;
  payment_method?: 'GCash' | 'Cash';
  notes: string;
  created_at: string;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  storage_type?: 'IndexedDB' | 'localStorage';
  error_reason?: string;
  failed_at?: string;
  retry_count?: number;
  requires_manual_action?: boolean;
}

export interface CanteenSyncStatusInfo {
  pendingCount: number;
  failedCount: number;
  totalPendingAmount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'IDLE';
  manualActionRequired: boolean;
  failedRecords: PendingOfflineCanteenRecord[];
}

export interface GeminiCopilotFileAttachment {
  filename: string;
  file_type: 'csv' | 'xlsx' | 'pdf' | 'svg' | 'json' | 'doc' | 'txt';
  label: string;
  content?: string;
  dataUrl?: string;
  rows?: (string | number)[][];
  mime_type?: string;
  summary?: string;
}

export interface GeminiCopilotActionExecuted {
  action_type:
    | 'CHECK_ATTENDANCE'
    | 'RECORD_ATTENDANCE'
    | 'CORRECT_ATTENDANCE'
    | 'ADD_CANTEEN_STIPEND'
    | 'RETRY_CANTEEN_SYNC'
    | 'RESOLVE_FAILED_CANTEEN_RECORD'
    | 'UPDATE_EMPLOYEE'
    | 'ADD_EXPENSE'
    | 'ADD_MATERIAL'
    | 'UPDATE_SETTINGS'
    | 'EXPORT_REPORT';
  target: string;
  details: string;
  timestamp: string;
  success: boolean;
}

export interface GeminiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions_executed?: GeminiCopilotActionExecuted[];
  files_generated?: GeminiCopilotFileAttachment[];
  attendance_summary?: {
    date: string;
    site_name: string;
    total_present: number;
    total_absent: number;
    total_late: number;
    total_hours: number;
    records: Array<{
      employee_id: string;
      name: string;
      status: string;
      time_in: string;
      time_out: string;
      total_hours: number;
      overtime_hours: number;
    }>;
  };
}


export interface CanteenAggregationWorkerLine {
  employee_id: string;
  name: string;
  position: string;
  canteen_deduction: number;
  week_key: string;
  notes?: string;
}

export interface CanteenAggregationSiteSummary {
  site_id: string;
  site_code: string;
  site_name: string;
  location: string;
  vendor_name: string;
  gcash_number: string;
  contact_person: string;
  worker_count: number;
  total_meal_deductions: number;
  total_gcash_settled: number;
  net_outstanding_balance: number;
  workers: CanteenAggregationWorkerLine[];
}

// ----------------------------------------------------
// Agreed Upgrade Types: GCash Hubs, RBAC & SMS Payslips
// ----------------------------------------------------

export type GcashHubType =
  | 'ceo_hub'
  | 'exec_distribution_hub'
  | 'admin2_distribution_hub';

export interface HubSessionState {
  hubId: GcashHubType;
  isUnlocked: boolean;
  unlockedBy?: string;
  unlockedRole?: AccessPointRole;
  unlockedAt?: string;
  expiresAt?: string;
  timeoutMinutes: number;
}

export interface AdminUserAccount {
  id: string;
  email: string;
  name: string;
  role: AccessPointRole;
  assignedSites: string[]; // e.g. ['SITE-001'] or ['ALL']
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes?: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type SmsNotificationType = 'PAYSLIP' | 'DTR_FINALIZED';

export interface SmsPayslipLogEntry {
  id: string;
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  mobile_number: string;
  week_key: string;
  site_id: string;
  gross_pay: number;
  deductions_total: number;
  net_pay: number;
  payout_ref: string;
  idempotency_key: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED' | 'RETRY_QUEUED';
  provider_ref: string;
  sms_body: string;
  failure_reason?: string;
  retry_count: number;
  sent_at: string;
  delivered_at?: string;
  notification_type?: SmsNotificationType;
  dtr_details?: {
    total_days: number;
    regular_hours: number;
    ot_hours: number;
  };
}

export interface GcashWalletInfo {
  merchant_id: string;
  account_name: string;
  available_balance: number;
  daily_disbursement_limit: number;
  daily_disbursed_today: number;
  status: 'ACTIVE' | 'PENDING_ONBOARDING' | 'SANDBOX_STAGING';
  settlement_currency: string;
  last_topup_date: string;
  network_provider: string;
  is_official_live_api: boolean;
  api_disclaimer?: string;
}

export interface EmailDtrRecipient {
  role: 'SITE_HEAD' | 'HR' | 'CEO' | 'CUSTOM';
  name: string;
  email: string;
  site_id?: string;
  selected: boolean;
}

export interface WeeklyDtrSummaryItem {
  employee_id: string;
  employee_name: string;
  trade: string;
  site_id: string;
  regular_hours: number;
  ot_hours: number;
  total_days: number;
  status: 'Verified' | 'Pending Review' | 'Flagged';
}

export interface WeeklyDtrEmailPayload {
  week_key: string;
  site_id: string;
  site_name: string;
  recipients: EmailDtrRecipient[];
  sender_name: string;
  sender_email: string;
  sender_role: string;
  notes?: string;
  summary: {
    total_workers: number;
    total_regular_hours: number;
    total_ot_hours: number;
    total_shifts: number;
    perfect_attendance_count: number;
    flagged_punches_count: number;
    items: WeeklyDtrSummaryItem[];
  };
}

export interface EmailDeliveryRecord {
  id: string;
  week_key: string;
  site_id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_role: string;
  subject: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  message_id: string;
  sent_at: string;
  delivered_at?: string;
  html_preview?: string;
  failure_reason?: string;
}

export interface WeeklyDtrEmailSchedule {
  enabled: boolean;
  frequency: 'WEEKLY';
  dispatch_day: 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | 'MONDAY';
  dispatch_time: string; // e.g. '18:00'
  include_site_heads: boolean;
  include_hr: boolean;
  include_ceo: boolean;
  auto_dispatch_on_cycle_finalize: boolean;
  last_automated_run?: string;
  next_scheduled_run?: string;
}

export interface SmsDtrFinalizedPayload {
  employee_id: string;
  employee_name: string;
  mobile_number: string;
  week_key: string;
  site_id: string;
  site_name: string;
  total_days: number;
  regular_hours: number;
  ot_hours: number;
  idempotency_key?: string;
}

export interface ProcurementTimelineItem {
  id: string;
  site_id: string;
  site_name: string;
  material_name: string;
  category: 'Structural' | 'Civil Works' | 'Architectural' | 'MEPF' | 'Equipment';
  supplier: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  target_delivery_date: string; // YYYY-MM-DD
  actual_delivery_date?: string;
  status: 'DELIVERED' | 'IN_TRANSIT' | 'PO_APPROVED' | 'PO_PENDING' | 'DELAYED';
  associated_task_id?: string;
  delivery_ref?: string;
  criticality: 'CRITICAL' | 'NORMAL' | 'LOW';
  lead_time_days: number;
  notes?: string;
}

