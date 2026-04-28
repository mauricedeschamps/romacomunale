const CACHE_NAME = 'lazio-escape-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icons/icon-192.jpg',
  'icons/icon-512.jpg'
  // 追加でスタイルやフォントが必要ならここに加える
];

// インストール: 必要なファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ: キャッシュ優先、ネットワークフォールバック
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // キャッシュヒット
        }
        // ネットワークへフォールバック
        return fetch(event.request).then(networkResponse => {
          // 不要なキャッシュ汚染を避けるため、必要なタイプだけ追加でキャッシュしてもよい
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // 完全オフライン時のフォールバック（必要に応じてオフラインページを表示）
          return new Response('Offline: content not available. Please check your connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});