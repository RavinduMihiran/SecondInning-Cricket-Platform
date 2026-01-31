import { toast } from 'react-toastify';
import socket, { reconnectSocket } from './socket';

class NotificationService {
  constructor() {
    this.initialized = false;
    this.userId = null;
    this.handlers = {
      mediaApproved: [],
      mediaRejected: [],
    };
    this.pendingNotifications = [];
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Listen for socket reconnection to reinitialize if needed
    socket.on('reconnect', () => {
      console.log('Socket reconnected, checking if notification service needs reinitialization');
      if (this.userId && !this.initialized) {
        console.log('Reinitializing notification service after reconnection');
        this.init(this.userId);
      }
    });
  }

  init(userId) {
    console.log(`Initializing notification service for user ${userId}`);
    this.userId = userId;
    
    // If socket is not connected, try to reconnect
    if (!socket.connected) {
      console.log('Socket not connected, attempting reconnection');
      reconnectSocket();
    }
    
    this.setupSocketListeners();
    this.initialized = true;
    
    // Process any pending notifications
    if (this.pendingNotifications.length > 0) {
      console.log(`Processing ${this.pendingNotifications.length} pending notifications`);
      this.pendingNotifications.forEach(notification => {
        this.processNotification(notification.type, notification.data);
      });
      this.pendingNotifications = [];
    }
  }

  setupSocketListeners() {
    // Listen for media approval notifications
    socket.on('media-approved', (data) => {
      console.log('Media approved notification received:', data);
      this.processNotification('approved', data);
    });

    // Listen for media rejection notifications
    socket.on('media-rejected', (data) => {
      console.log('Media rejected notification received:', data);
      this.processNotification('rejected', data);
    });
    
    // Test notification reception
    console.log('Notification listeners set up, waiting for events');
  }
  
  processNotification(type, data) {
    // If not initialized yet, store notification for later processing
    if (!this.initialized) {
      console.log(`Service not initialized, storing ${type} notification for later`);
      this.pendingNotifications.push({ type, data });
      return;
    }
    
    if (type === 'approved') {
      // Show toast notification
      toast.success(`Your media "${data.title}" has been approved!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Call registered handlers
      this.handlers.mediaApproved.forEach(handler => handler(data));
    } else if (type === 'rejected') {
      // Show toast notification with reason if available
      const reason = data.reason ? `: ${data.reason}` : '';
      toast.error(`Your media "${data.title}" has been rejected${reason}`, {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Call registered handlers
      this.handlers.mediaRejected.forEach(handler => handler(data));
    }
  }

  // Register event handlers
  onMediaApproved(handler) {
    this.handlers.mediaApproved.push(handler);
    return () => {
      this.handlers.mediaApproved = this.handlers.mediaApproved.filter(h => h !== handler);
    };
  }

  onMediaRejected(handler) {
    this.handlers.mediaRejected.push(handler);
    return () => {
      this.handlers.mediaRejected = this.handlers.mediaRejected.filter(h => h !== handler);
    };
  }

  // Clean up listeners
  cleanup() {
    console.log('Cleaning up notification service');
    socket.off('media-approved');
    socket.off('media-rejected');
    this.initialized = false;
    this.handlers = {
      mediaApproved: [],
      mediaRejected: [],
    };
  }
  
  // Test method to verify notification system is working
  testNotification() {
    console.log('Testing notification system');
    const testData = {
      mediaId: 'test-id',
      title: 'Test Media',
      reason: 'This is a test notification',
      message: 'Test notification'
    };
    
    // Process as both types to test both pathways
    this.processNotification('approved', testData);
    this.processNotification('rejected', testData);
    
    return true;
  }
}

export default new NotificationService(); 