import NotificationHelper from '../../utils/notification-helper';
import Auth from '../../utils/auth';

const NotificationSettings = {
  render() {
    // Only show if user is logged in
    if (!Auth.isLoggedIn()) {
      return '';
    }

    return `
      <div class="notification-settings">
        <div class="notification-settings__header">
          <h3>🔔 Push Notifications</h3>
          <p>Get notified when you add new stories</p>
        </div>
        
        <div class="notification-settings__content">
          <div class="notification-status" id="notificationStatus">
            <div class="loading-spinner">Checking notification status...</div>
          </div>
          
          <div class="notification-actions" id="notificationActions" style="display: none;">
            <button id="enableNotifications" class="btn-primary" style="display: none;">
              Enable Notifications
            </button>
            <button id="disableNotifications" class="btn-outline" style="display: none;">
              Disable Notifications
            </button>
            <button id="testNotification" class="btn-outline" style="display: none;">
              Test Notification
            </button>
          </div>
          
          <div class="notification-info">
            <small>
              <strong>Note:</strong> You need to allow notifications in your browser for this feature to work.
            </small>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this._updateNotificationStatus();
    this._bindEvents();
  },

  async _updateNotificationStatus() {
    const statusEl = document.getElementById('notificationStatus');
    const actionsEl = document.getElementById('notificationActions');
    const enableBtn = document.getElementById('enableNotifications');
    const disableBtn = document.getElementById('disableNotifications');
    const testBtn = document.getElementById('testNotification');

    if (!statusEl || !actionsEl) return;

    try {
      const permission = NotificationHelper.permission;
      const isSubscribed = NotificationHelper.isSubscribed;

      let statusHTML = '';
      let showActions = true;

      if (permission === 'denied') {
        statusHTML = `
          <div class="status-item status-denied">
            <span class="status-icon">❌</span>
            <div class="status-text">
              <strong>Notifications Blocked</strong>
              <p>Please enable notifications in your browser settings</p>
            </div>
          </div>
        `;
        showActions = false;
      } else if (permission === 'granted' && isSubscribed) {
        statusHTML = `
          <div class="status-item status-enabled">
            <span class="status-icon">✅</span>
            <div class="status-text">
              <strong>Notifications Enabled</strong>
              <p>You will receive notifications for new stories</p>
            </div>
          </div>
        `;
        disableBtn.style.display = 'inline-block';
        testBtn.style.display = 'inline-block';
      } else {
        statusHTML = `
          <div class="status-item status-disabled">
            <span class="status-icon">🔕</span>
            <div class="status-text">
              <strong>Notifications Disabled</strong>
              <p>Enable notifications to get updates</p>
            </div>
          </div>
        `;
        enableBtn.style.display = 'inline-block';
      }

      statusEl.innerHTML = statusHTML;
      actionsEl.style.display = showActions ? 'block' : 'none';

    } catch (error) {
      console.error('Error updating notification status:', error);
      statusEl.innerHTML = `
        <div class="status-item status-error">
          <span class="status-icon">⚠️</span>
          <div class="status-text">
            <strong>Error</strong>
            <p>Could not check notification status</p>
          </div>
        </div>
      `;
    }
  },

  _bindEvents() {
    const enableBtn = document.getElementById('enableNotifications');
    const disableBtn = document.getElementById('disableNotifications');
    const testBtn = document.getElementById('testNotification');

    if (enableBtn) {
      enableBtn.addEventListener('click', async () => {
        enableBtn.disabled = true;
        enableBtn.textContent = 'Enabling...';
        
        try {
          const success = await NotificationHelper.requestNotificationPermission();
          if (success) {
            await this._updateNotificationStatus();
          }
        } catch (error) {
          console.error('Error enabling notifications:', error);
          NotificationHelper.showToast('Failed to enable notifications');
        } finally {
          enableBtn.disabled = false;
          enableBtn.textContent = 'Enable Notifications';
        }
      });
    }

    if (disableBtn) {
      disableBtn.addEventListener('click', async () => {
        disableBtn.disabled = true;
        disableBtn.textContent = 'Disabling...';
        
        try {
          await NotificationHelper.unsubscribeFromPush();
          await this._updateNotificationStatus();
        } catch (error) {
          console.error('Error disabling notifications:', error);
          NotificationHelper.showToast('Failed to disable notifications');
        } finally {
          disableBtn.disabled = false;
          disableBtn.textContent = 'Disable Notifications';
        }
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        testBtn.disabled = true;
        testBtn.textContent = 'Sending...';
        
        try {
          await NotificationHelper.simulatePushNotification(
            'Test Notification',
            'This is a test notification from Dicoding Story!'
          );
        } catch (error) {
          console.error('Error sending test notification:', error);
          NotificationHelper.showToast('Failed to send test notification');
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = 'Test Notification';
        }
      });
    }
  }
};

export default NotificationSettings;