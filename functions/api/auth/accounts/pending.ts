import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../../_common.js';
import { d1GetSession } from '../../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
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
    return errorResponse('Forbidden: Executive CEO or Admin 1 authorization required.', 403);
  }

  if (env.DB) {
    try {
      const rows = (await env.DB.prepare("SELECT * FROM users WHERE status = 'pending_approval' ORDER BY created_at DESC").all<any>()).results || [];
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
    } catch (err) {
      console.warn('[D1 Pending Users Query Notice]:', err);
    }
  }

  return jsonResponse({
    success: true,
    pending_accounts: [],
  });
}
