import StoryModel from '../models/story-model';
import NotificationHelper from '../utils/notification-helper';

class AddPresenter {
  constructor({ view }) {
    this._view = view;
    this._storyModel = StoryModel;
  }
  
  async addStory(storyData) {
    this._view.showLoading();
    
    try {
      const { description, photo, lat, lon } = storyData;
      
      if (!photo) {
        // Gunakan method dari view, bukan langsung dari NotificationHelper
        this._view.showToast('Please capture an image first');
        this._view.hideLoading();
        return false;
      }
      
      const response = await this._storyModel.addStory(description, photo, lat, lon);
      
      if (response.error) {
        // Gunakan method dari view
        this._view.showToast(`Error: ${response.message}`);
        return false;
      } else {
        // Show success toast melalui view
        this._view.showToast('Story added successfully');
        
        // Send push notification about successful story creation
        await this._sendStoryCreatedNotification(description);
        
        return true;
      }
    } catch (error) {
      // Gunakan method dari view
      this._view.showToast(`Error: ${error.message}`);
      console.error('Error adding story:', error);
      return false;
    } finally {
      this._view.hideLoading();
    }
  }

  async _sendStoryCreatedNotification(description) {
    try {
      // Only send notification if user has enabled notifications
      if (NotificationHelper.isSubscribed && NotificationHelper.permission === 'granted') {
        // Truncate description for notification
        const truncatedDescription = description.length > 50 
          ? description.substring(0, 50) + '...' 
          : description;

        // Send local notification immediately for better UX
        await NotificationHelper.showServiceWorkerNotification(
          'Story berhasil dibuat', 
          {
            body: `Anda telah membuat story baru dengan deskripsi: ${truncatedDescription}`,
            tag: 'story-created',
            data: { 
              url: '/home',
              action: 'story-created',
              description: truncatedDescription
            },
            actions: [
              {
                action: 'view',
                title: 'View Stories'
              },
              {
                action: 'close',
                title: 'Close'
              }
            ]
          }
        );

        console.log('Story created notification sent');
      }
    } catch (error) {
      console.error('Error sending story created notification:', error);
      // Don't throw error, as this is not critical for the main flow
    }
  }
}

export default AddPresenter;