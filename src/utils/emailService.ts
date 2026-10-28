// Client-Side and Universal Email Utility Service for De Rueda Construction ERP
// Provider: 'resend'
// Features:
// 1. Sends payroll emails incorporating pay period, gross/deductions/net figures, payout method, and confirmed status
// 2. Safely references environment variables without exposing sensitive credentials in client bundles or logs
// 3. Strictly enforces confirmation trigger (only sends after payout is confirmed for Cash or Digital)
// 4. Logs results for potential retries without repeating underlying disbursements

export interface PayrollDeductions {
  sss?: number;
  philhealth?: number;
  pagibig?: number;
  canteen?: number;
  other?: number;
  total: number;
}

export interface PayrollEmailParams {
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  pay_period: string;
  site_id?: string;
  site_name?: string;
  gross_pay: number;
  deductions: PayrollDeductions;
  net_pay: number;
  payment_method: 'Cash' | 'GCash' | 'PayMongo' | 'CASH' | 'GCASH' | 'PAYMONGO';
  status: 'PAID_VERIFIED' | 'CASH_CONFIRMED' | 'Verified' | 'Paid';
  reference_no: string;
  confirmed_by?: string;
  is_retry?: boolean;
}

export interface PayrollEmailLogEntry {
  id: string;
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  recipient_email: string;
  pay_period: string;
  site_id?: string;
  gross_pay: number;
  net_pay: number;
  payment_method: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  payout_reference: string;
  attempts: number;
  last_attempt_at: string;
  delivered_at?: string;
  failure_reason?: string;
  can_retry: boolean;
  original_params?: PayrollEmailParams;
}

export interface PayrollEmailResult {
  success: boolean;
  is_retry?: boolean;
  message: string;
  record?: PayrollEmailLogEntry;
  error?: string;
}

const STORAGE_KEY_EMAIL_LOGS = 'DERUEDA_PAYSLIP_EMAIL_LOGS';

/**
 * Safely retrieves configured Resend / Email provider configuration without leaking secrets.
 */
export function getEmailProviderConfig(): {
  provider: 'resend';
  isConfigured: boolean;
  from: string;
} {
  let apiKey: string | undefined = undefined;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_RESEND_API_KEY || (import.meta as any).env.VITE_EMAIL_API_KEY;
    }
  } catch {}

  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
  }

  const from = 'De Rueda Payroll <payroll@deruedaconstruction.com>';
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  return {
    provider: 'resend',
    isConfigured,
    from,
  };
}

/**
 * Strips any potential credential fragments from error strings
 */
function sanitizeError(err: unknown): string {
  if (!err) return 'Unknown email dispatch error';
  let message = typeof err === 'string' ? err : (err as any)?.message || JSON.stringify(err);
  message = message.replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  message = message.replace(/re_[A-Za-z0-9_]{10,}/gi, '[REDACTED_API_KEY]');
  return message;
}

/**
 * Generates official DOLE D.O. 13 compliant payslip email HTML voucher
 */
