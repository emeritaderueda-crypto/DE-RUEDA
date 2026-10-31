// De Rueda Construction ERP Service Worker
// Provides offline resilience for field site network drops in Bataan, Subic & Zambales

const CACHE_NAME = 'drc-erp-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/api/canteen/menu',
];

// 1. Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[DRC Service Worker] Precaching app shell assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[DRC Service Worker] Precache partial error (ignored):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[DRC Service Worker] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-First with Cache Fallback for APIs, Stale-While-Revalidate for Shell
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests for standard caching
  if (request.method !== 'GET') {
    return;
  }

  // Never intercept Vite internal development routes, hot updates, or source modules
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('vite') ||
    url.searchParams.has('import') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // Dedicated handler for Canteen Menu standards (Stale-While-Revalidate with full offline fallback)
  if (url.pathname === '/api/canteen/menu') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cachedResponse);

        if (cachedResponse) {
          return cachedResponse;
        }

        return networkFetch.catch(() => {
          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              standard_code: 'DRC-CANTEEN-STD-2026-OFFLINE',
              accreditation: 'DOLE-R3-BTN-SANITARY-COMPLIANT',
              operating_hours: '06:00 - 19:30 Daily',
              inspection_status: 'CACHED OFFLINE SCHEDULE',
              menu_items: [
                { id: 'MENU-01', name: 'Hearty Field Breakfast', meal_type: 'Breakfast', price: 40, description: 'Garlic rice, fried egg, longganisa/daing, hot coffee', sanitary_certified: true, serving_window: '06:00 - 08:30' },
                { id: 'MENU-02', name: 'Standard Laborer Lunch Pack', meal_type: 'Lunch', price: 70, description: 'Steamed rice (2c), chicken/pork adobo, soup', sanitary_certified: true, serving_window: '11:30 - 13:30' },
                { id: 'MENU-03', name: 'Overtime Shift Dinner', meal_type: 'Dinner', price: 60, description: 'Steamed rice (2c), caldereta/fried chicken, pinakbet', sanitary_certified: true, serving_window: '17:30 - 19:30' },
                { id: 'MENU-04', name: 'Heavy Shift Extra Pack', meal_type: 'Heavy Pack', price: 100, description: 'Double rice, pork steak, egg, banana, water', sanitary_certified: true, serving_window: 'All Day' },
                { id: 'BUNDLE-01', name: '5-Day Standard Workweek Plan', meal_type: 'Weekly Bundle', price: 350, description: '5 days lunch (₱70/day) standard deduction', sanitary_certified: true, serving_window: 'Mon-Fri' },
                { id: 'BUNDLE-02', name: '5-Day Lunch + Breakfast Plan', meal_type: 'Weekly Bundle', price: 550, description: '5 days breakfast + lunch (₱110/day)', sanitary_certified: true, serving_window: 'Mon-Fri' },
                { id: 'BUNDLE-03', name: '6-Day Standard Extended Shift', meal_type: 'Weekly Bundle', price: 420, description: '6 days lunch (₱70/day)', sanitary_certified: true, serving_window: 'Mon-Sat' },
                { id: 'BUNDLE-04', name: '7-Day Full Heavy Site Overtime', meal_type: 'Weekly Bundle', price: 1050, description: '7 days high-calorie nutrition (₱150/day)', sanitary_certified: true, serving_window: '7 Days' },
              ],
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
          );
        });
      })
    );
    return;
  }

  // Handle general API Requests: Network first, with graceful offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone and cache for offline backup
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Network failed: attempt to match cached copy
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          // Return synthetic offline response
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Site network currently offline. Using local cached ERP records.',
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        })
    );
    return;
  }

  // Handle Static & App Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Client Communication & Background Sync Handlers
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'CHECK_SW_STATUS') {
    if (event.source) {
      event.source.postMessage({
        type: 'SW_STATUS_RESPONSE',
        version: CACHE_NAME,
        status: 'active',
        isOfflineReady: true,
        timestamp: Date.now(),
      });
    }
  } else if (event.data.type === 'NOTIFY_SYNC_STATE') {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_SYNC_STATE_CHANGED',
          isSyncing: event.data.isSyncing,
          pendingCount: event.data.pendingCount,
          timestamp: Date.now(),
        });
      });
    });
  }
});

// 5. Background Sync Event (Standard Service Worker Sync Registration)
self.addEventListener('sync', (event) => {
  if (event.tag === 'drc-offline-sync' || (event.tag && event.tag.startsWith('drc-sync'))) {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_TRIGGER_SYNC',
            tag: event.tag,
            timestamp: Date.now(),
          });
        });
      })
    );
  }
});

