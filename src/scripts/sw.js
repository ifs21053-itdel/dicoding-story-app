import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Definisikan versi cache - ubah ini saat ada perubahan besar
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  pages: `pages-${CACHE_VERSION}`,
  offline: `offline-${CACHE_VERSION}`
};

// App shell files untuk precache
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/app.webmanifest',
  '/favicon.png',
  '/images/logo.png',
  // Tambahkan file app shell penting lainnya di sini
];

// Precache app shell files
precacheAndRoute([
  ...self.__WB_MANIFEST || [],
  ...APP_SHELL_FILES.map(url => ({
    url,
    revision: CACHE_VERSION
  }))
]);

cleanupOutdatedCaches();

// ============================================
// ROUTE STRATEGIES
// ============================================

// API routes - StaleWhileRevalidate strategy
registerRoute(
  ({ request }) => request.url.includes('story-api.dicoding.dev'),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.api,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 jam
      }),
    ],
  })
);

// Cache images - CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// HTML pages - NetworkFirst strategy
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: CACHE_NAMES.pages,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Static assets - CacheFirst strategy
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// ============================================
// OFFLINE FALLBACK
// ============================================

// Buat strategi khusus untuk halaman utama
const mainPageStrategy = new NetworkFirst({
  cacheName: CACHE_NAMES.pages,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
});

// Register route untuk halaman utama
registerRoute(/\/$|\/index.html$/, mainPageStrategy);

// Buat fallback page
const createOfflineFallbackResponse = async () => {
  const cache = await caches.open(CACHE_NAMES.pages);
  const cachedResponse = await cache.match('/index.html');
  return cachedResponse || Response.error();
};

// Respond with cached main page untuk navigation requests yang gagal
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => createOfflineFallbackResponse())
    );
  }
});

// ============================================
// PUSH NOTIFICATION HANDLERS
// ============================================

// Handle push event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Dicoding Story',
    options: {
      body: 'You have a new notification',
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-192x192.png',
      tag: 'dicoding-story-notification',
      data: {
        url: '/home'
      }
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Push data received:', pushData);
      
      notificationData = {
        title: pushData.title || 'Dicoding Story',
        options: {
          body: pushData.options?.body || pushData.body || 'You have a new notification',
          icon: pushData.options?.icon || '/images/icons/icon-192x192.png',
          badge: pushData.options?.badge || '/images/icons/icon-192x192.png',
          tag: pushData.options?.tag || 'dicoding-story-notification',
          data: pushData.options?.data || { url: '/home' },
          actions: pushData.options?.actions || [
            {
              action: 'view',
              title: 'View Story'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'close') {
    // Just close the notification
    return;
  }

  // Default action or 'view' action
  const urlToOpen = notificationData.url ? 
    new URL(notificationData.url, self.location.origin).href : 
    self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab with the target URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Optional: Send analytics or perform cleanup
  event.waitUntil(
    // You can add analytics tracking here
    Promise.resolve()
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  
  event.waitUntil(
    // Handle subscription change
    // You might want to re-subscribe to push notifications
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });
    })
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    self.registration.showNotification(title, {
      body: options.body,
      icon: options.icon || '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-192x192.png',
      tag: 'manual-notification',
      ...options
    });
  }
});

// ============================================
// BACKGROUND SYNC HANDLER
// ============================================

// Handle sync event
self.addEventListener('sync', (event) => {
  console.log('Sync event triggered:', event.tag);
  
  if (event.tag === 'sync-new-story') {
    console.log('Syncing new stories created while offline...');
    
    event.waitUntil(
      // Implementasi sinkronisasi data offline
      caches.open('offline-posts')
        .then((cache) => {
          return cache.keys()
            .then((keys) => {
              // Jika tidak ada data yang perlu disinkronkan
              if (keys.length === 0) {
                console.log('No offline data to sync');
                return Promise.resolve();
              }
              
              return Promise.all(
                keys.map((key) => {
                  return cache.match(key)
                    .then((response) => response.json())
                    .then((data) => {
                      // Kirim data ke server
                      console.log('Syncing data:', data);
                      
                      // Contoh fetch ke API
                      return fetch('https://story-api.dicoding.dev/v1/stories', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${data.token}`
                        },
                        body: JSON.stringify(data.formData)
                      })
                      .then((response) => {
                        if (response.ok) {
                          // Hapus dari cache jika berhasil
                          console.log('Successfully synced story');
                          return cache.delete(key);
                        }
                        throw new Error('Failed to sync');
                      });
                    });
                })
              );
            })
            .then(() => {
              // Beritahu client bahwa sinkronisasi selesai
              self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                  client.postMessage({
                    type: 'SYNC_COMPLETED',
                    message: 'Data offline berhasil disinkronkan'
                  });
                });
              });
            });
        })
    );
  }
});