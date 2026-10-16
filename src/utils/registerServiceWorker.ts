// Service Worker Registration & Sync Management for De Rueda Construction ERP
import { useState, useEffect, useCallback } from 'react';

let globalRegistration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          globalRegistration = registration;
          console.log('[ServiceWorker] DRC ERP offline worker registered:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[ServiceWorker] New content is available; please refresh.');
                  } else {
                    console.log('[ServiceWorker] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Registration failed (ignored in sandbox):', error);
        });
    });
  }
}

/**
 * Retrieves the current Service Worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  if (globalRegistration) {
    return globalRegistration;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) {
      globalRegistration = reg;
      return reg;
    }
    // Alternatively wait for ready
    const readyReg = await navigator.serviceWorker.ready;
    globalRegistration = readyReg;
    return readyReg;
  } catch {
    return null;
  }
}

/**
 * Returns the synchronously cached registration instance if available
 */
export function getCachedServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return globalRegistration;
}

/**
 * Broadcasts sync activity to Service Worker for background sync & worker-assisted queueing
 */
export function broadcastSyncStateToServiceWorker(isSyncing: boolean, pendingCount: number): void {
  if (typeof window === 'undefined') return;

  // Dispatch local window event for instant in-tab synchronization
  window.dispatchEvent(
    new CustomEvent('drc:sw-sync-state', {
      detail: { isSyncing, pendingCount, timestamp: Date.now() },
    })
  );

  if (!('serviceWorker' in navigator)) return;

  const target = navigator.serviceWorker.controller || globalRegistration?.active;
  if (target) {
    try {
      target.postMessage({
        type: 'NOTIFY_SYNC_STATE',
        isSyncing,
        pendingCount,
      });
    } catch (err) {
      console.warn('[ServiceWorker] Failed to post sync message:', err);
    }
  }
}

/**
 * Registers a Background Sync tag with the Service Worker (if supported by browser)
 */
export async function requestServiceWorkerBackgroundSync(tag = 'drc-offline-sync'): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const reg = await getServiceWorkerRegistration();
    if (reg && 'sync' in reg) {
      await (reg as any).sync.register(tag);
      return true;
    }
  } catch {
    // Background sync not supported or failed
  }
  return false;
}

export interface ServiceWorkerSyncStatus {
  registration: ServiceWorkerRegistration | null;
  isRegistered: boolean;
  isControllerActive: boolean;
  cacheVersion: string;
  swSyncing: boolean;
  swPendingCount: number;
  backgroundSyncSupported: boolean;
  requestBackgroundSync: (tag?: string) => Promise<boolean>;
  broadcastSyncState: (isSyncing: boolean, pendingCount: number) => void;
}

/**
 * React hook to observe service worker registration, real-time sync state, and offline capability
 */
export function useServiceWorkerSyncStatus(): ServiceWorkerSyncStatus {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(globalRegistration);
  const [isRegistered, setIsRegistered] = useState(Boolean(globalRegistration));
  const [isControllerActive, setIsControllerActive] = useState(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)
  );
  const [cacheVersion, setCacheVersion] = useState<string>('drc-erp-cache-v2');
  const [swSyncing, setSwSyncing] = useState<boolean>(false);
  const [swPendingCount, setSwPendingCount] = useState<number>(0);
  const [backgroundSyncSupported, setBackgroundSyncSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let isMounted = true;

    // Check existing registration
    getServiceWorkerRegistration().then((reg) => {
      if (!isMounted) return;
      if (reg) {
        setRegistration(reg);
        setIsRegistered(true);
        setIsControllerActive(Boolean(navigator.serviceWorker.controller || reg.active));
        setBackgroundSyncSupported('sync' in reg);
      }
    });

    // Listen for controller changes
    const onControllerChange = () => {
      if (isMounted) {
        setIsControllerActive(Boolean(navigator.serviceWorker.controller));
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Listen for postMessages from Service Worker
    const handleSwMessage = (event: MessageEvent) => {
      if (!isMounted || !event.data) return;

      if (event.data.type === 'SW_STATUS_RESPONSE') {
        if (event.data.version) {
          setCacheVersion(event.data.version);
        }
      } else if (event.data.type === 'SW_SYNC_STATE_CHANGED') {
        if (typeof event.data.isSyncing === 'boolean') {
          setSwSyncing(event.data.isSyncing);
        }
        if (typeof event.data.pendingCount === 'number') {
          setSwPendingCount(event.data.pendingCount);
        }
      } else if (event.data.type === 'SW_TRIGGER_SYNC') {
        // Broadcast trigger event to window
        window.dispatchEvent(
          new CustomEvent('drc:sw-trigger-sync', {
            detail: { tag: event.data.tag, timestamp: Date.now() },
          })
        );
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);

    // Also listen to local window sync state broadcasts for instantaneous response
    const handleLocalSyncBroadcast = (e: Event) => {
      if (!isMounted) return;
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (typeof detail.isSyncing === 'boolean') {
          setSwSyncing(detail.isSyncing);
        }
        if (typeof detail.pendingCount === 'number') {
          setSwPendingCount(detail.pendingCount);
        }
      }
    };
    window.addEventListener('drc:sw-sync-state', handleLocalSyncBroadcast);

    // Ping SW to query active cache version
    const target = navigator.serviceWorker.controller || globalRegistration?.active;
    if (target) {
      try {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (isMounted && event.data && event.data.type === 'SW_STATUS_RESPONSE') {
            setCacheVersion(event.data.version || 'drc-erp-cache-v2');
          }
        };
        target.postMessage({ type: 'CHECK_SW_STATUS' }, [messageChannel.port2]);
      } catch {
        // Ignored
      }
    }

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      window.removeEventListener('drc:sw-sync-state', handleLocalSyncBroadcast);
    };
  }, []);

  const requestBackgroundSync = useCallback(async (tag = 'drc-offline-sync') => {
    return requestServiceWorkerBackgroundSync(tag);
  }, []);

  const broadcastSyncState = useCallback((isSyncing: boolean, pendingCount: number) => {
    broadcastSyncStateToServiceWorker(isSyncing, pendingCount);
  }, []);

  return {
    registration,
    isRegistered,
    isControllerActive,
    cacheVersion,
    swSyncing,
    swPendingCount,
    backgroundSyncSupported,
    requestBackgroundSync,
    broadcastSyncState,
  };
}
