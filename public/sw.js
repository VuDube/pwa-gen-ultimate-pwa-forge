// PWA_Gen's own service worker
// Using Workbox via CDN for simplicity and reliability in this demo phase.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
  // Precache files injected by the build process.
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  // Cache static assets (CSS, JS, images) with a Stale-While-Revalidate strategy.
  workbox.routing.registerRoute(
    ({ request }) => ['style', 'script', 'worker', 'image'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );
  // Cache Google Fonts with a Cache First strategy.
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-v1',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          maxEntries: 30,
        }),
      ],
    })
  );
  // Use a Network First strategy for navigation requests, falling back to an offline page.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'navigation-v1',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
      fallback: '/offline.html',
    })
  );
  // This allows the web app to trigger skipWaiting via postMessage
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}