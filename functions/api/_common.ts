import { D1Database, ensureD1Schema, d1GetUserByEmail, d1CreateSession, d1GetSession, d1RevokeSession, d1AddAuditLog } from '../../src/server/d1Database.js';

export interface PagesEnv {
  DB?: D1Database;
  SESSION_SECRET?: string;
  PBKDF2_PEPPER?: string;
  BACKEND_URL?: string;
  GEMINI_API_KEY?: string;
  PAYMONGO_SECRET_KEY?: string;
  EMAIL_API_KEY?: string;
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
 * Authoritative Pre-Seeded Corporate Accounts for Cloudflare Pages (Fail-Safe)
 * Guaranteed to match database seeds exactly, so authorized accounts ALWAYS log in
 * even during initial Cloudflare D1 provisioning or cold-starts.
 */
export const FALLBACK_ACCOUNTS = [
  // 1. Developer Account: marjoncompany@gmail.com
  {
    id: 'USR-DEV-MARJON',
    email: 'marjoncompany@gmail.com',
    name: 'Developer & Lead Systems Architect (Marjon Company)',
    role: 'ceo' as const,
    position: 'Developer / Super Admin',
    assignedSites: ['ALL'],
    company: 'De Rueda Construction Inc.',
    passwordSalt: 'drc_salt_dev_2026',
    passwordHash: '1b4f92f96bd1e9fdc4580f6f595edf232187bd8b755b06de5f6224db0aa16d1307c299092925bfab9ab4db29cae074a30139d465abf49af4e9e613f46287699a',
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    backupCodesHashed: [
      'c1b07221b34bb7678fc7bbd5668aa1c8ff4a3901b87b7aebba7101adfe5606d39d91f216dd1972f7d6391a6d71b3e92cf4a01c40be6a89c8d5d14cf05c3c0d01',
    ],
    status: 'active' as const,
    approvedBy: 'Corporate Charter / Developer Provisioning',
    approvedAt: '2026-01-01T08:00:00Z',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
  },
  // 2. Executive CEO Account: emeritaderueda@gmail.com
  {
    id: 'USR-CEO-EMERITA',
    email: 'emeritaderueda@gmail.com',
    name: 'Emerita De Rueda',
    role: 'ceo' as const,
    position: 'Chief Executive Officer (CEO)',
    assignedSites: ['ALL'],
    company: 'De Rueda Construction Inc.',
    passwordSalt: 'drc_salt_ceo_2026',
    passwordHash: '3ea75e47c1f8a846c4aa637da7576550ec4feef2287f34c26a02b793132e0e0a5bb86e885dcf545191cfaefcbb3d8c116ff1a0dbdaea502591ae9a04a5fb8cb6',
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    backupCodesHashed: [
      'c1b07221b34bb7678fc7bbd5668aa1c8ff4a3901b87b7aebba7101adfe5606d39d91f216dd1972f7d6391a6d71b3e92cf4a01c40be6a89c8d5d14cf05c3c0d01',
    ],
    status: 'active' as const,
    approvedBy: 'Board of Directors / Corporate Charter',
    approvedAt: '2026-01-01T08:00:00Z',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
  },
];
