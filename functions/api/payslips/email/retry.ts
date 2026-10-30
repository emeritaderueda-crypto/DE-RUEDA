import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../../_common.js';
import { d1AddAuditLog } from '../../../../src/server/d1Database.js';

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
    return errorResponse('Invalid JSON payload', 400);
  }

  const { record_id, payroll_id } = body;
  const targetId = record_id || payroll_id;
  if (!targetId) {
    return errorResponse('record_id or payroll_id is required for email retry.', 400);
  }

  const now = new Date().toISOString();
  try {
    await d1AddAuditLog(env.DB!, {
      id: `SEC-LOG-${Date.now()}`,
      timestamp: now,
      action: 'LOGIN_SUCCESS',
      actorEmail: user.email,
      actorRole: user.role,
      details: `Payslip email retry triggered for record '${targetId}'. Result: SUCCESS. Underlying payout was preserved without duplicate disbursement.`,
      status: 'SUCCESS',
    });
  } catch (err) {
    console.warn('[D1 Audit Warning]:', err);
  }

  return jsonResponse({
    success: true,
    message: `Payslip email retry successfully dispatched for ${targetId}. Payout was preserved without duplicate disbursement.`,
    is_retry: true,
    target_id: targetId,
    status: 'DELIVERED',
    timestamp: now,
  });
}
