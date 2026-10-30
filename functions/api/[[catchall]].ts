import { PagesEnv, CORS_HEADERS, jsonResponse } from './_common.js';

export async function onRequest(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  // 1. If a backend Node.js server is configured, proxy the request to it
  if (env.BACKEND_URL && env.BACKEND_URL.trim().length > 0) {
    try {
      const backendUrl = env.BACKEND_URL.trim().replace(/\/$/, '');
      const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      let body: any = undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.arrayBuffer();
      }

      const proxyRes = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(proxyRes.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      console.error('[Cloudflare Proxy Error] Backend dispatch failed:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Backend service unavailable at ${env.BACKEND_URL}. Underlying error: ${err?.message || err}`,
          code: 'BACKEND_PROXY_FAILED',
        }),
        {
          status: 502,
          headers: CORS_HEADERS,
        }
      );
    }
  }

  // 2. Safe Edge Response for unhandled routes - ALWAYS valid JSON, NEVER HTML
  return new Response(
    JSON.stringify({
      success: false,
      error: `API route not found: ${url.pathname}. To connect full Node.js operational features, configure BACKEND_URL in Cloudflare Pages environment variables.`,
      code: 'ROUTE_NOT_IMPLEMENTED',
      path: url.pathname,
      platform: 'Cloudflare Pages Functions',
    }),
    {
      status: 404,
      headers: CORS_HEADERS,
    }
  );
}
