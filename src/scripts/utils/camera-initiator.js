// Modifikasi pada CameraInitiator untuk menambahkan penanganan lifecycle kamera
// di src/scripts/utils/camera-initiator.js

class CameraInitiator {
  constructor({
    videoElement,
    canvasElement,
    imageElement,
    cameraStartButton,
    cameraStopButton,
    cameraCaptureButton,
  }) {
    this._videoElement = videoElement;
    this._canvasElement = canvasElement;
    this._imageElement = imageElement;
    this._cameraStartButton = cameraStartButton;
    this._cameraStopButton = cameraStopButton;
    this._cameraCaptureButton = cameraCaptureButton;

    this._streamActive = false;
    this._stream = null;
    this._capturedImage = null;

    this._initButtons();
    
    // Tambahkan event listener untuk hash change (pindah halaman)
    this._addRouteChangeListener();
  }

  _initButtons() {
    this._cameraStartButton.addEventListener('click', () => {
      this.startCamera();
    });

    this._cameraStopButton.addEventListener('click', () => {
      this.stopCamera();
    });

    this._cameraCaptureButton.addEventListener('click', () => {
      this.captureImage();
    });
  }
  
  // Tambahkan event listener untuk mendeteksi perubahan halaman
  _addRouteChangeListener() {
    window.addEventListener('hashchange', () => {
      if (this._streamActive) {
        console.log('Route changed, stopping camera');
        this.stopCamera();
      }
    });
    
    // Tambahkan event listener untuk saat user meninggalkan halaman atau menutup tab
    window.addEventListener('beforeunload', () => {
      if (this._streamActive) {
        console.log('Page unloading, stopping camera');
        this.stopCamera();
      }
    });
  }

  async startCamera() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this._videoElement.srcObject = this._stream;
      this._streamActive = true;

      // Show video and capture button, hide start button and image
      this._videoElement.style.display = 'block';
      this._imageElement.style.display = 'none';
      this._cameraStartButton.style.display = 'none';
      this._cameraStopButton.style.display = 'inline-block';
      this._cameraCaptureButton.style.display = 'inline-block';
    } catch (error) {
      console.error('Error starting camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  }

  stopCamera() {
    if (this._stream && this._streamActive) {
      // Hentikan semua track pada MediaStream
      this._stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.id);
      });
      
      this._videoElement.srcObject = null;
      this._streamActive = false;

      // Show start button, hide video, stop button, and capture button
      this._cameraStartButton.style.display = 'inline-block';
      this._videoElement.style.display = 'none';
      this._cameraStopButton.style.display = 'none';
      this._cameraCaptureButton.style.display = 'none';

      // Show image if available
      if (this._capturedImage) {
        this._imageElement.style.display = 'block';
      }
      
      console.log('Camera successfully stopped');
    } else {
      console.log('No active camera stream to stop');
    }
  }

  captureImage() {
    if (!this._streamActive) return;

    // Set canvas dimensions to match video
    this._canvasElement.width = this._videoElement.videoWidth;
    this._canvasElement.height = this._videoElement.videoHeight;

    // Draw video frame to canvas
    const context = this._canvasElement.getContext('2d');
    context.drawImage(this._videoElement, 0, 0, this._canvasElement.width, this._canvasElement.height);

    // Convert canvas to blob
    this._canvasElement.toBlob((blob) => {
      this._capturedImage = blob;
      
      // Display the captured image
      const imageUrl = URL.createObjectURL(blob);
      this._imageElement.src = imageUrl;
      this._imageElement.style.display = 'block';
      this._videoElement.style.display = 'none';

      // Stop the camera stream after capturing
      this.stopCamera();
    }, 'image/jpeg', 0.95);
  }

  getCapturedImage() {
    return this._capturedImage;
  }

  hasCapturedImage() {
    return !!this._capturedImage;
  }

  resetCamera() {
    this.stopCamera();
    this._capturedImage = null;
    this._imageElement.src = '';
    this._imageElement.style.display = 'none';
    this._cameraStartButton.style.display = 'inline-block';
  }
}

export default CameraInitiator;