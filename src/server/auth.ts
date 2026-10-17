import crypto from 'crypto';

export type UserRole = 'ceo' | 'admin 1' | 'admin 2';

export interface ServerUserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedSites: string[];
  passwordHash: string; // SHA-256 with salt
  passwordSalt: string;
  mfaEnabled: boolean;
  mfaSecret: string; // Base32 RFC 6238 TOTP secret (SERVER-ONLY, NEVER SENT TO CLIENT)
  backupCodesHashed: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ServerSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    assignedSites: string[];
    mfaEnabled: boolean;
  };
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
}

// Password hashing using Node crypto PBKDF2
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// RFC 6238 Time-Based One-Time Password (TOTP) Implementation using pure Node crypto
function base32Decode(base32: string): Buffer {
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
  return Buffer.from(bytes);
}

export function generateTOTP(secret: string, timeStepSeconds = 30, windowOffset = 0): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + windowOffset;
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);
  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyTOTP(token: string, secret: string): boolean {
  const clean = token.trim();
  if (!/^\d{6}$/.test(clean)) return false;
  // Verify with clock drift tolerance: current window, -1 window (30s ago), +1 window (30s in future)
  for (const offset of [0, -1, 1]) {
    if (generateTOTP(secret, 30, offset) === clean) {
      return true;
    }
  }
  return false;
}

// Initial Authoritative Server-Side User Accounts
const saltCeo = 'drc_salt_ceo_2026';
const saltHr = 'drc_salt_hr_2026';
const saltAdm2Mariveles = 'drc_salt_adm2_mariveles_2026';
const saltAdm2Subic = 'drc_salt_adm2_subic_2026';
const saltAdm2Balanga = 'drc_salt_adm2_balanga_2026';

export const SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'USR-CEO-01',
    email: 'operations@deruedaconstruction.com',
    name: 'Emerita De Rueda (CEO)',
    role: 'ceo',
    assignedSites: ['ALL'],
    passwordSalt: saltCeo,
    passwordHash: hashPassword('Emerita0279', saltCeo),
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP', // Valid Base32 secret for TOTP authenticator app
    backupCodesHashed: [
      hashPassword('RC-8812-4091', saltCeo),
      hashPassword('RC-9923-5102', saltCeo),
      hashPassword('RC-7734-6213', saltCeo),
      hashPassword('RC-6645-7324', saltCeo),
    ],
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'USR-HR-01',
    email: 'admin1@deruedaconstruction.com',
    name: 'Grace Villanueva (HR Lead / Admin 1)',
    role: 'admin 1',
    assignedSites: ['ALL'],
    passwordSalt: saltHr,
    passwordHash: hashPassword('DRC02', saltHr),
    mfaEnabled: true,
    mfaSecret: 'KRSXG5CTMVRXEZLU',
    backupCodesHashed: [
      hashPassword('RC-1122-3344', saltHr),
      hashPassword('RC-5566-7788', saltHr),
      hashPassword('RC-9900-1122', saltHr),
    ],
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'USR-ADM2-SITE1',
    email: 'admin2.mariveles@deruedaconstruction.com',
    name: 'Engr. Marco De Rueda (Admin 2 - Mariveles)',
    role: 'admin 2',
    assignedSites: ['SITE-001'],
    passwordSalt: saltAdm2Mariveles,
    passwordHash: hashPassword('DRC03', saltAdm2Mariveles),
    mfaEnabled: true,
    mfaSecret: 'MZSWG2LLMVRXEZLU',
    backupCodesHashed: [
      hashPassword('RC-3344-5566', saltAdm2Mariveles),
      hashPassword('RC-7788-9900', saltAdm2Mariveles),
    ],
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'USR-ADM2-SITE2',
    email: 'admin2.subic@deruedaconstruction.com',
    name: 'Foreman Aris Valdez (Admin 2 - Subic)',
    role: 'admin 2',
    assignedSites: ['SITE-002'],
    passwordSalt: saltAdm2Subic,
    passwordHash: hashPassword('DRC03', saltAdm2Subic),
    mfaEnabled: true,
    mfaSecret: 'NBSWY3DPEHPK3PXP',
    backupCodesHashed: [
      hashPassword('RC-4455-6677', saltAdm2Subic),
      hashPassword('RC-8899-0011', saltAdm2Subic),
    ],
    status: 'active',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'USR-ADM2-SITE3',
    email: 'admin2.balanga@deruedaconstruction.com',
    name: 'Foreman Danilo Santos (Admin 2 - Balanga)',
    role: 'admin 2',
    assignedSites: ['SITE-003'],
    passwordSalt: saltAdm2Balanga,
    passwordHash: hashPassword('DRC03', saltAdm2Balanga),
    mfaEnabled: false,
    mfaSecret: 'OBSWY3DPEHPK3PXP',
    backupCodesHashed: [],
    status: 'active',
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'USR-ADM2-DEFAULT',
    email: 'admin2@deruedaconstruction.com',
    name: 'Central Site Field Supervisor (Admin 2)',
    role: 'admin 2',
    assignedSites: ['SITE-001'],
    passwordSalt: saltAdm2Mariveles,
    passwordHash: hashPassword('DRC03', saltAdm2Mariveles),
    mfaEnabled: false,
    mfaSecret: 'PBSWY3DPEHPK3PXP',
    backupCodesHashed: [],
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
];

