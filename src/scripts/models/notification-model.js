import CONFIG from '../data/config';
import Auth from '../utils/auth';

const NotificationModel = {
  async subscribeNotification(subscription) {
    const token = Auth.getToken();
    
    if (!token) {
      console.warn('Cannot subscribe to notifications: No authentication token');
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }

    if (!subscription) {
      return {
        error: true,
        message: "Invalid subscription object"
      };
    }

    try {
      console.log('Sending subscription to server:', subscription);
      
      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log('Subscription response from server:', result);
      return result;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return { 
        error: true, 
        message: error.message || 'Failed to subscribe to notifications'
      };
    }
  },

  async unsubscribeNotification(endpoint) {
    const token = Auth.getToken();
    
    if (!token) {
      console.warn('Cannot unsubscribe from notifications: No authentication token');
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }

    if (!endpoint) {
      return {
        error: true,
        message: "Invalid endpoint"
      };
    }

    try {
      console.log('Unsubscribing from notifications:', endpoint);
      
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log('Unsubscribe response from server:', result);
      return result;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      return { 
        error: true, 
        message: error.message || 'Failed to unsubscribe from notifications'
      };
    }
  },

  // Check subscription status on server
  async getSubscriptionStatus() {
    const token = Auth.getToken();
    
    if (!token) {
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }

    try {
      const response = await fetch(`${CONFIG.BASE_URL}/notifications/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        // Endpoint might not exist, return default
        return {
          error: false,
          subscribed: false
        };
      }
    } catch (error) {
      console.warn('Could not check subscription status:', error);
      return {
        error: false,
        subscribed: false
      };
    }
  }
};

export default NotificationModel;