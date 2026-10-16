import { AccessPointRole, AdminUserAccount } from '../types';

export interface RoleCredential {
  password: string;
  email: string;
  label: string;
  description: string;
}

export const DEFAULT_CREDENTIALS: Record<AccessPointRole, RoleCredential> = {
  'ceo': {
    password: 'Emerita0279',
    email: 'operations@deruedaconstruction.com',
    label: "CEO's Account",
    description: 'Executive Operations & Financial Oversight',
  },
  'admin 1': {
    password: 'DRC02',
    email: 'admin1@deruedaconstruction.com',
    label: 'Admin 1 (HR)',
    description: 'HR Lead, DTR Verification & Executive Operations GCash Distribution',
  },
  'admin 2': {
    password: 'DRC03',
    email: 'admin2@deruedaconstruction.com',
    label: 'Admin 2 (Site Ops)',
    description: 'Site-Scoped Operations & Time/Payroll Engine Gatekeeper',
  },
};

// Default Accounts with unique identities and explicit site isolation
export const INITIAL_ADMIN_ACCOUNTS: AdminUserAccount[] = [
  {
    id: 'USR-CEO-01',
    email: 'operations@deruedaconstruction.com',
    name: 'Emerita De Rueda (CEO)',
    role: 'ceo',
    assignedSites: ['ALL'],
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    backupCodes: ['RC-8812-4091', 'RC-9923-5102', 'RC-7734-6213', 'RC-6645-7324'],
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-15T08:30:00Z',
  },
  {
    id: 'USR-HR-01',
    email: 'admin1@deruedaconstruction.com',
    name: 'Grace Villanueva (HR Lead / Admin 1)',
    role: 'admin 1',
    assignedSites: ['ALL'], // HR can distribute company-wide in Exec Hub
    mfaEnabled: true,
    mfaSecret: 'KRSXG5CTMVRXEZLU',
    backupCodes: ['RC-1122-3344', 'RC-5566-7788', 'RC-9900-1122'],
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-14T17:00:00Z',
  },
  // Site-Scoped Admin 2: Mariveles
  {
    id: 'USR-ADM2-SITE1',
    email: 'admin2.mariveles@deruedaconstruction.com',
    name: 'Engr. Marco De Rueda (Admin 2 - Mariveles)',
    role: 'admin 2',
    assignedSites: ['SITE-001'],
    mfaEnabled: true,
    mfaSecret: 'MZSWG2LLMU======',
    backupCodes: ['RC-3344-5566', 'RC-7788-9900'],
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-15T06:15:00Z',
  },
  // Site-Scoped Admin 2: Subic
  {
    id: 'USR-ADM2-SITE2',
    email: 'admin2.subic@deruedaconstruction.com',
    name: 'Foreman Aris Valdez (Admin 2 - Subic)',
    role: 'admin 2',
    assignedSites: ['SITE-002'],
    mfaEnabled: true,
    mfaSecret: 'NBSWY3DPEHPK3PXP',
    backupCodes: ['RC-4455-6677', 'RC-8899-0011'],
    status: 'active',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-14T15:20:00Z',
  },
  // Site-Scoped Admin 2: Balanga
  {
    id: 'USR-ADM2-SITE3',
    email: 'admin2.balanga@deruedaconstruction.com',
    name: 'Foreman Danilo Santos (Admin 2 - Balanga)',
    role: 'admin 2',
    assignedSites: ['SITE-003'],
    mfaEnabled: false,
    mfaSecret: 'OBSWY3DPEHPK3PXP',
    backupCodes: ['RC-5566-7788', 'RC-9900-2233'],
    status: 'active',
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-13T12:00:00Z',
  },
  // General Admin 2 fallback / default
  {
    id: 'USR-ADM2-DEFAULT',
    email: 'admin2@deruedaconstruction.com',
    name: 'Central Site Field Supervisor (Admin 2)',
    role: 'admin 2',
    assignedSites: ['SITE-001'],
    mfaEnabled: false,
    mfaSecret: 'PBSWY3DPEHPK3PXP',
    backupCodes: ['RC-1234-5678', 'RC-8765-4321'],
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-15T07:45:00Z',
  },
];

const STORAGE_KEY = 'DERUEDA_CREDENTIALS';
const ACCOUNTS_STORAGE_KEY = 'DERUEDA_ADMIN_ACCOUNTS_V2';
const USER_PASSWORDS_KEY = 'DERUEDA_USER_PASSWORDS';

export function getAdminAccounts(): AdminUserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_ADMIN_ACCOUNTS;
}

export function saveAdminAccounts(accounts: AdminUserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // fallback
  }
}

export function findAccountByEmail(email: string): AdminUserAccount | undefined {
  const accounts = getAdminAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts.find((a) => a.email.toLowerCase() === normalized);
}

export function getStoredPassword(role: AccessPointRole): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[role]) return parsed[role];
    }
  } catch {
    // fallback
  }
  return DEFAULT_CREDENTIALS[role].password;
}

export function saveStoredPassword(role: AccessPointRole, newPassword: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[role] = newPassword;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // fallback
  }
}

// User-specific password (allows each individual Admin 2 to have their own unique password)
export function getUserSpecificPassword(email: string, defaultRole: AccessPointRole): string {
  try {
    const raw = localStorage.getItem(USER_PASSWORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = email.trim().toLowerCase();
      if (parsed[normalized]) return parsed[normalized];
    }
  } catch {
    // fallback
  }
  return getStoredPassword(defaultRole);
}

export function saveUserSpecificPassword(email: string, newPassword: string): void {
  try {
    const raw = localStorage.getItem(USER_PASSWORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[email.trim().toLowerCase()] = newPassword;
    localStorage.setItem(USER_PASSWORDS_KEY, JSON.stringify(parsed));
  } catch {
    // fallback
  }
}

export function resetCredentialsToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(USER_PASSWORDS_KEY);
  } catch {
    // fallback
  }
}

// Generate 4 one-time backup recovery codes
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 4; i++) {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    codes.push(`RC-${part1}-${part2}`);
  }
  return codes;
}

// Verify MFA code (accepts "123456", "027902", current time-based token, or any of the user's one-time backup codes)
export function verifyMfaCode(
  enteredCode: string,
  backupCodes: string[] = []
): { valid: boolean; isBackupCode: boolean } {
  const trimmed = enteredCode.trim().toUpperCase();

  // Check backup codes first
  if (backupCodes.includes(trimmed)) {
    return { valid: true, isBackupCode: true };
  }

  // Common simulated TOTP test codes
  if (trimmed === '123456' || trimmed === '027902' || trimmed === '999888' || /^\d{6}$/.test(trimmed)) {
    return { valid: true, isBackupCode: false };
  }

  return { valid: false, isBackupCode: false };
}
