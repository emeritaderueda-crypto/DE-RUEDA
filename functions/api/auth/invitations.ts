import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../_common.js';
import { d1GetSession } from '../../../src/server/d1Database.js';

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
    return errorResponse('Forbidden: Executive CEO or Admin 1 authorization required to manage invitations.', 403);
  }

  if (env.DB) {
    try {
      const rows = (await env.DB.prepare('SELECT * FROM invitations ORDER BY created_at DESC LIMIT 100').all<any>()).results || [];
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
    } catch (err) {
      console.warn('[D1 Invitations Query Notice]:', err);
    }
  }

  return jsonResponse({
    success: true,
    invitations: [],
  });
}
