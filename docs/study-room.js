// 관리자 설정에서 저장한 스터디 채팅방 주소를 공개 CTA에 적용합니다.
// (주소에 캐시용 파라미터를 붙이면 Supabase가 필터로 읽어 오류 → 붙이지 말 것. 캐시는 no-store로 막음)
// 나중에 그려지는 버튼(국내 인기 책장 목록 속 참여 카드 등)도 바뀌도록 DOM 변화를 지켜봅니다.
(function(){
  if(!document.querySelector('[data-study-room-link]'))return;
  var api='https://vvfqrewseibjdwcuscaz.supabase.co/rest/v1/settings?select=study_room_url&id=eq.1';
  var key='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi';
  function apply(href){
    document.querySelectorAll('[data-study-room-link]').forEach(function(a){if(a.href!==href)a.href=href;});
  }
  fetch(api,{cache:'no-store',headers:{apikey:key,Authorization:'Bearer '+key}})
    .then(function(r){if(!r.ok)throw new Error('settings unavailable');return r.json();})
    .then(function(rows){
      var value=rows&&rows[0]&&rows[0].study_room_url;
      if(!value)return;
      var url;try{url=new URL(value);}catch(e){return;}
      if(url.protocol!=='https:'||url.hostname!=='open.kakao.com')return;
      apply(url.href);
      if(window.MutationObserver)new MutationObserver(function(){apply(url.href);})
        .observe(document.body,{childList:true,subtree:true});
    }).catch(function(){});
})();
