import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns the resolved persistent database directory.
 * Reads process.env.DATABASE_DIR if set (e.g. './data' or absolute path).
 * Falls back to resolving '../../data' relative to the server source or current working directory.
 */
export function getDatabaseDir(): string {
  const envDir = process.env.DATABASE_DIR?.trim();
  if (envDir && envDir.length > 0) {
    return path.isAbsolute(envDir) ? envDir : path.resolve(process.cwd(), envDir);
  }
  return path.resolve(__dirname, '../../data');
}

export function getDatabaseFilePath(): string {
  return path.join(getDatabaseDir(), 'derueda_erp_store.json');
}

export function getBackupDir(): string {
  return path.join(getDatabaseDir(), 'backups');
}

export interface ErpDatabaseSchema {
  version: string;
  created_at: string;
  updated_at: string;
  metadata: {
    system_name: string;
    organization: string;
    environment: 'production' | 'staging' | 'test';
    durable_persistence: boolean;
    last_backup_at?: string;
  };
  master_cutoff: {
    switch_on: boolean;
    updated_at: string;
    updated_by: string;
    reason: string;
    history: Array<{
      timestamp: string;
      actor: string;
      new_state: 'ON' | 'OFF';
      reason: string;
      result: 'SUCCESS' | 'REJECTED';
    }>;
  };
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: 'ceo' | 'admin 1' | 'admin 2' | 'site head';
    position: string;
    assignedSites: string[];
    company: string;
    passwordHash: string;
    passwordSalt: string;
    mfaEnabled: boolean;
    mfaSecret: string;
    backupCodesHashed: string[];
    status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  invitations: Array<{
    id: string;
    token: string;
    email: string;
    company: string;
    assignedRole: 'ceo' | 'admin 1' | 'admin 2' | 'site head';
    assignedPosition: string;
    assignedSites: string[];
    createdBy: string;
    createdAt: string;
    expiresAt: string;
    status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
    usedAt?: string;
    usedByUserId?: string;
    notes?: string;
  }>;
  audit_logs: Array<{
    id: string;
    timestamp: string;
    action: string;
    actorEmail: string;
    actorRole: string;
    targetEmail?: string;
    details: string;
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
    ipAddress?: string;
  }>;
  idempotency_store: Record<
    string,
    {
      timestamp: string;
      key: string;
      result: any;
    }
  >;
  projects: Array<{
    site_id: string;
    name: string;
    location: string;
    status: 'Active' | 'Finished Early' | 'Cancelled' | 'On Hold' | 'No Work';
    progress: number;
    head_engineer: string;
    updated_at: string;
  }>;
  cash_receipts: Array<{
    receipt_id: string;
    payroll_id: string;
    employee_id: string;
    pay_period: string;
    amount: number;
    photo_evidence_url: string;
    confirmed_by: string;
    confirmed_role: string;
    timestamp: string;
    witness_notes?: string;
  }>;
}

// Node.js PBKDF2 Password Hashing
export function hashDbPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}