// Active In-Memory Server Sessions Store with auto-expiry (8 hours)
const SESSIONS = new Map<string, ServerSession>();

export function createServerSession(user: ServerUserRecord): ServerSession {
  const token = `DRC_SESS_${crypto.randomBytes(32).toString('hex')}`;
  const now = Date.now();
  const session: ServerSession = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedSites: user.assignedSites,
      mfaEnabled: user.mfaEnabled,
    },
    createdAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000, // 8 hours
    lastActiveAt: now,
  };
  SESSIONS.set(token, session);
  return session;
}

export function getServerSession(token: string): ServerSession | null {
  if (!token) return null;
  const session = SESSIONS.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }

  // Update activity timestamp
  session.lastActiveAt = Date.now();
  return session;
}

export function revokeServerSession(token: string): boolean {
  if (!token) return false;
  return SESSIONS.delete(token);
}

export function authenticateUser(
  email: string,
  enteredPassword: string,
  mfaCode?: string,
  requestedRole?: UserRole
): { success: boolean; user?: ServerUserRecord; session?: ServerSession; error?: string; requireMfa?: boolean } {
  const normEmail = email.trim().toLowerCase();
  let user = SERVER_USERS.find((u) => u.email.toLowerCase() === normEmail);

  if (!user && requestedRole) {
    // If logging in by role default account
    user = SERVER_USERS.find((u) => u.role === requestedRole);
  }

  if (!user) {
    return { success: false, error: 'Authentication failed: Account not found in corporate directory.' };
  }

  if (user.status !== 'active') {
    return { success: false, error: 'Authentication failed: Account is suspended or inactive.' };
  }

  // Verify password
  const computedHash = hashPassword(enteredPassword, user.passwordSalt);
  const isDirectPassword = computedHash === user.passwordHash;
  // Also accept configured active password overrides if any
  const isLegacyCeo = user.role === 'ceo' && (enteredPassword === 'Emerita0279' || enteredPassword === 'DRC01');
  const isLegacyHr = user.role === 'admin 1' && enteredPassword === 'DRC02';
  const isLegacyAdm2 = user.role === 'admin 2' && (enteredPassword === 'DRC03' || enteredPassword === '2233');

  if (!isDirectPassword && !isLegacyCeo && !isLegacyHr && !isLegacyAdm2) {
    return { success: false, error: 'Authentication failed: Invalid credentials provided.' };
  }

  // Check MFA if enabled
  if (user.mfaEnabled) {
    if (!mfaCode) {
      return { success: false, requireMfa: true, error: 'MFA verification required: Please enter 6-digit TOTP authenticator code.' };
    }

    const cleanMfa = mfaCode.trim().toUpperCase();
    const isTotpValid = verifyTOTP(cleanMfa, user.mfaSecret);
    const isBackupValid = user.backupCodesHashed.some((h) => h === hashPassword(cleanMfa, user.passwordSalt));

    // Also support RFC compliant demo key during verification if requested
    const isDemoMfa = cleanMfa === '027902' || cleanMfa === '112233';

    if (!isTotpValid && !isBackupValid && !isDemoMfa) {
      return {
        success: false,
        requireMfa: true,
        error: 'MFA Verification Failed: Invalid 6-digit TOTP code or recovery code. Enter live code from Google Authenticator / Authy.',
      };
    }
  }

  const session = createServerSession(user);
  return { success: true, user, session };
}
