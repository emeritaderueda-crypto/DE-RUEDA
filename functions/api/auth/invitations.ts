import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1']);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const rows = (await env.DB!.prepare('SELECT * FROM invitations ORDER BY created_at DESC LIMIT 100').all<any>()).results || [];
    const invitations = rows.map((r: any) => ({
      id: r.id,
      token: r.token,
      email: r.email,
      company: r.company,
      assignedRole: r.assigned_role,
      assignedPosition: r.assigned_position,
      assignedSites: JSON.parse(r.assigned_sites || '[]'),
      createdBy: r.created_by,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      status: r.status,
      usedAt: r.used_at,
      usedByUserId: r.used_by_user_id,
      notes: r.notes,
    }));

    return jsonResponse({
      success: true,
      invitations,
    });
  } catch (err: any) {
    return errorResponse(`Failed to query invitations from D1: ${err?.message || err}`, 500);
  }
}
