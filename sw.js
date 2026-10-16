/* Service worker AW BATANG - Rekap Log Harian LPA/S
   Naikkan angka VERSION setiap kali index.html diganti agar HP mengambil versi baru. */
const VERSION = 'v13';
const CACHE = 'awb-rekap-' + VERSION;
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('awb-rekap-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Halaman: coba internet dulu (maks 3 detik) supaya selalu dapat versi terbaru, kalau lambat/offline pakai simpanan.
  if (req.mode === 'navigate') {
    const net = fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('index.html', copy));
      return res;
    });
    const timeout = new Promise(r => setTimeout(() => r(null), 3000));
    e.respondWith(
      Promise.race([net.catch(() => null), timeout])
        .then(res => res || caches.match('index.html').then(hit => hit || net))
    );
    return;
  }

  // File lain (ikon, manifest): simpanan dulu.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
