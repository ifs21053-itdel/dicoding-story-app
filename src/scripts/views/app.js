import DrawerInitiator from '../utils/drawer-initiator';
import UrlParser from '../routes/url-parser';
import routes, { routeConfig } from '../routes/routes';
import Auth from '../utils/auth';
import NetworkHandler from '../utils/network-handler';
import { swRegister } from '../utils/sw-register';
import PWAUtils from '../utils/pwa-utils';

class App {
  constructor({ button, drawer, content }) {
    this._button = button;
    this._drawer = drawer;
    this._content = content;
    this._currentUrl = null; // Tambahkan ini untuk mencegah render berulang
    
    // Inisialisasi NetworkHandler untuk mengelola status online/offline
    this._networkHandler = new NetworkHandler();
    window.networkHandler = this._networkHandler; // Expose ke global untuk akses di komponen lain
    
    this._initialAppShell();
    this._initializePWA();
  }

  _initialAppShell() {
    DrawerInitiator.init({
      button: this._button,
      drawer: this._drawer,
      content: this._content,
    });
  }
  
  async _initializePWA() {
    try {
      // Daftarkan service worker
      const registration = await swRegister();
      if (registration) {
        console.log('Service worker registered successfully');
        
        // Inisialisasi PWA utils
        this._pwaUtils = new PWAUtils();
        window.pwaUtils = this._pwaUtils;
        
        // Menyiapkan sinkronisasi background jika didukung
        if ('SyncManager' in window) {
          registration.sync.register('sync-new-story')
            .then(() => console.log('Background sync registered'))
            .catch(error => console.error('Background sync registration failed:', error));
        }
      }
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
    
    // Register network listeners
    this._registerNetworkListeners();
    
    // Check initial network status
    this._checkInitialNetworkStatus();
  }
  
  _registerNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('App is back online');
      document.body.classList.remove('offline-mode');
      
      // Show notification
      this._networkHandler.showNotification(
        'Anda kembali online! Semua fitur telah tersedia.',
        'success',
        3000
      );
      
      // Re-render halaman jika diperlukan
      if (this._currentUrl) {
        this.renderPage();
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline');
      document.body.classList.add('offline-mode');
      
      // Show notification
      this._networkHandler.showNotification(
        'Anda sedang offline. Beberapa fitur mungkin terbatas.',
        'warning',
        0  // Don't auto-hide
      );
    });
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'SYNC_COMPLETED') {
          this._networkHandler.showNotification(
            event.data.message || 'Data offline telah disinkronkan',
            'success',
            5000
          );
        }
      });
    }
  }
  
  _checkInitialNetworkStatus() {
    if (!navigator.onLine) {
      document.body.classList.add('offline-mode');
    }
  }

  async renderPage() {
    try {
      // Update navigation based on authentication status
      this._updateNavigationByAuth();

      const url = UrlParser.parseActiveUrlWithCombiner();
      
      // Tambahkan pengecekan ini untuk mencegah render berulang pada URL yang sama
      if (this._currentUrl === url) {
        console.log('Skipping render - URL didn\'t change:', url);
        return;
      }

      this._currentUrl = url;
      console.log('Rendering page for URL:', url);
      
      const page = routes[url];
      
      // Check if page exists
      if (!page) {
        console.error('Page not found for URL:', url);
        this._content.innerHTML = this._getNotFoundTemplate();
        return;
      }
      
      // Get route configuration if exists
      const config = routeConfig[url] || {};
      
      // Check if we're offline and the page requires online access
      if (config.needsOnline && !this._networkHandler.isOnline()) {
        console.log('Page requires online access but we are offline');
        this._content.innerHTML = this._getOfflineTemplate();
        return;
      }
      
      // Check if the page requires authentication
      if (config.needAuth && !Auth.isLoggedIn()) {
        console.log('Page requires auth, redirecting to login');
        window.location.href = '#/login';
        return;
      }
      
      // Add page transition
      this._content.classList.add('page-transition');
      
      // Show loading indicator if available
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
      }
      
      try {
        // Render page content
        this._content.innerHTML = await page.render();
        
        // Remove transition class after short delay
        setTimeout(() => {
          this._content.classList.remove('page-transition');
          this._content.classList.add('page-visible');
        }, 50);
        
        await page.afterRender();
      } catch (renderError) {
        console.error('Error rendering page content:', renderError);
        
        // Cek apakah error disebabkan oleh masalah koneksi
        if (!this._networkHandler.isOnline()) {
          this._content.innerHTML = this._getOfflineTemplate();
        } else {
          this._content.innerHTML = this._getErrorTemplate(renderError.message);
        }
      } finally {
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
        }
      }
      
      // Scroll ke atas pada setiap navigasi halaman
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error in renderPage:', error);
      this._content.innerHTML = this._getErrorTemplate(error.message);
    }
  }

  _updateNavigationByAuth() {
    const loginMenuItem = document.getElementById('loginMenuItem');
    const logoutMenuItem = document.getElementById('logoutMenuItem');
    
    if (!loginMenuItem || !logoutMenuItem) {
      console.warn('Navigation menu items not found');
      return;
    }
    
    if (Auth.isLoggedIn()) {
      loginMenuItem.classList.add('hidden');
      logoutMenuItem.classList.remove('hidden');
      
      // Hapus event listener lama jika ada untuk mencegah multiple handlers
      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) {
        logoutButton.removeEventListener('click', this._logoutHandler);
        
        // Gunakan function untuk mencegah masalah dengan 'this'
        this._logoutHandler = (e) => {
          e.preventDefault();
          Auth.logout();
          window.location.href = '#/home';
        };
        
        logoutButton.addEventListener('click', this._logoutHandler);
      }
    } else {
      loginMenuItem.classList.remove('hidden');
      logoutMenuItem.classList.add('hidden');
    }
    
    // Add PWA install button if available
    if (this._pwaUtils && !this._pwaUtils.isAppInstalled()) {
      this._pwaUtils._createInstallButton();
    }
  }
  
  /**
   * Template untuk halaman tidak ditemukan
   */
  _getNotFoundTemplate() {
    return `
      <div class="error-container">
        <h3>Page Not Found</h3>
        <p>The page you are looking for does not exist.</p>
        <a href="#/home" class="story-item__action-button">Go to Home</a>
      </div>
    `;
  }
  
  /**
   * Template untuk halaman error
   */
  _getErrorTemplate(message) {
    return `
      <div class="error-container">
        <h3>Error</h3>
        <p>${message || 'Something went wrong'}</p>
        <a href="#/home" class="story-item__action-button">Go to Home</a>
      </div>
    `;
  }
  
  /**
   * Template untuk halaman offline
   */
  _getOfflineTemplate() {
    return `
      <div class="offline-content error-container">
        <h3>Anda Sedang Offline</h3>
        <p>Halaman ini memerlukan koneksi internet. Beberapa fitur mungkin tidak tersedia saat offline.</p>
        <div class="cached-content">
          <p>Anda tetap dapat melihat konten yang telah diakses sebelumnya.</p>
        </div>
        <a href="#/home" class="story-item__action-button">Kembali ke Beranda</a>
      </div>
    `;
  }
}

export default App;