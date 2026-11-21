const V = 'jade-os-v2-6';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (pega a versão nova sempre que houver internet); sem internet, usa o cache
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(req, { signal: ctrl.signal, cache: 'no-cache' });
      clearTimeout(t);
      if (r.ok) cache.put(req, r.clone());
      return r;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html'));
    }
  })());
});
