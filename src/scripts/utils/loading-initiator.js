// Perbaikan pada LoadingInitiator di loading-initiator.js

const LoadingInitiator = {
  // Tambahkan timer untuk mencegah loading terlalu lama
  _loadingTimer: null,
  _loadingTimeoutDuration: 5000, // Kurangi dari 10000 (10 detik) ke 5000 (5 detik)
  
  showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
      console.log('Loading indicator shown');
      
      // Reset timer yang ada jika ada
      this._clearLoadingTimer();
      
      // Set timer baru untuk secara otomatis menyembunyikan loading
      this._loadingTimer = setTimeout(() => {
        console.log('Loading timeout triggered - auto hiding');
        this.hideLoading();
      }, this._loadingTimeoutDuration);
    } else {
      console.error('Loading indicator element not found when trying to show');
      this._createLoadingIndicator();
    }
  },
  
  hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
      console.log('Loading indicator hidden');
      
      // Bersihkan timer saat loading disembunyikan
      this._clearLoadingTimer();
    } else {
      console.error('Loading indicator element not found when trying to hide');
    }
  },
  
  _clearLoadingTimer() {
    if (this._loadingTimer) {
      clearTimeout(this._loadingTimer);
      this._loadingTimer = null;
    }
  },
  
  // Buat elemen loading secara dinamis jika tidak ada di DOM
  _createLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.className = 'loading-indicator';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    loadingIndicator.appendChild(spinner);
    document.body.appendChild(loadingIndicator);
    console.log('Loading indicator created dynamically');
  }
};

export default LoadingInitiator;