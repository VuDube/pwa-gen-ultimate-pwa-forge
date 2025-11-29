import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { App } from '@/App';
import '@/index.css'
// The root of the application is rendered here, wrapped in StrictMode and an ErrorBoundary.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('PWA_Gen ServiceWorker registration successful with scope: ', registration.scope);
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available, but the old service worker is still in control.
                // We can optionally notify the user to refresh.
                console.log('New content is available; please refresh.');
                // For a seamless update, we can post a message to the new worker.
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          };
        }
      };
    }).catch(error => {
      console.error('ServiceWorker registration failed: ', error);
    });
  });
}