import { AccessPointRole, AdminUserAccount } from '../types';

export interface RoleCredential {
  label: string;
  description: string;
  role: AccessPointRole;
}

// Access point descriptions without privileged email addresses
export const DEFAULT_CREDENTIALS: Record<AccessPointRole, RoleCredential> = {
  'ceo': {
    label: "CEO / Executive Account",
    description: 'Executive Operations & Financial Oversight',
    role: 'ceo',
  },
  'admin 1': {
    label: 'Admin 1 (HR)',
    description: 'HR Lead, DTR Verification & Executive Operations GCash Distribution',
    role: 'admin 1',
  },
  'admin 2': {
    label: 'Admin 2 (Site Ops)',
    description: 'Site-Scoped Operations & Time/Payroll Engine Gatekeeper',
    role: 'admin 2',
  },
  'site head': {
    label: 'Site Head (Field Ops)',
    description: 'Site-Assigned Field Operations & Local Workforce Payment Authorizer',
    role: 'site head',
  },
};

// No pre-bundled accounts in client assets; identities are authenticated server-side
export const INITIAL_ADMIN_ACCOUNTS: AdminUserAccount[] = [];

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

// Passwords are strictly verified server-side with PBKDF2; no plaintext hardcoding
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
