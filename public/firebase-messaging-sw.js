// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: "AIzaSyB8xNWLkmm_DQhyInvSa3Afja_dceXPJcw",
//   authDomain: "expert-cc4f8.firebaseapp.com",
//   projectId: "expert-cc4f8",
//   storageBucket: "expert-cc4f8.appspot.com",
//   messagingSenderId: "780298280205",
//   appId: "1:780298280205:web:585189caf84b685e5c2444",
//   measurementId: "G-XPFTN0Z1S3"
// });

// const messaging = firebase.messaging();

// // Handle background messages
// messaging.onBackgroundMessage((payload) => {
//   console.log('Received background message:', payload);

//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/logo.png',
//     badge: '/badge.png',
//     data: payload.data,
//     requireInteraction: true, // Keep notification visible until user interacts
//     actions: [
//       {
//         action: 'open',
//         title: 'Open'
//       },
//       {
//         action: 'close',
//         title: 'Close'
//       }
//     ]
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// // Handle notification click
// self.addEventListener('notificationclick', (event) => {
//   console.log('Notification click received:', event);

//   event.notification.close();

//   if (event.action === 'close') {
//     return;
//   }

//   // This looks to see if the current is already open and focuses if it is
//   event.waitUntil(
//     clients.matchAll({
//       type: 'window',
//       includeUncontrolled: true
//     }).then((clientList) => {
//       // Check if there is already a window/tab open with the target URL
//       for (const client of clientList) {
//         if (client.url.includes('/') && 'focus' in client) {
//           return client.focus();
//         }
//       }
//       // If no window/tab is already open, open a new one
//       if (clients.openWindow) {
//         return clients.openWindow('/');
//       }
//     })
//   );
// }); 

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB8xNWLkmm_DQhyInvSa3Afja_dceXPJcw",
  authDomain: "expert-cc4f8.firebaseapp.com",
  projectId: "expert-cc4f8",
  storageBucket: "expert-cc4f8.appspot.com",
  messagingSenderId: "780298280205",
  appId: "1:780298280205:web:585189caf84b685e5c2444",
  measurementId: "G-XPFTN0Z1S3"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png', // Make sure this icon exists in your public folder
    badge: '/badge.png',  // Make sure this icon exists in your public folder
    data: payload.data,   // This will contain any custom data
    click_action: payload.data?.click_action || '/appointment-log/', // Default to appointments page
    tag: payload.data?.tag || 'default', // Used to group notifications
    renotify: true,       // Show notification even if it's in the same tag
    requireInteraction: true // Keep notification visible until user interacts
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  // Get the click_action from the notification data
  const clickAction = event.notification.data?.click_action || '/appointment';
  
  // Get the user role from the notification data
  const userRole = event.notification.data?.user_role || 'solution_seeker';
  
  // Construct the URL based on user role
  let url = clickAction;
  if (userRole === 'expert') {
    url = '/expert/appointment-log';
  } else if (userRole === 'solution_seeker') {
    url = '/appointment-log';
  }

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
