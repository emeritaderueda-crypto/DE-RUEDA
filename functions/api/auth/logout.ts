import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';
import { d1RevokeSession } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && env.DB) {
    try {
      await d1RevokeSession(env.DB, token);
    } catch {
      // ignore
    }
  }

  return jsonResponse({
    success: true,
    message: 'Session revoked successfully.',
  });
}
