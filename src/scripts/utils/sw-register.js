import { Workbox } from 'workbox-window';

// Flag untuk memastikan service worker hanya didaftarkan sekali
let swRegistered = false;

const swRegister = async () => {
  if (swRegistered) {
    console.log('Service worker already registered, skipping...');
    return await navigator.serviceWorker.ready;
  }
 
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return null;
  }
  
  try {
    let workbox;
   
    // Register service worker berdasarkan environment
    if (process.env.NODE_ENV === 'production') {
      // Production: menggunakan Workbox-generated service worker
      workbox = new Workbox('./sw.bundle.js');
     
      // Handle service worker updates
      workbox.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('New service worker installed (update)');
          // Beri opsi kepada user untuk reload
          if (confirm('Versi baru tersedia! Muat ulang untuk memperbarui?')) {
            window.location.reload();
          }
        } else {
          console.log('Service worker installed for the first time');
          // Dispatch custom event untuk first installation
          window.dispatchEvent(new CustomEvent('pwa-installed'));
        }
      });
      
      workbox.addEventListener('waiting', () => {
        // Handle waiting state - tampilkan notifikasi update
        console.log('Service worker update waiting for activation');
        
        // Tampilkan notifikasi update
        const updateNotification = document.getElementById('notification');
        const updateMessage = document.getElementById('notificationMessage');
        
        if (updateNotification && updateMessage) {
          updateMessage.textContent = 'Pembaruan aplikasi tersedia. Muat ulang untuk menggunakan versi terbaru.';
          updateNotification.classList.remove('hidden');
          updateNotification.classList.add('update');
          
          // Tambahkan tombol update
          const updateButton = document.createElement('button');
          updateButton.textContent = 'Update';
          updateButton.classList.add('update-button');
          updateButton.addEventListener('click', () => {
            // Skip waiting dan reload
            workbox.messageSkipWaiting();
            window.location.reload();
          });
          
          updateNotification.appendChild(updateButton);
        }
      });
      
      workbox.addEventListener('activated', (event) => {
        console.log('Service worker activated');
        if (!event.isUpdate) {
          // First time activation, initialize push notifications
          console.log('First time activation, ready for push notifications');
          
          // Claim clients
          workbox.messageSW({ type: 'CLIENTS_CLAIM' });
        }
      });
      
      // Register the service worker
      await workbox.register();
      console.log('Production service worker registered successfully');
     
    } else {
      // Development: register service worker langsung
      // Perbaikan: Gunakan path relatif './sw.js' alih-alih '/sw.js'
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Development service worker registered successfully');
     
      // Simulasi workbox interface untuk konsistensi
      workbox = {
        messageSkipWaiting: () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }),
        addEventListener: (type, handler) => {
          // Simplified event handling for development
          if (type === 'installed') {
            registration.addEventListener('updatefound', () => {
              handler({ isUpdate: !!registration.waiting });
            });
          }
        }
      };
    }
   
    swRegistered = true;
   
    // Return service worker registration untuk push notifications
    const registration = await navigator.serviceWorker.ready;
    console.log('Service worker ready for push notifications');
   
    // Setup communication channel with service worker
    setupMessageChannel();
    
    return registration;
   
  } catch (error) {
    console.error('Failed to register service worker:', error);
   
    // Debug info
    console.log('Current location:', window.location.href);
    console.log('Navigator:', navigator.userAgent);
   
    return null;
  }
};

// Setup message channel untuk komunikasi dengan service worker
const setupMessageChannel = () => {
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from Service Worker:', event.data);
    
    if (event.data && event.data.type === 'SYNC_COMPLETED') {
      // Handle sync completed notification
      const { message } = event.data;
      const networkHandler = window.networkHandler;
      
      if (networkHandler) {
        networkHandler.showNotification(message || 'Data offline telah disinkronkan', 'success', 5000);
      }
    }
  });
};

// Function untuk mengirim pesan ke service worker
const sendToSW = async (message) => {
  const registration = await navigator.serviceWorker.ready;
  if (registration.active) {
    registration.active.postMessage(message);
  }
};

export { swRegister, sendToSW };
export default swRegister;