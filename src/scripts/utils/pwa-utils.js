/**
 * pwa-utils.js
 * Utilitas untuk fitur-fitur PWA
 */

class PWAUtils {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    
    this._init();
  }
  
  _init() {
    // Cek apakah aplikasi sudah terinstal
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('Aplikasi sudah terinstal');
      return;
    }
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent Chrome 76+ dari otomatis menampilkan prompt
      event.preventDefault();
      
      // Simpan event agar bisa dipicu nanti
      this.deferredPrompt = event;
      
      // Buat tombol instal di UI jika diperlukan
      this._createInstallButton();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', (event) => {
      console.log('Aplikasi terinstal', event);
      this.isInstalled = true;
      
      // Sembunyikan tombol instal jika ada
      this._hideInstallButton();
      
      // Tampilkan notifikasi sukses instalasi
      const networkHandler = window.networkHandler;
      if (networkHandler) {
        networkHandler.showNotification(
          'Aplikasi berhasil diinstal! Anda sekarang dapat mengaksesnya langsung dari layar utama.',
          'success',
          5000
        );
      }
    });
    
    // Custom event untuk PWA installed (from sw-register.js)
    window.addEventListener('pwa-installed', () => {
      console.log('PWA installation detected via service worker');
      this._showFirstTimeInstallTips();
    });
  }
  
  _createInstallButton() {
    // Cek jika tombol sudah ada
    if (document.getElementById('pwaInstallButton')) {
      return;
    }
    
    // Buat tombol instal di navbar atau footer
    const navbar = document.querySelector('.app-bar__navigation ul');
    if (navbar && this.deferredPrompt) {
      const installItem = document.createElement('li');
      installItem.innerHTML = '<a href="#" id="pwaInstallButton">Instal Aplikasi</a>';
      navbar.appendChild(installItem);
      
      // Tambahkan event listener
      document.getElementById('pwaInstallButton').addEventListener('click', (e) => {
        e.preventDefault();
        this._installApp();
      });
    }
  }
  
  _hideInstallButton() {
    const installButton = document.getElementById('pwaInstallButton');
    if (installButton && installButton.parentElement) {
      installButton.parentElement.remove();
    }
  }
  
  async _installApp() {
    if (!this.deferredPrompt) {
      console.log('Tidak ada prompt instalasi tersedia');
      return;
    }
    
    // Tampilkan prompt instalasi
    this.deferredPrompt.prompt();
    
    // Tunggu user merespon prompt
    const choiceResult = await this.deferredPrompt.userChoice;
    console.log('User install choice:', choiceResult.outcome);
    
    // Bersihkan variable deferredPrompt
    this.deferredPrompt = null;
  }
  
  _showFirstTimeInstallTips() {
    // Tampilkan tips untuk pengguna pertama kali saat PWA diinstal
    const networkHandler = window.networkHandler;
    if (networkHandler) {
      networkHandler.showNotification(
        'Selamat datang! Aplikasi dapat digunakan secara offline dan menyimpan data Anda.',
        'info',
        8000
      );
    }
  }
  
  /**
   * Cek apakah aplikasi terinstal
   * @returns {boolean} Status instalasi
   */
  isAppInstalled() {
    return this.isInstalled;
  }
  
  /**
   * Memicu prompt instalasi secara manual jika tersedia
   * @returns {boolean} True jika prompt tersedia, false jika tidak
   */
  showInstallPrompt() {
    if (this.deferredPrompt) {
      this._installApp();
      return true;
    }
    return false;
  }
  
  /**
   * Menambahkan tombol "Instal" ke suatu elemen
   * @param {HTMLElement} container Elemen kontainer tempat tombol ditambahkan
   */
  addInstallButton(container) {
    if (!container || this.isInstalled || !this.deferredPrompt) {
      return false;
    }
    
    const installButton = document.createElement('button');
    installButton.textContent = 'Instal Aplikasi';
    installButton.classList.add('install-button');
    installButton.addEventListener('click', () => this._installApp());
    
    container.appendChild(installButton);
    return true;
  }
}

export default PWAUtils;