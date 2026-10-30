import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../../_common.js';
import { d1AddAuditLog } from '../../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1']);
  if (auth.errorResponse) return auth.errorResponse;
  const user = auth.user!;

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

  try {
    await env.DB!.prepare(`
      UPDATE users SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?
    `).bind(newStatus, user.email, now, now, user_id).run();

    await d1AddAuditLog(env.DB!, {
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
    return errorResponse(`Approval error in D1: ${err?.message || err}`, 500);
  }
}
