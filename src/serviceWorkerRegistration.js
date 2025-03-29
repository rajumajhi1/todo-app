// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });

    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      window.deferredPrompt = e;
      
      // Show install promotion to the user after some delay
      setTimeout(() => {
        showInstallPromotion();
      }, 3000);
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'New content is available and will be used when all ' +
                  'tabs for this page are closed. See https://cra.link/PWA.'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Function to show install promotion
function showInstallPromotion() {
  // Check if the deferred prompt exists and if we haven't shown the promotion yet
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
        <img src="${process.env.PUBLIC_URL}/logo192.png" alt="App Icon" style="width: 36px; height: 36px; border-radius: 8px;">
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
} 