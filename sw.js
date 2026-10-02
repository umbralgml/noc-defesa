// Service worker do NOC: deixa o jogo instalável (PWA) e jogável offline.
// Estratégia: rede primeiro (sempre a versão mais nova quando há internet), cache como reserva.
// O ranking (Supabase) nunca passa pelo cache. Fontes do Google: cache e atualiza em segundo plano.
const CACHE = 'noc-app-v1', FONTS = 'noc-fonts-v1', TIMEOUT = 4000;
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'src/style.css', 'src/main.js',
  'src/changelog.json', 'src/config.json', 'src/levels/index.json', 'src/levels/prologo.json', 'src/levels/linux.json',
  'src/levels/ato1.json', 'src/levels/ato2.json', 'src/levels/ato3.json', 'src/levels/ato4.json', 'src/levels/ato5.json', 'src/levels/ato6.json',
  ...['util', 'state', 'levels', 'scene', 'audio', 'ui', 'rank', 'wire', 'drop', 'quiz', 'game', 'daily', 'news', 'pwa', 'room', 'term', 'bank', 'career', 'ach', 'z3r0', 'train', 'steps', 'defense', 'topo', 'pcap', 'netlib', 'prefs', 'cert'].map(m => `src/engine/${m}.js`),
  'src/icons/icon-192.png', 'src/icons/icon-512.png'
];

self.addEventListener('install', e => {
  // Um arquivo faltando não pode impedir a instalação.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin) e.respondWith(networkFirst(req));
  else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; });
  const cached = await cache.match(req, { ignoreSearch: true });
  if (!cached) return net.catch(() => req.mode === 'navigate' ? cache.match('./') : Response.error());
  // Com cópia guardada, espera a rede só até TIMEOUT (internet ruim no celular).
  const late = new Promise(res => setTimeout(() => res(cached), TIMEOUT));
  return Promise.race([net.catch(() => cached), late]);
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(FONTS), cached = await cache.match(req);
  const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => cached);
  return cached || net;
}
