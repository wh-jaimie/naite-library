// 나이테 스터디 PWA 서비스워커 (설치 가능 조건 충족용 · 네트워크 패스스루)
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
// fetch 핸들러 존재 = 설치 가능 조건. 별도 캐싱 없이 브라우저 기본 동작에 맡김.
self.addEventListener('fetch', function(){ /* passthrough */ });
