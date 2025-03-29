import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Add update notification
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available!');
              
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
            }
          };
        };
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
    });
  });
  
  // Add event listener for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Store the event so it can be triggered later
    window.deferredPrompt = e;
    
    // Show install promotion after delay
    setTimeout(() => {
      if (!window.deferredPrompt || sessionStorage.getItem('installPromptShown')) {
        return;
      }
      
      // Create the install promotion banner
      const banner = document.createElement('div');
      banner.id = 'install-app-banner';
      banner.innerHTML = `
        <div style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #5b68eb;
          color: white;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/logo192.png" alt="App Icon" style="width: 36px; height: 36px; border-radius: 8px;">
            <div>
              <div style="font-weight: bold; font-size: 16px;">Install Work Status</div>
              <div style="font-size: 14px; opacity: 0.9;">Add to home screen for quick access</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="install-dismiss" style="
              background: transparent;
              border: none;
              color: white;
              padding: 8px 12px;
              cursor: pointer;
              font-size: 14px;
            ">Not now</button>
            <button id="install-accept" style="
              background: white;
              color: #5b68eb;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-weight: bold;
              cursor: pointer;
              font-size: 14px;
            ">Install</button>
          </div>
        </div>
      `;
      
      // Add banner to body
      document.body.appendChild(banner);
      
      // Add event listeners to buttons
      document.getElementById('install-accept').addEventListener('click', async () => {
        // Hide the banner
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
        
        // Show the installation prompt
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          
          // Wait for the user to respond to the prompt
          const { outcome } = await window.deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          
          // Clear the deferred prompt
          window.deferredPrompt = null;
        }
        
        // Mark as shown in this session
        sessionStorage.setItem('installPromptShown', 'true');
      });
      
      document.getElementById('install-dismiss').addEventListener('click', () => {
        // Hide the banner
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
        
        // Mark as shown in this session
        sessionStorage.setItem('installPromptShown', 'true');
      });
    }, 3000);
  });
}
