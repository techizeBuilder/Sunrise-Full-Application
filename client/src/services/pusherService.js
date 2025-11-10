import Pusher from 'pusher-js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channels = new Map();
    this.isConnected = false;
  }

  // Initialize Pusher connection
  init(user) {
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher('9a62ef4d6', {
      cluster: 'ap2',
      encrypted: true,
      forceTLS: true
    });

    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully');
      this.isConnected = true;
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      this.isConnected = false;
    });

    this.pusher.connection.bind('error', (error) => {
      console.error('Pusher connection error:', error);
    });

    // Subscribe to user-specific channel
    if (user) {
      this.subscribeToUserChannel(user);
    }

    return this.pusher;
  }

  // Subscribe to user-specific notifications
  subscribeToUserChannel(user) {
    if (!this.pusher || !user) return;

    const userId = user.id;
    const userRole = user.role;

    // Subscribe to user-specific channel
    const userChannel = this.pusher.subscribe(`user-${userId}`);
    this.channels.set(`user-${userId}`, userChannel);

    // Subscribe to role-based channel
    const roleChannelName = userRole === 'Super User' 
      ? 'notifications-all' 
      : `notifications-${userRole.toLowerCase().replace(' ', '-')}`;
    
    const roleChannel = this.pusher.subscribe(roleChannelName);
    this.channels.set(roleChannelName, roleChannel);

    // Also subscribe to global notifications for all users
    if (roleChannelName !== 'notifications-all') {
      const globalChannel = this.pusher.subscribe('notifications-all');
      this.channels.set('notifications-all', globalChannel);
    }

    console.log(`Subscribed to channels: user-${userId}, ${roleChannelName}`);
  }

  // Bind notification event listener
  onNotification(callback) {
    if (!this.pusher) return;

    this.channels.forEach((channel) => {
      channel.bind('notification', callback);
    });
  }

  // Unbind notification event listener
  offNotification(callback) {
    if (!this.pusher) return;

    this.channels.forEach((channel) => {
      channel.unbind('notification', callback);
    });
  }

  // Get connection status
  getConnectionState() {
    return this.pusher?.connection?.state || 'disconnected';
  }

  // Disconnect from Pusher
  disconnect() {
    if (this.pusher) {
      this.channels.forEach((channel, channelName) => {
        this.pusher.unsubscribe(channelName);
      });
      this.channels.clear();
      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
    }
  }

  // Reconnect with retry logic
  reconnect(user, maxRetries = 3) {
    let retryCount = 0;
    
    const attemptReconnect = () => {
      if (retryCount >= maxRetries) {
        console.error('Max reconnection attempts reached');
        return;
      }

      console.log(`Attempting to reconnect... (${retryCount + 1}/${maxRetries})`);
      
      setTimeout(() => {
        this.init(user);
        retryCount++;
        
        // Check if connection was successful after a delay
        setTimeout(() => {
          if (!this.isConnected) {
            attemptReconnect();
          }
        }, 2000);
      }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
    };

    attemptReconnect();
  }
}

export default new PusherService();