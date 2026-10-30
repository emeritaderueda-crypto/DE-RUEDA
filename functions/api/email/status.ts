import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: PagesEnv }): Promise<Response> {
  const { env } = context;
  const isConfigured = Boolean(env.EMAIL_API_KEY && env.EMAIL_API_KEY.trim().length > 0);

  return jsonResponse({
    success: true,
    provider: 'resend',
    isConfigured,
    from: 'De Rueda Payroll <payroll@deruedaconstruction.com>',
    status: isConfigured ? 'CONFIGURED' : 'EMAIL_NOT_CONFIGURED',
    note: isConfigured
      ? 'Resend API operational for official payroll notifications.'
      : 'Email provider not configured. Outgoing emails paused safely without disrupting payouts.',
  });
}
