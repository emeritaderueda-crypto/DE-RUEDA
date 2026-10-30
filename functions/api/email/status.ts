import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: PagesEnv }): Promise<Response> {
  const { env } = context;
  const apiKey = (env.RESEND_API_KEY || env.EMAIL_API_KEY || '').trim();
  const isConfigured = Boolean(apiKey.length > 0);
  const from = env.EMAIL_FROM || 'De Rueda Payroll <payroll@deruedaconstruction.com>';

  return jsonResponse({
    success: true,
    provider: env.EMAIL_PROVIDER || 'resend',
    isConfigured,
    from,
    status: isConfigured ? 'CONFIGURED' : 'EMAIL_NOT_CONFIGURED',
    note: isConfigured
      ? 'Resend API operational for official payroll notifications.'
      : 'Email provider not configured (RESEND_API_KEY missing). Outgoing emails paused safely without disrupting payouts.',
  });
}
