import { PagesEnv, jsonResponse, CORS_HEADERS } from '../_common.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: PagesEnv }): Promise<Response> {
  const { env } = context;
  const isKeyConfigured = Boolean(env.PAYMONGO_SECRET_KEY && env.PAYMONGO_SECRET_KEY.trim().length > 0);

  return jsonResponse({
    status: isKeyConfigured ? 'CONNECTED' : 'MAINTENANCE',
    message: isKeyConfigured
      ? 'PayMongo payment gateway is operational.'
      : 'Payment provider temporarily unavailable — maintenance',
    provider: 'PayMongo',
    currency: 'PHP',
    timestamp: new Date().toISOString(),
  });
}
