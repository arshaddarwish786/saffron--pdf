const VERSION = 'saffron-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './pdf.min.js', './pdf.worker.min.js', './pdf-lib.min.js', './icon-192.png', './icon-512.png', './maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'saffron-share').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      const form = await e.request.formData(); const c = await caches.open('saffron-share');
      let i = 0;
      for (const f of form.getAll('files')) {
        if (!(f instanceof File)) continue;
        await c.put(new Request('./shared/' + (i++)), new Response(f, { headers: { 'content-type': f.type || 'application/pdf', 'x-name': encodeURIComponent(f.name || 'shared.pdf') } }));
      }
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
