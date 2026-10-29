// StrategyOS PWA Service Worker v10.8.0-mobile
const CACHE_NAME = 'strategyos-v10.9.0-mobile';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './cesinha-vendedor.html',
  './css/style.css',
  './manifest.json',
  './js/supabase-config.js',
  './js/backup-data.js',
  './js/data.js',
  './js/calculators.js',
  './js/ui.js',
  './js/ui-sections.js',
  './js/ui-modals.js',
  './js/ui-trocas.js',
  './js/ui-trocas-form.js',
  './js/ui-assistencia.js',
  './js/ui-tabela-precos.js',
  './js/ui-vendedor.js',
  './js/ui-vendedor-fluxos.js',
  './js/ui-venda-avulsa.js',
  './js/ui-simulador.js',
  './js/ui-fiado.js',
  './js/ui-caixa.js',
  './js/ui-ia-sugestoes.js',
  './js/ui-fidelidade.js',
  './js/ui-estoque.js',
  './js/peliculaiq.js',
  './js/ui-peliculaiq.js',
  './js/ui-melhorias.js',
  './js/ui-melhorias-2.js',
  './js/integrations.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