// Initial Seed Users with verified developer and executive credentials
function createDefaultSeed(): ErpDatabaseSchema {
  const saltCeo = 'drc_salt_ceo_2026';
  const saltDev = 'drc_salt_dev_2026';
  const saltHr = 'drc_salt_hr_2026';
  const saltAdm2Mariveles = 'drc_salt_adm2_mariveles_2026';
  const saltAdm2Subic = 'drc_salt_adm2_subic_2026';
  const saltAdm2Balanga = 'drc_salt_adm2_balanga_2026';

  const now = new Date().toISOString();

  return {
    version: '2.0.0',
    created_at: now,
    updated_at: now,
    metadata: {
      system_name: 'De Rueda Construction ERP',
      organization: 'De Rueda Construction Inc.',
      environment: 'production',
      durable_persistence: true,
    },
    master_cutoff: {
      switch_on: false, // Fail-closed by default for safety
      updated_at: now,
      updated_by: 'security.initialization@deruedaconstruction.com',
      reason: 'Initial security baseline cutover: Master cut-off engaged (fail-closed)',
      history: [
        {
          timestamp: now,
          actor: 'security.initialization@deruedaconstruction.com',
          new_state: 'OFF',
          reason: 'Initial security cutover baseline state',
          result: 'SUCCESS',
        },
      ],
    },
    users: [
      // 1. Developer Account: marjoncompany@gmail.com / MaDeRuSe=26 (Full Super Admin / Systems Architect)
      {
        id: 'USR-DEV-MARJON',
        email: 'marjoncompany@gmail.com',
        name: 'Developer & Lead Systems Architect (Marjon Company)',
        role: 'ceo',
        position: 'Developer / Super Admin',
        assignedSites: ['ALL'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltDev,
        passwordHash: hashDbPassword('MaDeRuSe=26', saltDev),
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        backupCodesHashed: [
          hashDbPassword('RC-8812-4091', saltDev),
          hashDbPassword('RC-9923-5102', saltDev),
        ],
        status: 'active',
        approvedBy: 'Corporate Charter / Developer Provisioning',
        approvedAt: now,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: now,
      },
      // 2. Executive CEO Account: emeritaderueda@gmail.com / Emerita0279
      {
        id: 'USR-CEO-EMERITA',
        email: 'emeritaderueda@gmail.com',
        name: 'Emerita De Rueda',
        role: 'ceo',
        position: 'Chief Executive Officer (CEO)',
        assignedSites: ['ALL'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltCeo,
        passwordHash: hashDbPassword('Emerita0279', saltCeo),
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        backupCodesHashed: [
          hashDbPassword('RC-8812-4091', saltCeo),
          hashDbPassword('RC-9923-5102', saltCeo),
          hashDbPassword('RC-7734-6213', saltCeo),
          hashDbPassword('RC-6645-7324', saltCeo),
        ],
        status: 'active',
        approvedBy: 'Board of Directors / Corporate Charter',
        approvedAt: '2026-01-01T08:00:00Z',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: now,
      },
      // 3. Operational CEO Mirror for backwards compatibility
      {
        id: 'USR-CEO-01',
        email: 'operations@deruedaconstruction.com',
        name: 'Emerita De Rueda (Operations Hub)',
        role: 'ceo',
        position: 'Executive CEO',
        assignedSites: ['ALL'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltCeo,
        passwordHash: hashDbPassword('Emerita0279', saltCeo),
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        backupCodesHashed: [
          hashDbPassword('RC-8812-4091', saltCeo),
          hashDbPassword('RC-9923-5102', saltCeo),
        ],
        status: 'active',
        approvedBy: 'Board of Directors',
        approvedAt: '2026-01-01T08:00:00Z',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: now,
      },
      // 4. HR Lead / Admin 1
      {
        id: 'USR-HR-01',
        email: 'admin1@deruedaconstruction.com',
        name: 'Grace Villanueva',
        role: 'admin 1',
        position: 'HR Officer',
        assignedSites: ['ALL'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltHr,
        passwordHash: hashDbPassword('GraceHR2026!', saltHr),
        mfaEnabled: true,
        mfaSecret: 'KRSXG5CTMVRXEZLU',
        backupCodesHashed: [
          hashDbPassword('RC-1122-3344', saltHr),
          hashDbPassword('RC-5566-7788', saltHr),
        ],
        status: 'active',
        approvedBy: 'operations@deruedaconstruction.com',
        approvedAt: '2026-01-15T08:00:00Z',
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: now,
      },
      // 5. Site 001 Scoped Admin 2
      {
        id: 'USR-ADM2-SITE1',
        email: 'admin2.mariveles@deruedaconstruction.com',
        name: 'Engr. Marco De Rueda',
        role: 'admin 2',
        position: 'Site Engineer',
        assignedSites: ['SITE-001'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltAdm2Mariveles,
        passwordHash: hashDbPassword('DRC03', saltAdm2Mariveles),
        mfaEnabled: true,
        mfaSecret: 'MZSWG2LLMVRXEZLU',
        backupCodesHashed: [
          hashDbPassword('RC-3344-5566', saltAdm2Mariveles),
          hashDbPassword('RC-7788-9900', saltAdm2Mariveles),
        ],
        status: 'active',
        approvedBy: 'admin1@deruedaconstruction.com',
        approvedAt: '2026-02-01T08:00:00Z',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: now,
      },
      // 6. Site 002 Scoped Admin 2
      {
        id: 'USR-ADM2-SITE2',
        email: 'admin2.subic@deruedaconstruction.com',
        name: 'Foreman Aris Valdez',
        role: 'admin 2',
        position: 'Foreman',
        assignedSites: ['SITE-002'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltAdm2Subic,
        passwordHash: hashDbPassword('DRC03', saltAdm2Subic),
        mfaEnabled: true,
        mfaSecret: 'NBSWY3DPEHPK3PXP',
        backupCodesHashed: [
          hashDbPassword('RC-4455-6677', saltAdm2Subic),
          hashDbPassword('RC-8899-0011', saltAdm2Subic),
        ],
        status: 'active',
        approvedBy: 'admin1@deruedaconstruction.com',
        approvedAt: '2026-03-15T08:00:00Z',
        createdAt: '2026-03-15T08:00:00Z',
        updatedAt: now,
      },
      // 7. Site 003 Scoped Admin 2
      {
        id: 'USR-ADM2-SITE3',
        email: 'admin2.balanga@deruedaconstruction.com',
        name: 'Foreman Danilo Santos',
        role: 'admin 2',
        position: 'Foreman',
        assignedSites: ['SITE-003'],
        company: 'De Rueda Construction Inc.',
        passwordSalt: saltAdm2Balanga,
        passwordHash: hashDbPassword('DRC03', saltAdm2Balanga),
        mfaEnabled: true,
        mfaSecret: 'OBSWY3DPEHPK3PXP',
        backupCodesHashed: [
          hashDbPassword('RC-5566-7788', saltAdm2Balanga),
          hashDbPassword('RC-9900-2233', saltAdm2Balanga),
        ],
        status: 'active',
        approvedBy: 'admin1@deruedaconstruction.com',
        approvedAt: '2026-05-10T08:00:00Z',
        createdAt: '2026-05-10T08:00:00Z',
        updatedAt: now,
      },
    ],
    invitations: [
      {
        id: 'INV-DEMO-EXPIRED',
        token: 'INV-DRC-EXPIRED-TOKEN-DEMO',
        email: 'expired.candidate@example.com',
        company: 'De Rueda Construction Inc.',
        assignedRole: 'admin 2',
        assignedPosition: 'Expired Position',
        assignedSites: ['SITE-001'],
        createdBy: 'operations@deruedaconstruction.com',
        createdAt: '2025-01-01T00:00:00Z',
        expiresAt: '2025-01-02T00:00:00Z', // Expired
        status: 'EXPIRED',
      },
      {
        id: 'INV-DEMO-REVOKED',
        token: 'INV-DRC-REVOKED-TOKEN-DEMO',
        email: 'revoked.candidate@example.com',
        company: 'De Rueda Construction Inc.',
        assignedRole: 'admin 2',
        assignedPosition: 'Revoked Position',
        assignedSites: ['SITE-001'],
        createdBy: 'operations@deruedaconstruction.com',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-12-31T00:00:00Z',
        status: 'REVOKED',
      },
    ],
    audit_logs: [
      {
        id: 'SEC-LOG-INITIAL',
        timestamp: now,
        action: 'SESSIONS_INVALIDATED_ALL',
        actorEmail: 'security.initialization@deruedaconstruction.com',
        actorRole: 'system',
        details: 'Durable Enterprise Database initialized. Security Replacement and Legacy Retirement verified.',
        status: 'SUCCESS',
      },
    ],
    idempotency_store: {},
    projects: [
      {
        site_id: 'SITE-001',
        name: 'Mariveles Commercial Complex',
        location: 'Mariveles, Bataan',
        status: 'Active',
        progress: 68,
        head_engineer: 'Engr. Marco De Rueda',
        updated_at: now,
      },
      {
        site_id: 'SITE-002',
        name: 'Subic Industrial Warehouse',
        location: 'Subic Bay Freeport Zone',
        status: 'Active',
        progress: 42,
        head_engineer: 'Foreman Aris Valdez',
        updated_at: now,
      },
      {
        site_id: 'SITE-003',
        name: 'Balanga High-Rise Residences',
        location: 'Balanga City, Bataan',
        status: 'Active',
        progress: 85,
        head_engineer: 'Foreman Danilo Santos',
        updated_at: now,
      },
    ],
    cash_receipts: [],
  };
}

// In-Memory cache synchronized with durable file storage
let cachedDb: ErpDatabaseSchema | null = null;

export function clearDatabaseCache(): void {
  cachedDb = null;
}

// Ensure storage directories exist
export function ensureDataDirectories(): void {
  const dataDir = getDatabaseDir();
  const backupDir = getBackupDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

// Read database from disk or initialize
export function getDatabase(): ErpDatabaseSchema {
  if (cachedDb) return cachedDb;

  ensureDataDirectories();
  const dbFilePath = getDatabaseFilePath();

  if (fs.existsSync(dbFilePath)) {
    try {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version && Array.isArray(parsed.users)) {
        cachedDb = parsed;
        return cachedDb!;
      }
    } catch (err) {
      console.error('[Database Read Error] Corrupted DB file. Recovering default schema:', err);
    }
  }

  // Initialize and write seed
  cachedDb = createDefaultSeed();
  persistDatabase(cachedDb);
  return cachedDb;
}

// Atomic persistence: write to .tmp then atomic rename
export function persistDatabase(db: ErpDatabaseSchema): void {
  ensureDataDirectories();
  db.updated_at = new Date().toISOString();

  const dataDir = getDatabaseDir();
  const dbFilePath = getDatabaseFilePath();
  const tempPath = path.join(dataDir, `derueda_erp_store.tmp.${Date.now()}`);
  const data = JSON.stringify(db, null, 2);

  fs.writeFileSync(tempPath, data, 'utf-8');
  fs.renameSync(tempPath, dbFilePath);
  cachedDb = db;
}

// Create Full Database Backup
export function createDatabaseBackup(actorEmail = 'system'): {
  backup_id: string;
  file_path: string;
  timestamp: string;
  total_users: number;
} {
  ensureDataDirectories();
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const backupId = `DRC_BACKUP_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const filename = `${backupId}.json`;
  const filePath = path.join(getBackupDir(), filename);

  const backupData = {
    backup_id: backupId,
    created_at: timestamp,
    created_by: actorEmail,
    database_version: db.version,
    data: db,
  };

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  db.metadata.last_backup_at = timestamp;
  persistDatabase(db);

  return {
    backup_id: backupId,
    file_path: filePath,
    timestamp,
    total_users: db.users.length,
  };
}

// Restore Database from Backup
export function restoreDatabaseBackup(backupJson: any): { success: boolean; message: string } {
  if (!backupJson || !backupJson.data || !Array.isArray(backupJson.data.users)) {
    throw new Error('Invalid backup file format: missing valid data schema');
  }

  const restoredDb: ErpDatabaseSchema = backupJson.data;
  restoredDb.updated_at = new Date().toISOString();
  persistDatabase(restoredDb);
  cachedDb = restoredDb;

  return {
    success: true,
    message: `Database restored successfully. Version ${restoredDb.version}, ${restoredDb.users.length} users restored.`,
  };
}

// Enforce Site Scope Isolation
export function assertSiteAccess(
  actorSites: string[],
  targetSiteId: string,
  actorEmail: string,
  actorRole: string
): void {
  const normTarget = (targetSiteId || '').toString().trim().toUpperCase();
  if (!normTarget) return;

  const hasAll = actorSites.some((s) => s.toUpperCase() === 'ALL');
  if (hasAll) return;

  const isAssigned = actorSites.some((s) => s.toUpperCase() === normTarget);
  if (!isAssigned) {
    const errorMsg = `Site Isolation Security Denial: User ${actorEmail} (${actorRole}) is scoped strictly to [${actorSites.join(
      ', '
    )}]. Cross-site operation on site '${normTarget}' is forbidden (Section 2 & 3).`;
    const err: any = new Error(errorMsg);
    err.statusCode = 403;
    err.code = 'SITE_ISOLATION_VIOLATION';
    throw err;
  }
}

// Idempotency Store Guard (Prevents duplicate payouts, duplicate payroll runs, duplicate SMS)
export function processWithIdempotency<T>(
  idempotencyKey: string,
  executor: () => T
): { result: T; isDuplicate: boolean } {
  const db = getDatabase();
  const cleanKey = idempotencyKey.trim();

  if (db.idempotency_store[cleanKey]) {
    return {
      result: db.idempotency_store[cleanKey].result as T,
      isDuplicate: true,
    };
  }

  const result = executor();
  db.idempotency_store[cleanKey] = {
    key: cleanKey,
    timestamp: new Date().toISOString(),
    result,
  };
  persistDatabase(db);

  return {
    result,
    isDuplicate: false,
  };
}
