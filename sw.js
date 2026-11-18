/* 낙지 앱: 한 번 열면 인터넷이 끊겨도 열리도록 파일을 기기에 저장해 둠 */
const VER = 'nakji-v1';
const CORE = ['./', 'index.html', 'sensor.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'help.mp3', 'bonus.jpg', 'nakji-intro.mp4'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.get('range')) return;          // 영상 부분 요청은 그대로 인터넷으로
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const page = req.mode === 'navigate';
  // 화면(html)은 새 버전 먼저, 안 되면 저장본 / 나머지는 저장본 먼저, 없으면 받아서 저장
  if (page) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque') && (same || /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host))) {
      const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp));
    }
    return r;
  })));
});
