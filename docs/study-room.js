// 관리자 설정에서 저장한 스터디 채팅방 주소를 공개 CTA에 적용합니다.
(function(){
  var links=document.querySelectorAll('[data-study-room-link]');
  if(!links.length)return;
  var api='https://vvfqrewseibjdwcuscaz.supabase.co/rest/v1/settings?select=study_room_url&id=eq.1&v='+Date.now();
  var key='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi';
  fetch(api,{cache:'no-store',headers:{apikey:key,Authorization:'Bearer '+key}})
    .then(function(r){if(!r.ok)throw new Error('settings unavailable');return r.json();})
    .then(function(rows){
      var value=rows&&rows[0]&&rows[0].study_room_url;
      if(!value)return;
      var url;try{url=new URL(value);}catch(e){return;}
      if(url.protocol!=='https:'||url.hostname!=='open.kakao.com')return;
      links.forEach(function(a){a.href=url.href;});
    }).catch(function(){});
})();
