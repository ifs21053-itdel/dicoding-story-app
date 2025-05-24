import NotificationHelper from './notification-helper';

const WebSocketInitiator = {
  init() {
    // For simulating WebSocket since Dicoding Story API doesn't have WebSocket
    // Instead we listen for Push Notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { title, options } = event.data;
        
        if (title && options) {
          NotificationHelper.showToast(options.body || title);
        }
      });
    }
  },
};

export default WebSocketInitiator;