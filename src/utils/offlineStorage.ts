import {
  AttendanceRecord,
  Employee,
  Site,
  PayrollRecord,
  OfflineActionItem,
  OfflineCacheStats,
  SyncActivityLogEntry,
} from '../types';

const PREFIX = 'DRC_ERP_OFFLINE_';
const KEYS = {
  ATTENDANCE: `${PREFIX}ATTENDANCE_CACHE`,
  EMPLOYEES: `${PREFIX}EMPLOYEES_CACHE`,
  PROJECTS: `${PREFIX}PROJECTS_CACHE`,
  PAYROLL: `${PREFIX}PAYROLL_CACHE`,
  QUEUE: `${PREFIX}ACTION_QUEUE`,
  LAST_SYNC: `${PREFIX}LAST_SYNC_TS`,
  SIMULATE_OFFLINE: `${PREFIX}SIMULATE_OFFLINE`,
  SYNC_LOGS: `${PREFIX}SYNC_LOGS`,
};

// Safe localStorage access
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to save ${key}:`, err);
  }
}

// 1. Core Data Cache Savers
export function saveAttendanceCache(data: AttendanceRecord[]): void {
  safeSet(KEYS.ATTENDANCE, data);
  touchLastSync();
}

export function getAttendanceCache(): AttendanceRecord[] {
  return safeGet<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
}

export function saveEmployeesCache(data: Employee[]): void {
  safeSet(KEYS.EMPLOYEES, data);
  touchLastSync();
}

export function getEmployeesCache(): Employee[] {
  return safeGet<Employee[]>(KEYS.EMPLOYEES, []);
}

export function saveProjectsCache(data: Site[]): void {
  safeSet(KEYS.PROJECTS, data);
  touchLastSync();
}

export function getProjectsCache(): Site[] {
  return safeGet<Site[]>(KEYS.PROJECTS, []);
}

export function savePayrollCache(data: PayrollRecord[]): void {
  safeSet(KEYS.PAYROLL, data);
  touchLastSync();
}

export function getPayrollCache(): PayrollRecord[] {
  return safeGet<PayrollRecord[]>(KEYS.PAYROLL, []);
}

function touchLastSync(): void {
  try {
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function getLastSyncTimestamp(): string {
  try {
    return localStorage.getItem(KEYS.LAST_SYNC) || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// 2. Offline Action Mutation Queue & Payload Sizing
export function getPayloadSizeBytes(payload: any): number {
  try {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return new TextEncoder().encode(serialized).length;
  } catch {
    return 256;
  }
}

export const INITIAL_SAMPLE_QUEUE: OfflineActionItem[] = [
  {
    id: 'QUEUE-TX-101',
    type: 'ATTENDANCE_SCAN',
    payload: {
      employee_id: 'DRC-EMP-2024-000001',
      employee_name: 'Juan Dela Cruz',
      event_type: 'TIME_IN',
      clock_time: '06:48 AM',
      site_id: 'SITE-001',
      device_id: 'TURNSTILE-GATE-01A',
      location_tag: 'Main Turnstile North',
      qr_version: 1,
      security_hash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      turnstile_mode: 'High-Volume Optical Offline Pass',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    synced: false,
    retryCount: 2,
    maxRetries: 5,
    lastError: 'HTTP 504 Gateway Timeout: Turnstile cellular router dropped connection during burst POST.',
    site_id: 'SITE-001',
    device_id: 'TURNSTILE-GATE-01A',
    status: 'RETRYING',
    payloadSizeBytes: 584,
  },
  {
    id: 'QUEUE-TX-102',
    type: 'DEDUCTION_ADD',
    payload: {
      charge_id: 'CANTEEN-CHG-9921',
      employee_id: 'DRC-EMP-2024-000004',
      employee_name: 'Rodrigo Santos',
      week_key: 'Week 41',
      meal_items: [
        { item: 'Pork Sinigang with Rice', qty: 1, price: 95 },
        { item: 'Bottled Mineral Water 500ml', qty: 1, price: 20 },
      ],
      amount: 115,
      site_id: 'SITE-002',
      payment_method: 'Payroll Deduction Chit',
      canteen_pos_id: 'CANTEEN-POS-02',
      authorized_by: 'Canteen Supervisor Gloria',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    synced: false,
    retryCount: 1,
    maxRetries: 5,
    lastError: 'HTTP 408 Request Timeout: Upstream payroll ledger lock busy.',
    site_id: 'SITE-002',
    device_id: 'CANTEEN-POS-02',
    status: 'PENDING',
    payloadSizeBytes: 712,
  },
  {
    id: 'QUEUE-TX-103',
    type: 'GCASH_PAY',
    payload: {
      payroll_id: 'PR-2026-W41-002',
      employee_id: 'DRC-EMP-2024-000002',
      employee_name: 'Eduardo Manalo',
      gcash_number: '0917-889-4321',
      amount: 5250.0,
      reference_no: 'GCASH-OFF-20261014-8841',
      transaction_mode: 'Site Offline Emergency Voucher',
      receipt_file: 'GCash_Receipt_Eduardo_Manalo_8841.svg',
      authorized_by: 'Engr. De Rueda (CEO)',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    synced: false,
    retryCount: 3,
    maxRetries: 5,
    lastError: 'HTTP 429 Rate Limit Exceeded: Upstream GCash gateway backoff required before retry.',
    site_id: 'SITE-001',
    device_id: 'TABLET-DISBURSE-01',
    status: 'FAILED',
    payloadSizeBytes: 648,
  },
  {
    id: 'QUEUE-TX-104',
    type: 'ATTENDANCE_SCAN',
    payload: {
      employee_id: 'DRC-EMP-2024-000008',
      employee_name: 'Danilo Reyes',
      event_type: 'TIME_OUT',
      clock_time: '05:02 PM',
      site_id: 'SITE-003',
      device_id: 'TURNSTILE-GATE-03',
      location_tag: 'Depot Gate East',
      qr_version: 1,
      security_hash: 'SHA256:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
      turnstile_mode: 'Autonomous Turnstile Camera',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    synced: false,
    retryCount: 0,
    maxRetries: 5,
    site_id: 'SITE-003',
    device_id: 'TURNSTILE-GATE-03',
    status: 'PENDING',
    payloadSizeBytes: 540,
  },
  {
    id: 'QUEUE-TX-105',
    type: 'PAYROLL_VERIFY',
    payload: {
      verification_id: 'VERIFY-W41-S01',
      payroll_batch_id: 'BATCH-2026-W41',
      verified_by: 'Admin 1 (Timekeeper)',
      verified_workers_count: 24,
      total_gross_wages: 104500.0,
      total_statutory_deductions: 9405.0,
      compliance_seal: 'DOLE-PHIL-APPROVED',
      site_id: 'SITE-001',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    synced: false,
    retryCount: 0,
    maxRetries: 5,
    site_id: 'SITE-001',
    device_id: 'ADMIN-CONSOLE-01',
    status: 'PENDING',
    payloadSizeBytes: 890,
  },
];

export function queueOfflineAction(
  action: Omit<OfflineActionItem, 'id' | 'timestamp' | 'synced' | 'retryCount'> & {
    retryCount?: number;
    maxRetries?: number;
    lastError?: string;
    site_id?: string;
    device_id?: string;
    payloadSizeBytes?: number;
    status?: 'PENDING' | 'RETRYING' | 'FAILED' | 'COMMITTED';
  }
): OfflineActionItem {
  const queue = getOfflineQueue();
  const calculatedSize = action.payloadSizeBytes || getPayloadSizeBytes(action.payload);
  const newItem: OfflineActionItem = {
    ...action,
    id: `QUEUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    synced: false,
    retryCount: action.retryCount || 0,
    maxRetries: action.maxRetries || 5,
    payloadSizeBytes: calculatedSize,
    status: action.status || 'PENDING',
  };
  const updated = [newItem, ...queue];
  safeSet(KEYS.QUEUE, updated);
  return newItem;
}

