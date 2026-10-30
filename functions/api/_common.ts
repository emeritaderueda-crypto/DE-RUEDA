import { D1Database, ensureD1Schema, d1GetUserByEmail, d1CreateSession, d1GetSession, d1RevokeSession, d1AddAuditLog } from '../../src/server/d1Database.js';

export interface PagesEnv {
  DB?: D1Database;
  SESSION_SECRET?: string;
  PBKDF2_PEPPER?: string;
  BACKEND_URL?: string;
  GEMINI_API_KEY?: string;
  PAYMONGO_SECRET_KEY?: string;
  EMAIL_API_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
}

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(message: string, status = 400, code?: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: code || 'REQUEST_FAILED',
    }),
    {
      status,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Constant-time string equality to prevent timing attacks
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * PBKDF2 Password Hashing using native Web Crypto (Cloudflare Workers & Browser compatible)
 * 10,000 iterations, SHA-256, 64-byte key (512 bits) - 100% bit-compatible with Node.js crypto
 */
export async function hashPasswordWeb(password: string, salt: string, pepper = ''): Promise<string> {
  const enc = new TextEncoder();
  const secretKey = pepper ? `${password}:${pepper}` : password;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    512
  );
  const byteArray = new Uint8Array(derivedBits);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies password against stored PBKDF2 hash, testing peppered first then unpeppered for compatibility.
 */
export async function verifyPasswordWeb(
  password: string,
  salt: string,
  storedHash: string,
  pepper = ''
): Promise<boolean> {
  if (pepper) {
    const pepperedHash = await hashPasswordWeb(password, salt, pepper);
    if (constantTimeEqual(pepperedHash, storedHash)) return true;
  }
  const unpepperedHash = await hashPasswordWeb(password, salt, '');
  return constantTimeEqual(unpepperedHash, storedHash);
}

/**
 * Base32 Decode for RFC 6238 TOTP validation
 */
function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const clean = base32.replace(/=+$/, '').toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

/**
 * Base32 Encode for RFC 6238 TOTP secret generation
 */
export function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Generates dynamic RFC 6238 Base32 Secret using Web Crypto
 */
export function generateTotpSecretWeb(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * RFC 6238 Time-Based One-Time Password generator using Web Crypto HMAC-SHA1
 */
export async function generateTotpWeb(secret: string, epochSeconds: number, windowOffset = 0): Promise<string> {
  const keyBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const timeStep = BigInt(Math.floor(epochSeconds / 30) + windowOffset);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigInt64(0, timeStep);
  const sig = await crypto.subtle.sign('HMAC', key, buffer);
  const hmac = new Uint8Array(sig);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verifies 6-digit TOTP token with +/- 1 time step tolerance (90 second window)
 */
export async function verifyTotpWeb(token: string, secret: string): Promise<boolean> {
  const clean = token.trim();
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Math.floor(Date.now() / 1000);
  for (const offset of [0, -1, 1]) {
    const expected = await generateTotpWeb(secret, now, offset);
    if (constantTimeEqual(clean, expected)) return true;
  }
  return false;
}

/**
 * Generates high-entropy crypto random session token
 */
export function generateSessionTokenWeb(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates random cryptographic salt
 */
export function generateSaltWeb(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Authoritative session authenticator for Cloudflare Pages Functions.
 * Validates token strictly against Cloudflare D1 persistent sessions.
 * Never allows arbitrary bypasses.
 */
export async function getAuthenticatedUserFromRequest(
  request: Request,
  env: PagesEnv,
  allowedRoles?: string[]
): Promise<{ user: any | null; errorResponse: Response | null }> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return {
      user: null,
      errorResponse: errorResponse('Authentication required: missing Bearer token', 401, 'UNAUTHORIZED'),
    };
  }

  if (!env.DB) {
    return {
      user: null,
      errorResponse: errorResponse('Database service unavailable: Cloudflare D1 binding required', 503, 'DATABASE_UNAVAILABLE'),
    };
  }

  try {
    const session = await d1GetSession(env.DB, token);
    if (!session || !session.user) {
      return {
        user: null,
        errorResponse: errorResponse('Session token expired or invalid', 401, 'INVALID_SESSION'),
      };
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      return {
        user: null,
        errorResponse: errorResponse(`Forbidden: Role '${session.user.role}' is not authorized for this resource`, 403, 'FORBIDDEN'),
      };
    }

    return { user: session.user, errorResponse: null };
  } catch (err: any) {
    return {
      user: null,
      errorResponse: errorResponse('Database error validating session', 500, 'D1_QUERY_ERROR'),
    };
  }
}


