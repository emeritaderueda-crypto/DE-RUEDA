import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../../_common.js';
import { d1AddAuditLog } from '../../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo']);
  if (auth.errorResponse) return auth.errorResponse;
  const user = auth.user!;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { masterSwitchOn, switch_on, reason } = body;
  const newState = typeof masterSwitchOn === 'boolean' ? masterSwitchOn : Boolean(switch_on);
  const now = new Date().toISOString();

  try {
    await env.DB!.prepare(`
      INSERT INTO master_cutoff (id, switch_on, updated_at, updated_by, reason)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        switch_on = excluded.switch_on,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by,
        reason = excluded.reason
    `).bind(
      newState ? 1 : 0,
      now,
      user.email,
      reason || 'Master cutoff state changed by Executive CEO'
    ).run();

    await env.DB!.prepare(`
      INSERT INTO master_cutoff_history (timestamp, actor, new_state, reason, result)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      now,
      user.email,
      newState ? 'ENGAGED' : 'DISENGAGED',
      reason || 'Executive Toggle',
      'SUCCESS'
    ).run();

    await d1AddAuditLog(env.DB!, {
      id: `SEC-LOG-${Date.now()}`,
      timestamp: now,
      action: 'LOGIN_SUCCESS',
      actorEmail: user.email,
      actorRole: user.role,
      details: `Master transaction cutoff set to ${newState ? 'ON (Active)' : 'OFF (Locked)'}. Reason: ${reason || 'Executive Toggle'}.`,
      status: 'SUCCESS',
    });

    return jsonResponse({
      success: true,
      masterSwitchOn: newState,
      switch_on: newState,
      isCutoffEngaged: !newState,
      updated_at: now,
      actor: user.email,
      reason: reason || 'Executive Toggle',
    });
  } catch (dbErr: any) {
    return errorResponse(`D1 database error toggling master cutoff: ${dbErr?.message || dbErr}`, 500);
  }
}
