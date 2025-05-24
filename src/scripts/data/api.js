import Auth from '../utils/auth';
import CONFIG from './config';

const API = {
  async register(name, email, password) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
    
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    return response.json();
  },

  async getAllStories(page = 1, size = 10, location = 1) {
    // PERBAIKAN: Cek keberadaan token sebelum melakukan request dengan auth
    const token = Auth.getToken();
    
    // Jika tidak ada token, gunakan endpoint guest atau return data kosong
    if (!token) {
      // Opsi 1: Return data kosong
      return { 
        error: false, 
        message: "No authentication token", 
        listStory: [] 
      };
      
      // Opsi 2: Gunakan endpoint guest jika ada
      // const response = await fetch(`${CONFIG.BASE_URL}/stories/guest?page=${page}&size=${size}`);
      // return response.json();
    }
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.json();
    } catch (error) {
      console.error('Error fetching stories:', error);
      return { 
        error: true, 
        message: error.message, 
        listStory: [] 
      };
    }
  },

  async getStoryDetail(id) {
    // PERBAIKAN: Cek keberadaan token dan ID valid
    const token = Auth.getToken();
    
    if (!token) {
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }
    
    if (!id) {
      return {
        error: true,
        message: "Invalid story ID"
      };
    }
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.json();
    } catch (error) {
      console.error('Error fetching story detail:', error);
      return { 
        error: true, 
        message: error.message
      };
    }
  },

  async addStory(description, photo, lat, lon) {
    const token = Auth.getToken();
    const formData = new FormData();
    
    formData.append('description', description);
    formData.append('photo', photo);
    
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }
    
    // PERBAIKAN: Tentukan endpoint dan header berdasarkan status autentikasi
    const url = token 
      ? `${CONFIG.BASE_URL}/stories` 
      : `${CONFIG.BASE_URL}/stories/guest`;
    
    const headers = token 
      ? { Authorization: `Bearer ${token}` }
      : {};
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      return response.json();
    } catch (error) {
      console.error('Error adding story:', error);
      return { 
        error: true, 
        message: error.message
      };
    }
  },

  async subscribeNotification(subscription) {
    const token = Auth.getToken();
    
    // PERBAIKAN: Jangan panggil API jika tidak ada token
    if (!token) {
      console.warn('Cannot subscribe to notifications: No authentication token');
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }
    
    try {
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
      
      return response.json();
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return { 
        error: true, 
        message: error.message
      };
    }
  },

  async unsubscribeNotification(endpoint) {
    const token = Auth.getToken();
    
    // PERBAIKAN: Jangan panggil API jika tidak ada token
    if (!token) {
      console.warn('Cannot unsubscribe from notifications: No authentication token');
      return { 
        error: true, 
        message: "Authentication required" 
      };
    }
    
    try {
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
      
      return response.json();
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      return { 
        error: true, 
        message: error.message
      };
    }
  },
};

export default API;