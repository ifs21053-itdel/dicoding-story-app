import AddPresenter from '../../presenters/add-presenter';
import LoadingInitiator from '../../utils/loading-initiator';
import CameraInitiator from '../../utils/camera-initiator';
import MapInitiator from '../../utils/map-initiator';
import NotificationHelper from '../../utils/notification-helper';
import Auth from '../../utils/auth';

const AddPage = {
  needAuth: true,
  
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Add New Story</h2>
        
        <div id="offlineWarning" class="offline-warning hidden">
          <p>Anda sedang offline. Data Anda akan disimpan dan dikirim saat kembali online.</p>
        </div>
        
        <form id="addStoryForm">
          <div class="form-group">
            <label for="description" class="form-label">Description</label>
            <textarea id="description" class="form-textarea" placeholder="Share your story..." required></textarea>
          </div>
          
          <div class="form-group">
            <label id="cameraLabel" class="form-label">Photo</label>
            <div class="camera">
              <div class="camera-preview">
                <video id="cameraPreview" autoplay playsinline></video>
                <canvas id="cameraCanvas"></canvas>
                <img id="capturedImage" alt="Captured photo preview">
              </div>
              <div class="camera-control">
                <button type="button" id="startCamera" class="camera-button">Start Camera</button>
                <button type="button" id="stopCamera" class="camera-button" style="display: none;">Stop Camera</button>
                <button type="button" id="captureImage" class="camera-button" style="display: none;">Capture</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Location (Click on map to set location)</label>
            <div id="locationMap" class="map-container"></div>
            <div class="map-info">
              <input type="hidden" id="latitude" name="latitude">
              <input type="hidden" id="longitude" name="longitude">
              <p id="locationText">No location selected</p>
            </div>
          </div>
          
          <div class="form-group">
            <button type="submit" id="submitButton" class="form-button" disabled>Post Story</button>
          </div>
        </form>
      </div>
    `;
  },

  async afterRender() {
    // Inisialisasi presenter
    this._presenter = new AddPresenter({
      view: this,
    });
    
    // Tambahkan event listener untuk unload halaman
    window.addEventListener('beforeunload', () => {
      this._cleanupResources();
    });
    
    // Tambahkan event listener untuk hashchange
    window.addEventListener('hashchange', () => {
      this._cleanupResources();
    });
    
    // Check offline status
    this._checkOfflineStatus();
    
    // Listen for online/offline changes
    window.addEventListener('online', () => this._checkOfflineStatus());
    window.addEventListener('offline', () => this._checkOfflineStatus());
    
    // Initialize camera
    this._camera = new CameraInitiator({
      videoElement: document.querySelector('#cameraPreview'),
      canvasElement: document.querySelector('#cameraCanvas'),
      imageElement: document.querySelector('#capturedImage'),
      cameraStartButton: document.querySelector('#startCamera'),
      cameraStopButton: document.querySelector('#stopCamera'),
      cameraCaptureButton: document.querySelector('#captureImage'),
    });
    
    // Initialize map
    const latitudeInput = document.querySelector('#latitude');
    const longitudeInput = document.querySelector('#longitude');
    const locationText = document.querySelector('#locationText');
    
    this._mapInitiator = new MapInitiator({
      mapElement: document.querySelector('#locationMap'),
      latitudeInput,
      longitudeInput,
    });
    await this._mapInitiator.init();
    
    // Update location text when map is clicked
    const updateLocationText = () => {
      if (latitudeInput.value && longitudeInput.value) {
        locationText.textContent = `Selected location: ${latitudeInput.value}, ${longitudeInput.value}`;
        this._updateSubmitButton();
      } else {
        locationText.textContent = 'No location selected';
        this._updateSubmitButton();
      }
    };
    
    latitudeInput.addEventListener('change', updateLocationText);
    longitudeInput.addEventListener('change', updateLocationText);
    
    // Handle form submission
    const form = document.querySelector('#addStoryForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const description = document.querySelector('#description').value;
      const photo = this._camera.getCapturedImage();
      const lat = parseFloat(latitudeInput.value);
      const lon = parseFloat(longitudeInput.value);
      
      // Check if we're offline
      const networkHandler = window.networkHandler;
      if (networkHandler && !networkHandler.isOnline()) {
        // Save data for later sync
        await this._saveOfflineData({
          description,
          photo,
          lat,
          lon
        });
        
        // Notify user and redirect to home
        NotificationHelper.showToast('Data disimpan dan akan dikirim saat online');
        
        // Cleanup resources
        this._cleanupResources();
        window.location.href = '#/home';
        return;
      }
      
      // We're online, proceed normally
      const success = await this._presenter.addStory({
        description,
        photo,
        lat,
        lon,
      });
      
      if (success) {
        // Pastikan bersihkan resource sebelum navigasi
        this._cleanupResources();
        window.location.href = '#/home';
      }
    });
  },
  
  // Metode untuk memeriksa status offline
  _checkOfflineStatus() {
    const offlineWarning = document.querySelector('#offlineWarning');
    if (!offlineWarning) return;
    
    const isOffline = !navigator.onLine;
    
    if (isOffline) {
      offlineWarning.classList.remove('hidden');
    } else {
      offlineWarning.classList.add('hidden');
    }
  },
  
  // Metode untuk menyimpan data offline
  async _saveOfflineData(data) {
    const networkHandler = window.networkHandler;
    
    if (!networkHandler) {
      console.error('NetworkHandler tidak tersedia');
      return false;
    }
    
    try {
      // Buat ID unik untuk data
      const timestamp = new Date().getTime();
      const storyId = `offline-story-${timestamp}`;
      
      // Simpan data ke storage offline
      await networkHandler.saveOfflineData(storyId, {
        token: Auth.getToken(),
        formData: {
          description: data.description,
          photo: data.photo,
          lat: data.lat,
          lon: data.lon,
          createdAt: timestamp
        }
      });
      
      // Register sync jika didukung
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-new-story');
        console.log('Background sync registered for new story');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  },
  
  // Metode untuk membersihkan resource saat meninggalkan halaman
  _cleanupResources() {
    console.log('Cleaning up resources for Add Page');
    if (this._camera) {
      this._camera.stopCamera();
    }
  },
  
  // View methods
  showLoading() {
    LoadingInitiator.showLoading();
  },
  
  hideLoading() {
    LoadingInitiator.hideLoading();
  },
  
  // IMPORTANT: Tambahkan method showToast untuk menampilkan toast
  showToast(message) {
    console.log('AddPage.showToast called with:', message);
    // Gunakan NotificationHelper untuk menampilkan toast
    NotificationHelper.showToast(message);
  },
  
  _updateSubmitButton() {
    const submitButton = document.querySelector('#submitButton');
    const hasLocation = document.querySelector('#latitude').value && document.querySelector('#longitude').value;
    const hasImage = this._camera && this._camera.hasCapturedImage();
    
    submitButton.disabled = !(hasLocation && hasImage);
  }
};

export default AddPage;