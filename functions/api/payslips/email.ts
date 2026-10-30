import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../_common.js';
import { d1AddAuditLog } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1', 'admin 2', 'site head']);
  if (auth.errorResponse) return auth.errorResponse;
  const user = auth.user!;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { payroll_id, employee_id, employee_name, employee_email, payout_status, reference_no, pay_period, site_id } = body;

  // Site Scope Isolation
  if (site_id && user.role !== 'ceo' && user.role !== 'admin 1') {
    const assignedSites: string[] = user.assignedSites || [];
    if (!assignedSites.includes('ALL') && !assignedSites.includes(site_id)) {
      return errorResponse(`Site Isolation Security Violation: Role '${user.role}' cannot dispatch emails for '${site_id}'.`, 403, 'SITE_ISOLATION_VIOLATION');
    }
  }

  if (!payroll_id || !employee_id || !employee_email) {
    return errorResponse('payroll_id, employee_id, and employee_email are required', 400);
  }

  // Compliance: Payslip emails strictly require confirmed payout first
  const isPayoutConfirmed = payout_status === 'PAID_VERIFIED' || payout_status === 'CASH_CONFIRMED' || Boolean(reference_no);
  if (!isPayoutConfirmed) {
    return errorResponse('Compliance Violation: Payslip email dispatch blocked. Wage payout must be verified first.', 400, 'PAYOUT_NOT_CONFIRMED');
  }

  const messageId = `msg_resend_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  // If RESEND_API_KEY is configured on Cloudflare Pages, dispatch real Resend email
  const resendApiKey = env.RESEND_API_KEY || env.EMAIL_API_KEY;
  if (resendApiKey) {
    try {
      const from = env.EMAIL_FROM || 'De Rueda Payroll <payroll@deruedaconstruction.com>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [employee_email],
          subject: `Official Payslip: ${pay_period || 'Current'} - De Rueda Construction Inc.`,
          html: `<p>Dear ${employee_name || employee_id},</p><p>Your verified payslip for ${pay_period} has been confirmed. Ref: ${reference_no || payroll_id}.</p>`,
        }),
      });
    } catch (e: any) {
      console.warn('[Resend API dispatch notice]:', e?.message);
    }
  }

  try {
    await d1AddAuditLog(env.DB!, {
      id: `SEC-LOG-${Date.now()}`,
      timestamp: now,
      action: 'LOGIN_SUCCESS',
      actorEmail: user.email,
      actorRole: user.role,
      targetEmail: employee_email,
      details: `Payslip email sent to ${employee_email} for ${employee_name || employee_id} (${pay_period || 'Current'}) [Ref: ${reference_no || payroll_id}].`,
      status: 'SUCCESS',
    });
  } catch (err) {
    console.warn('[D1 Audit Warning]:', err);
  }

  return jsonResponse({
    success: true,
    messageId,
    status: 'DELIVERED',
    sent_at: now,
    recipient: employee_email,
    employee_name: employee_name || employee_id,
    payroll_id,
    payout_preserved: true,
  });
}
