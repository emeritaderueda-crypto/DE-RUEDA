import { PendingOfflineCanteenRecord } from '../types';

const DB_NAME = 'DRC_ERP_INDEXED_DB';
const DB_VERSION = 1;
const STORE_CANTEEN_OFFLINE = 'offline_canteen_stipends';
const STORE_SYNC_LOGS = 'canteen_sync_logs';

/**
 * Open or upgrade the IndexedDB database for De Rueda Construction ERP
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store for offline GCash/cash collection records
      if (!db.objectStoreNames.contains(STORE_CANTEEN_OFFLINE)) {
        const store = db.createObjectStore(STORE_CANTEEN_OFFLINE, { keyPath: 'id' });
        store.createIndex('site_id', 'site_id', { unique: false });
        store.createIndex('week_key', 'week_key', { unique: false });
        store.createIndex('employee_id', 'employee_id', { unique: false });
        store.createIndex('payment_method', 'payment_method', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // 2. Store for sync history logs
      if (!db.objectStoreNames.contains(STORE_SYNC_LOGS)) {
        db.createObjectStore(STORE_SYNC_LOGS, { keyPath: 'sync_id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Store an offline GCash/cash weekly canteen stipend collection record in IndexedDB
 */
export async function saveOfflineCollectionToIndexedDB(
  record: PendingOfflineCanteenRecord
): Promise<PendingOfflineCanteenRecord> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);

      const toSave: PendingOfflineCanteenRecord = {
        ...record,
        storage_type: 'IndexedDB',
      };

      const request = store.put(toSave);

      request.onsuccess = () => {
        resolve(toSave);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Put error:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback save: IndexedDB error:', err);
    return record;
  }
}

/**
 * Retrieve all pending offline canteen stipend collections from IndexedDB
 */
export async function getAllOfflineCollectionsFromIndexedDB(): Promise<PendingOfflineCanteenRecord[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readonly');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[IndexedDB] GetAll error:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not load records:', err);
    return [];
  }
}

/**
 * Delete a synced or removed collection record from IndexedDB
 */
export async function deleteOfflineCollectionFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Delete error:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not delete item:', err);
  }
}

/**
 * Clear only successfully synced offline canteen stipend records from IndexedDB,
 * preserving any records that FAILED upload and require manual user action.
 */
export async function clearSyncedOnlyOfflineCollectionsFromIndexedDB(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const all = await getAllOfflineCollectionsFromIndexedDB();
    const toDelete = all.filter((r) => r.status === 'SYNCED');
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);

      toDelete.forEach((item) => {
        store.delete(item.id);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not clear synced records:', err);
  }
}

/**
 * Update an existing collection record in IndexedDB (e.g. marking as FAILED with error_reason)
 */
export async function updateOfflineCollectionRecord(
  id: string,
  updates: Partial<PendingOfflineCanteenRecord>
): Promise<PendingOfflineCanteenRecord | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (!getReq.result) {
          resolve(null);
          return;
        }
        const updated: PendingOfflineCanteenRecord = {
          ...getReq.result,
          ...updates,
          storage_type: 'IndexedDB',
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not update record:', err);
    return null;
  }
}

/**
 * Log a sync attempt result to IndexedDB for audit inspection
 */
export async function logCanteenSyncAttempt(log: {
  sync_id: string;
  timestamp: string;
  attempted_count: number;
  synced_count: number;
  failed_count: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  error_summary?: string;
}): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SYNC_LOGS, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_LOGS);
      store.put(log);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore logging errors
  }
}

/**
 * Clear all offline canteen stipend records from IndexedDB
 */
export async function clearAllOfflineCollectionsFromIndexedDB(): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTEEN_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_CANTEEN_OFFLINE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not clear store:', err);
  }
}

/**
 * Get statistics of offline records stored in IndexedDB
 */
export async function getIndexedDbCollectionStats(): Promise<{
  count: number;
  totalAmount: number;
  dbReady: boolean;
}> {
  try {
    const items = await getAllOfflineCollectionsFromIndexedDB();
    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      count: items.length,
      totalAmount: total,
      dbReady: true,
    };
  } catch {
    return {
      count: 0,
      totalAmount: 0,
      dbReady: false,
    };
  }
}

/**
 * Setup listener to automatically trigger synchronization once connectivity is detected
 */
export function setupAutoSyncOnConnectivity(
  onConnectivityDetected: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[IndexedDB AutoSync] Browser network online event detected.');
    onConnectivityDetected();
  };

  const handleCustomOnline = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.online) {
      console.log('[IndexedDB AutoSync] Custom network change event (online).');
      onConnectivityDetected();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('drc:network-change', handleCustomOnline);

  // Periodic connectivity heartbeat check every 30 seconds
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      onConnectivityDetected();
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('drc:network-change', handleCustomOnline);
    clearInterval(intervalId);
  };
}
