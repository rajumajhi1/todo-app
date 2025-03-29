import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onUpdate: registration => {
    // Create update notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: #5b68eb;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      ">
        <div>New version available! 🎉</div>
        <button id="update-app" style="
          background: white;
          color: #5b68eb;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        ">Update now</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
    
    // Add event listener to update button
    document.getElementById('update-app').addEventListener('click', () => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  },
  onSuccess: registration => {
    console.log('Service worker registered successfully');
  }
});
