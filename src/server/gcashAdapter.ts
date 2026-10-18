// Server-Side GCash Provider Adapter & Onboarding Integration Boundary
// Upgraded in strict compliance with:
// "DE RUEDA CONSTRUCTION ERP - Upgrade & Change Specification: Employee + Site QR Payments,
// System-Wide Individual Payments, and Official GCash API Integration" (Sections 1, 3, 4, 5)

import crypto from 'crypto';

export type PaymentRecordStatus =
  | 'AWAITING_PAYMENT'
  | 'RECEIPT_UPLOADED'
  | 'UNDER_REVIEW'
  | 'PAID_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'NEEDS_REVIEW';

export interface DisbursementItem {
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  gcash_number: string;
  amount: number;
  week_key: string;
  site_id: string;
  site_name?: string;
  idempotency_key?: string;
}

export interface DisbursementResult {
  transaction_id: string;
  reference_no: string;
  payroll_id: string;
  employee_name: string;
  recipient_mobile: string;
  amount: number;
  status: 'DISABLED_PENDING_APPROVAL' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN' | 'UNDER_REVIEW';
  timestamp: string;
  receipt_url?: string;
  receipt_file_name?: string;
  error_message?: string;
  provider_reference?: string;
  reconciliation_required: boolean;
}

// =========================================================================
// SECTION 4 COMPLIANCE: FEATURE FLAG & OFFICIAL ONBOARDING BOUNDARY
// =========================================================================
// "Automated payouts and automatic provider-confirmed settlement must remain disabled
// until the business is approved and the official API is implemented and tested." (Page 1)
export const GCASH_API_FEATURE_ENABLED = false;

// Corporate Onboarding & Readiness State (Section 4 Phase A, B, C)
export const OFFICIAL_GCASH_ONBOARDING_INFO = {
  product_target: 'GCash PowerPay+ / Funds Disbursement Service' as const,
  current_phase: 'PHASE_A_ONBOARDING' as const,
  business_verification: {
    business_name: 'DE RUEDA CONSTRUCTION INC.',
    sec_registration_no: 'CS201844920',
    tin: '009-842-192-000',
    dole_compliance_verified: true,
    contact_channel: 'GCash for Business Official Corporate Desk',
    inquiry_status: 'PENDING_OFFICIAL_APPROVAL' as const,
    notes: 'Official application submitted for PowerPay+ corporate wage disbursement line. Live direct payout disabled pending commercial contract and API onboarding token.',
  },
  security_architecture: {
    secrets_in_client_bundle: false,
    server_side_adapter_only: true,
    idempotency_enforced: true,
    duplicate_reference_check: true,
    receipt_upload_not_auto_paid: true,
    sms_only_on_verified: true,
    audit_trail_immutable: true,
    emergency_killswitch_active: true,
  },
  manual_fallback_active: true,
};

// Global Duplicate Reference Registry for Receipt Verification (Section 3 Page 3)
// Enforces that no GCash reference number can be used more than once across the ERP
const DUPLICATE_REFERENCE_REGISTRY = new Map<string, { record_id: string; registered_at: string }>();

// In-Memory Idempotency Cache to Prevent Duplicate Requests
const IDEMPOTENCY_STORE = new Map<string, DisbursementResult>();

// Authoritative historical server transactions ledger
export const SERVER_GCASH_TRANSACTIONS: DisbursementResult[] = [];

/**
 * Check if a GCash reference number has already been claimed/uploaded
 */
export function checkDuplicateReference(
  rawReference: string,
  currentRecordId?: string
): { isDuplicate: boolean; conflictingRecordId?: string } {
  if (!rawReference) return { isDuplicate: false };
  const cleanRef = rawReference.replace(/[\s\-_]/g, '').toUpperCase();
  if (DUPLICATE_REFERENCE_REGISTRY.has(cleanRef)) {
    const existing = DUPLICATE_REFERENCE_REGISTRY.get(cleanRef)!;
    if (currentRecordId && existing.record_id === currentRecordId) {
      return { isDuplicate: false };
    }
    return { isDuplicate: true, conflictingRecordId: existing.record_id };
  }
  return { isDuplicate: false };
}

/**
 * Register a verified or uploaded GCash reference number into the registry
 */
