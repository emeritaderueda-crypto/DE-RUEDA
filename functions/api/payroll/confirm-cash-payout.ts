import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../_common.js';
import { d1AddAuditLog } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  // 1. Strict Authorization check against D1 sessions
  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1', 'admin 2', 'site head']);
  if (auth.errorResponse) return auth.errorResponse;
  const user = auth.user!;

  // 2. Parse request payload
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON payload', 400, 'MALFORMED_JSON');
  }

  const { payroll_id, employee_id, pay_period, amount, photo_evidence_url, site_id, witness_notes } = body;

  // 3. Site Scope Isolation Check
  if (site_id && user.role !== 'ceo' && user.role !== 'admin 1') {
    const assignedSites: string[] = user.assignedSites || [];
    if (!assignedSites.includes('ALL') && !assignedSites.includes(site_id)) {
      return errorResponse(`Site Isolation Security Violation: Role '${user.role}' assigned to sites [${assignedSites.join(', ')}] cannot perform actions on '${site_id}'.`, 403, 'SITE_ISOLATION_VIOLATION');
    }
  }

  // 4. Validation: Required fields
  if (!payroll_id || !employee_id || !amount || !pay_period) {
    return errorResponse('Missing required payroll details: payroll_id, employee_id, pay_period, and amount are required.', 400, 'MISSING_FIELDS');
  }

  // 5. Validation: Strict Recipient Photo Evidence (Compliance requirement)
  if (!photo_evidence_url || typeof photo_evidence_url !== 'string' || photo_evidence_url.trim().length < 10) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'DOLE & Enterprise Compliance: Cash payroll strictly requires a recipient photo proof of receipt before payment can be confirmed.',
        requirement: 'PHOTO_EVIDENCE_MANDATORY',
      }),
      {
        status: 400,
        headers: CORS_HEADERS,
      }
    );
  }

  const receiptId = `CSH-REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const receiptRecord = {
    receipt_id: receiptId,
    payroll_id,
    employee_id,
    pay_period,
    amount: Number(amount),
    photo_evidence_url,
    confirmed_by: user.email,
    confirmed_role: user.role,
    timestamp: now,
    witness_notes: witness_notes || 'Confirmed with recipient photo evidence.',
  };

  try {
    await env.DB!.prepare(`
      INSERT INTO cash_receipts (
        receipt_id, payroll_id, employee_id, pay_period, amount, photo_evidence_url, confirmed_by, confirmed_role, timestamp, witness_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      receiptRecord.receipt_id,
      receiptRecord.payroll_id,
      receiptRecord.employee_id,
      receiptRecord.pay_period,
      receiptRecord.amount,
      receiptRecord.photo_evidence_url,
      receiptRecord.confirmed_by,
      receiptRecord.confirmed_role,
      receiptRecord.timestamp,
      receiptRecord.witness_notes
    ).run();

    await d1AddAuditLog(env.DB!, {
      id: `SEC-LOG-${Date.now()}`,
      timestamp: now,
      action: 'LOGIN_SUCCESS',
      actorEmail: user.email,
      actorRole: user.role,
      targetEmail: employee_id,
      details: `Cash wage released for ${employee_id} (₱${amount}) with verified recipient photo evidence. Pay period: ${pay_period}.`,
      status: 'SUCCESS',
    });
  } catch (dbErr: any) {
    return errorResponse(`Failed to persist cash receipt to D1: ${dbErr?.message || dbErr}`, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Cash payout verified and recorded with mandatory recipient photo evidence.',
    receipt: receiptRecord,
  });
}
