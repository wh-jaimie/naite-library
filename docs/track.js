// 나이테 영어도서관 — 가벼운 방문 집계(page_view). 정적 페이지용.
// events 테이블에 anon insert(공개 키). 개인정보 수집 없음(익명 세션 id만).
(function(){
  var URL="https://vvfqrewseibjdwcuscaz.supabase.co";
  var ANON="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi";
  var cs=document.currentScript;
  var page=(cs&&cs.getAttribute('data-page'))||document.title||location.pathname;
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
