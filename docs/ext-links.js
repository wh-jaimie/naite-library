/* 홈 화면 앱(standalone)에서 바깥 링크 열기
 * 일부 브라우저(삼성 인터넷 등)로 설치한 앱에서는 target="_blank" 새 창이 열리지 않아
 * 구매·워크지·유튜브 링크를 눌러도 아무 일이 없음. 앱으로 열렸을 때만 다른 사이트 링크를
 * 같은 창에서 열고(뒤로 가기·닫기로 앱 복귀), 브라우저로 볼 때는 기존처럼 새 창으로 둔다.
 */
(function(){
  function standalone(){try{return window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.navigator.standalone===true;}catch(e){return false;}}
  if(!standalone())return;
  // 캡처 단계: 페이지의 클릭 집계 핸들러가 stopPropagation 해도 먼저 받음(집계는 그대로 실행됨)
  window.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
    var u;try{u=new URL(a.getAttribute('href'),location.href);}catch(x){return;}
    if(!/^https?:$/.test(u.protocol)||u.origin===location.origin)return;
    e.preventDefault();
    var href=u.href;
    setTimeout(function(){location.assign(href);},250); // 클릭 집계 전송 시간을 잠깐 줌
  },true);
})();
