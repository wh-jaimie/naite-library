// 나이테 120(공개 사이트): 자료가 공개된 주제에 '스터디 자료 보기' 버튼.
// 이번 달은 공개 스터디 자료(study/), 지난 달은 회원 전용이라 나이테 스터디 앱(record/) 입장으로 연결.
// 회원 앱 안(?embed=record)에서는 앱이 직접 버튼을 붙이므로 여기서는 아무것도 안 함.
(function(){
  if(/[?&]embed=/.test(location.search))return;
  var URL='https://vvfqrewseibjdwcuscaz.supabase.co',KEY='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi';
  var H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
  var pub=null,cur='';
  function apply(){
    if(!pub)return;
    document.querySelectorAll('.theme[data-key]').forEach(function(el){
      var k=el.getAttribute('data-key');
      if(!pub[k]||el.querySelector('.c120-study'))return;
      var now=k===cur,a=document.createElement('a');
      a.className='c120-study'+(now?'':' member');
      a.href=now?'study/?m='+encodeURIComponent(k)+'&from=c120':'record/?m='+encodeURIComponent(k);
      a.innerHTML='📖 스터디 자료 보기'+(now?'<small>이번 달</small>':'<small>🔒 회원 전용</small>');
      var th=el.querySelector('.th');if(th)th.insertAdjacentElement('afterend',a);else el.insertBefore(a,el.firstChild);
    });
  }
  var st=document.createElement('style');
  st.textContent='.c120-study{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 2px 14px;padding:10px 12px;border-radius:12px;background:#E4EEE7;color:#245648;font-weight:800;font-size:.9rem;text-decoration:none;border:1px solid #CFE0D6}'+
    '.c120-study small{font-size:.72rem;font-weight:700;color:#4F7A68}.c120-study.member{background:#F3E7DA;color:#7A4520;border-color:#E6D3C0}.c120-study.member small{color:#A8622F}';
  document.head.appendChild(st);
  Promise.all([
    fetch(URL+'/rest/v1/rpc/list_published',{method:'POST',headers:H,body:'{}'}).then(function(r){return r.ok?r.json():[];}),
    fetch(URL+'/rest/v1/settings?select=current_theme&id=eq.1',{headers:H,cache:'no-store'}).then(function(r){return r.ok?r.json():[];})
  ]).then(function(res){
    pub={};(res[0]||[]).forEach(function(t){if(t&&t.key)pub[t.key]=1;});
    cur=(res[1]&&res[1][0]&&res[1][0].current_theme)||'';
    apply();
    var body=document.getElementById('course-body')||document.body;
    try{new MutationObserver(apply).observe(body,{childList:true,subtree:true});}catch(e){}
  },function(){});
})();
