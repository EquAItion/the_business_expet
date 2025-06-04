import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB8xNWLkmm_DQhyInvSa3Afja_dceXPJcw",
  authDomain: "expert-cc4f8.firebaseapp.com",
  projectId: "expert-cc4f8",
  storageBucket: "expert-cc4f8.appspot.com",
  messagingSenderId: "780298280205",
  appId: "1:780298280205:web:585189caf84b685e5c2444",
  measurementId: "G-XPFTN0Z1S3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Function to initialize messaging
const initializeMessaging = async () => {
  try {
    // Check if messaging is supported
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Firebase messaging initialization error:', error);
    return null;
  }
};

// Function to request notification permission and get token
const requestNotificationPermission = async () => {
  try {
    // Initialize messaging if not already initialized
    if (!messaging) {
      messaging = await initializeMessaging();
      if (!messaging) return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key is missing');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });
      
      if (currentToken) {
        console.log('Current token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
  }
};

// Function to handle foreground messages
const setupForegroundMessageHandler = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Show notification using browser's Notification API
    if (Notification.permission === 'granted') {
      const notificationTitle = payload?.notification?.title || 'New Notification';
      const notificationBody = payload?.notification?.body || 'You have a new message';
      const notificationData = payload?.data || {};

      const notificationOptions = {
        body: notificationBody,
        icon: '/logo.png',
        badge: '/badge.png',
        data: notificationData,
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Close' }
        ]
      };

      // Show notification
      const notification = new Notification(notificationTitle, notificationOptions);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle click action
        const clickAction = notificationData.click_action || '/';
        window.location.href = clickAction;
      };
    }
  });
};

// Initialize messaging and setup handlers
initializeMessaging().then(() => {
  setupForegroundMessageHandler();
});

export { app, messaging, requestNotificationPermission }; 