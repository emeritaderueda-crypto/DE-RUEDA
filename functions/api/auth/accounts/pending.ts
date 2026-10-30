import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1']);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const rows = (await env.DB!.prepare("SELECT * FROM users WHERE status = 'pending_approval' ORDER BY created_at DESC").all<any>()).results || [];
    const pendingUsers = rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      position: r.position,
      assignedSites: JSON.parse(r.assigned_sites || '[]'),
      company: r.company,
      createdAt: r.created_at,
      status: r.status,
    }));

    return jsonResponse({
      success: true,
      pending_accounts: pendingUsers,
    });
  } catch (err: any) {
    return errorResponse(`Failed to query pending accounts from D1: ${err?.message || err}`, 500);
  }
}