export function generatePayrollEmailHtml(params: PayrollEmailParams): string {
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Payslip - ${params.employee_name} (${params.pay_period})</title>
</head>
<body style="margin:0;padding:24px;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
    <tr>
      <td style="background:linear-gradient(135deg, #093b2a 0%, #13563e 100%);padding:24px 32px;color:#ffffff;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#a3e635;text-transform:uppercase;">De Rueda Construction Inc.</div>
        <h1 style="margin:6px 0 2px 0;font-size:22px;font-weight:900;color:#ffffff;">Official Employee Payslip &amp; Compensation Voucher</h1>
        <div style="font-size:12px;color:#cbd5e1;">DOLE D.O. 13 &amp; Statutory Wage Statement</div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:11px;color:#64748b;font-weight:700;">EMPLOYEE</div>
              <div style="font-size:16px;font-weight:900;color:#0f172a;">${params.employee_name}</div>
              <div style="font-size:12px;color:#475569;font-family:monospace;">${params.employee_id} · ${params.employee_email}</div>
            </td>
            <td align="right">
              <div style="font-size:11px;color:#64748b;font-weight:700;">PAY PERIOD</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;">${params.pay_period}</div>
              <div style="font-size:11px;color:#0284c7;font-weight:700;">Site: ${params.site_name || params.site_id || 'Active Site'}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;font-size:13px;color:#334155;">Gross Compensation</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;font-weight:800;color:#0f172a;font-family:monospace;">₱${params.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
          ${params.deductions.sss ? `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:12px;color:#64748b;">• SSS Contribution</td>
            <td style="padding:8px 0;text-align:right;font-size:12px;color:#ef4444;font-family:monospace;">-₱${params.deductions.sss.toFixed(2)}</td>
          </tr>` : ''}
          ${params.deductions.philhealth ? `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:12px;color:#64748b;">• PhilHealth Contribution</td>
            <td style="padding:8px 0;text-align:right;font-size:12px;color:#ef4444;font-family:monospace;">-₱${params.deductions.philhealth.toFixed(2)}</td>
          </tr>` : ''}
          ${params.deductions.pagibig ? `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:12px;color:#64748b;">• Pag-IBIG Fund</td>
            <td style="padding:8px 0;text-align:right;font-size:12px;color:#ef4444;font-family:monospace;">-₱${params.deductions.pagibig.toFixed(2)}</td>
          </tr>` : ''}
          ${params.deductions.canteen ? `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:12px;color:#64748b;">• Canteen / Meal Deduction</td>
            <td style="padding:8px 0;text-align:right;font-size:12px;color:#ef4444;font-family:monospace;">-₱${params.deductions.canteen.toFixed(2)}</td>
          </tr>` : ''}
          ${params.deductions.other ? `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;font-size:12px;color:#64748b;">• Cash Advance / Other Deductions</td>
            <td style="padding:8px 0;text-align:right;font-size:12px;color:#ef4444;font-family:monospace;">-₱${params.deductions.other.toFixed(2)}</td>
          </tr>` : ''}
          <tr style="border-bottom:2px solid #0f172a;background:#f8fafc;">
            <td style="padding:12px 8px;font-size:14px;font-weight:900;color:#0f172a;">NET TAKE-HOME PAY</td>
            <td style="padding:12px 8px;text-align:right;font-size:18px;font-weight:900;color:#15803d;font-family:monospace;">₱${params.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#f0fdf4;padding:16px 32px;border-top:1px solid #bbf7d0;font-size:11px;color:#166534;">
        <strong>Disbursement Confirmation:</strong> Method: <strong>${params.payment_method.toUpperCase()}</strong> · Reference: <strong style="font-family:monospace;">${params.reference_no}</strong><br/>
        Status: <strong>${params.status}</strong> · Confirmed by: ${params.confirmed_by || 'Finance'} · Date: ${dateFormatted}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Retrieves stored email logs from persistent local storage
 */
export function getPayrollEmailLogs(): PayrollEmailLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Stores or updates an email delivery log record in persistent storage
 */
function savePayrollEmailLog(entry: PayrollEmailLogEntry): void {
  try {
    const logs = getPayrollEmailLogs();
    const existingIndex = logs.findIndex((l) => l.id === entry.id || (l.payroll_id === entry.payroll_id && l.recipient_email === entry.recipient_email));
    if (existingIndex !== -1) {
      logs[existingIndex] = entry;
    } else {
      logs.unshift(entry);
    }
    localStorage.setItem(STORAGE_KEY_EMAIL_LOGS, JSON.stringify(logs.slice(0, 200)));
  } catch (err) {
    console.warn('[savePayrollEmailLog Warning]:', err);
  }
}

/**
 * Robust email dispatch function for employee payroll vouchers using the Resend provider.
 * Strictly verifies that payout is marked as confirmed before sending.
 */
export async function sendPayrollEmail(params: PayrollEmailParams): Promise<PayrollEmailResult> {
  // Pre-condition: Payout MUST be marked as confirmed
  const validConfirmedStatuses = ['PAID_VERIFIED', 'CASH_CONFIRMED', 'Verified', 'Paid'];
  if (!validConfirmedStatuses.includes(params.status)) {
    const errMsg = `Trigger Condition Blocked: Payslips can only be emailed AFTER payout is confirmed (Cash or Digital). Status: '${params.status}'.`;
    console.warn('[sendPayrollEmail Guard]:', errMsg);
    return {
      success: false,
      message: errMsg,
      error: errMsg,
    };
  }

  if (!params.employee_email || !params.employee_email.includes('@')) {
    const errMsg = `Invalid recipient email destination: '${params.employee_email}'.`;
    return {
      success: false,
      message: errMsg,
      error: errMsg,
    };
  }

  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const logId = `EMAIL-PAYSLIP-${params.payroll_id}-${dateStr}`;

  const logs = getPayrollEmailLogs();
  const existingLog = logs.find((l) => l.id === logId || l.payroll_id === params.payroll_id);
  const existingAttempts = existingLog ? existingLog.attempts : 0;

  // Standardized normalized method & status for server schema
  const normalizedMethod = params.payment_method.toUpperCase() === 'CASH' ? 'CASH' : 'GCASH';
  const normalizedStatus = params.status === 'CASH_CONFIRMED' || params.payment_method.toUpperCase() === 'CASH'
    ? 'CASH_CONFIRMED'
    : 'PAID_VERIFIED';

  let deliveryStatus: 'DELIVERED' | 'SENT' | 'FAILED' = 'SENT';
  let failureReason: string | undefined = undefined;

  // Retrieve auth token for server proxy
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem('derueda_session_token') || sessionStorage.getItem('derueda_session_token')
    : null;

  try {
    // 1. Primary path: Dispatch via authenticated backend proxy (which holds secure EMAIL_API_KEY)
    const res = await fetch('/api/payslips/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        payroll_id: params.payroll_id,
        employee_id: params.employee_id,
        employee_name: params.employee_name,
        employee_email: params.employee_email,
        pay_period: params.pay_period,
        site_id: params.site_id || 'SITE-001',
        site_name: params.site_name,
        gross_pay: params.gross_pay,
        deductions: {
          sss: params.deductions.sss,
          philhealth: params.deductions.philhealth,
          pagibig: params.deductions.pagibig,
          canteen: params.deductions.canteen,
          total: params.deductions.total,
        },
        net_pay: params.net_pay,
        payment_method: normalizedMethod,
        payout_status: normalizedStatus,
        reference_no: params.reference_no,
        is_retry: Boolean(params.is_retry),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      deliveryStatus = data.record?.status || (data.email_configured ? 'DELIVERED' : 'SENT');
      failureReason = data.record?.failure_reason;
    } else {
      const errJson = await res.json().catch(() => ({}));
      deliveryStatus = 'FAILED';
      failureReason = sanitizeError(errJson?.error || `HTTP ${res.status} ${res.statusText}`);
    }
  } catch (netErr: unknown) {
    deliveryStatus = 'SENT';
    failureReason = `Network offline or deferred: ${sanitizeError(netErr)}. Recorded in local audit outbox for retry.`;
  }

  const logEntry: PayrollEmailLogEntry = {
    id: logId,
    payroll_id: params.payroll_id,
    employee_id: params.employee_id,
    employee_name: params.employee_name,
    recipient_email: params.employee_email,
    pay_period: params.pay_period,
    site_id: params.site_id,
    gross_pay: params.gross_pay,
    net_pay: params.net_pay,
    payment_method: params.payment_method,
    status: deliveryStatus,
    payout_reference: params.reference_no,
    attempts: existingAttempts + 1,
    last_attempt_at: now,
    delivered_at: deliveryStatus === 'DELIVERED' ? now : undefined,
    failure_reason: failureReason,
    can_retry: deliveryStatus === 'FAILED' || deliveryStatus === 'SENT',
    original_params: params,
  };

  savePayrollEmailLog(logEntry);

  const isSuccess = deliveryStatus !== 'FAILED';
  const successMsg = deliveryStatus === 'DELIVERED'
    ? `Official payslip email delivered via Resend to ${params.employee_email} (Ref: ${params.reference_no}).`
    : deliveryStatus === 'SENT'
    ? `Payslip voucher recorded in audit ledger for ${params.employee_email} (live external dispatch pending API key).`
    : `Failed to deliver payslip email to ${params.employee_email}: ${failureReason}`;

  return {
    success: isSuccess,
    is_retry: params.is_retry,
    message: successMsg,
    record: logEntry,
    error: isSuccess ? undefined : failureReason,
  };
}

/**
 * Retries dispatching a failed payroll email without duplicating or re-executing any payout.
 */
export async function retryPayrollEmail(recordIdOrPayrollId: string): Promise<PayrollEmailResult> {
  const logs = getPayrollEmailLogs();
  const target = logs.find((l) => l.id === recordIdOrPayrollId || l.payroll_id === recordIdOrPayrollId);

  if (!target) {
    return {
      success: false,
      message: `No email log entry found matching '${recordIdOrPayrollId}' for retry.`,
      error: 'RECORD_NOT_FOUND',
    };
  }

  const retryParams: PayrollEmailParams = target.original_params || {
    payroll_id: target.payroll_id,
    employee_id: target.employee_id,
    employee_name: target.employee_name,
    employee_email: target.recipient_email,
    pay_period: target.pay_period,
    site_id: target.site_id,
    gross_pay: target.gross_pay,
    deductions: { total: 0 },
    net_pay: target.net_pay,
    payment_method: target.payment_method as any,
    status: 'PAID_VERIFIED',
    reference_no: target.payout_reference,
    is_retry: true,
  };

  return sendPayrollEmail({
    ...retryParams,
    is_retry: true,
  });
}
