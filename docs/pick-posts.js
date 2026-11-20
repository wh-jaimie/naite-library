/* 나이테 Pick 엄마들 추천(2026-11-17) — road.html 전용.
 * 대박책: 회원이 '우리 집 대박책' 추천(책 제목·아이 개월·한 줄 이유) → 나이테 대박책과 함께 😆 재밌어요(book_likes) 많은 순으로.
 * 걸어온 길: 회원이 '이맘때 했던 추천 활동'(개월·활동·함께 쓴 책)을 올리고 👍 추천(book_likes 키 'pickact<id>'). 나이(살)별 칸 안에 표 많은 순.
 * DB: supabase/migrate_pick_posts.sql(add_pick_post/list_pick_posts/delete_pick_post). 없으면 조용히 숨김.
 * 이벤트: pick_form_open·pick_post_save·pick_post_delete·pick_vote {kind} (KPI_EVENTS.md) */
(function(){
  var U='https://vvfqrewseibjdwcuscaz.supabase.co',K='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi',H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
  var P={ok:false,posts:[],cnt:{},mine:{}};
  function e(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function lkey(t){t=String(t||'').toLowerCase().replace(/&/g,'and').replace(/^\s*the\s+/,'');return t.replace(/[^0-9a-z가-힣]/g,'').slice(0,80);} // likes.js key()와 같게
  function hex(n){var a=new Uint8Array(n);crypto.getRandomValues(a);var s='';for(var i=0;i<n;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}
  // 2026-11-18: 추천·👍는 기록 공유(이어보기)와 별개 → naite_voice
  function reader(make){try{var r=localStorage.getItem('naite_voice');if(!r||r.length<16){var o=localStorage.getItem('naite_reader');r=(o&&o.length>=16)?o:'';if(!r&&make)r=hex(16);if(r)localStorage.setItem('naite_voice',r);}return r&&r.length>=16?r:'';}catch(e){return '';}}
  function rpc(n,a){return fetch(U+'/rest/v1/rpc/'+n,{method:'POST',headers:H,body:JSON.stringify(a)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});}
  function ev(type,meta){try{if(localStorage.getItem('naite_notrack')==='1')return;var src=/[?&]embed=record/.test(location.search)?'record':'';
    fetch(U+'/rest/v1/events',{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=minimal'},keepalive:true,
      body:JSON.stringify({type:type,session_id:localStorage.getItem('joy_sid')||'anon',path:location.pathname,meta:Object.assign({page:'나이테 Pick',src:src},meta||{})})}).catch(function(){});}catch(x){}}
  function akey(p){return 'pickact'+p.id;}
  function rkey(n){return ('roadit'+lkey(n)).slice(0,80);} // 나이테 걸어온 길 항목 👍 추천(2026-11-17)
  function ageTxt(m){return m==null?'':m+'개월';}

  function load(){
    return rpc('list_pick_posts',{p_reader:reader(false)||null}).then(function(l){return l;},function(){return null;}).then(function(list){P.ok=!!list;P.posts=list||[];P.vok=true; // 엄마 추천 표가 없어도 걸어온 길 👍는 보이게
      var keys=(window.BEST||[]).map(function(b){return lkey(b[0]);});
      P.posts.forEach(function(p){keys.push(p.kind==='book'?lkey(p.title):akey(p));});
      (window.ROAD||[]).forEach(function(y){(y[1]||[]).forEach(function(i){keys.push(rkey(i.n));});});
      keys=keys.filter(function(k,i){return k&&keys.indexOf(k)===i;}).slice(0,600);
      return rpc('list_likes',{p_keys:keys,p_reader:reader(false)||null}).then(function(rows){P.cnt={};P.mine={};(rows||[]).forEach(function(r){P.cnt[r.book_key]=r.n;if(r.mine)P.mine[r.book_key]=1;});},function(){});
    }).then(paint,function(){P.ok=false;P.vok=false;paint();});
  }

  // ── 대박책: 나이테 대박책 + 엄마들 추천, 재밌어요 많은 순
  function paintBest(){
    var box=document.getElementById('best');if(!box)return;
    var sec=document.getElementById('bestSec'),bar=document.getElementById('ppBestBar');
    if(!bar){bar=document.createElement('div');bar.id='ppBestBar';bar.className='pp-bar';sec.insertBefore(bar,box);}
    bar.innerHTML=P.ok?'<button type="button" class="pp-add" data-ppadd="book">➕ 우리 집 대박책 추천하기</button><p class="pp-note">나이테 대박책과 엄마들이 추천한 책을 <b>😆 재밌어요</b> 많은 순으로 보여요.</p>':'';
    if(!P.ok)return;
    var items=[],seen={};
    (window.BEST||[]).forEach(function(b,i){var k=lkey(b[0]);if(seen[k])return;seen[k]=1;items.push({k:k,t:b[0],c:b[1],o:i,mine:0});});
    P.posts.filter(function(p){return p.kind==='book';}).forEach(function(p,i){var k=lkey(p.title);
      if(seen[k]){var it=items.filter(function(x){return x.k===k;})[0];if(it){(it.by=it.by||[]).push(p);}return;}
      seen[k]=1;items.push({k:k,t:p.title,o:1000+i,by:[p],member:1});});
    items.forEach(function(it){it.n=P.cnt[it.k]||0;});
    items.sort(function(a,b){return b.n-a.n||a.o-b.o;});
    box.innerHTML=items.map(function(it){
      var cv=it.c?img(it.c):'<span class="ph">📚</span>',u=lk(it.t);
      var who=it.by&&it.by.length?'<span class="pp-by">'+(it.member?'엄마 추천':'엄마 추천도 '+it.by.length)+(it.by[0].age_m!=null?' · '+ageTxt(it.by[0].age_m):'')+'</span>'+(it.by[0].body?'<span class="pp-why">“'+e(it.by[0].body)+'”</span>':''):'';
      var del=(it.by||[]).filter(function(p){return p.mine;})[0];
      return '<div class="bk'+(it.member?' pp-m':'')+'">'+(u?wrap(u,cv,it.t):'<span class="cv">'+cv+'</span>')+'<span class="bt">'+e(it.t)+'</span>'+who+
        '<button type="button" data-like="'+e(it.t)+'" hidden></button>'+(del?'<button type="button" class="pp-del" data-ppdel="'+del.id+'">내 추천 지우기</button>':'')+'</div>';}).join('');
  }

  // ── 걸어온 길: 나이(살)별 칸에 엄마들 활동, 👍 추천 많은 순
  function paintRoadActs(){
    var list=document.getElementById('list');if(!list)return;
    var bar=document.getElementById('ppActBar');
    if(!bar||bar.parentNode!==list){bar=document.createElement('div');bar.id='ppActBar';bar.className='pp-bar';list.insertBefore(bar,list.firstChild);} // #list 안 맨 위(걸어온 길 탭에서만 보이게)
    bar.innerHTML=P.ok?'<button type="button" class="pp-add" data-ppadd="act">➕ 우리 아이 이맘때 했던 활동 추천하기</button>':'';
    [].forEach.call(list.querySelectorAll('.pp-acts,.pp-rv'),function(x){x.remove();});
    if(!P.vok)return;
    [].forEach.call(list.querySelectorAll('article.it'),function(a){var b=a.querySelector('.h b');if(!b)return;var n=b.textContent,k=rkey(n),c=P.cnt[k]||0,on=!!P.mine[k];
      var bt=document.createElement('button');bt.type='button';bt.className='pp-vote pp-rv'+(on?' on':'');bt.setAttribute('data-pprv',k);bt.setAttribute('data-ppt',n);bt.setAttribute('aria-pressed',String(on));
      bt.innerHTML='👍 추천'+(c?' <b>'+c+'</b>':'');var tx=a.querySelector('.tx');(tx||a).appendChild(bt);});
    if(!P.ok)return;
    var acts=P.posts.filter(function(p){return p.kind==='act';}),by={};
    acts.forEach(function(p){var g=Math.max(1,Math.ceil((p.age_m||1)/12));(by[g]=by[g]||[]).push(p);});
    Object.keys(by).forEach(function(g){
      var L=by[g].sort(function(a,b){return (P.cnt[akey(b)]||0)-(P.cnt[akey(a)]||0)||(a.created_at<b.created_at?1:-1);});
      var det=null;[].forEach.call(list.querySelectorAll('details.ag'),function(d){var an=d.querySelector('.an');if(an&&parseInt(an.textContent,10)===+g)det=d;});
      if(!det){det=document.createElement('details');det.className='ag';det.innerHTML='<summary><span class="an">'+g+'살</span><span class="ar">'+((g-1)*12+1)+'~'+(g*12)+'개월 · 엄마들 추천</span></summary>';list.appendChild(det);}
      var w=document.createElement('div');w.className='pp-acts';
      w.innerHTML='<p class="pp-h">💛 엄마들이 이맘때 한 활동 <span>'+L.length+'</span></p>'+L.map(function(p){var k=akey(p),n=P.cnt[k]||0,on=!!P.mine[k];
        return '<div class="pp-act"><div class="tx"><span class="when">'+e(ageTxt(p.age_m))+'</span> '+e(p.body)+(p.title?'<span class="pp-with">📚 '+e(p.title)+'</span>':'')+
          (p.mine?' <button type="button" class="pp-del" data-ppdel="'+p.id+'">지우기</button>':'')+'</div>'+
          '<button type="button" class="pp-vote'+(on?' on':'')+'" data-ppvote="'+p.id+'" aria-pressed="'+on+'">👍 추천'+(n?' <b>'+n+'</b>':'')+'</button></div>';}).join('');
      det.appendChild(w);
    });
  }
  function paint(){paintBest();paintRoadActs();}

  // ── 올리기 창
  function openForm(kind){
    var old=document.querySelector('.pp-ov');if(old)old.remove();
    var ov=document.createElement('div');ov.className='pp-ov';
    ov.innerHTML='<div class="pp-box" role="dialog" aria-modal="true"><h3>'+(kind==='book'?'📚 우리 집 대박책 추천':'💛 이맘때 했던 활동 추천')+'</h3>'+
      (kind==='book'
        ?'<label>책 제목 *<input id="ppT" maxlength="80" placeholder="예: Brown Bear, Brown Bear, What Do You See?"></label>'+
         '<label>아이 몇 개월 때 좋아했나요? <span>(선택)</span><input id="ppA" type="number" inputmode="numeric" min="0" max="144" placeholder="예: 18"></label>'+
         '<label>한 줄 추천 이유 <span>· 책 후기로도 올라가요</span><input id="ppB" maxlength="100" placeholder="예: 동물 소리 흉내 내며 매일 가져와요"></label>'
        :'<label>아이 몇 개월 때였나요? *<input id="ppA" type="number" inputmode="numeric" min="0" max="144" placeholder="예: 18"></label>'+
         '<label>어떤 활동이었나요? *<input id="ppB" maxlength="100" placeholder="예: 노부영 노래 틀어 두고 율동하며 따라 부르기"></label>'+
         '<label>함께 쓴 책·영상 <span>(선택)</span><input id="ppT" maxlength="80" placeholder="예: Dear Zoo"></label>')+
      '<p class="pp-warn">이름 없이 모두에게 바로 보여요. 아이 이름·얼굴·연락처는 적지 말아 주세요.</p><p class="pp-err" id="ppE"></p>'+
      '<div class="pp-btns"><button type="button" class="pp-cancel" data-ppx>닫기</button><button type="button" class="pp-ok" data-ppok>올리기</button></div></div>';
    document.body.appendChild(ov);
    function close(){ov.remove();}
    ov.addEventListener('click',function(x){if(x.target===ov)close();});
    ov.querySelector('[data-ppx]').onclick=close;
    ov.querySelector('[data-ppok]').onclick=function(){var b=this,t=ov.querySelector('#ppT').value.trim(),a=ov.querySelector('#ppA').value.trim(),d=ov.querySelector('#ppB').value.trim(),er=ov.querySelector('#ppE');
      var am=a===''?null:Math.round(+a);
      if(kind==='book'&&!t){er.textContent='책 제목을 적어 주세요.';return;}
      if(kind==='act'&&(am==null||isNaN(am))){er.textContent='아이 개월 수를 숫자로 적어 주세요.';return;}
      if(kind==='act'&&d.length<2){er.textContent='어떤 활동이었는지 적어 주세요.';return;}
      if(am!=null&&(isNaN(am)||am<0||am>144)){er.textContent='개월 수는 0~144 사이 숫자로 적어 주세요.';return;}
      b.disabled=true;b.textContent='올리는 중…';
      rpc('add_pick_post',{p_reader:reader(true),p_kind:kind,p_age_m:am,p_title:t,p_body:d}).then(function(r){
        if(!r||!r.ok){b.disabled=false;b.textContent='올리기';er.textContent=r&&r.error==='limit'?'오늘은 더 올릴 수 없어요. 내일 다시 해 주세요.':'올리지 못했어요. 잠시 뒤 다시 해 주세요.';return;}
        ev('pick_post_save',{kind:kind,age_m:am});close();load().then(function(){
          if(kind==='book'){var w=lkey(t);if(!P.mine[w])vote(w,t,true);}});
      },function(){b.disabled=false;b.textContent='올리기';er.textContent='연결이 불안정해요. 잠시 뒤 다시 해 주세요.';});
    };
    ev('pick_form_open',{kind:kind});
    try{ov.querySelector(kind==='book'?'#ppT':'#ppA').focus();}catch(x){}
  }
  function vote(k,title,on){return rpc('set_like',{p_reader:reader(true),p_key:k,p_title:String(title||'').slice(0,120),p_page:'나이테 Pick',p_on:on});}

  document.addEventListener('click',function(x){var t=x.target.closest&&x.target.closest('[data-ppadd],[data-ppvote],[data-ppdel],[data-pprv]');if(!t)return;x.preventDefault();x.stopPropagation();
    if(t.hasAttribute('data-pprv')){var rk=t.getAttribute('data-pprv'),ron=!P.mine[rk];P.mine[rk]=ron?1:0;P.cnt[rk]=Math.max(0,(P.cnt[rk]||0)+(ron?1:-1));
      t.classList.toggle('on',ron);t.setAttribute('aria-pressed',String(ron));t.innerHTML='👍 추천'+(P.cnt[rk]?' <b>'+P.cnt[rk]+'</b>':'');
      vote(rk,t.getAttribute('data-ppt'),ron).then(function(r){if(r&&r.ok&&typeof r.n==='number')P.cnt[rk]=r.n;},function(){});if(ron)ev('pick_vote',{kind:'road',title:t.getAttribute('data-ppt')});return;}
    if(t.hasAttribute('data-ppadd')){openForm(t.getAttribute('data-ppadd'));return;}
    if(t.hasAttribute('data-ppdel')){if(!confirm('이 추천을 지울까요?'))return;rpc('delete_pick_post',{p_reader:reader(false),p_id:+t.getAttribute('data-ppdel')}).then(function(){ev('pick_post_delete',{});load();});return;}
    var id=+t.getAttribute('data-ppvote'),p=P.posts.filter(function(y){return y.id===id;})[0];if(!p)return;
    var k=akey(p),on=!P.mine[k];P.mine[k]=on?1:0;P.cnt[k]=Math.max(0,(P.cnt[k]||0)+(on?1:-1));
    t.classList.toggle('on',on);t.setAttribute('aria-pressed',String(on));t.innerHTML='👍 추천'+(P.cnt[k]?' <b>'+P.cnt[k]+'</b>':'');
    vote(k,(p.body||'').slice(0,60),on).then(function(r){if(r&&r.ok&&typeof r.n==='number'){P.cnt[k]=r.n;}},function(){});
    if(on)ev('pick_vote',{kind:'act'});
  },true);

  // road.html이 쿠팡 링크를 받아 다시 그릴 때(paintRoad) 엄마들 추천도 다시 붙임
  if(typeof window.paintRoad==='function'){var _p=window.paintRoad;window.paintRoad=function(){_p.apply(this,arguments);paint();};}
  load();
})();
