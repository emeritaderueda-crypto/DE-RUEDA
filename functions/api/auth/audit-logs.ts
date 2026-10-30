import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS, getAuthenticatedUserFromRequest } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const auth = await getAuthenticatedUserFromRequest(request, env, ['ceo', 'admin 1']);
  if (auth.errorResponse) return auth.errorResponse;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);

  try {
    const rows = (await env.DB!.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').bind(limit).all<any>()).results || [];
    const logs = rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      actorEmail: r.actor_email,
      actorRole: r.actor_role,
      targetEmail: r.target_email,
      details: r.details,
      status: r.status,
      ipAddress: r.ip_address,
    }));

    return jsonResponse({
      success: true,
      logs,
    });
  } catch (err: any) {
    return errorResponse(`Failed to query audit logs from D1: ${err?.message || err}`, 500);
  }
}
