interface Env {
  GEMINI_API_KEY?: string;
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const geminiApiKey = context.env?.GEMINI_API_KEY || '';
  return new Response(
    JSON.stringify({
      status: 'ok',
      platform: 'Cloudflare Pages Functions',
      system: 'De Rueda Construction Management System',
      gemini_configured: Boolean(geminiApiKey),
      model: 'gemini-3.8-flash',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
