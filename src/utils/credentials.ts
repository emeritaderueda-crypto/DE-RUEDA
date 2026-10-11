import { AccessPointRole } from '../types';

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
    label: 'Admin 1',
    description: 'Lead Site Administration, DTR Verification & Master Vault',
  },
  'admin 2': {
    password: 'DRC03',
    email: 'admin2@deruedaconstruction.com',
    label: 'Admin 2',
    description: 'Site Operations, Procurement & Timekeeping Gatekeeper',
  },
};

const STORAGE_KEY = 'DERUEDA_CREDENTIALS';

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

export function resetCredentialsToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fallback
  }
}
