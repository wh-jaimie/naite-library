/* 💬 엄마들 후기 보기(2026-11-20) — 나이테 120 · 국내 인기 책장 · 나이테 Pick 공통.
 * likes.js 의 재밌어요 버튼([data-like="책 제목"]) 옆에 '💬 후기 N'을 붙이고, 누르면 그 책 후기(아이 나이대·반응·한 줄)를 보여 줌.
 * 같은 책 = 같은 책 키(likes.js key()와 같은 규칙, 부제가 다르면 다른 책). 스터디 앱에서 남긴 후기(이번 달 책·지난 달 책·제목 후기)가 모두 모임.
 * 후기 쓰기는 스터디 앱 기록 페이지에서. 후기가 없는 책은 아무것도 안 붙음. 아직 SQL(migrate_reviews_by_key.sql) 전이면 조용히 숨김.
 * <script src="reviews.js" data-page="나이테 120"></script> (likes.js 다음에) */
(function(){
  var U='https://vvfqrewseibjdwcuscaz.supabase.co',K='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi';
  var cs=document.currentScript,PAGE=(cs&&cs.getAttribute('data-page'))||document.title||'';
  var R={},ASKED={},OK=true;
  var RX={laugh:['😆','웃었어요'],again:['🔁','또 읽어 달래요'],talk:['🗣️','따라 말했어요'],notyet:['😴','아직 관심 없어요']},AGE={1:'0~3세',2:'4~6세',3:'7~9세'};
  function key(t){t=String(t||'').toLowerCase().replace(/&/g,'and').replace(/^\s*the\s+/,'');return t.replace(/[^0-9a-z가-힣]/g,'').slice(0,80);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rpc(fn,body){return fetch(U+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);});}
  var css=document.createElement('style');
  css.textContent='.nl-rv{align-self:flex-start;margin-left:12px;display:inline-flex;align-items:center;gap:4px;border:0!important;background:none!important;box-shadow:none!important;color:#23291F!important;font:inherit;font-size:.82rem!important;font-weight:700!important;line-height:1;padding:3px 0!important;border-radius:0;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;min-width:0}'+
    '.nl-rv::before{content:"";display:block;width:20px;height:20px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M20.7 16.4A9 9 0 1 0 17 20l4 1z%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M20.7 16.4A9 9 0 1 0 17 20l4 1z%27/%3E%3C/svg%3E") center/contain no-repeat}'+
    '.nl-rv b{font-weight:700}'+
    '.nl-rvm{position:fixed;inset:0;z-index:9999;background:rgba(20,26,18,.5);display:flex;align-items:flex-end;justify-content:center}'+
    '.nl-rvm .bx{width:100%;max-width:480px;max-height:82vh;overflow:auto;background:#FBFBF8;border-radius:18px 18px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));color:#23291F;font-family:inherit}'+
    '.nl-rvm .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.nl-rvm h3{margin:0;font-size:1.05rem;line-height:1.35}'+
    '.nl-rvm .x{border:0;background:none;font-size:1.1rem;color:#8A917E;cursor:pointer;padding:2px 4px}'+
    '.nl-rvm .sum{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}.nl-rvm .sum span{background:#fff;border:1px solid #E3CFB4;border-radius:999px;padding:4px 10px;font-size:.82rem;font-weight:700}'+
    '.nl-rvm .it{border-top:1px solid #EEF0E8;padding:10px 2px;font-size:.9rem;line-height:1.5}.nl-rvm .it .m{display:block;font-size:.76rem;color:#8A917E}'+
    '.nl-rvm .ft{margin:12px 0 0;font-size:.8rem;color:#6b7364;line-height:1.5}.nl-rvm .ft a{color:#245648;font-weight:800}';
  document.head.appendChild(css);
  function chip(el){var k=el._rk,L=R[k]||[];var c=el.nextElementSibling&&el.nextElementSibling.classList.contains('nl-rv')?el.nextElementSibling:null;
    if(!OK||!L.length){if(c)c.remove();return;}
    if(!c){c=document.createElement('button');c.type='button';c.className='nl-rv';c.setAttribute('data-rvk',k);c.setAttribute('data-ev','후기 보기');el.insertAdjacentElement('afterend',c);}
    c.setAttribute('data-title',el.getAttribute('data-like')||'');c.setAttribute('aria-label','엄마들 후기 '+L.length+'개 보기');
    c.innerHTML='<b>'+L.length+'</b>';}
  function paintKey(k){document.querySelectorAll('[data-like]').forEach(function(el){if(el._rk===k)chip(el);});}
  var qT=null;
  function scan(){
    var want=[];
    document.querySelectorAll('[data-like]').forEach(function(el){
      if(!el._rk)el._rk=key(el.getAttribute('data-like'));if(!el._rk)return;
      if(!ASKED[el._rk]){ASKED[el._rk]=1;want.push(el._rk);}
      var c=el.nextElementSibling;if((R[el._rk]||[]).length&&!(c&&c.classList.contains('nl-rv')))chip(el);
    });
    for(var i=0;i<want.length;i+=500)(function(part){
      rpc('list_reviews_by_keys',{p_keys:part}).then(function(rows){
        (rows||[]).forEach(function(r){if(!r||(!r.body&&!(r.reactions||[]).length))return;(R[r.book_key]=R[r.book_key]||[]).push(r);});
        part.forEach(paintKey);
      },function(){OK=false;});
    })(want.slice(i,i+500));
  }
  function later(){clearTimeout(qT);qT=setTimeout(scan,150);}
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++)if(ms[i].addedNodes.length){later();return;}}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  function dt(t){var d=new Date(t);return isNaN(d)?'':(d.getMonth()+1)+'.'+d.getDate();}
  function sid(){try{return localStorage.getItem('joy_sid')||'anon';}catch(e){return 'anon';}}
  function logEv(meta){try{if(localStorage.getItem('naite_notrack')==='1')return;}catch(e){}
    try{fetch(U+'/rest/v1/events',{method:'POST',keepalive:true,headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({type:'review_view',session_id:sid(),path:location.pathname,meta:meta})}).catch(function(){});}catch(e){}}
  function open(k,title){
    var L=R[k]||[],cnt={};L.forEach(function(x){(x.reactions||[]).forEach(function(r){cnt[r]=(cnt[r]||0)+1;});});
    var ov=document.createElement('div');ov.className='nl-rvm';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
    ov.innerHTML='<div class="bx"><div class="hd"><h3>💬 '+esc(title)+'</h3><button type="button" class="x" data-x aria-label="닫기">✕</button></div>'+
      '<div class="sum">'+Object.keys(RX).filter(function(r){return cnt[r];}).map(function(r){return '<span>'+RX[r][0]+' '+RX[r][1]+' '+cnt[r]+'</span>';}).join('')+'</div>'+
      L.map(function(x){var re=(x.reactions||[]).map(function(r){return RX[r]?RX[r][0]+' '+RX[r][1]:'';}).filter(Boolean).join(' · ');
        return '<div class="it"><span class="m">'+(AGE[x.age]?AGE[x.age]+' 엄마 · ':'')+dt(x.created_at)+'</span>'+(re?re:'')+(x.body?(re?'<br>':'')+'“'+esc(x.body)+'”':'')+'</div>';}).join('')+
      '<p class="ft">읽은 책은 <a href="https://wh-jaimie.github.io/naite-library/record/" target="_blank" rel="noopener">나이테 스터디 앱</a>에 기록하고 후기를 남겨 주세요.</p></div>';
    document.body.appendChild(ov);
    function close(){ov.remove();}
    ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('[data-x]'))close();});
    document.addEventListener('keydown',function f(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',f);}});
    logEv({title:title,key:k,n:L.length,page:PAGE});
  }
  // 캡처 단계에서 받아 카드 전체 클릭(쿠팡 열기 등)으로 번지지 않게
  document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.nl-rv');if(!c)return;e.preventDefault();e.stopPropagation();open(c.getAttribute('data-rvk'),c.getAttribute('data-title')||'');},true);
})();
