import {
  PagesEnv,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
  hashPasswordWeb,
  generateSaltWeb,
  generateTotpSecretWeb,
  constantTimeEqual,
} from '../_common.js';
import { ensureD1Schema, d1AddAuditLog } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// In-memory rate limiting map for edge requests (max 5 failed attempts per IP per 10 minutes)
const PROVISIONING_RATE_LIMIT = new Map<string, { attempts: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = PROVISIONING_RATE_LIMIT.get(ip);
  if (!entry || entry.resetAt < now) {
    PROVISIONING_RATE_LIMIT.set(ip, { attempts: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.attempts >= 5) {
    return false;
  }
  entry.attempts += 1;
  return true;
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;
  const clientIp = request.headers.get('cf-connecting-ip') || 'unknown-client';

  // 1. Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    return errorResponse(
      'Too many failed provisioning attempts. Access throttled for 10 minutes.',
      429,
      'RATE_LIMITED'
    );
  }

  // 2. Strict Database Verification
  if (!env.DB) {
    return errorResponse(
      'Database service unavailable: Cloudflare D1 database binding "DB" is required for account provisioning.',
      503,
      'D1_DATABASE_UNAVAILABLE'
    );
  }

  await ensureD1Schema(env.DB);

  // 3. Strict Database Status Check: Is system already initialized?
  const existingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if (existingCount && existingCount.count > 0) {
    return errorResponse(
      'Initial account provisioning is permanently closed. The system already contains authorized corporate accounts. Additional accounts must be onboarded via invitation-only registration by an executive administrator.',
      403,
      'PROVISIONING_CLOSED'
    );
  }

  // 4. Secure One-Time Pre-Shared Authorization Check
  // The operator must provide the INITIAL_PROVISIONING_KEY or BOOTSTRAP_TOKEN configured in Cloudflare environment
  const expectedKey = (env.INITIAL_PROVISIONING_KEY || env.BOOTSTRAP_TOKEN || '').trim();
  if (!expectedKey) {
    return errorResponse(
      'Initial account provisioning is locked. The INITIAL_PROVISIONING_KEY environment secret must be configured in Cloudflare Pages dashboard before initial bootstrapping can proceed.',
      403,
      'PROVISIONING_LOCKED_UNCONFIGURED'
    );
  }

  let body: any = {};
  try {
    const rawText = await request.text();
    if (rawText && rawText.trim().length > 0) {
      body = JSON.parse(rawText);
    }
  } catch {
    return errorResponse('Invalid JSON payload in provisioning request', 400, 'MALFORMED_JSON');
  }

  // Extract provisioning authorization key from header or body
  const authHeader = request.headers.get('authorization') || '';
  const headerKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const customHeaderKey = (request.headers.get('x-provisioning-key') || '').trim();
  const bodyKey = (body.provisioning_key || body.bootstrap_token || '').toString().trim();
  const providedKey = headerKey || customHeaderKey || bodyKey;

  if (!providedKey || !constantTimeEqual(providedKey, expectedKey)) {
    // Record failed security audit event
    try {
      await d1AddAuditLog(env.DB, {
        id: `SEC-LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'LOGIN_FAILED',
        actorEmail: clientIp,
        actorRole: 'unauthorized',
        details: 'Failed attempt to execute initial admin provisioning with invalid provisioning key.',
        status: 'FAILED',
        ipAddress: clientIp,
      });
    } catch {
      // ignore
    }

    return errorResponse(
      'Unauthorized: invalid initial provisioning key. Initial setup is restricted to authorized systems administrators.',
      401,
      'INVALID_PROVISIONING_KEY'
    );
  }

  // 5. Validate Admin Profile Details
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  const fullName = (body.full_name || body.name || 'Executive CEO').toString().trim();

  if (!email || !password || password.length < 10) {
    return errorResponse(
      'Valid corporate email and high-strength password (minimum 10 characters) are required for initial executive provisioning.',
      400,
      'INVALID_CREDENTIALS_SPEC'
    );
  }

  const salt = generateSaltWeb();
  const passwordHash = await hashPasswordWeb(password, salt, env.PBKDF2_PEPPER || '');
  const mfaSecret = generateTotpSecretWeb(20);
  const now = new Date().toISOString();
  const userId = `USR-INITIAL-${Date.now()}`;

  // Generate 4 one-time backup recovery codes
  const rawCodes = [
    `RC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    `RC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    `RC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    `RC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  ];

  const hashedCodes: string[] = [];
  for (const c of rawCodes) {
    hashedCodes.push(await hashPasswordWeb(c, salt, env.PBKDF2_PEPPER || ''));
  }

  // 6. Atomic Concurrency Lock: Use metadata primary key 'initial_admin_provisioned'
  // If two requests race concurrently, the second INSERT into metadata will fail immediately.
  try {
    await env.DB.prepare(`
      INSERT INTO metadata (key, value, updated_at) VALUES ('initial_admin_provisioned', ?, ?)
    `).bind(userId, now).run();
  } catch {
    return errorResponse(
      'Provisioning lock collision: Initial administrator has already been initialized.',
      409,
      'PROVISIONING_RACE_DETECTED'
    );
  }

  // 7. Insert the Executive CEO Account
  try {
    await env.DB.prepare(`
      INSERT INTO users (
        id, email, name, role, position, assigned_sites, company,
        password_hash, password_salt, mfa_enabled, mfa_secret, backup_codes,
        status, approved_by, approved_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'ceo', 'Executive CEO', '["ALL"]', 'De Rueda Construction Inc.', ?, ?, 1, ?, ?, 'active', 'Initial Provisioning Authority', ?, ?, ?)
    `).bind(
      userId,
      email,
      fullName,
      passwordHash,
      salt,
      mfaSecret,
      JSON.stringify(hashedCodes),
      now,
      now,
      now
    ).run();

    await d1AddAuditLog(env.DB, {
      id: `SEC-LOG-${Date.now()}`,
      timestamp: now,
      action: 'LOGIN_SUCCESS',
      actorEmail: email,
      actorRole: 'ceo',
      details: `Initial Executive Administrator successfully provisioned into Cloudflare D1 with verified MFA secret. Initial provisioning is permanently closed.`,
      status: 'SUCCESS',
      ipAddress: clientIp,
    });

    return jsonResponse({
      success: true,
      message: 'Initial Executive Administrator account successfully provisioned into Cloudflare D1. Initial provisioning is now permanently closed.',
      user: {
        id: userId,
        email,
        name: fullName,
        role: 'ceo',
        position: 'Executive CEO',
        mfa_enabled: true,
      },
      mfa_enrollment: {
        totp_secret: mfaSecret,
        totp_uri: `otpauth://totp/De%20Rueda%20Construction:${encodeURIComponent(email)}?secret=${mfaSecret}&issuer=De%20Rueda%20Construction`,
        backup_recovery_codes: rawCodes,
        notice: 'Store your TOTP secret in your authenticator app and save your recovery codes safely. These will not be displayed again.',
      },
    });
  } catch (err: any) {
    return errorResponse(`Provisioning database write error in D1: ${err?.message || err}`, 500, 'PROVISION_FAILED');
  }
}
