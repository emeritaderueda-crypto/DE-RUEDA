import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const token = (body.token || '').toString().trim();
  if (!token) {
    return errorResponse('Invitation token is required', 400);
  }

  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT * FROM invitations WHERE token = ?').bind(token).first<any>();
      if (!row) {
        return errorResponse('Invalid or unknown invitation token.', 404, 'INVITATION_NOT_FOUND');
      }
      if (row.status !== 'PENDING') {
        return errorResponse(`Invitation token is ${row.status.toLowerCase()}.`, 400, 'INVITATION_INACTIVE');
      }
      return jsonResponse({
        success: true,
        invitation: {
          token: row.token,
          email: row.email,
          company: row.company,
          assignedRole: row.assigned_role,
          assignedPosition: row.assigned_position,
          assignedSites: JSON.parse(row.assigned_sites || '[]'),
          expiresAt: row.expires_at,
          status: row.status,
        },
      });
    } catch (err: any) {
      console.warn('[D1 Invitation Check Notice]:', err);
    }
  }

  // Fallback demo tokens for test environments
  if (token === 'INV-VALID-TEST') {
    return jsonResponse({
      success: true,
      invitation: {
        token: 'INV-VALID-TEST',
        email: 'invited.sitehead@deruedaconstruction.com',
        company: 'De Rueda Construction Inc.',
        assignedRole: 'site head',
        assignedPosition: 'Project Site Head Engineer',
        assignedSites: ['SITE-001'],
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'PENDING',
      },
    });
  }

  return errorResponse('Invalid or unknown invitation token. Registration is strictly invitation-only.', 404, 'INVITATION_NOT_FOUND');
}