export function getOfflineQueue(): OfflineActionItem[] {
  const stored = safeGet<OfflineActionItem[]>(KEYS.QUEUE, []);
  if (stored.length === 0) {
    safeSet(KEYS.QUEUE, INITIAL_SAMPLE_QUEUE);
    return INITIAL_SAMPLE_QUEUE;
  }
  return stored;
}

export function updateOfflineQueueItem(id: string, updates: Partial<OfflineActionItem>): void {
  const queue = getOfflineQueue();
  const updated = queue.map((item) => (item.id === id ? { ...item, ...updates } : item));
  safeSet(KEYS.QUEUE, updated);
}

export function removeOfflineQueueItem(id: string): void {
  const queue = getOfflineQueue();
  safeSet(KEYS.QUEUE, queue.filter((item) => item.id !== id));
}

export function clearOfflineQueue(): void {
  safeSet(KEYS.QUEUE, []);
}

export function seedSampleOfflineQueue(): OfflineActionItem[] {
  safeSet(KEYS.QUEUE, INITIAL_SAMPLE_QUEUE);
  return INITIAL_SAMPLE_QUEUE;
}

// 2b. Detailed Synchronization Service Activity Logger
const INITIAL_SAMPLE_SYNC_LOGS: SyncActivityLogEntry[] = [
  {
    id: 'SYNC-LOG-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    direction: 'PULL',
    service: 'MASTERLIST_CACHE',
    status: 'SUCCESS',
    records_count: 24,
    payload_summary: 'Pulled 24 active employee biometric master records & credentials from central cloud database',
    site_id: 'SITE-001',
    device_id: 'TURNSTILE-GATE-01A',
    latency_ms: 142,
    details: 'HTTP 200 OK · Cloud Firestore / REST endpoint replica synced',
  },
  {
    id: 'SYNC-LOG-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    direction: 'PUSH',
    service: 'ATTENDANCE_QUEUE',
    status: 'SUCCESS',
    records_count: 8,
    payload_summary: 'Pushed 8 morning shift turnstile attendance clock-in scans from local SQLite/localStorage cache',
    site_id: 'SITE-001',
    device_id: 'TURNSTILE-GATE-01A',
    latency_ms: 89,
    details: 'Batch POST /api/attendance/sync committed with anti-duplicate validation',
  },
  {
    id: 'SYNC-LOG-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    direction: 'PUSH',
    service: 'CANTEEN_CHITS',
    status: 'SUCCESS',
    records_count: 4,
    payload_summary: 'Pushed 4 canteen meal subsidy deduction tickets stored during offline network drop',
    site_id: 'SITE-002',
    device_id: 'CANTEEN-POS-01',
    latency_ms: 110,
    details: 'IndexedDB buffer flushed successfully to payroll deduction register',
  },
  {
    id: 'SYNC-LOG-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    direction: 'HEARTBEAT',
    service: 'SYSTEM_STATE',
    status: 'SUCCESS',
    records_count: 1,
    payload_summary: 'Keep-alive connectivity ping to DRC primary API gateway',
    site_id: 'SITE-001',
    device_id: 'GATE-MONITOR-02',
    latency_ms: 38,
    details: 'Round-trip 38ms · Uplink healthy (LTE/Fiber redundant link)',
  },
];

