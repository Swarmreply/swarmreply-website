// SwarmReply Service Worker v1.0
const CACHE = 'swarmreply-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const PRECACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/terms.html',
  '/privacy.html',
  '/offline.html',
  '/manifest.json'
];

// ── INSTALL: pre-cache core assets ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: network-first, fallback to cache, fallback to offline ─────────────
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache fresh copy
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(event.request)
            .then(cached => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // For all other requests: stale-while-revalidate
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => null);
        return cached || networkFetch;
      })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch(e) { data = { title: 'SwarmReply', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SwarmReply', {
      body: data.body || 'You have a new notification.',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: data.tag || 'swarmreply',
      data: { url: data.url || '/login.html' },
      actions: data.actions || [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: data.requireInteraction || false
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/login.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(url);
      })
  );
});
