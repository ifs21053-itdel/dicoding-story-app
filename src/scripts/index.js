import 'regenerator-runtime';
import 'leaflet/dist/leaflet.css';
import '../styles/styles.css';
import App from './views/app';
import swRegister from './utils/sw-register';
import WebSocketInitiator from './utils/websocket-initiator';
import NotificationHelper from './utils/notification-helper';
import AccessibilityInitiator from './utils/accessibility-initiator';

const app = new App({
  button: document.querySelector('#hamburgerButton'),
  drawer: document.querySelector('#navigationDrawer'),
  content: document.querySelector('#mainContent'),
});

// Fungsi untuk transisi halaman yang halus
function smoothPageTransition(callback) {
  const mainContent = document.querySelector('#mainContent');
  
  // Jika browser mendukung View Transition API, gunakan itu
  if (document.startViewTransition) {
    return document.startViewTransition(callback);
  }
  
  // Fallback untuk browser yang tidak mendukung View Transition API
  mainContent.classList.add('page-transition-exit');
  
  setTimeout(() => {
    callback();
    mainContent.classList.remove('page-transition-exit');
    mainContent.classList.add('page-transition-enter');
    
    setTimeout(() => {
      mainContent.classList.remove('page-transition-enter');
    }, 300);
  }, 150);
}

window.addEventListener('hashchange', () => {
  document.querySelector('.app-bar__navigation')?.classList.remove('open');
  
  // Gunakan transisi halus untuk perubahan halaman
  smoothPageTransition(() => {
    app.renderPage();
  });
});

window.addEventListener('load', async () => {
  try {
    console.log('Initializing Dicoding Story App...');
    
    // Inisialisasi aksesibilitas dengan skip to content
    AccessibilityInitiator.init();
    
    // Render halaman dengan transisi
    smoothPageTransition(() => {
      app.renderPage();
    });
    
    // Register service worker (penting untuk push notifications)
    console.log('Registering service worker...');
    const swRegistration = await swRegister();
    
    if (swRegistration) {
      console.log('Service worker registered successfully');
    }
    
    // Initialize WebSocket connection for notifications
    WebSocketInitiator.init();

    // Initialize push notifications (setelah service worker ready)
    console.log('Initializing push notifications...');
    await NotificationHelper.init();
    
    console.log('App initialization completed');
    
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});

// Handle View Transitions untuk link clicks dengan transisi yang smooth
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a');
  if (anchor && anchor.href.includes('#/')) {
    e.preventDefault();
    
    // Gunakan transisi halus
    smoothPageTransition(() => {
      window.location.href = anchor.href;
    });
  }
});

// Tambahkan smooth scrolling untuk semua internal links
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (anchor && !anchor.href.includes('#/')) {
    e.preventDefault();
    const targetId = anchor.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
});

// Handle service worker messages (untuk push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from service worker:', event.data);
    
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      // Handle notification click events
      const { action, data } = event.data;
      
      if (action === 'view' && data.url) {
        // Navigate to the specified URL
        window.location.href = `#${data.url}`;
      }
    }
  });
}