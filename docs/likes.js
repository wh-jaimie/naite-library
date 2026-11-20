/* 😆 재밌어요 투표(2026-11-17) — 나이테 120 · 국내 인기 책장 · 나이테 Pick 대박책 공통.
 * 페이지에 <button type="button" data-like="책 제목"></button> 만 두면 이 스크립트가 버튼을 채우고(다시 그려져도 자동),
 * 누르면 켜기/끄기. 로그인 없이 기기 ID(naite_voice — 이어보기로 기록을 같이 써도 사람마다 따로)로 한 책에 1표.
 * 같은 책은 페이지가 달라도 같은 칸(key) — 규칙은 migrate_likes.sql 의 set_like 검사와 맞춤.
 * 숫자는 MIN명 이상일 때만 보여 줌(지금 1 = 한 표라도 있으면 보임).
 * <script src="likes.js" data-page="나이테 120"></script> */
(function(){
  var U='https://vvfqrewseibjdwcuscaz.supabase.co',K='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi',MIN=1; // 2026-11-17: 1표부터 숫자 보이기(운영자 요청)
  var cs=document.currentScript,PAGE=(cs&&cs.getAttribute('data-page'))||document.title||'';
  var C={},MINE={},ASKED={},OK=true;
  function key(t){t=String(t||'').toLowerCase().replace(/&/g,'and').replace(/^\s*the\s+/,'');return t.replace(/[^0-9a-z가-힣]/g,'').slice(0,80);}
  function hex(n){var a=new Uint8Array(n);crypto.getRandomValues(a);var s='';for(var i=0;i<n;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}
  // 2026-11-18: 재밌어요는 기록 공유(이어보기)와 별개 → 기기별 naite_voice(처음엔 이 기기 기록 ID로 시작)
  function reader(make){try{var r=localStorage.getItem('naite_voice');if(!r||r.length<16){var o=localStorage.getItem('naite_reader');r=(o&&o.length>=16)?o:'';if(!r&&make)r=hex(16);if(r)localStorage.setItem('naite_voice',r);}return r&&r.length>=16?r:'';}catch(e){return '';}}
  function rpc(fn,body){return fetch(U+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);});}
  var css=document.createElement('style');
  // 2026-11-17: 빈 동그라미는 누르는 건지 몰라서 → 인스타 '좋아요'처럼 하트(운영자 선택 B). 🤍 → ❤️, 누르면 '+1'이 떠오름
  // 2026-11-20 운영자: 모든 페이지 하트 통일 — 인스타 좋아요처럼 테두리 없는 선 하트 + 숫자, 누르면 빨간 하트와 '+1'
  css.textContent='.nl-like{position:relative;align-self:flex-start;display:inline-flex;align-items:center;gap:4px;border:0!important;background:none!important;box-shadow:none!important;color:#23291F!important;font:inherit;font-size:.82rem!important;font-weight:700!important;line-height:1;padding:3px 0!important;border-radius:0;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;min-width:0}'+
    '.nl-like::before{content:"";display:block;width:20px;height:20px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z%27/%3E%3C/svg%3E") center/contain no-repeat;transition:transform .15s}'+
    '.nl-like.on::before{content:"";display:block;width:20px;height:20px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27black%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27black%27 stroke=%27black%27 stroke-width=%272%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z%27/%3E%3C/svg%3E") center/contain no-repeat;color:#ED4956}'+
    '.nl-like:active::before{transform:scale(.85)}'+
    '.nl-like b{font-weight:700;color:#23291F!important}'+
    '.nl-like .p1{position:absolute;left:12px;top:-6px;font-size:.66rem;font-weight:900;color:#ED4956;pointer-events:none;opacity:0}'+
    '.nl-like.pop::before{animation:nlPop .35s ease}.nl-like.pop .p1{animation:nlUp .8s ease}'+
    '@keyframes nlPop{40%{transform:scale(1.25)}}@keyframes nlUp{0%{opacity:0;transform:translateY(4px)}25%{opacity:1}100%{opacity:0;transform:translateY(-18px)}}'+
    '.nl-like[hidden]{display:none}@media (prefers-reduced-motion:reduce){.nl-like.pop::before,.nl-like.pop .p1{animation:none}}';
  document.head.appendChild(css);
  function paint(el){var k=el._nk,n=C[k]||0,on=!!MINE[k];
    el.classList.add('nl-like');el.classList.toggle('on',on);el.setAttribute('aria-pressed',String(on));
    el.setAttribute('aria-label','재밌어요'+(on?' 취소':'')+(n>=MIN?', '+n+'명':''));
    el.innerHTML=(n>=MIN?'<b>'+n+'</b>':'')+'<span class="p1" aria-hidden="true">+1</span>';
    el.hidden=!OK;el._np=n+'|'+on;}
  function paintKey(k){document.querySelectorAll('[data-like]').forEach(function(el){if(el._nk===k)paint(el);});}
  var qT=null;
  function scan(){
    var want=[];
    document.querySelectorAll('[data-like]').forEach(function(el){
      if(!el._nk){el._nk=key(el.getAttribute('data-like'));if(!el.getAttribute('data-ev'))el.setAttribute('data-ev','재밌어요');}
      if(!el._nk){el.hidden=true;return;}
      if(!ASKED[el._nk]){ASKED[el._nk]=1;want.push(el._nk);}
      if(el._np!==((C[el._nk]||0)+'|'+!!MINE[el._nk]))paint(el);
    });
    for(var i=0;i<want.length;i+=500)(function(part){
      rpc('list_likes',{p_keys:part,p_reader:reader(false)||null}).then(function(rows){
        (rows||[]).forEach(function(r){C[r.book_key]=r.n;if(r.mine)MINE[r.book_key]=1;});
        part.forEach(paintKey);
      },function(){OK=false;document.querySelectorAll('[data-like]').forEach(function(el){el.hidden=true;});}); // 아직 SQL 전이면 조용히 숨김
    })(want.slice(i,i+500));
  }
  function later(){clearTimeout(qT);qT=setTimeout(scan,120);}
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++)if(ms[i].addedNodes.length){later();return;}}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  function sid(){try{return localStorage.getItem('joy_sid')||'anon';}catch(e){return 'anon';}}
  function logEv(meta){try{if(localStorage.getItem('naite_notrack')==='1')return;}catch(e){}
    try{fetch(U+'/rest/v1/events',{method:'POST',keepalive:true,headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({type:'book_like',session_id:sid(),path:location.pathname,meta:meta})}).catch(function(){});}catch(e){}}
  var busy={};
  // 캡처 단계에서 받아 카드 전체 클릭(쿠팡 열기 등)으로 번지지 않게
  document.addEventListener('click',function(e){
    var el=e.target.closest&&e.target.closest('[data-like]');if(!el||!el._nk)return;
    e.preventDefault();e.stopPropagation();
    var k=el._nk;if(busy[k])return;
    var on=!MINE[k],r=reader(true);if(!r)return;
    if(on)MINE[k]=1;else delete MINE[k];C[k]=Math.max(0,(C[k]||0)+(on?1:-1));
    paintKey(k);el.classList.remove('pop');void el.offsetWidth;if(on)el.classList.add('pop');
    try{if(on&&navigator.vibrate)navigator.vibrate(10);}catch(x){}
    busy[k]=1;
    var src='';try{src=window.NAITE_SRC||'';}catch(x){}
    rpc('set_like',{p_reader:r,p_key:k,p_title:el.getAttribute('data-like')||'',p_page:PAGE,p_on:on}).then(function(d){
      busy[k]=0;
      if(!d||!d.ok){if(on)delete MINE[k];else MINE[k]=1;C[k]=Math.max(0,(C[k]||0)+(on?-1:1));paintKey(k);return;}
      C[k]=d.n;paintKey(k);
      logEv({title:el.getAttribute('data-like')||'',key:k,on:on?1:0,page:PAGE,src:src});
    },function(){busy[k]=0;if(on)delete MINE[k];else MINE[k]=1;C[k]=Math.max(0,(C[k]||0)+(on?-1:1));paintKey(k);});
  },true);
  window.NaiteLikes={key:key,scan:scan};
})();
