// 나이테 영어도서관 PWA 서비스워커(사이트 전체 /naite-library/ — study/·record/ 는 각자 서비스워커가 우선)
// 홈 화면 앱이 예전 화면·스크립트를 계속 쓰지 않도록, 우리 사이트 파일(같은 출처 GET)은
// 매번 서버에 바뀌었는지 확인하고 가져옴(cache:'no-cache' → 안 바뀌었으면 304로 가볍게 끝남).
// 표지 이미지·Supabase·글꼴 같은 다른 사이트 요청은 건드리지 않음. 오프라인 캐시는 두지 않음.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // 페이지 이동(navigate) 요청은 옵션을 붙여 다시 만들 수 없어 주소로 새로 요청(리디렉트는 브라우저가 처리)
  var p=req.mode==='navigate'
    ?fetch(req.url,{cache:'no-cache',credentials:'same-origin',redirect:'manual'})
    :fetch(req,{cache:'no-cache'});
  e.respondWith(p.catch(function(){return fetch(req);}));
});
