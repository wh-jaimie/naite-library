/* 홈 화면 앱(standalone)에서 쿠팡 구매 링크 열기 — 안드로이드
 * 쿠팡 파트너스 링크(link.coupang.com)는 열리자마자 쿠팡 앱으로 넘기려 하는데, 설치된 앱 안의
 * 창에서는 이 이동이 막혀 아무 반응이 없음(워크지 같은 일반 링크는 정상).
 * 안드로이드 앱으로 열렸을 때만 쿠팡 링크를 intent:// 로 휴대폰 시스템에 넘겨
 * 쿠팡 앱이 있으면 앱으로, 없으면 기본 브라우저로 열리게 함. 그 외 링크·환경은 기존 그대로.
 */
(function(){
  function standalone(){try{return window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches;}catch(e){return false;}}
  if(!standalone()||!/Android/i.test(navigator.userAgent))return;
  var HOST=/(^|\.)coupang\.com$/i;
  // 캡처 단계: 페이지의 클릭 집계(buy_click)가 stopPropagation 해도 먼저 받음(집계는 그대로 실행됨)
  window.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0)return;
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
    var u;try{u=new URL(a.getAttribute('href'),location.href);}catch(x){return;}
    if(!/^https?:$/.test(u.protocol)||!HOST.test(u.hostname))return;
    e.preventDefault();
    var intent='intent://'+u.host+u.pathname+u.search+'#Intent;scheme='+u.protocol.replace(':','')+';S.browser_fallback_url='+encodeURIComponent(u.href)+';end';
    setTimeout(function(){location.href=intent;},150); // 클릭 집계 전송 시간을 잠깐 줌
  },true);
})();
