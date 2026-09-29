// 나이테 영어도서관 — 가벼운 방문 집계(page_view). 정적 페이지용.
// events 테이블에 anon insert(공개 키). 개인정보 수집 없음(익명 세션 id만).
(function(){
  var URL="https://vvfqrewseibjdwcuscaz.supabase.co";
  var ANON="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi";
  var cs=document.currentScript;
  var page=(cs&&cs.getAttribute('data-page'))||document.title||location.pathname;
  // 방문 집계 제외 옵션: ?notrack=1 로 이 기기 제외(=0 해제). 관리자 본인 방문 제외용.
  try{var _q=new URLSearchParams(location.search);if(_q.has('notrack')){var _v=_q.get('notrack')==='0'?'0':'1';localStorage.setItem('naite_notrack',_v);alert(_v==='0'?'이 기기: 방문 집계를 다시 시작합니다.':'이 기기의 방문은 이제 KPI 집계에서 제외됩니다.');}}catch(e){}
  try{if(localStorage.getItem('naite_notrack')==='1')return;}catch(e){}
  function sid(){var s;try{s=localStorage.getItem('joy_sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('joy_sid',s);}}catch(e){s='anon';}return s;}
  try{
    fetch(URL+"/rest/v1/events",{
      method:"POST",
      headers:{"apikey":ANON,"Authorization":"Bearer "+ANON,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({type:"page_view",session_id:sid(),path:location.pathname,meta:{page:page}}),
      keepalive:true
    }).catch(function(){});
  }catch(e){}
})();
