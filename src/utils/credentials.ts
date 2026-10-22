import { AccessPointRole, AdminUserAccount } from '../types';

export interface RoleCredential {
  email: string;
  label: string;
  description: string;
  role: AccessPointRole;
}

// Pre-authorized Directory Access Points (Passwords & MFA secrets enforced server-side only per Section 6)
export const DEFAULT_CREDENTIALS: Record<AccessPointRole, RoleCredential> = {
  'ceo': {
    email: 'operations@deruedaconstruction.com',
    label: "CEO's Account",
    description: 'Executive Operations & Financial Oversight',
    role: 'ceo',
  },
  'admin 1': {
    email: 'admin1@deruedaconstruction.com',
    label: 'Admin 1 (HR)',
    description: 'HR Lead, DTR Verification & Executive Operations GCash Distribution',
    role: 'admin 1',
  },
  'admin 2': {
    email: 'admin2@deruedaconstruction.com',
    label: 'Admin 2 (Site Ops)',
    description: 'Site-Scoped Operations & Time/Payroll Engine Gatekeeper',
    role: 'admin 2',
  },
  'site head': {
    email: 'sitehead.mariveles@deruedaconstruction.com',
    label: 'Site Head (Field Ops)',
    description: 'Site-Assigned Field Operations & Local Workforce Payment Authorizer',
    role: 'site head',
  },
};

// Registered Identity Profiles (MFA secrets, salt and PBKDF2 hashes are stored securely server-side)
export const INITIAL_ADMIN_ACCOUNTS: AdminUserAccount[] = [
  {
    id: 'USR-CEO-01',
    email: 'operations@deruedaconstruction.com',
    name: 'Emerita De Rueda (CEO)',
    role: 'ceo',
    assignedSites: ['ALL'],
    mfaEnabled: true,
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
    assignedSites: ['ALL'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-14T17:00:00Z',
  },
  {
    id: 'USR-ADM2-SITE1',
    email: 'admin2.mariveles@deruedaconstruction.com',
    name: 'Engr. Marco De Rueda (Admin 2 - Mariveles)',
    role: 'admin 2',
    assignedSites: ['SITE-001'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-15T06:15:00Z',
  },
  {
    id: 'USR-ADM2-SITE2',
    email: 'admin2.subic@deruedaconstruction.com',
    name: 'Foreman Aris Valdez (Admin 2 - Subic)',
    role: 'admin 2',
    assignedSites: ['SITE-002'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-14T15:20:00Z',
  },
  {
    id: 'USR-ADM2-SITE3',
    email: 'admin2.balanga@deruedaconstruction.com',
    name: 'Foreman Danilo Santos (Admin 2 - Balanga)',
    role: 'admin 2',
    assignedSites: ['SITE-003'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-13T12:00:00Z',
  },
  {
    id: 'USR-ADM2-DEFAULT',
    email: 'admin2@deruedaconstruction.com',
    name: 'Central Site Field Supervisor (Admin 2)',
    role: 'admin 2',
    assignedSites: ['ALL'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-10-15T07:45:00Z',
  },
  {
    id: 'USR-SITEHEAD-01',
    email: 'sitehead.mariveles@deruedaconstruction.com',
    name: 'Engr. Jun Reyes (Site Head - Mariveles)',
    role: 'site head',
    assignedSites: ['SITE-001'],
    mfaEnabled: true,
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
    lastLoginAt: '2026-10-16T08:00:00Z',
  },
];

const ACCOUNTS_STORAGE_KEY = 'DERUEDA_ADMIN_ACCOUNTS_V2';

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
    // Clean accounts before saving to prevent any client secrets leakage
    const sanitized = accounts.map((a) => {
      const copy = { ...a };
      delete copy.mfaSecret;
      delete copy.backupCodes;
      return copy;
    });
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // fallback
  }
}

export function findAccountByEmail(email: string): AdminUserAccount | undefined {
  const accounts = getAdminAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts.find((a) => a.email.toLowerCase() === normalized);
}

// Deprecated in favor of server-side PBKDF2 authentication
export function getStoredPassword(_role: AccessPointRole): string {
  return '';
}

export function saveStoredPassword(_role: AccessPointRole, _newPassword: string): void {}

export function getUserSpecificPassword(_email: string, _defaultRole: AccessPointRole): string {
  return '';
}

export function saveUserSpecificPassword(_email: string, _newPassword: string): void {}

export function resetCredentialsToDefault(): void {
  try {
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem('DERUEDA_ADMIN_CREDENTIALS_V1');
    localStorage.removeItem('DERUEDA_USER_PASSWORDS_V1');
  } catch {
    // fallback
  }
}

// Generate one-time backup recovery codes format
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 4; i++) {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    codes.push(`RC-${part1}-${part2}`);
  }
  return codes;
}

// Client-side format validation (authoritative TOTP verification executes on server)
export function verifyMfaCode(enteredCode: string, backupCodes?: string[]): { valid: boolean; isBackupCode: boolean } {
  const trimmed = enteredCode.trim().toUpperCase();
  if (trimmed.startsWith('RC-')) {
    const isKnownBackup = Array.isArray(backupCodes) && backupCodes.includes(trimmed);
    return { valid: isKnownBackup || trimmed.length >= 10, isBackupCode: true };
  }
  return { valid: /^\d{6}$/.test(trimmed), isBackupCode: false };
}