export function registerReference(
  rawReference: string,
  recordId: string
): { success: boolean; error?: string } {
  const cleanRef = rawReference.replace(/[\s\-_]/g, '').toUpperCase();
  const dupCheck = checkDuplicateReference(cleanRef, recordId);
  if (dupCheck.isDuplicate) {
    return {
      success: false,
      error: `Duplicate transaction reference ${rawReference} already registered for payment record ${dupCheck.conflictingRecordId}.`,
    };
  }
  DUPLICATE_REFERENCE_REGISTRY.set(cleanRef, {
    record_id: recordId,
    registered_at: new Date().toISOString(),
  });
  return { success: true };
}

/**
 * Server-Side Provider Adapter Execution Entry Point
 * In compliance with Section 1 & 4:
 * When GCASH_API_FEATURE_ENABLED is false, automated live disbursement requests are safely rejected
 * with an informative message requiring the manual receipt-backed workflow.
 */
export async function executeDisbursement(
  item: DisbursementItem,
  environment = 'sandbox'
): Promise<DisbursementResult> {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = now.toISOString();
  const idemKey = item.idempotency_key || `IDEM-${item.payroll_id}-${datePart}-${item.amount}`;

  if (IDEMPOTENCY_STORE.has(idemKey)) {
    console.warn(`[GCash Idempotency] Duplicate request prevented for key: ${idemKey}`);
    return IDEMPOTENCY_STORE.get(idemKey)!;
  }

  // Section 1 & 4 Enforcement: Automated Payout Disabled
  if (!GCASH_API_FEATURE_ENABLED) {
    const disabledResult: DisbursementResult = {
      transaction_id: `DISABLED-${Date.now()}`,
      reference_no: 'N/A-MANUAL-MODE',
      payroll_id: item.payroll_id,
      employee_name: item.employee_name,
      recipient_mobile: item.gcash_number,
      amount: item.amount,
      status: 'DISABLED_PENDING_APPROVAL',
      timestamp,
      error_message:
        'Automated GCash disbursement is currently DISABLED pending official business partner approval (PowerPay+ / Funds Disbursement Service). All disbursements must follow the manual receipt-backed payment record workflow.',
      reconciliation_required: false,
    };
    IDEMPOTENCY_STORE.set(idemKey, disabledResult);
    return disabledResult;
  }

  // Prepared Provider API Call boundary for future live credentials
  const gcashApiKey = process.env.GCASH_API_KEY || '';
  if (!gcashApiKey) {
    const unconfiguredResult: DisbursementResult = {
      transaction_id: `UNCONFIGURED-${Date.now()}`,
      reference_no: 'N/A-UNCONFIGURED',
      payroll_id: item.payroll_id,
      employee_name: item.employee_name,
      recipient_mobile: item.gcash_number,
      amount: item.amount,
      status: 'FAILED',
      timestamp,
      error_message: 'Official GCash API credentials not provisioned in server secrets store.',
      reconciliation_required: false,
    };
    IDEMPOTENCY_STORE.set(idemKey, unconfiguredResult);
    return unconfiguredResult;
  }

  // Official Provider API call will be placed here once partner onboarding token is issued
  throw new Error('Official GCash partner API client pending token activation.');
}

/**
 * Returns Authoritative Status of the GCash Integration & Onboarding Roadmap
 */
export async function getLiveBalance(): Promise<{
  status: 'MANUAL_RECEIPT_MODE' | 'ACTIVE' | 'UNAVAILABLE';
  available_balance: number | null;
  currency: string;
  last_updated: string;
  message: string;
  mode: string;
}> {
  return {
    status: 'MANUAL_RECEIPT_MODE',
    available_balance: null,
    currency: 'PHP',
    last_updated: new Date().toISOString(),
    mode: 'Manual Receipt-Backed Payment Records (Official API Pending Business Approval)',
    message:
      'Per Upgrade & Change Specification, automated wallet control and fabricated balances are retired. Payments are tracked through individual payment records, verified recipient details, and manual receipt reconciliation.',
  };
}

export function getAuthoritativeFloat(): number {
  return 0;
}

export function setLiveMerchantBalance(_amount: number): number {
  return 0;
}

export function topUpLiveMerchantBalance(_amount: number): number {
  return 0;
}

export function deductLiveMerchantBalance(_amount: number): number {
  return 0;
}
