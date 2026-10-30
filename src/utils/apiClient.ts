/**
 * Resilient API Client Utility for De Rueda Construction ERP
 * Guarantees safe response parsing without ever throwing 'Unexpected end of JSON input'.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  rawText?: string;
  error?: string;
}

/**
 * Resolves full API URL with optional VITE_API_BASE_URL
 */
export function resolveApiUrl(path: string): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (baseUrl && path.startsWith('/api/')) {
    return `${baseUrl}${path}`;
  }
  return path;
}

/**
 * Safely executes a fetch request, parsing JSON with fail-safe guards against
 * empty bodies, HTML error pages, and network failures.
 */
export async function safeFetchJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const targetUrl = resolveApiUrl(path);

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Attach session token from storage if available and not explicitly provided
  const existingToken =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('DERUEDA_AUTH_TOKEN') || localStorage.getItem('DERUEDA_AUTH_TOKEN')
      : null;

  if (existingToken && !options.headers) {
    defaultHeaders['Authorization'] = `Bearer ${existingToken}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers: mergedHeaders,
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const rawText = await response.text();

    // 1. Guard against empty response body
    if (!rawText || rawText.trim().length === 0) {
      return {
        ok: response.ok,
        status: response.status,
        data: {
          success: response.ok,
          error: response.ok ? undefined : `Server returned an empty response (HTTP ${response.status}).`,
        } as T,
        rawText: '',
      };
    }

    // 2. Guard against HTML returned on unhandled routes or 404/502 fallbacks
    const trimmed = rawText.trim();
    if (
      contentType.includes('text/html') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<head')
    ) {
      return {
        ok: false,
        status: response.status,
        data: {
          success: false,
          error: `Authentication endpoint returned an unexpected HTML document instead of JSON (HTTP ${response.status}). Please check network connection or Cloudflare Pages Functions configuration.`,
        } as T,
        rawText,
        error: 'NON_JSON_RESPONSE',
      };
    }

    // 3. Parse JSON safely
    try {
      const parsedData = JSON.parse(rawText) as T;
      return {
        ok: response.ok,
        status: response.status,
        data: parsedData,
        rawText,
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        data: {
          success: false,
          error: `Malformed JSON response from server (HTTP ${response.status}).`,
        } as T,
        rawText,
        error: 'JSON_PARSE_ERROR',
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: netErr?.message || 'Network connection failed while communicating with the server.',
      } as T,
      error: 'NETWORK_ERROR',
    };
  }
}
