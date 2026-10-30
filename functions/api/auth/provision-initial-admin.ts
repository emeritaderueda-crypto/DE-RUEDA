import {
  PagesEnv,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
  hashPasswordWeb,
  generateSaltWeb,
  generateTotpSecretWeb,
} from '../_common.js';
import { ensureD1Schema, d1AddAuditLog } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      'Database service unavailable: Cloudflare D1 database binding "DB" is required for account provisioning.',
      503,
      'D1_DATABASE_UNAVAILABLE'
    );
  }

  await ensureD1Schema(env.DB);

  // Check if any user already exists
  const existingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if (existingCount && existingCount.count > 0) {
    return errorResponse(
      'Initial account provisioning is closed. The system already contains authorized corporate accounts. Additional accounts must be onboarded via invitation-only registration by an executive administrator.',
      403,
      'PROVISIONING_CLOSED'
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON payload in provisioning request', 400, 'MALFORMED_JSON');
  }

  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  const fullName = (body.full_name || body.name || 'Executive CEO').toString().trim();

  if (!email || !password || password.length < 8) {
    return errorResponse('Valid corporate email and password (minimum 8 characters) are required for initial provisioning.', 400, 'INVALID_INPUT');
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

  try {
    await env.DB.prepare(`
      INSERT INTO users (
        id, email, name, role, position, assigned_sites, company,
        password_hash, password_salt, mfa_enabled, mfa_secret, backup_codes,
        status, approved_by, approved_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'ceo', 'Executive CEO', '["ALL"]', 'De Rueda Construction Inc.', ?, ?, 1, ?, ?, 'active', 'Corporate Provisioning', ?, ?, ?)
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
      details: `Initial Executive Administrator successfully provisioned into Cloudflare D1. Provisioning endpoint is now closed.`,
      status: 'SUCCESS',
      ipAddress: request.headers.get('cf-connecting-ip') || 'edge-provisioning',
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
    return errorResponse(`Provisioning error in D1: ${err?.message || err}`, 500, 'PROVISION_FAILED');
  }
}
