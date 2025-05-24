/**
 * network-handler.js
 * Class untuk mengelola status koneksi dan UI saat online/offline
 */

class NetworkHandler {
  constructor() {
    this._isOnline = navigator.onLine;
    this._notificationContainer = document.getElementById('notification');
    this._notificationMessage = document.getElementById('notificationMessage');
    this._closeButton = document.getElementById('notificationClose');
    
    // Queue untuk operasi offline
    this._offlineQueue = [];
    
    this._init();
  }

  _init() {
    // Dengarkan perubahan status koneksi
    window.addEventListener('online', () => this._handleOnline());
    window.addEventListener('offline', () => this._handleOffline());

    // Setup event handler untuk tombol close
    if (this._closeButton) {
      this._closeButton.addEventListener('click', () => {
        this._notificationContainer.classList.add('hidden');
      });
    }

    // Periksa status koneksi saat inisialisasi
    this._checkConnection();
    
    // Set up pengecekan koneksi periodik (untuk koneksi tidak stabil)
    setInterval(() => this._checkRealConnectivity(), 30000);
  }

  _checkConnection() {
    // Periksa koneksi awal
    this._isOnline = navigator.onLine;
    
    if (!this._isOnline) {
      this._showOfflineMode();
    } else {
      this._hideOfflineMode();
    }
  }

  async _checkRealConnectivity() {
    // Pengecekan koneksi yang lebih handal - ping resource kecil
    if (navigator.onLine) {
      try {
        const response = await fetch('/connectivity-check.json', {
          method: 'HEAD',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok && !this._isOnline) {
          // Kita offline tapi sekarang online
          this._handleOnline();
        }
      } catch (error) {
        console.log('Connectivity check failed:', error);
        
        if (this._isOnline) {
          // Navigator mengatakan kita online tapi fetch gagal
          this._handleOffline();
        }
      }
    }
  }

  _handleOnline() {
    console.log('Kembali online');
    this._isOnline = true;
    
    document.body.classList.remove('offline-mode');
    
    // Tampilkan notifikasi
    this.showNotification('Koneksi terpulihkan! Semua fitur kembali tersedia.', 'success');
    
    // Proses antrian operasi offline
    this._processOfflineQueue();
    
    // Trigger sync jika tersedia
    this._triggerBackgroundSync();
  }

  _handleOffline() {
    console.log('Koneksi terputus');
    this._isOnline = false;
    
    document.body.classList.add('offline-mode');
    
    // Tampilkan notifikasi
    this.showNotification('Anda sedang offline. Beberapa fitur mungkin terbatas.', 'warning', 0);
  }

  _showOfflineMode() {
    // Tambahkan kelas offline-mode ke body
    document.body.classList.add('offline-mode');
    
    // Tampilkan banner offline
    this.showNotification('Anda sedang offline. Beberapa fitur mungkin terbatas.', 'warning', 0);
  }

  _hideOfflineMode() {
    // Hapus kelas offline-mode dari body
    document.body.classList.remove('offline-mode');
    
    // Sembunyikan banner offline
    if (this._notificationContainer) {
      this._notificationContainer.classList.add('hidden');
    }
  }

  _processOfflineQueue() {
    if (this._offlineQueue.length === 0) {
      console.log('Tidak ada operasi offline yang perlu diproses');
      return;
    }
    
    console.log(`Memproses ${this._offlineQueue.length} operasi offline`);
    
    // Proses setiap operasi dalam antrian
    const operations = [...this._offlineQueue];
    this._offlineQueue = [];
    
    operations.forEach(operation => {
      try {
        operation();
      } catch (error) {
        console.error('Gagal memproses operasi offline:', error);
      }
    });
  }

  _triggerBackgroundSync() {
    // Cek apakah background sync didukung
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Trigger background sync untuk data yang tersimpan saat offline
          return registration.sync.register('sync-new-story');
        })
        .catch((error) => {
          console.error('Background sync failed:', error);
          
          // Fallback ke sync manual
          this._manualSync();
        });
    } else {
      // Fallback ke sync manual untuk browser tanpa background sync
      this._manualSync();
    }
  }
  
  _manualSync() {
    // Implementasi sync manual untuk browser tanpa background sync
    console.log('Melakukan sync manual data offline');
    
    // Implementasi tergantung pada metode penyimpanan data Anda
    // Contoh dengan Cache API:
    if ('caches' in window) {
      caches.open('offline-posts')
        .then((cache) => {
          return cache.keys()
            .then((keys) => {
              if (keys.length === 0) {
                console.log('Tidak ada data offline untuk disinkronkan');
                return Promise.resolve();
              }
              
              return Promise.all(
                keys.map((key) => {
                  return cache.match(key)
                    .then((response) => response.json())
                    .then((data) => {
                      // Kirim data ke server
                      console.log('Syncing data:', data);
                      
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
                          console.log('Berhasil sync story');
                          return cache.delete(key);
                        }
                        throw new Error('Gagal sync');
                      });
                    });
                })
              );
            });
        })
        .catch(error => {
          console.error('Gagal melakukan sync manual:', error);
        });
    }
  }

  /**
   * Menampilkan notifikasi dengan tipe dan durasi tertentu
   * @param {string} message - Pesan notifikasi
   * @param {string} type - Tipe notifikasi (info, success, warning, error)
   * @param {number} duration - Durasi tampil dalam milidetik, 0 untuk tidak otomatis hilang
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (this._notificationContainer && this._notificationMessage) {
      this._notificationMessage.textContent = message;
      
      // Reset class
      this._notificationContainer.className = 'notification';
      
      // Tambahkan class berdasarkan tipe
      if (type) {
        this._notificationContainer.classList.add(type);
      }
      
      this._notificationContainer.classList.remove('hidden');
      
      // Auto hide jika duration > 0
      if (duration > 0) {
        setTimeout(() => {
          this._notificationContainer.classList.add('hidden');
        }, duration);
      }
    }
  }

  /**
   * Mengecek apakah aplikasi sedang online
   * @returns {boolean} Status online
   */
  isOnline() {
    return this._isOnline;
  }
  
  /**
   * Menambahkan operasi ke antrian untuk dijalankan saat kembali online
   * @param {Function} operation - Fungsi yang akan dijalankan saat online
   */
  queueForOnline(operation) {
    if (typeof operation !== 'function') {
      console.error('Offline queue hanya menerima fungsi');
      return;
    }
    
    if (this._isOnline) {
      // Jika online, jalankan langsung
      operation();
    } else {
      // Jika tidak, tambahkan ke antrian
      this._offlineQueue.push(operation);
      console.log('Operasi ditambahkan ke antrian offline');
    }
  }
  
  /**
   * Menyimpan data untuk penggunaan offline
   * @param {string} key - Identifier unik untuk data
   * @param {Object} data - Data yang akan disimpan
   * @returns {Promise} Promise yang resolve saat data tersimpan
   */
  saveOfflineData(key, data) {
    // Simpan data di cache atau storage yang sesuai
    // Implementasi ini menggunakan Cache API
    return caches.open('offline-posts')
      .then(cache => {
        const request = new Request(`offline-data/${key}`);
        const response = new Response(JSON.stringify(data));
        return cache.put(request, response);
      })
      .then(() => {
        console.log('Data disimpan untuk penggunaan offline:', key);
        return true;
      })
      .catch(error => {
        console.error('Gagal menyimpan data offline:', error);
        return false;
      });
  }
}

export default NetworkHandler;