export function getSyncActivityLogs(): SyncActivityLogEntry[] {
  const stored = safeGet<SyncActivityLogEntry[]>(KEYS.SYNC_LOGS, []);
  if (!stored || stored.length === 0) {
    safeSet(KEYS.SYNC_LOGS, INITIAL_SAMPLE_SYNC_LOGS);
    return INITIAL_SAMPLE_SYNC_LOGS;
  }
  return stored;
}

export function addSyncActivityLog(
  entry: Omit<SyncActivityLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): SyncActivityLogEntry {
  const currentLogs = getSyncActivityLogs();
  const newLog: SyncActivityLogEntry = {
    ...entry,
    id: `SYNC-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  const updated = [newLog, ...currentLogs].slice(0, 200); // keep up to 200 recent entries
  safeSet(KEYS.SYNC_LOGS, updated);
  return newLog;
}

export function clearSyncActivityLogs(): void {
  safeSet(KEYS.SYNC_LOGS, []);
}

// 3. Network & Simulation Helpers
export function isSimulateOffline(): boolean {
  try {
    return localStorage.getItem(KEYS.SIMULATE_OFFLINE) === 'true';
  } catch {
    return false;
  }
}

export function setSimulateOffline(simulate: boolean): void {
  try {
    localStorage.setItem(KEYS.SIMULATE_OFFLINE, simulate ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('drc:network-change', { detail: { online: !simulate && navigator.onLine } }));
  } catch {
    // ignore
  }
}

export function isNetworkOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (isSimulateOffline()) return false;
  return navigator.onLine;
}

// 4. Calculate Storage Size & Cache Diagnostic Stats
export function getOfflineCacheStats(): OfflineCacheStats {
  const isOnline = isNetworkOnline();
  const sim = isSimulateOffline();
  const emp = getEmployeesCache();
  const att = getAttendanceCache();
  const sites = getProjectsCache();
  const pay = getPayrollCache();
  const queue = getOfflineQueue();
  const lastSync = getLastSyncTimestamp();

  let storageBytes = 0;
  try {
    for (const key in localStorage) {
      if (key.startsWith(PREFIX)) {
        storageBytes += (localStorage.getItem(key) || '').length * 2;
      }
    }
  } catch {
    // ignore
  }

  return {
    isOnline,
    isSimulatedOffline: sim,
    cachedEmployeesCount: emp.length,
    cachedAttendanceCount: att.length,
    cachedSitesCount: sites.length,
    cachedPayrollCount: pay.length,
    pendingQueueCount: queue.length,
    lastSyncTimestamp: lastSync,
    storageUsageBytes: storageBytes,
  };
}

// 5. Offline Fallback GCash Receipt Generator (if site network drops during payment)
export function generateClientOfflineGCashReceipt(params: {
  referenceNo: string;
  transactionId: string;
  recipientName: string;
  recipientMobile: string;
  amount: number;
  weekKey: string;
  siteId: string;
  timestamp: string;
}): string {
  const formattedAmount = params.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 820" width="540" height="820" style="background:#0b1612;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;">
    <rect x="20" y="20" width="500" height="780" rx="20" fill="#ffffff"/>
    <path d="M 20 40 Q 20 20 40 20 L 500 20 Q 520 20 520 40 L 520 140 L 20 140 Z" fill="#005ce6"/>
    <text x="50" y="65" font-size="28" font-weight="900" fill="#ffffff">GCash</text>
    <text x="50" y="92" font-size="12" font-weight="700" fill="#bae6fd">OFFLINE QUEUED DISBURSEMENT</text>
    <text x="50" y="112" font-size="11" font-weight="500" fill="#e0f2fe">De Rueda Construction Enterprise Portal</text>
    <circle cx="458" cy="73" r="22" fill="#10b981"/>
    <path d="M 450 73 L 456 79 L 468 66" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <text x="270" y="185" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">Payment Queued for Sync</text>
    <text x="270" y="208" font-size="12" font-weight="500" fill="#64748b" text-anchor="middle">Recorded in Site Offline Cache</text>
    <rect x="50" y="225" width="440" height="90" rx="14" fill="#f0f7ff" stroke="#bfdbfe" stroke-width="1.5"/>
    <text x="270" y="258" font-size="13" font-weight="700" fill="#005ce6" text-anchor="middle">SALARY DISBURSEMENT</text>
    <text x="270" y="295" font-size="32" font-weight="900" fill="#003b99" text-anchor="middle" font-family="monospace">PHP ${formattedAmount}</text>
    <text x="70" y="360" font-size="12" font-weight="700" fill="#64748b">RECIPIENT</text>
    <text x="70" y="385" font-size="16" font-weight="800" fill="#0f172a">${params.recipientName}</text>
    <text x="470" y="385" font-size="14" font-weight="700" fill="#005ce6" text-anchor="end" font-family="monospace">${params.recipientMobile}</text>
    <text x="70" y="440" font-size="12" fill="#64748b">Reference No.</text>
    <text x="470" y="440" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end" font-family="monospace">${params.referenceNo}</text>
    <text x="70" y="480" font-size="12" fill="#64748b">Sender</text>
    <text x="470" y="480" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">DE RUEDA CONSTRUCTION INC.</text>
    <text x="70" y="520" font-size="12" fill="#64748b">Payroll Period</text>
    <text x="470" y="520" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${params.weekKey} (${params.siteId})</text>
    <rect x="50" y="680" width="440" height="52" rx="10" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="70" y="705" font-size="11" font-weight="700" fill="#065f46">OFFICIAL VOUCHER (STORED OFFLINE)</text>
    <text x="70" y="721" font-size="10" fill="#047857">Automatically queued and registered in DRC Document Vault.</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
