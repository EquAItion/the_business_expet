import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'



// Register Firebase Messaging service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Firebase service worker registered successfully:', registration);
      })
      .catch((error) => {
        console.error('Firebase service worker registration failed:', error);
      });
  }
  
createRoot(document.getElementById("root")!).render(<App />);
