// 나이테 영어도서관 — 가벼운 방문 집계(page_view) + 버튼 클릭(ui_click). 정적 페이지용.
// events 테이블에 anon insert(공개 키). 개인정보 수집 없음(익명 세션 id만).
// 방문 출처(meta.src): ?from= 꼬리표 → 없으면 넘어온 사이트(referrer) → 없으면 direct.
//   처음 들어온 출처를 이번 방문(탭) 동안 sessionStorage 'naite_src'에 들고 다녀서, 다른 페이지·참여 클릭에도 같이 남김.
//   window.NAITE_SRC 로 다른 스크립트가 읽음. <script src="track.js" data-nopv> 는 출처만 정하고 page_view는 안 보냄.
(function(){
  var URL="https://vvfqrewseibjdwcuscaz.supabase.co";
  var ANON="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi";
  var cs=document.currentScript;
  var page=(cs&&cs.getAttribute('data-page'))||document.title||location.pathname;
  function srcNow(){
    var q='';try{q=(new URLSearchParams(location.search).get('from')||'').trim().toLowerCase().slice(0,30);}catch(e){}
    if(q)return q;
    var h='';try{h=document.referrer?new window.URL(document.referrer).hostname:'';}catch(e){}
    if(!h)return 'direct';
    if(h===location.hostname)return null; // 사이트 안에서 이동 — 첫 출처 유지
    if(/(^|\.)instagram\.com$/.test(h))return 'insta';
    if(/(^|\.)blog\.naver\.com$/.test(h))return 'blog';
    if(/(^|\.)naver\.com$/.test(h))return 'naver';
    if(/(^|\.)google\./.test(h))return 'google';
    if(/(^|\.)daum\.net$/.test(h))return 'daum';
    if(/kakao/.test(h))return 'kakao';
    if(/(^|\.)threads\.(net|com)$/.test(h))return 'threads';
    if(/(^|\.)(youtube\.com|youtu\.be)$/.test(h))return 'youtube';
    if(/(^|\.)(facebook\.com|fb\.com)$/.test(h))return 'facebook';
    if(/(^|\.)(daangn\.com|karrot\.com)$/.test(h))return 'carrot';
    return h.replace(/^www\./,'').slice(0,40);
  }
  var src=null;try{src=sessionStorage.getItem('naite_src');}catch(e){}
  try{if(new URLSearchParams(location.search).get('embed')==='record')src='record';}catch(e){} // 기록앱 안(iframe)에서 연 페이지 → 출처 '기록 앱'으로 집계
  if(!src){src=srcNow()||'direct';try{sessionStorage.setItem('naite_src',src);}catch(e){}}
  window.NAITE_SRC=src;
  // 방문 집계 제외 옵션: ?notrack=1 로 이 기기 제외(=0 해제). 관리자 본인 방문 제외용.
  try{var _q=new URLSearchParams(location.search);if(_q.has('notrack')){var _v=_q.get('notrack')==='0'?'0':'1';localStorage.setItem('naite_notrack',_v);alert(_v==='0'?'이 기기: 방문 집계를 다시 시작합니다.':'이 기기의 방문은 이제 KPI 집계에서 제외됩니다.');}}catch(e){}
  try{if(localStorage.getItem('naite_notrack')==='1')return;}catch(e){}
  function sid(){var s;try{s=localStorage.getItem('joy_sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('joy_sid',s);}}catch(e){s='anon';}return s;}
  function post(row){try{fetch(URL+"/rest/v1/events",{method:"POST",keepalive:true,
    headers:{"apikey":ANON,"Authorization":"Bearer "+ANON,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(row)}).catch(function(){});}catch(e){}}
  // 버튼·링크 클릭(ui_click): 어느 화면에서 어떤 버튼까지 누르는지. 이름 = data-ev → 글자(40자) → aria-label
  //   나이테 120 표지(읽었어요 체크)는 '표지 체크', 입력칸은 안 셈. 같은 버튼 0.7초 안 연타는 1번
  var lastK='',lastT=0;
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest&&e.target.closest('a,button,summary,[role=button],.cover');if(!el)return;
    var label=el.getAttribute('data-ev')||(el.classList.contains('cover')?'표지 체크':'')||(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,40)||el.getAttribute('aria-label')||el.tagName.toLowerCase();
    var k=label+'|'+(el.getAttribute('href')||''),now=Date.now();if(k===lastK&&now-lastT<700)return;lastK=k;lastT=now;
    var href=el.getAttribute('href')||'';if(href.length>120)href=href.slice(0,120);
    post({type:'ui_click',session_id:sid(),path:location.pathname,meta:{page:page,label:label,href:href,src:src}});
  },true);
  if(cs&&cs.hasAttribute('data-nopv'))return;
  try{
    fetch(URL+"/rest/v1/events",{
      method:"POST",
      headers:{"apikey":ANON,"Authorization":"Bearer "+ANON,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({type:"page_view",session_id:sid(),path:location.pathname,meta:{page:page,src:src}}),
      keepalive:true
    }).catch(function(){});
  }catch(e){}
})();
