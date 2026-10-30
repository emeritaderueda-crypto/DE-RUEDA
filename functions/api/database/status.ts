import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';
import { ensureD1Schema } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: PagesEnv }): Promise<Response> {
  const { env } = context;

  const statusInfo: any = {
    platform: 'Cloudflare Pages Functions',
    timestamp: new Date().toISOString(),
    d1_bound: Boolean(env.DB),
    backend_proxy_configured: Boolean(env.BACKEND_URL),
    session_secret_configured: Boolean(env.SESSION_SECRET),
    pepper_configured: Boolean(env.PBKDF2_PEPPER),
  };

  if (env.DB) {
    try {
      const initResult = await ensureD1Schema(env.DB);
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
      const sessionCount = await env.DB.prepare('SELECT COUNT(*) as count FROM sessions').first<{ count: number }>();
      const auditCount = await env.DB.prepare('SELECT COUNT(*) as count FROM audit_logs').first<{ count: number }>();
      const projectCount = await env.DB.prepare('SELECT COUNT(*) as count FROM projects').first<{ count: number }>();
      const cutoff = await env.DB.prepare('SELECT switch_on FROM master_cutoff WHERE id = 1').first<{ switch_on: number }>();

      statusInfo.database = {
        provider: 'Cloudflare D1',
        live_connectivity: true,
        database_name: 'derueda-erp-db',
        database_id: '7cbf9162-4195-4a90-aca5-1ade12e736f0',
        schema_status: initResult.message,
        users_count: userCount?.count || 0,
        active_sessions_count: sessionCount?.count || 0,
        audit_logs_count: auditCount?.count || 0,
        projects_count: projectCount?.count || 0,
        master_cutoff_state: cutoff?.switch_on === 1 ? 'ON' : 'OFF',
      };
    } catch (err: any) {
      statusInfo.database = {
        provider: 'Cloudflare D1 (Error)',
        live_connectivity: false,
        error: err?.message || String(err),
      };
    }
  } else {
    statusInfo.database = {
      provider: 'None (D1 binding not detected)',
      live_connectivity: false,
      notice: 'To enable persistent D1 database storage on Cloudflare Pages, bind the D1 database named "derueda-erp-db" (ID: 7cbf9162-4195-4a90-aca5-1ade12e736f0) with variable name "DB" in Cloudflare Pages dashboard under Settings > Functions > D1 database bindings.',
      command_help: 'npx wrangler d1 migrations apply derueda-erp-db --remote',
    };
  }

  return jsonResponse({
    success: true,
    status: statusInfo,
  });
}
