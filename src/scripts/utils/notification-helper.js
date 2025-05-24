import CONFIG from '../data/config';
import Auth from '../utils/auth';

const NotificationHelper = {
  _isSubscribed: false,
  _subscription: null,
  _toastTimeout: null,

  async init() {
    console.log('Initializing NotificationHelper...');
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.warn('This browser does not support push messaging');
      return;
    }

    // Initialize push notifications
    await this._initializePushNotifications();
  },

  async _initializePushNotifications() {
    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready for push notifications');

      // Check current subscription
      const subscription = await registration.pushManager.getSubscription();
      this._subscription = subscription;
      this._isSubscribed = subscription !== null;

      console.log('Current subscription status:', this._isSubscribed);

      // If user is logged in and not subscribed, request permission
      if (Auth.isLoggedIn() && !this._isSubscribed) {
        await this.requestNotificationPermission();
      }

      // If already subscribed, make sure server knows about it
      if (this._isSubscribed && subscription) {
        await this._syncSubscriptionWithServer(subscription);
      }

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  },

  async requestNotificationPermission() {
    console.log('Requesting notification permission...');
    
    // Check current permission
    let permission = Notification.permission;
    
    if (permission === 'denied') {
      console.warn('Notification permission denied');
      this._showPermissionDeniedMessage();
      return false;
    }

    if (permission === 'default') {
      // Request permission
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      console.log('Notification permission granted');
      await this._subscribeUserToPush();
      return true;
    } else {
      console.warn('Notification permission not granted');
      return false;
    }
  },

  async _subscribeUserToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe user to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      });

      console.log('User subscribed to push notifications:', subscription);
      
      // IMPORTANT: Validate subscription object
      if (!subscription) {
        throw new Error('Subscription is null');
      }
      
      // Log subscription details for debugging
      console.log('Subscription endpoint:', subscription.endpoint);
      console.log('Subscription keys:', subscription.keys);
      console.log('Keys p256dh:', subscription.keys?.p256dh);
      console.log('Keys auth:', subscription.keys?.auth);

      this._subscription = subscription;
      this._isSubscribed = true;

      // Send subscription to server
      await this._sendSubscriptionToServer(subscription);

      // Show success message
      this.showLocalNotification(
        'Notifications Enabled!', 
        'You will now receive notifications when you add new stories.'
      );

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user to push:', error);
      this._isSubscribed = false;
      throw error;
    }
  },

  async _sendSubscriptionToServer(subscription) {
    try {
      const response = await this.subscribeNotification(subscription);
      
      if (response.error) {
        throw new Error(response.message);
      }
      
      console.log('Subscription sent to server successfully');
      return response;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  },

  async _syncSubscriptionWithServer(subscription) {
    try {
      // Silently sync subscription with server
      await this._sendSubscriptionToServer(subscription);
    } catch (error) {
      console.warn('Failed to sync subscription with server:', error);
    }
  },

  async unsubscribeFromPush() {
    try {
      if (!this._subscription) {
        console.log('No subscription to unsubscribe from');
        return;
      }

      // Unsubscribe from push service
      await this._subscription.unsubscribe();
      
      // Notify server
      await this.unsubscribeNotification(this._subscription.endpoint);

      this._subscription = null;
      this._isSubscribed = false;

      console.log('Successfully unsubscribed from push notifications');
      
      this.showLocalNotification(
        'Notifications Disabled', 
        'You will no longer receive push notifications.'
      );

    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      throw error;
    }
  },

  // FIXED: API Methods dengan validasi subscription object
  async subscribeNotification(subscription) {
    const token = Auth.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    if (!subscription) {
      throw new Error('Subscription object is null or undefined');
    }
    
    if (!subscription.endpoint) {
      throw new Error('Subscription endpoint is missing');
    }
    
    // CRITICAL FIX: Validasi dan konversi keys
    let keys;
    if (subscription.keys) {
      // Browser modern (Chrome, Firefox, etc.)
      keys = {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      };
    } else if (subscription.getKey) {
      // Fallback untuk browser lama
      try {
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');
        
        keys = {
          p256dh: p256dhKey ? this._arrayBufferToBase64(p256dhKey) : null,
          auth: authKey ? this._arrayBufferToBase64(authKey) : null,
        };
      } catch (error) {
        console.error('Error getting keys from subscription:', error);
        throw new Error('Unable to extract subscription keys');
      }
    } else {
      throw new Error('Subscription keys are not available');
    }
    
    // Validasi keys
    if (!keys.p256dh || !keys.auth) {
      console.error('Invalid keys:', keys);
      throw new Error('Subscription keys (p256dh or auth) are missing');
    }
    
    console.log('Sending subscription to server:', {
      endpoint: subscription.endpoint,
      keys: keys
    });
    
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: keys,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  },

  async unsubscribeNotification(endpoint) {
    const token = Auth.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    if (!endpoint) {
      throw new Error('Endpoint is required for unsubscription');
    }
    
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  },

  // Helper function untuk convert ArrayBuffer ke Base64
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  // Show local notification (fallback)
  showLocalNotification(title, body, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/images/icons/web-app-manifest-192x192.png',
        badge: '/images/icons/web-app-manifest-192x192.png',
        tag: 'local-notification',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } else {
      // Fallback to toast notification
      this.showToast(`${title}: ${body}`);
    }
  },

  // Show notification via service worker
  async showServiceWorkerNotification(title, options = {}) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/images/icons/web-app-manifest-192x192.png',
        badge: options.badge || '/images/icons/web-app-manifest-192x192.png',
        tag: options.tag || 'sw-notification',
        data: options.data || {},
        actions: options.actions || [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ],
        ...options
      });
    } catch (error) {
      console.error('Failed to show service worker notification:', error);
      // Fallback to local notification
      this.showLocalNotification(title, options.body || '', options);
    }
  },

  // Simulate push notification (for testing)
  async simulatePushNotification(title, body) {
    await this.showServiceWorkerNotification(title, {
      body,
      tag: 'test-notification',
      data: { url: '/' }
    });
  },

  // Toast notification for UI feedback
  showToast(message, duration = 3000) {
    console.log('ShowToast called with message:', message);
    
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationClose = document.getElementById('notificationClose');

    if (!notification || !notificationMessage || !notificationClose) {
      console.warn('Toast notification elements not found in DOM');
      // Fallback: show browser alert if DOM elements not found
      if (typeof message === 'string') {
        alert(message);
      }
      return;
    }

    notificationMessage.textContent = message;
    notification.classList.remove('hidden');

    // Clear existing timeout
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
    }

    // Auto hide
    this._toastTimeout = setTimeout(() => {
      notification.classList.add('hidden');
    }, duration);

    // Manual close
    const closeHandler = () => {
      notification.classList.add('hidden');
      if (this._toastTimeout) {
        clearTimeout(this._toastTimeout);
      }
      notificationClose.removeEventListener('click', closeHandler);
    };

    notificationClose.removeEventListener('click', closeHandler);
    notificationClose.addEventListener('click', closeHandler);
  },

  // Show notification (legacy method for compatibility)
  showNotification(title, options) {
    if (!('Notification' in window)) {
      console.log('Notification not supported in this browser');
      return;
    }

    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else {
      console.log('Notification permission denied');
    }
  },

  // Permission denied message
  _showPermissionDeniedMessage() {
    this.showToast(
      'Notifications are blocked. Please enable them in your browser settings to receive notifications.',
      5000
    );
  },

  // Utility function to convert VAPID key
  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },

  // Getters
  get isSubscribed() {
    return this._isSubscribed;
  },

  get subscription() {
    return this._subscription;
  },

  get permission() {
    return Notification.permission;
  }
};

export default NotificationHelper;