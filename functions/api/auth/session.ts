import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../_common.js';
import { d1GetSession } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequest(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Extract token from header or query or body
  const authHeader = request.headers.get('authorization') || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token && request.method === 'POST') {
    try {
      const body: any = await request.json();
      token = (body.token || body.session_token || '').toString().trim();
    } catch {
      // ignore
    }
  }

  if (!token) {
    const url = new URL(request.url);
    token = (url.searchParams.get('token') || '').trim();
  }

  if (!token) {
    return errorResponse('Missing authorization session token', 401, 'MISSING_TOKEN');
  }

  if (!env.DB) {
    return errorResponse('Database service unavailable: D1 binding required for session verification.', 503, 'DATABASE_UNAVAILABLE');
  }

  // Validate session strictly against Cloudflare D1
  try {
    const session = await d1GetSession(env.DB, token);
    if (session) {
      return jsonResponse({
        success: true,
        authenticated: true,
        session,
        user: session.user,
      });
    }
  } catch (dbErr: any) {
    console.error('[D1 Session Lookup Error]:', dbErr);
    return errorResponse('Database error verifying session', 500, 'D1_QUERY_ERROR');
  }

  return errorResponse('Session token expired or invalid', 401, 'INVALID_SESSION');
}
