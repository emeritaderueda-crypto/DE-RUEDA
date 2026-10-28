/**
 * Daily Redundancy Export Service (Browser Local Storage Database Redundancy)
 *
 * Implements a routine that triggers a browser-based database export of payroll
 * and employee records to local storage at the end of each day to ensure data redundancy.
 */

import { Employee, PayrollRecord } from '../types';

export interface RedundancySnapshotMetadata {
  snapshot_id: string;
  date_key: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  trigger_type: 'AUTOMATIC_END_OF_DAY' | 'MANUAL_TRIGGER';
  initiated_by: string;
  employee_count: number;
  payroll_count: number;
  total_gross_pay: number;
  total_net_pay: number;
  checksum: string;
  storage_size_bytes: number;
}

export interface DailyRedundancySnapshot {
  metadata: RedundancySnapshotMetadata;
  data: {
    employees: Employee[];
    payroll: PayrollRecord[];
  };
}

const STORAGE_KEY_PREFIX = 'DERUEDA_EOD_BACKUP_';
const STORAGE_KEY_LATEST = 'DERUEDA_EOD_BACKUP_LATEST';
const STORAGE_KEY_INDEX = 'DERUEDA_EOD_BACKUP_INDEX';
const STORAGE_KEY_LAST_DATE = 'DERUEDA_LAST_EOD_EXPORT_DATE';
const STORAGE_KEY_LAST_TIME = 'DERUEDA_LAST_EOD_EXPORT_TIME';

/**
 * Generate a deterministic checksum string for data redundancy verification
 */
function generateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `CRC32-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

/**
 * Get date string formatted as YYYY-MM-DD in local timezone
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check whether the end-of-day redundancy routine should trigger automatically
 * Triggers if:
 * 1. No backup exists for today's date key, AND
 * 2. Current local time is at or after 17:00 (5:00 PM - end of construction workday) OR
 *    no redundancy snapshot has ever been created.
 */
export function shouldTriggerEodExport(currentTime: Date = new Date()): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  const todayKey = getLocalDateKey(currentTime);
  const lastExportDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);

  // If already exported today, no duplicate automatic trigger needed
  if (lastExportDate === todayKey) {
    return false;
  }

  // End of business day is 17:00 (5:00 PM) onwards
  const currentHour = currentTime.getHours();
  const isEndOfDay = currentHour >= 17;

  // Trigger if it's end of day or if no previous export exists at all
  if (isEndOfDay || !lastExportDate) {
    return true;
  }

  return false;
}

/**
 * Execute a browser-based database export of payroll and employee records to localStorage
 */
export function triggerDailyRedundancyExport(
  employees: Employee[],
  payroll: PayrollRecord[],
  triggerType: 'AUTOMATIC_END_OF_DAY' | 'MANUAL_TRIGGER' = 'AUTOMATIC_END_OF_DAY',
  initiatedBy: string = 'SYSTEM_EOD_ROUTINE'
): { success: boolean; snapshot?: DailyRedundancySnapshot; error?: string } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, error: 'Local storage is unavailable in this environment.' };
  }

  try {
    const now = new Date();
    const dateKey = getLocalDateKey(now);
    const snapshotId = `DRC-EOD-${dateKey}-${now.getTime().toString(36).toUpperCase()}`;

    const totalGross = payroll.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0);
    const totalNet = payroll.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);

    const rawDataString = JSON.stringify({ employees, payroll });
    const checksum = generateSimpleChecksum(rawDataString);

    const metadata: RedundancySnapshotMetadata = {
      snapshot_id: snapshotId,
      date_key: dateKey,
      timestamp: now.toISOString(),
      trigger_type: triggerType,
      initiated_by: initiatedBy,
      employee_count: employees.length,
      payroll_count: payroll.length,
      total_gross_pay: Math.round(totalGross * 100) / 100,
      total_net_pay: Math.round(totalNet * 100) / 100,
      checksum,
      storage_size_bytes: rawDataString.length,
    };

    const snapshot: DailyRedundancySnapshot = {
      metadata,
      data: {
        employees,
        payroll,
      },
    };

    const serializedSnapshot = JSON.stringify(snapshot);

    // 1. Store as latest backup
    localStorage.setItem(STORAGE_KEY_LATEST, serializedSnapshot);

    // 2. Store specific dated daily backup
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${dateKey}`, serializedSnapshot);

    // 3. Update index of daily backups (retain rolling last 30 daily snapshots)
    const existingIndexRaw = localStorage.getItem(STORAGE_KEY_INDEX);
    let index: RedundancySnapshotMetadata[] = [];
    if (existingIndexRaw) {
      try {
        index = JSON.parse(existingIndexRaw);
        if (!Array.isArray(index)) index = [];
      } catch {
        index = [];
      }
    }

    // Remove older snapshot with the same date key if present, then prepend
    index = index.filter((item) => item.date_key !== dateKey);
    index.unshift(metadata);

    // Prune beyond 30 days to keep localStorage lightweight
    if (index.length > 30) {
      const removed = index.slice(30);
      removed.forEach((item) => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${item.date_key}`);
      });
      index = index.slice(0, 30);
    }

    localStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(index));
    localStorage.setItem(STORAGE_KEY_LAST_DATE, dateKey);
    localStorage.setItem(STORAGE_KEY_LAST_TIME, metadata.timestamp);

    return { success: true, snapshot };
  } catch (err: any) {
    console.error('[Redundancy Export Error]:', err);
    return {
      success: false,
      error: err?.message || 'Failed to write redundancy snapshot to browser local storage.',
    };
  }
}

/**
 * Retrieve the latest redundancy backup snapshot metadata and status
 */
export function getLatestRedundancySnapshot(): DailyRedundancySnapshot | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LATEST);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Retrieve the list of all daily redundancy snapshots in local storage
 */
export function getRedundancyIndex(): RedundancySnapshotMetadata[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INDEX);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Download a specific redundancy snapshot as a JSON backup file to user's disk
 */
export function downloadRedundancySnapshot(dateKey?: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = dateKey ? `${STORAGE_KEY_PREFIX}${dateKey}` : STORAGE_KEY_LATEST;
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    const blob = new Blob([raw], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRC_REDUNDANCY_DATABASE_EXPORT_${dateKey || 'LATEST'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download redundancy snapshot:', err);
    return false;
  }
}
