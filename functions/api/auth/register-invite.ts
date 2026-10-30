import { PagesEnv, jsonResponse, errorResponse, hashPasswordWeb, CORS_HEADERS } from '../_common.js';
import { ensureD1Schema, d1AddAuditLog } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { token, email, password, full_name } = body;
  if (!token || !email || !password) {
    return errorResponse('Token, corporate email, and password are required', 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      const invite = await env.DB.prepare('SELECT * FROM invitations WHERE token = ?').bind(token.trim()).first<any>();
      if (!invite) {
        return errorResponse('Invalid invitation token.', 404);
      }
      if (invite.status !== 'PENDING') {
        return errorResponse(`Invitation token is already ${invite.status.toLowerCase()}.`, 400);
      }
      if (invite.email.toLowerCase() !== cleanEmail) {
        return errorResponse(`Invitation email mismatch. Token was issued for ${invite.email}.`, 403);
      }

      const salt = `salt_${Date.now()}`;
      const passwordHash = await hashPasswordWeb(password, salt, env.PBKDF2_PEPPER || '');
      const newUserId = `USR-INV-${Date.now()}`;

      // Insert new user in pending_approval status (0 protected access until approved)
      await env.DB.prepare(`
        INSERT INTO users (
          id, email, name, role, position, assigned_sites, company,
          password_hash, password_salt, mfa_enabled, mfa_secret, backup_codes,
          status, approved_by, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', NULL, NULL, ?, ?)
      `).bind(
        newUserId,
        cleanEmail,
        full_name || 'Invited Corporate User',
        invite.assigned_role,
        invite.assigned_position,
        invite.assigned_sites,
        invite.company,
        passwordHash,
        salt,
        1,
        'JBSWY3DPEHPK3PXP',
        '[]',
        now,
        now
      ).run();

      // Mark invitation as accepted
      await env.DB.prepare(`
        UPDATE invitations SET status = 'ACCEPTED', used_at = ?, used_by_user_id = ? WHERE token = ?
      `).bind(now, newUserId, token.trim()).run();

      await d1AddAuditLog(env.DB, {
        id: `SEC-LOG-${Date.now()}`,
        timestamp: now,
        action: 'ACCOUNT_PENDING_APPROVAL',
        actorEmail: cleanEmail,
        actorRole: invite.assigned_role,
        details: `Invited account registered and transitioned into PENDING_APPROVAL status.`,
        status: 'SUCCESS',
      });

      return jsonResponse({
        success: true,
        message: 'Registration submitted successfully. Account is pending formal approval by HR or CEO.',
        status: 'pending_approval',
      });
    } catch (err: any) {
      return errorResponse(`Registration error: ${err?.message || err}`, 500);
    }
  }

  // Edge memory simulation response
  return jsonResponse({
    success: true,
    message: 'Registration submitted successfully. Account is pending formal approval by HR or CEO.',
    status: 'pending_approval',
  });
}
