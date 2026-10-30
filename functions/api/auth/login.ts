import {
  PagesEnv,
  jsonResponse,
  errorResponse,
  verifyPasswordWeb,
  verifyTotpWeb,
  hashPasswordWeb,
  generateSessionTokenWeb,
  FALLBACK_ACCOUNTS,
  CORS_HEADERS,
} from '../_common.js';
import {
  ensureD1Schema,
  d1GetUserByEmail,
  d1CreateSession,
  d1AddAuditLog,
} from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  // 1. If backend URL is configured, proxy to Node.js backend
  if (env.BACKEND_URL && env.BACKEND_URL.trim().length > 0) {
    try {
      const backendUrl = env.BACKEND_URL.trim().replace(/\/$/, '');
      const proxyReq = new Request(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: request.headers,
        body: await request.text(),
      });
      const proxyRes = await fetch(proxyReq);
      const resText = await proxyRes.text();
      return new Response(resText, {
        status: proxyRes.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': proxyRes.headers.get('content-type') || 'application/json',
        },
      });
    } catch (err: any) {
      console.error('[Cloudflare Proxy Error] Backend unreachable:', err);
      // Fall through to Edge authentication if backend proxy fails
    }
  }

  // 2. Parse request payload safely
  let body: any = {};
  try {
    const rawText = await request.text();
    if (!rawText || rawText.trim().length === 0) {
      return errorResponse('Missing corporate email and password payload', 400, 'EMPTY_REQUEST');
    }
    body = JSON.parse(rawText);
  } catch {
    return errorResponse('Invalid JSON payload in authentication request', 400, 'MALFORMED_JSON');
  }

  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  const mfaCode = (body.mfa_code || '').toString().trim();

  if (!email || !password) {
    return errorResponse('Corporate email and password are required', 400, 'MISSING_CREDENTIALS');
  }

  // 3. Retrieve user from D1 database or Fallback pre-seeded accounts
  let user: any = null;
  let isD1Active = false;

  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      user = await d1GetUserByEmail(env.DB, email);
      isD1Active = true;
    } catch (dbErr) {
      console.warn('[D1 Query Notice] D1 query encountered error, falling back to verified seed:', dbErr);
    }
  }

  // Fallback to in-memory verified seeds (guarantees developer & CEO access during initial deployment)
  if (!user) {
    user = FALLBACK_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
  }

  // Uniform failure message to prevent account enumeration
  const genericAuthError = 'Invalid corporate email or password. Access is restricted to authorized personnel.';

  if (!user) {
    return errorResponse(genericAuthError, 401, 'INVALID_CREDENTIALS');
  }

  // Check account status
  if (user.status === 'pending_approval') {
    return jsonResponse(
      {
        success: false,
        pending_approval: true,
        error: 'Account registration is pending formal approval by HR or CEO.',
        code: 'ACCOUNT_PENDING_APPROVAL',
      },
      403
    );
  }

  if (user.status === 'suspended' || user.status === 'rejected') {
    return errorResponse('Access denied: account is not active.', 403, 'ACCOUNT_INACTIVE');
  }

  // 4. Verify password with PBKDF2 (testing pepper first if configured)
  const isPasswordValid = await verifyPasswordWeb(
    password,
    user.passwordSalt,
    user.passwordHash,
    env.PBKDF2_PEPPER || ''
  );

  if (!isPasswordValid) {
    return errorResponse(genericAuthError, 401, 'INVALID_CREDENTIALS');
  }

  // 5. Verify Two-Factor Authentication (MFA)
  if (user.mfaEnabled) {
    if (!mfaCode) {
      return jsonResponse({
        success: false,
        require_mfa: true,
        message: 'Two-Factor Authentication required: enter 6-digit TOTP from your authenticator app.',
      });
    }

    // Verify TOTP
    let mfaPassed = await verifyTotpWeb(mfaCode, user.mfaSecret);

    // If TOTP fails, check backup recovery codes
    if (!mfaPassed && Array.isArray(user.backupCodesHashed)) {
      const codeHash = await hashPasswordWeb(mfaCode, user.passwordSalt, env.PBKDF2_PEPPER || '');
      if (user.backupCodesHashed.includes(codeHash)) {
        mfaPassed = true;
      }
    }

    if (!mfaPassed) {
      return errorResponse('Invalid Two-Factor Authentication (MFA) code.', 401, 'MFA_FAILED');
    }
  }

  // 6. Generate authoritative server session
  const token = generateSessionTokenWeb();
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    position: user.position,
    assignedSites: user.assignedSites,
    company: user.company,
    mfaEnabled: user.mfaEnabled,
    status: user.status,
  };

  const sessionRecord = {
    token,
    user: sessionUser,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    lastActiveAt: Date.now(),
  };

  // Persist session to D1 if active
  if (env.DB && isD1Active) {
    try {
      await d1CreateSession(env.DB, sessionRecord);
      await d1AddAuditLog(env.DB, {
        id: `SEC-LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        action: 'LOGIN_SUCCESS',
        actorEmail: user.email,
        actorRole: user.role,
        details: `Cloudflare Pages Edge login successful for ${user.email} (${user.role}).`,
        status: 'SUCCESS',
        ipAddress: request.headers.get('cf-connecting-ip') || 'edge-client',
      });
    } catch (saveErr) {
      console.warn('[D1 Session Save Notice] Could not persist session to D1:', saveErr);
    }
  }

  return jsonResponse({
    success: true,
    session_token: token,
    user: sessionUser,
    message: 'Authentication successful.',
    storage_type: isD1Active ? 'cloudflare-d1' : 'edge-memory',
  });
}
