import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: PagesEnv }): Promise<Response> {
  const { env } = context;

  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT switch_on, updated_at, reason FROM master_cutoff WHERE id = 1').first<any>();
      if (row) {
        return jsonResponse({
          success: true,
          switch_on: Boolean(row.switch_on),
          updated_at: row.updated_at,
          reason: row.reason,
          status: Boolean(row.switch_on) ? 'DISBURSEMENTS_ACTIVE' : 'LOCKED_FAIL_CLOSED',
        });
      }
    } catch {
      // ignore
    }
  }

  // Safe fail-closed baseline
  return jsonResponse({
    success: true,
    switch_on: false,
    status: 'LOCKED_FAIL_CLOSED',
    reason: 'Initial security baseline cutover: Master cut-off engaged (fail-closed)',
    updated_at: new Date().toISOString(),
  });
}
