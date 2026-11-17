/* 😆 재밌어요 투표(2026-11-17) — 나이테 120 · 국내 인기 책장 · 나이테 Pick 대박책 공통.
 * 페이지에 <button type="button" data-like="책 제목"></button> 만 두면 이 스크립트가 버튼을 채우고(다시 그려져도 자동),
 * 누르면 켜기/끄기. 로그인 없이 기기 ID(naite_reader, 스터디 앱과 같은 값)로 한 책에 1표.
 * 같은 책은 페이지가 달라도 같은 칸(key) — 규칙은 migrate_likes.sql 의 set_like 검사와 맞춤.
 * 숫자는 MIN명 이상일 때만 보여 줌(처음엔 0이 많아 휑해 보여서).
 * <script src="likes.js" data-page="나이테 120"></script> */
(function(){
  var U='https://vvfqrewseibjdwcuscaz.supabase.co',K='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi',MIN=3;
  var cs=document.currentScript,PAGE=(cs&&cs.getAttribute('data-page'))||document.title||'';
  var C={},MINE={},ASKED={},OK=true;
  function key(t){t=String(t||'').toLowerCase().split(/[:(]/)[0].replace(/&/g,'and').replace(/^\s*the\s+/,'');return t.replace(/[^0-9a-z가-힣]/g,'').slice(0,80);}
  function hex(n){var a=new Uint8Array(n);crypto.getRandomValues(a);var s='';for(var i=0;i<n;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}
  function reader(make){try{var r=localStorage.getItem('naite_reader');if((!r||r.length<16)&&make){r=hex(16);localStorage.setItem('naite_reader',r);}return r&&r.length>=16?r:'';}catch(e){return '';}}
  function rpc(fn,body){return fetch(U+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);});}
  var css=document.createElement('style');
  css.textContent='.nl-like{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;border:1px solid #D4D9C9;background:#fff;color:#545C4B;font:inherit;font-size:.74rem;font-weight:800;line-height:1;padding:5px 9px 5px 6px;border-radius:999px;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}'+
    '.nl-like .ck{width:15px;height:15px;border-radius:50%;border:1.6px solid #B9BFAD;display:inline-grid;place-items:center;font-size:10px;color:#fff;flex:none}'+
    '.nl-like b{font-weight:800;color:#B87343}'+
    '.nl-like.on{background:#FFF3E6;border-color:#E3B98F;color:#7A4520}.nl-like.on .ck{background:#B87343;border-color:#B87343}'+
    '.nl-like.pop{animation:nlPop .3s ease}@keyframes nlPop{40%{transform:scale(1.12)}}'+
    '.nl-like[hidden]{display:none}@media (prefers-reduced-motion:reduce){.nl-like.pop{animation:none}}';
  document.head.appendChild(css);
  function paint(el){var k=el._nk,n=C[k]||0,on=!!MINE[k];
    el.classList.add('nl-like');el.classList.toggle('on',on);el.setAttribute('aria-pressed',String(on));
    el.setAttribute('aria-label','재밌어요'+(on?' 취소':'')+(n>=MIN?', '+n+'명':''));
    el.innerHTML='<span class="ck" aria-hidden="true">'+(on?'✓':'')+'</span>재밌어요'+(n>=MIN?' <b>'+n+'</b>':'');
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
