import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('De Rueda Construction ERP - The Eanuxx Recipe System Verification', () => {
  let ceoToken = '';

  before(async () => {
    // Authenticate as Executive CEO with RFC 6238 TOTP
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operations@deruedaconstruction.com',
        password: 'Emerita0279',
        mfa_code: '027902',
      }),
    });
    const data = await res.json();
    assert.ok(data.session_token, 'CEO session token must be issued');
    ceoToken = data.session_token;
  });

  it('1. Rejects public unrestricted signup (Invitation-Only requirement)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'uninvited.candidate@example.com',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 403, 'Public signup must return HTTP 403');
    const data = await res.json();
    assert.equal(data.code, 'PUBLIC_SIGNUP_RETIRED');
    assert.equal(data.success, false);
  });

  it('2. Rejects expired and revoked invitation tokens', async () => {
    // Expired token
    const resExpired = await fetch(`${BASE_URL}/api/auth/invitations/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'INV-DRC-EXPIRED-TOKEN-DEMO' }),
    });
    assert.equal(resExpired.status, 400);
    const dataExpired = await resExpired.json();
    assert.equal(dataExpired.valid, false);
    assert.match(dataExpired.error, /EXPIRED_TOKEN/);

    // Revoked token
    const resRevoked = await fetch(`${BASE_URL}/api/auth/invitations/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'INV-DRC-REVOKED-TOKEN-DEMO' }),
    });
    assert.equal(resRevoked.status, 400);
    const dataRevoked = await resRevoked.json();
    assert.equal(dataRevoked.valid, false);
    assert.match(dataRevoked.error, /REVOKED_TOKEN/);
  });

  it('3. Rejects token redeemed with mismatched email', async () => {
    const uniqueEmail = `audit.mason.${Date.now()}@deruedaconstruction.com`;

    // Create fresh single-use invitation
    const createRes = await fetch(`${BASE_URL}/api/auth/invitations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        email: uniqueEmail,
        assigned_position: 'Lead Mason',
        assigned_role: 'admin 2',
        assigned_sites: ['SITE-001'],
      }),
    });
    const createData = await createRes.json();
    assert.ok(createData.invitation?.token, 'Must create invitation');
    const token = createData.invitation.token;

    // Validate with wrong email
    const res = await fetch(`${BASE_URL}/api/auth/invitations/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        email: 'completely.wrong.email@example.com',
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.match(data.error, /WRONG_EMAIL/);
  });

  it('4. Successfully registers valid invitation into PENDING_APPROVAL status (0 protected access)', async () => {
    const candidateEmail = `worker.candidate.${Date.now()}@deruedaconstruction.com`;

    // Create fresh single-use invitation
    const createRes = await fetch(`${BASE_URL}/api/auth/invitations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        email: candidateEmail,
        assigned_position: 'Safety Officer',
        assigned_role: 'admin 2',
        assigned_sites: ['SITE-002'],
      }),
    });
    const createData = await createRes.json();
    const token = createData.invitation.token;

    // Register with valid invitation
    const regRes = await fetch(`${BASE_URL}/api/auth/register-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        email: candidateEmail,
        password: 'CandidateStrong2026!',
        full_name: 'Test Candidate',
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.status, 'pending_approval');

    // 5. Verify pending approval account is blocked from login and receives 0 protected access
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: candidateEmail,
        password: 'CandidateStrong2026!',
      }),
    });
    assert.equal(loginRes.status, 403);
    const loginData = await loginRes.json();
    assert.equal(loginData.success, false);
    assert.equal(loginData.pending_approval, true);
    assert.equal(loginData.code, 'ACCOUNT_PENDING_APPROVAL');
  });

  it('5. Challenges active account for MFA TOTP verification and verifies session', async () => {
    // Challenge
    const challengeRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operations@deruedaconstruction.com',
        password: 'Emerita0279',
      }),
    });
    assert.equal(challengeRes.status, 200);
    const challengeData = await challengeRes.json();
    assert.equal(challengeData.success, false);
    assert.equal(challengeData.require_mfa, true);

    // Verify MFA
    const verifyRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operations@deruedaconstruction.com',
        password: 'Emerita0279',
        mfa_code: '027902',
      }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.session_token);
    assert.equal(verifyData.user.role, 'ceo');
    assert.equal(verifyData.user.position, 'Executive CEO');
  });

  it('6. Enforces Site Isolation: Site 001 account blocked from Site 002 actions', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin2.mariveles@deruedaconstruction.com',
        password: 'DRC03',
        mfa_code: '027902',
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.session_token;
    assert.ok(token);

    const isolationRes = await fetch(`${BASE_URL}/api/payments/upload-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        site_id: 'SITE-002',
        reference_number: `REF-ISO-${Date.now()}`,
        receipt_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    });
    assert.equal(isolationRes.status, 403, 'Foreign site action must be blocked HTTP 403');
    const isoData = await isolationRes.json();
    assert.match(isoData.error, /Site Isolation Security Violation/);
  });

  it('7. CEO Vault Master Transaction Cut-Off fails closed (OFF blocks transactions)', async () => {
    const statusRes = await fetch(`${BASE_URL}/api/system/master-cutoff`);
    const statusData = await statusRes.json();
    assert.equal(statusData.masterSwitchOn, false, 'Master cut-off must be OFF (Engaged)');

    const payoutRes = await fetch(`${BASE_URL}/api/gcash/disburse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: 'PAY-W41-999',
        employee_name: 'Test Worker',
        gcash_number: '09181234567',
        amount: 2500,
      }),
    });
    assert.equal(payoutRes.status, 423, 'Must return HTTP 423 Locked when cut-off is OFF');
    const payoutData = await payoutRes.json();
    assert.equal(payoutData.code, 'MASTER_CUTOFF_ENGAGED');
  });

  it('8. Immutable Security Audit Trail records events', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/audit-logs?limit=10`, {
      headers: {
        Authorization: `Bearer ${ceoToken}`,
      },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.logs.length > 0);
  });
});
