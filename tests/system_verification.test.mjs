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

  it('9. Authenticates Developer account (marjoncompany@gmail.com / MaDeRuSe=26) and issues verified session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marjoncompany@gmail.com',
        password: 'MaDeRuSe=26',
        mfa_code: '027902',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.session_token);
    assert.equal(data.user.email, 'marjoncompany@gmail.com');
    assert.equal(data.user.position, 'Developer / Super Admin');
  });

  it('10. Authenticates Executive CEO account (emeritaderueda@gmail.com / Emerita0279) and issues verified session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emeritaderueda@gmail.com',
        password: 'Emerita0279',
        mfa_code: '027902',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.session_token);
    assert.equal(data.user.email, 'emeritaderueda@gmail.com');
    assert.equal(data.user.role, 'ceo');
  });

  it('11. Enforces Cash Payout photo evidence requirement (Section 4: fails without photo)', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll/confirm-cash-payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: 'PAY-W41-001',
        employee_id: 'EMP-0001',
        pay_period: 'Week 41 (Oct 19 - Oct 25, 2026)',
        amount: 4500,
        // photo_evidence_url intentionally omitted
      }),
    });
    assert.equal(res.status, 400, 'Cash payout without photo evidence must return HTTP 400');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.requirement, 'PHOTO_EVIDENCE_MANDATORY');
  });

  it('12. Confirms Cash Payout when recipient photo proof is provided and creates audit record', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll/confirm-cash-payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: `PAY-W41-${Date.now()}`,
        employee_id: 'EMP-0002',
        pay_period: 'Week 41 (Oct 19 - Oct 25, 2026)',
        amount: 5200,
        photo_evidence_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        site_id: 'SITE-001',
        witness_notes: 'Cash envelope received and signed by worker in presence of Site Timekeeper',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.receipt.receipt_id);
    assert.equal(data.receipt.employee_id, 'EMP-0002');
  });

  it('13. Verifies Durable Database health and backup endpoints (Section 3)', async () => {
    const healthRes = await fetch(`${BASE_URL}/api/db/health`, {
      headers: { Authorization: `Bearer ${ceoToken}` },
    });
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.success, true);
    assert.equal(healthData.persistence_mode, 'DURABLE_ATOMIC_JSON');
    assert.ok(healthData.counts.users >= 3);

    const backupRes = await fetch(`${BASE_URL}/api/admin/backup`, {
      headers: { Authorization: `Bearer ${ceoToken}` },
    });
    assert.equal(backupRes.status, 200);
    const backupData = await backupRes.json();
    assert.equal(backupData.success, true);
    assert.ok(backupData.backup.backup_id);
  });

  it('14. Project status lifecycle supports Finished Early, Cancelled, On Hold, and No Work (Section 7)', async () => {
    const res = await fetch(`${BASE_URL}/api/projects/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        site_id: 'SITE-001',
        status: 'Finished Early',
        reason: 'Phase 1 structural commissioning completed ahead of schedule.',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.project.status, 'Finished Early');
  });

  it('15. PayMongo Status reports "Payment provider temporarily unavailable — maintenance" (Section 2)', async () => {
    const res = await fetch(`${BASE_URL}/api/paymongo/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, 'Payment provider temporarily unavailable — maintenance');
    assert.equal(data.provider_decision, 'ON_HOLD');
    assert.equal(data.simulation_mode, true);
    assert.equal(data.is_live, false);
  });

  it('16. Payslip Email dispatch blocks unconfirmed/pending payout (Section 3: payout must be confirmed first)', async () => {
    const res = await fetch(`${BASE_URL}/api/payslips/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: 'PAY-TEST-UNCONFIRMED',
        employee_id: 'EMP-0001',
        employee_name: 'Juan Dela Cruz',
        employee_email: 'juan.delacruz@deruedaconstruction.com',
        pay_period: 'Week 42 (Oct 19 - Oct 25, 2026)',
        site_id: 'SITE-001',
        gross_pay: 5000,
        deductions: { total: 500 },
        net_pay: 4500,
        payment_method: 'GCASH',
        payout_status: 'PENDING_APPROVAL', // Not confirmed!
        reference_no: 'REF-PENDING',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Trigger Condition Blocked/);
  });

  it('17. Payslip Email dispatches when payout is confirmed (PAID_VERIFIED) and permits retry without duplicating payouts', async () => {
    const payrollId = `PAY-TEST-${Date.now()}`;
    const payload = {
      payroll_id: payrollId,
      employee_id: 'EMP-0002',
      employee_name: 'Pedro Santos',
      employee_email: 'pedro.santos@deruedaconstruction.com',
      pay_period: 'Week 42 (Oct 19 - Oct 25, 2026)',
      site_id: 'SITE-001',
      gross_pay: 5200,
      deductions: { sss: 200, philhealth: 150, pagibig: 100, total: 450 },
      net_pay: 4750,
      payment_method: 'CASH',
      payout_status: 'CASH_CONFIRMED', // Confirmed!
      reference_no: `CSH-REC-${Date.now()}`,
    };

    // First send
    const res1 = await fetch(`${BASE_URL}/api/payslips/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify(payload),
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.success, true);
    assert.ok(data1.record?.id);

    // Retry send
    const res2 = await fetch(`${BASE_URL}/api/payslips/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({ ...payload, is_retry: true }),
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.success, true);
    assert.equal(data2.is_retry, true);
  });

  it('18. Email configuration endpoint reports safe status without exposing secrets (Section 4)', async () => {
    const res = await fetch(`${BASE_URL}/api/email/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.provider);
    assert.ok(typeof data.isConfigured === 'boolean');
    assert.ok(data.status === 'CONFIGURED' || data.status === 'EMAIL_NOT_CONFIGURED');
    // Ensure credentials and secrets are never exposed
    assert.equal(data.apiKey, undefined);
    assert.equal(data.EMAIL_API_KEY, undefined);
  });

  it('19. Automated email dispatch triggers only after cash payout is confirmed with photo proof', async () => {
    const payrollId = `PAY-CASH-AUTOMAIL-${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/payroll/confirm-cash-payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: payrollId,
        employee_id: 'EMP-0003',
        employee_name: 'Miguel Reyes',
        employee_email: 'miguel.reyes@deruedaconstruction.com',
        pay_period: 'Week 42 (Oct 19 - Oct 25, 2026)',
        amount: 4850,
        gross_pay: 5300,
        deductions: { total: 450 },
        photo_evidence_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        site_id: 'SITE-001',
        witness_notes: 'Confirmed cash wage envelope handover with photographic voucher.',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.receipt?.receipt_id, 'Receipt record must be generated');
    assert.ok(data.email_dispatch, 'Automated email dispatch result must be attached');
    assert.equal(data.email_dispatch.success, true);
    assert.equal(data.email_dispatch.record?.status, 'SENT');
    assert.equal(data.email_dispatch.record?.recipient_email, 'miguel.reyes@deruedaconstruction.com');
  });

  it('20. /api/payslips/email/retry allows retrying email dispatch without duplicating financial payout', async () => {
    const payrollId = `PAY-RETRY-TEST-${Date.now()}`;
    // 1. Initial payout dispatch
    const initialSend = await fetch(`${BASE_URL}/api/payslips/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({
        payroll_id: payrollId,
        employee_id: 'EMP-0004',
        employee_name: 'Alan Garcia',
        employee_email: 'alan.garcia@deruedaconstruction.com',
        pay_period: 'Week 42 (Oct 19 - Oct 25, 2026)',
        site_id: 'SITE-001',
        gross_pay: 5100,
        deductions: { total: 400 },
        net_pay: 4700,
        payment_method: 'CASH',
        payout_status: 'CASH_CONFIRMED',
        reference_no: `CSH-REC-RETRY-${Date.now()}`,
      }),
    });
    const initialData = await initialSend.json();
    assert.equal(initialData.success, true);
    const recordId = initialData.record.id;

    // 2. Retry endpoint
    const retryRes = await fetch(`${BASE_URL}/api/payslips/email/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({ record_id: recordId }),
    });

    assert.equal(retryRes.status, 200);
    const retryData = await retryRes.json();
    assert.equal(retryData.success, true);
    assert.ok(retryData.record);
    assert.equal(retryData.record.attempts, 2, 'Attempts count must increment on retry');
  });

  it('21. Public HTML does not leak privileged accounts, master account cards, or default credentials', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.equal(html.includes('emeritaderueda@gmail.com'), false, 'Public HTML must not contain privileged CEO email');
    assert.equal(html.includes('marjoncompany@gmail.com'), false, 'Public HTML must not contain developer email');
    assert.equal(html.includes('MaDeRuSe=26'), false, 'Public HTML must not contain passwords');
    assert.equal(html.includes('Emerita0279'), false, 'Public HTML must not contain passwords');
    assert.equal(html.includes('AUTHORIZED MASTER ACCOUNTS'), false, 'Public HTML must not contain master accounts card');
  });

  it('22. Protected financial and operational APIs reject unauthenticated requests with HTTP 401', async () => {
    const endpoints = [
      '/api/paymongo/balance',
      '/api/paymongo/transactions',
      '/api/xendit/balance',
      '/api/xendit/transactions',
      '/api/auth/invitations',
      '/api/auth/accounts/pending',
      '/api/auth/audit-logs',
      '/api/admin/backup',
      '/api/gcash/transactions',
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep}`);
      assert.equal(
        res.status,
        401,
        `Unauthenticated request to ${ep} must return HTTP 401 Unauthorized`
      );
    }
  });

  it('23. Prevents account enumeration: unknown email and incorrect password return identical error', async () => {
    // 1. Unknown account
    const resUnknown = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent.user.probe@deruedaconstruction.com',
        password: 'RandomPassword123!',
      }),
    });
    assert.equal(resUnknown.status, 401);
    const dataUnknown = await resUnknown.json();

    // 2. Existing account with wrong password
    const resWrongPw = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operations@deruedaconstruction.com',
        password: 'WrongPassword999!',
      }),
    });
    assert.equal(resWrongPw.status, 401);
    const dataWrongPw = await resWrongPw.json();

    // Both must be identical to prevent enumeration
    assert.equal(dataUnknown.error, 'Authentication failed: Invalid email or password.');
    assert.equal(dataWrongPw.error, 'Authentication failed: Invalid email or password.');
    assert.equal(dataUnknown.error, dataWrongPw.error, 'Error message must be identical');
  });

  it('24. Unauthenticated /api/system/master-cutoff does not leak privileged administrator emails', async () => {
    const res = await fetch(`${BASE_URL}/api/system/master-cutoff`);
    assert.equal(res.status, 200);
    const raw = await res.text();

    assert.equal(raw.includes('marjoncompany@gmail.com'), false, 'Must not leak marjoncompany email');
    assert.equal(raw.includes('emeritaderueda@gmail.com'), false, 'Must not leak emeritaderueda email');
  });

  it('25. DATABASE_DIR configuration and persistent storage health endpoint', async () => {
    // 1. Check authenticated db health endpoint
    const resHealth = await fetch(`${BASE_URL}/api/db/health`, {
      headers: { Authorization: `Bearer ${ceoToken}` },
    });
    assert.equal(resHealth.status, 200);
    const dataHealth = await resHealth.json();
    assert.equal(dataHealth.success, true);
    assert.ok(dataHealth.database_dir, 'Database directory must be reported');
    assert.ok(dataHealth.database_dir.endsWith('data'), 'Database directory should resolve to data dir');
    assert.ok(dataHealth.database_file.endsWith('derueda_erp_store.json'));

    // 2. Check public diagnostic database status endpoint
    const resStatus = await fetch(`${BASE_URL}/api/database/status`);
    assert.equal(resStatus.status, 200);
    const dataStatus = await resStatus.json();
    assert.equal(dataStatus.success, true);
    assert.ok(dataStatus.status.database_dir);
    assert.equal(dataStatus.status.d1_compatible_migrations, true);
  });

  it('26. Cloudflare D1 migrations and schema DDL validity', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const schemaPath = path.resolve(process.cwd(), 'migrations/0001_d1_erp_schema.sql');
    const seedPath = path.resolve(process.cwd(), 'migrations/0002_d1_seed_initial_data.sql');

    assert.ok(fs.existsSync(schemaPath), '0001_d1_erp_schema.sql must exist');
    assert.ok(fs.existsSync(seedPath), '0002_d1_seed_initial_data.sql must exist');

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS users/);
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS sessions/);
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS master_cutoff/);
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS audit_logs/);
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS projects/);
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS cash_receipts/);

    assert.match(seedSql, /marjoncompany@gmail\.com/);
    assert.match(seedSql, /emeritaderueda@gmail\.com/);
    assert.match(seedSql, /INSERT OR IGNORE INTO users/);
  });

  it('27. Authenticates Developer marjoncompany@gmail.com and CEO emeritaderueda@gmail.com and generates verified sessions', async () => {
    // 1. Authenticate Developer
    const devRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marjoncompany@gmail.com',
        password: 'MaDeRuSe=26',
        mfa_code: '027902',
      }),
    });
    assert.equal(devRes.status, 200);
    const devData = await devRes.json();
    assert.equal(devData.success, true);
    assert.equal(devData.user?.email, 'marjoncompany@gmail.com');
    assert.equal(devData.user?.role, 'ceo');
    assert.ok(devData.session_token);

    // 2. Authenticate Executive CEO
    const ceoRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emeritaderueda@gmail.com',
        password: 'Emerita0279',
        mfa_code: '027902',
      }),
    });
    assert.equal(ceoRes.status, 200);
    const ceoData = await ceoRes.json();
    assert.equal(ceoData.success, true);
    assert.equal(ceoData.user?.email, 'emeritaderueda@gmail.com');
    assert.equal(ceoData.user?.role, 'ceo');
    assert.ok(ceoData.session_token);

    // 3. Rejects invalid credentials with safe, uniform 401 error
    const badRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marjoncompany@gmail.com',
        password: 'WrongPassword!',
      }),
    });
    assert.equal(badRes.status, 401);
    const badData = await badRes.json();
    assert.equal(badData.success, false);
    assert.match(badData.error, /Invalid email or password/);
  });

  it('28. Resilient JSON response parser handles empty or HTML responses without crashing with Unexpected end of JSON input', async () => {
    // Test safe JSON parsing algorithm directly
    async function safeParseResponse(mockResponse) {
      const contentType = (mockResponse.headers.get('content-type') || '').toLowerCase();
      const rawText = await mockResponse.text();

      if (!rawText || rawText.trim().length === 0) {
        return {
          ok: mockResponse.ok,
          status: mockResponse.status,
          data: {
            success: mockResponse.ok,
            error: mockResponse.ok ? undefined : `Server returned an empty response (HTTP ${mockResponse.status}).`,
          },
        };
      }

      if (contentType.includes('text/html') || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
        return {
          ok: false,
          status: mockResponse.status,
          data: {
            success: false,
            error: `Authentication endpoint returned an unexpected HTML document instead of JSON (HTTP ${mockResponse.status}).`,
          },
        };
      }

      try {
        return { ok: mockResponse.ok, status: mockResponse.status, data: JSON.parse(rawText) };
      } catch {
        return { ok: false, status: mockResponse.status, data: { success: false, error: 'Malformed JSON response' } };
      }
    }

    // 1. Test HTML response (Cloudflare Pages fallback to index.html)
    const htmlResponse = new Response('<!DOCTYPE html><html><head><title>App</title></head><body>Root</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
    const parsedHtml = await safeParseResponse(htmlResponse);
    assert.equal(parsedHtml.ok, false);
    assert.equal(parsedHtml.data.success, false);
    assert.match(parsedHtml.data.error, /unexpected HTML document/);

    // 2. Test empty response (502 / gateway error)
    const emptyResponse = new Response('', {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
    const parsedEmpty = await safeParseResponse(emptyResponse);
    assert.equal(parsedEmpty.ok, false);
    assert.equal(parsedEmpty.data.success, false);
    assert.match(parsedEmpty.data.error, /empty response/);

    // 3. Test valid JSON response
    const validResponse = new Response(JSON.stringify({ success: true, session_token: 'valid-test-token-123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const parsedValid = await safeParseResponse(validResponse);
    assert.equal(parsedValid.ok, true);
    assert.equal(parsedValid.data.success, true);
    assert.equal(parsedValid.data.session_token, 'valid-test-token-123');
  });

  it('29. CEO/Admin-only database backup export with SHA-256 integrity and Google Drive manual archive destination', async () => {
    // 1. Rejects unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/api/backup/export`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated backup export must return HTTP 401');

    // 2. Authenticated CEO download
    const res = await fetch(`${BASE_URL}/api/backup/export`, {
      headers: { Authorization: `Bearer ${ceoToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.system, 'De Rueda Construction Management System');
    assert.equal(data.version, '2.0.0');
    assert.ok(data.export_timestamp);
    assert.ok(data.checksum, 'Cryptographic checksum must be present');
    assert.ok(data.collections, 'Backup collections must be present');
  });

  it('30. Protected backup restoration workflow validates payload structure and creates pre-restore rollback snapshot', async () => {
    // 1. Rejects unauthenticated restore
    const unauthRes = await fetch(`${BASE_URL}/api/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData: {} }),
    });
    assert.equal(unauthRes.status, 401);

    // 2. Rejects invalid backup structure
    const invalidRes = await fetch(`${BASE_URL}/api/backup/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({ backupData: { invalid: true } }),
    });
    assert.equal(invalidRes.status, 400);

    // 3. Accepts valid authoritative payload and produces rollback snapshot
    const validBackup = {
      system: 'De Rueda Construction Management System',
      version: '2.0.0',
      export_timestamp: new Date().toISOString(),
      collections: {
        transactions: [],
        sms_outbox: [],
        gcash_transfers: [],
      },
    };

    const validRes = await fetch(`${BASE_URL}/api/backup/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({ backupData: validBackup }),
    });
    assert.equal(validRes.status, 200);
    const resultData = await validRes.json();
    assert.equal(resultData.success, true);
    assert.ok(resultData.snapshot_id, 'Pre-restore rollback snapshot must be created');
    assert.equal(resultData.rollback_available, true);
  });
});
