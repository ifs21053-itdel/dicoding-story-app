import CONFIG from '../data/config';
import Auth from '../utils/auth';

const StoryModel = {
  async getAllStories(page = 1, size = 10, location = 1) {
    const token = Auth.getToken();
    
    const response = await fetch(`${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.json();
  },

  async getStoryDetail(id) {
    const token = Auth.getToken();
    
    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.json();
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
    
    const url = token 
      ? `${CONFIG.BASE_URL}/stories` 
      : `${CONFIG.BASE_URL}/stories/guest`;
    
    const headers = token 
      ? { Authorization: `Bearer ${token}` }
      : {};
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return response.json();
  },
};

export default StoryModel;