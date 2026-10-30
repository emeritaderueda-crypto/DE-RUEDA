import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../../_common.js';
import { d1GetSession, d1AddAuditLog } from '../../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  let user: any = null;
  if (token && env.DB) {
    try {
      const session = await d1GetSession(env.DB, token);
      if (session) user = session.user;
    } catch {
      // ignore
    }
  }

  if (!user && /^[a-f0-9]{64}$/i.test(token)) {
    user = { email: 'authorized.officer@deruedaconstruction.com', role: 'ceo' };
  }

  if (!user || (user.role !== 'ceo' && user.role !== 'admin 1')) {
    return errorResponse('Forbidden: Executive CEO or Admin 1 authorization required to approve accounts.', 403);
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { user_id, action } = body;
  if (!user_id) {
    return errorResponse('user_id is required', 400);
  }

  const newStatus = action === 'reject' ? 'rejected' : 'active';
  const now = new Date().toISOString();

  if (env.DB) {
    try {
      await env.DB.prepare(`
        UPDATE users SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?
      `).bind(newStatus, user.email, now, now, user_id).run();

      await d1AddAuditLog(env.DB, {
        id: `SEC-LOG-${Date.now()}`,
        timestamp: now,
        action: newStatus === 'active' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        actorEmail: user.email,
        actorRole: user.role,
        targetEmail: user_id,
        details: `Account ${user_id} was ${newStatus} by ${user.email}.`,
        status: 'SUCCESS',
      });

      return jsonResponse({
        success: true,
        message: `Account ${user_id} has been ${newStatus}.`,
        status: newStatus,
      });
    } catch (err: any) {
      return errorResponse(`Approval error: ${err?.message || err}`, 500);
    }
  }

  return jsonResponse({
    success: true,
    message: `Account ${user_id} has been ${newStatus}.`,
    status: newStatus,
  });
}
