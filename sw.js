/* BANA FASHION Admin — Service Worker
   অ্যাপ শেল ক্যাশ হয়; Firebase/ডাটাবেস রিকোয়েস্ট কখনও ক্যাশ হয় না (সবসময় লাইভ ডাটা)। */
const VER = 'bana-admin-v4';
const SHELL = ['./index.html','./app-shell.js','./manifest.json','./icon-192.png','./icon-512.png','./favicon.png','./logo.png'];
const CDN = ['cdn.tailwindcss.com','cdnjs.cloudflare.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  // পেজ: আগে নেটওয়ার্ক (নতুন আপডেট পেতে), না পেলে ক্যাশ
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => { const cp = res.clone(); caches.open(VER).then(c => c.put('./index.html', cp)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // নিজের ফাইল + CDN লাইব্রেরি: ক্যাশ থেকে দ্রুত দেখাও, পেছনে আপডেট করো
  const ok = u.origin === location.origin || CDN.includes(u.hostname);
  if (!ok) return;
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque')) { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
