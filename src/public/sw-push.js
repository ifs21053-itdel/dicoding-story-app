// sw-push.js - File untuk menangani push notification di service worker
// Letakkan file ini di folder /public untuk disalin ke folder dist

// ============================================
// PUSH NOTIFICATION HANDLERS
// ============================================

// Handler untuk menerima push notification
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Dicoding Story',
    options: {
      body: 'Ada cerita baru untuk Anda!',
      icon: './images/icons/web-app-manifest-192x192.png',
      badge: './images/icons/web-app-manifest-72x72.png',
      tag: 'dicoding-story-notification',
      data: {
        url: '/home'
      },
      actions: [
        {
          action: 'view',
          title: 'Lihat Cerita'
        },
        {
          action: 'close',
          title: 'Tutup'
        }
      ]
    }
  };

  // Parse data yang diterima jika ada
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Push data received:', pushData);
      
      // Gunakan data dari server jika tersedia
      notificationData = {
        title: pushData.title || 'Dicoding Story',
        options: {
          body: pushData.options?.body || pushData.body || 'Ada cerita baru untuk Anda!',
          icon: pushData.options?.icon || './images/icons/web-app-manifest-192x192.png',
          badge: pushData.options?.badge || './images/icons/web-app-manifest-72x72.png',
          tag: pushData.options?.tag || 'dicoding-story-notification',
          data: pushData.options?.data || { url: '/home' },
          actions: pushData.options?.actions || [
            {
              action: 'view',
              title: 'Lihat Cerita'
            },
            {
              action: 'close',
              title: 'Tutup'
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Tampilkan notifikasi
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

// Handler untuk klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Tutup notifikasi
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  
  // Jika action adalah close, tidak perlu melakukan apa-apa
  if (action === 'close') {
    return;
  }

  // Default action atau action view
  const urlToOpen = notificationData.url ? 
    new URL(notificationData.url, self.location.origin).href : 
    self.location.origin;

  // Buka jendela atau tab dengan URL yang ditentukan
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((windowClients) => {
      // Periksa apakah sudah ada jendela/tab terbuka dengan URL yang sama
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        // Jika URL sudah terbuka, focus ke tab tersebut
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Jika tidak ada tab terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handler untuk penutupan notifikasi
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Opsional: kirim analytics atau lakukan pembersihan
  event.waitUntil(
    // Implementasi jika diperlukan
    Promise.resolve()
  );
});

// Handler untuk perubahan subscription push
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  
  // VAPID public key dari Dicoding API
  const applicationServerKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
  
  // Resubscribe dengan key yang sama
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
    .then((subscription) => {
      // Kirim subscription baru ke server
      return fetch('https://story-api.dicoding.dev/v1/stories/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Ganti dengan token pengguna
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });
    })
    .catch(error => {
      console.error('Failed to resubscribe:', error);
    })
  );
});

// Handler untuk pesan dari main thread
self.addEventListener('message', (event) => {
  console.log('Message received in service worker:', event.data);
  
  // Handle pesan untuk menampilkan notifikasi manual
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    self.registration.showNotification(title, {
      body: options.body || 'Notification from Dicoding Story',
      icon: options.icon || './images/icons/web-app-manifest-192x192.png',
      badge: './images/icons/web-app-manifest-72x72.png',
      tag: 'manual-notification',
      ...options
    });
  }
  
  // Handle pesan untuk memperbarui cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});