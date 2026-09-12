// =====================================================
// sw.js - Service Worker kwa PWA (Offline Mode)
// =====================================================

const CACHE_NAME = 'mfumo-michango-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/config.js',
    './js/auth.js'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch - cache first kwa assets, network first kwa API
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API calls (Supabase) - network first
    if (url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Assets - cache first
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request))
    );
});