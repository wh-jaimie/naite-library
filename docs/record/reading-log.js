/* 나이테 스터디 — 회원 읽기 기록 (record/app.html 전용, record/index.html 입장 화면은 비밀번호 저장·설치 안내만 사용)
 * 회원 입장(record/)에서 비밀번호를 넣은 기기만 app.html 에 들어옴. 비밀번호가 바뀌면 onExpired → 입장 화면으로.
 * 하단 메뉴: 이번 달 자료 · 우리 책장 · 읽기 통계.
 * 기록: 표지 한 번 탭 = 1회. 화면에 먼저 반영 → 서버(log_read/undo_read)엔 뒤에서 전송,
 *       실패하면 outbox에 남겨 재전송(client_id로 중복 방지). 기록 주인은 기기별 ID라 회원 비밀번호가 바뀌어도 이어짐.
 * 사용: NaiteReading.mount({client, theme, books, monthLabel, onEvent, onExpired}) — app.html render() 뒤에 호출.
 */
(function(){
  var CUTOFF_H=4;          // 새벽 4시 전 기록은 전날로
  var DOUBLE_TAP_MS=1500;  // 같은 책 1.5초 안 연속 탭은 1회
  var READER_KEY='naite_reader', MEMBER_KEY='naite_member';
  var TAB_IDS=['study','shelf','stats'];
  var S=null;              // 현재 마운트 상태

  function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function $(id){return document.getElementById(id);}
  function hex(n){var a=new Uint8Array(n);(window.crypto||window.msCrypto).getRandomValues(a);var s='';for(var i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}
  function readerId(){try{var r=localStorage.getItem(READER_KEY);if(!r||r.length<16){r=hex(16);localStorage.setItem(READER_KEY,r);}return r;}catch(e){return null;}}
  function pad(n){return (n<10?'0':'')+n;}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function logicalToday(){return ymd(new Date(Date.now()-CUTOFF_H*3600e3));}
  function addDays(s,n){var p=s.split('-');return ymd(new Date(+p[0],+p[1]-1,+p[2]+n));}
  function md(s){var p=s.split('-');return (+p[1])+'/'+(+p[2]);}
  function dayLabel(s,short){var t=logicalToday();if(s===t)return '오늘';if(s===addDays(t,-1))return '어제';var p=s.split('-');return short?md(s):(+p[1])+'월 '+(+p[2])+'일';}
  function shortTitle(t){t=String(t||'');return t.length>22?t.slice(0,20)+'…':t;}

  /* ── 회원 비밀번호(이 기기) ── */
  function getCode(){try{return localStorage.getItem(MEMBER_KEY)||sessionStorage.getItem(MEMBER_KEY)||'';}catch(e){return '';}}
  function setCode(code,keep){try{localStorage.removeItem(MEMBER_KEY);sessionStorage.removeItem(MEMBER_KEY);if(code)(keep?localStorage:sessionStorage).setItem(MEMBER_KEY,code);}catch(e){}}

  /* ── 기록 저장소 ── */
  function storeKey(){return 'naite_reads_'+S.theme.key;}
  function load(){try{var j=JSON.parse(localStorage.getItem(storeKey())||'null');if(j&&j.rows&&j.outbox)return j;}catch(e){}return {rows:[],outbox:[]};}
  function save(){try{localStorage.setItem(storeKey(),JSON.stringify({rows:S.rows,outbox:S.outbox}));}catch(e){}}

  /* ── 집계 ── */
  function count(bid,day){var n=0;S.rows.forEach(function(r){if(r.b===bid&&(day==null||r.d===day))n++;});return n;}
  function lastDay(bid){var m='';S.rows.forEach(function(r){if(r.b===bid&&r.d>m)m=r.d;});return m;}
  function readDays(){var o={};S.rows.forEach(function(r){o[r.d]=1;});return Object.keys(o).length;}
  function metBooks(){return S.books.filter(function(b){return count(b.id);}).length;}
  function monthInfo(){ // month_label "2026년 10월 · 1개월차" → 스터디 달과 오늘까지 경과 일수
    var m=/(\d{4})\s*년\s*(\d{1,2})\s*월/.exec(S.monthLabel||'');if(!m)return null;
    var y=+m[1],mo=+m[2],t=logicalToday().split('-'),ty=+t[0],tm=+t[1],td=+t[2];
    var dim=new Date(y,mo,0).getDate(),el=0;
    if(ty===y&&tm===mo)el=td;else if(ty*12+tm>y*12+mo)el=dim;
    return {year:y,month:mo,days:dim,elapsed:el};
  }

  /* ── 서버 ── */
  function rpc(name,args){return S.client.rpc(name,args).then(function(r){if(r.error)throw r.error;return r.data;});}
  function flush(){
    if(!S.reader||S.inflight||!S.outbox.length||!S.member)return;
    var st=S,op=S.outbox[0];st.inflight=op;
    var p=op.op==='add'?rpc('log_read',{p_reader:st.reader,p_client_id:op.c,p_book_id:op.b,p_read_on:op.d,p_code:st.code})
                       :rpc('undo_read',{p_reader:st.reader,p_client_id:op.c});
    p.then(function(res){
      st.inflight=null;
      if(st!==S)return;
      if(op.op==='add'&&res&&res.error==='member'){expire();return;} // 기록은 outbox에 남겨 두고 새 비밀번호로 입장하면 이어서 전송
      S.outbox=S.outbox.filter(function(o){return o!==op;});
      if(op.op==='add'&&res&&res.ok===false){ // 날짜 범위·상한 등으로 거절 → 화면에서도 제거
        S.rows=S.rows.filter(function(r){return r.c!==op.c;});
        toast(res.error==='limit'?'오늘 기록이 너무 많아 더 저장할 수 없어요.':'이 기록은 저장할 수 없어요. 날짜를 확인해 주세요.');
        paint();
      }
      save();flush();
    },function(){st.inflight=null;}); // 네트워크 오류 등 → outbox에 남겨 두고 다음 기회에 재시도
  }
  function pull(){
    if(!S.reader||!S.member)return;
    var key=S.theme.key,since=Date.now();
    rpc('my_reads',{p_reader:S.reader,p_theme:key}).then(function(list){
      if(!S||S.theme.key!==key)return;
      var rows=(list||[]).map(function(r){return {c:r.client_id,b:+r.book_id,d:r.read_on,t:Date.parse(r.created_at)||0};});
      function has(c){return rows.some(function(r){return r.c===c;});}
      // 아직 서버에 못 보낸 변경, 조회 중에 생긴 기록·삭제를 위에 덮어씀
      S.outbox.forEach(function(op){
        if(op.op==='add'){if(!has(op.c))rows.push({c:op.c,b:op.b,d:op.d,t:op.t||Date.now()});}
        else rows=rows.filter(function(r){return r.c!==op.c;});
      });
      S.rows.forEach(function(r){if(r.t>=since&&!has(r.c))rows.push(r);});
      rows=rows.filter(function(r){return !S.gone[r.c];});
      rows.sort(function(a,b){return a.t-b.t;});
      S.rows=rows;save();paint();
    },function(){});
  }
  function verifyMember(){ // 저장된 비밀번호가 아직 유효한지 조용히 확인(오프라인이면 그대로 둠)
    if(!S.code)return;
    var st=S;
    rpc('check_member',{p_code:st.code}).then(function(ok){
      if(st!==S)return;
      if(ok===false)expire();
    },function(){});
  }

  /* ── 회원 만료·해제 ── */
  function expire(){setCode('');S.member=false;if(S.onExpired)S.onExpired();}
  function leave(){setCode('');S.member=false;if(S.onLeave)S.onLeave();}

  /* ── 기록 · 취소 ── */
  function record(bid){
    if(!S.member)return;
    var now=Date.now();
    if(S.lastTap[bid]&&now-S.lastTap[bid]<DOUBLE_TAP_MS){bump(bid);return;}
    S.lastTap[bid]=now;
    var row={c:hex(12),b:bid,d:S.recDay,t:now};
    S.rows.push(row);S.outbox.push({op:'add',c:row.c,b:bid,d:row.d,t:now});
    save();paint();bump(bid);
    try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}
    var b=S.byId[bid];
    toast('<b>'+esc(shortTitle(b.title))+'</b> '+dayLabel(row.d)+' '+count(bid,row.d)+'번째 기록 ✓','취소',function(){remove(row.c,true);});
    flush();
  }
  function remove(c,silent){
    var row=S.rows.filter(function(r){return r.c===c;})[0];if(!row)return;
    S.rows=S.rows.filter(function(r){return r.c!==c;});
    S.gone[c]=1;
    // 아직 안 보낸 추가라면 outbox에서 지우기만, 이미 보냈거나 보내는 중이면 삭제 요청
    var pend=S.outbox.filter(function(o){return o.op==='add'&&o.c===c;})[0];
    if(pend&&S.inflight!==pend)S.outbox=S.outbox.filter(function(o){return o!==pend;});
    else S.outbox.push({op:'del',c:c});
    S.lastTap[row.b]=0;
    save();paint();flush();
    if(silent)toast('기록을 취소했어요.');
    else toast('기록을 지웠어요.','되돌리기',function(){restore(row);});
  }
  function restore(row){
    S.rows.push(row);S.rows.sort(function(a,b){return a.t-b.t;});
    delete S.gone[row.c];
    // 삭제 요청이 아직 대기 중이면 취소만, 이미 보냈거나(보내는 중) 추가 자체를 안 보냈으면 다시 추가
    var del=S.outbox.filter(function(o){return o.op==='del'&&o.c===row.c;})[0];
    if(del&&S.inflight!==del)S.outbox=S.outbox.filter(function(o){return o!==del;});
    else S.outbox.push({op:'add',c:row.c,b:row.b,d:row.d,t:row.t});
    save();paint();flush();toast('기록을 되돌렸어요.');
  }

  /* ── 토스트 ── */
  var toastEl=null,toastT=null;
  function toast(html,actLabel,act){
    if(!toastEl){toastEl=document.createElement('div');toastEl.className='rl-toast';toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');document.body.appendChild(toastEl);}
    toastEl.innerHTML='<span class="tx">'+html+'</span>'+(actLabel?'<button type="button">'+esc(actLabel)+'</button>':'');
    if(actLabel)toastEl.querySelector('button').onclick=function(){hideToast();act();};
    toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(hideToast,4500);
  }
  function hideToast(){if(toastEl)toastEl.classList.remove('on');}

  /* ── 아래에서 올라오는 창(회원 입장 등) ── */
  var sheetEl=null,sheetReturn=null;
  function openSheet(html){
    if(!sheetEl){sheetEl=document.createElement('div');sheetEl.className='rl-scrim';sheetEl.hidden=true;
      sheetEl.innerHTML='<div class="rl-sheet" role="dialog" aria-modal="true"></div>';document.body.appendChild(sheetEl);
      sheetEl.addEventListener('click',function(e){if(e.target===sheetEl)closeSheet();});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheetEl&&!sheetEl.hidden)closeSheet();});}
    sheetReturn=document.activeElement;
    sheetEl.firstChild.innerHTML='<div class="grab" aria-hidden="true"></div>'+html;sheetEl.hidden=false;
    document.documentElement.classList.add('rl-lock');hideToast();
    return sheetEl.firstChild;
  }
  function closeSheet(){if(!sheetEl)return;sheetEl.hidden=true;document.documentElement.classList.remove('rl-lock');try{if(sheetReturn)sheetReturn.focus();}catch(e){}}
  function openLeave(){
    var sh=openSheet('<h3>이 폰에서 회원 해제할까요?</h3><p class="sub">해제하면 다음에 들어올 때 회원 비밀번호를 다시 넣어야 해요. 읽기 기록은 지워지지 않고 그대로 남아요.</p>'+
      '<button type="button" class="pri" data-sclose>계속 회원으로 보기</button><button type="button" class="subtle" id="rlLeave">회원 해제</button>');
    sh.querySelector('[data-sclose]').onclick=closeSheet;
    sh.querySelector('#rlLeave').onclick=function(){closeSheet();leave();};
  }

  /* ── 홈 화면 설치 ──
   * 안드로이드 크롬: 설치 창(beforeinstallprompt). 아이폰: 공유 → 홈 화면에 추가 안내.
   * 카카오톡 등 앱 안 브라우저: 설치가 안 되고 저장소도 따로라 기록이 이어지지 않음 → 다른 브라우저로 열기 안내. */
  var INSTALL_KEY='naite_install_offered',deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;});
  window.addEventListener('appinstalled',function(){deferredPrompt=null;document.querySelectorAll('[data-rinstall]').forEach(function(el){el.hidden=true;});});
  function isStandalone(){try{return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}catch(e){return false;}}
  function isiOS(){var u=navigator.userAgent;return /iphone|ipad|ipod/i.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1);}
  function inAppName(){var u=navigator.userAgent;if(/KAKAOTALK/i.test(u))return '카카오톡';if(/NAVER\(inapp/i.test(u))return '네이버';if(/Instagram/i.test(u))return '인스타그램';if(/FBAN|FBAV/i.test(u))return '페이스북';if(/\bLine\//i.test(u))return '라인';return '';}
  function externalHref(){return /KAKAOTALK/i.test(navigator.userAgent)?'kakaotalk://web/openExternal?url='+encodeURIComponent(location.href):'';}
  function inAppHtml(name){
    var ext=externalHref();
    return '<p class="sub"><b>'+name+' 안에서 열려 있어요.</b> 여기서는 홈 화면에 추가할 수 없고, 기록도 이 창 안에만 따로 저장돼요. '+(isiOS()?'사파리':'크롬')+'에서 열어 주세요.</p>'+
      (ext?'<a class="pri" href="'+esc(ext)+'">'+(isiOS()?'사파리로':'크롬으로')+' 열기</a>':'')+
      '<ol class="steps"><li>화면 오른쪽 위나 아래의 <b>⋮ / ⋯</b> 버튼을 눌러요</li><li><b>다른 브라우저로 열기</b>를 골라요</li><li>열린 화면에서 다시 홈 화면에 추가해요</li></ol>';
  }
  function guideHtml(){
    var app=inAppName();if(app)return inAppHtml(app);
    if(isiOS())return '<p class="sub">아이폰은 사파리에서 직접 추가해요.</p><ol class="steps"><li>화면 아래 <b>공유 버튼(⬆︎)</b>을 눌러요</li><li>목록을 내려 <b>홈 화면에 추가</b>를 골라요</li><li>오른쪽 위 <b>추가</b>를 누르면 끝!</li></ol>';
    return '<ol class="steps"><li>브라우저 오른쪽 위 <b>⋮ 메뉴</b>를 눌러요</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 골라요</li><li><b>설치(추가)</b>를 누르면 끝!</li></ol>';
  }
  function install(){
    if(deferredPrompt&&!inAppName()){var p=deferredPrompt;deferredPrompt=null;p.prompt();if(p.userChoice)p.userChoice.then(function(c){if(c&&c.outcome==='accepted')toast('홈 화면에 추가했어요. 다음부터는 앱으로 열어 주세요.');},function(){});return;}
    var sh=openSheet('<h3>📲 홈 화면에 추가</h3>'+guideHtml()+'<button type="button" class="subtle" data-sclose>닫기</button>');
    sh.querySelector('[data-sclose]').onclick=closeSheet;
  }
  // 처음 입장했을 때 한 번만: 설치 창을 띄울 수 있거나(안드로이드) 안내가 필요한 환경(아이폰·앱 안 브라우저)일 때
  function offerInstallOnce(){
    if(isStandalone())return;
    try{if(localStorage.getItem(INSTALL_KEY))return;}catch(e){return;}
    var waited=0;(function check(){
      if(!S||document.visibilityState!=='visible')return;
      var ok=deferredPrompt||isiOS()||inAppName();
      if(!ok&&waited<3000){waited+=500;setTimeout(check,500);return;}
      if(!ok)return; // 설치를 지원하지 않는 브라우저(데스크톱 등)는 조용히 넘어감
      if(sheetEl&&!sheetEl.hidden)return;
      try{localStorage.setItem(INSTALL_KEY,String(Date.now()));}catch(e){}
      var app=inAppName();
      var sh=openSheet('<h3>홈 화면에 추가해 두세요</h3>'+
        (app?inAppHtml(app):'<p class="sub">매일 아이와 책을 읽고 바로 기록할 수 있게, 앱처럼 한 번에 열려요. 비밀번호도 다시 묻지 않아요.</p>'+
          '<button type="button" class="pri" id="rlInstall">홈 화면에 추가</button>')+
        '<button type="button" class="subtle" data-sclose>나중에 할게요</button>');
      var b=sh.querySelector('#rlInstall');if(b)b.onclick=function(){closeSheet();install();};
      sh.querySelector('[data-sclose]').onclick=closeSheet;
      if(S.onEvent)S.onEvent('install_offer',{env:app||(isiOS()?'ios':'android')});
    })();
  }

  /* ── 그리기 ── */
  function coverImg(b){return b.cover?'<img src="'+esc(b.cover)+'" alt="">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>';}
  function paintTray(anim){
    var el=$('rtray');if(!el)return;
    el.hidden=S.tab!=='study';
    if(el.hidden){el.innerHTML='';return;}
    if(anim){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');}
    var today=logicalToday(),yest=addDays(today,-1),isT=S.recDay===today,sum=0;
    S.rows.forEach(function(r){if(r.d===S.recDay)sum++;});
    el.innerHTML='<div class="rt-in">'+
      '<div class="rt-hd"><span class="rt-tt">읽은 책 기록</span>'+
        '<span class="rt-chip" role="group" aria-label="기록 날짜"><button type="button" data-rday="'+today+'" aria-pressed="'+isT+'">오늘</button><button type="button" data-rday="'+yest+'" aria-pressed="'+(!isT)+'">어제</button></span>'+
        '<span class="rt-sum">'+(isT?'오늘':'어제')+' '+sum+'번</span></div>'+
      '<div class="rt-row">'+S.books.map(function(b){var c=count(b.id,S.recDay);
        return '<button type="button" class="rt-cov'+(c?'':' zero')+'" data-rbook="'+b.id+'" aria-label="'+esc(b.title)+' 읽음 기록, '+(isT?'오늘':'어제')+' '+c+'번">'+coverImg(b)+'<span class="pl" aria-hidden="true">+</span><span class="ct" aria-hidden="true">'+c+'</span><span class="rp" aria-hidden="true"></span></button>';}).join('')+
        '<span class="rt-mini">'+(isT?'오늘':'<b>어제</b>')+' '+sum+'번</span></div>'+
      '<div class="rt-ft">'+(isT?'표지를 누를 때마다 1번 읽음으로 기록돼요':'어제('+md(yest)+') 날짜로 기록 중이에요')+'</div>'+
    '</div>';
    compactOn=null;onScroll();
  }
  function bump(bid){
    var el=document.querySelector('#rtray [data-rbook="'+bid+'"]');if(!el)return;
    el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
  }
  function paintCards(){
    document.querySelectorAll('[data-rrow]').forEach(function(el){
      el.hidden=false;
      var bid=+el.getAttribute('data-rrow'),n=count(bid),ld=lastDay(bid);
      el.innerHTML='<span class="rmeta">'+(n?'이번 달 <b>'+n+'번</b> · 마지막 '+dayLabel(ld,true):'아직 안 읽었어요')+'</span>'+
        '<button type="button" class="rbtn" data-rbook="'+bid+'">📖 읽었어요</button>';
    });
  }
  function paintTabs(anim){
    var el=$('rtabs');if(!el)return;
    var T={study:['📚','이번 달 자료'],shelf:['🗂️','우리 책장'],stats:['📊','읽기 통계']};
    el.innerHTML='<div class="in" role="tablist">'+TAB_IDS.map(function(id){
      return '<button type="button" role="tab" class="rtab" data-rtab="'+id+'" aria-selected="'+(S.tab===id)+'"><span class="ic" aria-hidden="true">'+T[id][0]+'</span>'+T[id][1]+'</button>';}).join('')+'</div>';
    if(anim){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');}
  }
  function stack(n){var s=[],k=Math.min(n-1,5);for(var i=1;i<=k;i++){s.push((i*3)+'px '+(-i*3)+'px 0 -1px #FCFCF8');s.push((i*3)+'px '+(-i*3)+'px 0 0 #CBD0C1');}return s.length?'box-shadow:'+s.join(',')+';':'';}
  function viewHead(title,sub){
    return '<div class="rv-hd"><div class="em">'+esc(S.theme.emoji||'📚')+'</div><h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>';
  }
  function paintShelf(){
    var el=$('v-shelf');if(!el||!S.member||S.tab!=='shelf')return;
    var mi=monthInfo(),met=metBooks(),total=S.rows.length;
    var planks=[];for(var i=0;i<S.books.length;i+=3)planks.push(S.books.slice(i,i+3));
    var recent=S.rows.slice().sort(function(a,b){return a.d===b.d?b.t-a.t:(a.d<b.d?1:-1);}).slice(0,30);
    el.innerHTML='<div class="rv">'+viewHead((mi?mi.month+'월 ':'')+esc(S.theme.ko||'')+' 책장',S.books.length+'권 중 <b>'+met+'권</b> 만났어요 · 모두 '+total+'번 읽었어요')+
      '<div class="rs-shelf">'+planks.map(function(p){return '<div class="rs-plank">'+p.map(function(b){var n=count(b.id);
        return '<div class="rs-book'+(n?'':' unread')+'"><span class="cv">'+(b.cover?'<img src="'+esc(b.cover)+'" alt="'+esc(b.title)+'" style="'+stack(n)+'">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>')+(n?'<span class="x">×'+n+'</span>':'')+'</span>'+
          '<span class="lb">'+(n?'마지막 '+dayLabel(lastDay(b.id),true):'아직이에요')+'</span></div>';}).join('')+'</div>';}).join('')+'</div>'+
      '<p class="rs-legend">많이 읽은 책일수록 뒤에 책장이 쌓여 두꺼워져요. 흐린 책은 아직 안 읽은 책이에요.</p>'+
      '<h3 class="rv-h3">최근 기록</h3>'+
      (recent.length?'<ul class="rs-list">'+recent.map(function(r){var b=S.byId[r.b]||{title:'(이번 달 책 아님)'};
        return '<li><span class="dl">'+dayLabel(r.d)+'</span>'+(b.cover?'<img src="'+esc(b.cover)+'" alt="">':'')+'<span class="tt">'+esc(b.title)+'</span><button type="button" data-rdel="'+esc(r.c)+'" aria-label="'+esc(b.title)+' '+dayLabel(r.d)+' 기록 지우기">지우기</button></li>';}).join('')+'</ul>'
        :'<p class="rv-empty">아직 기록이 없어요. 이번 달 자료 맨 위의 표지를 누르면 여기에 쌓여요.</p>')+
      '<p class="rv-note">기록은 이 폰(브라우저)에 연결돼 있어요. 회원 비밀번호가 바뀌어도 이어지지만, 다른 기기에서는 보이지 않고 브라우저 데이터를 지우면 이어서 볼 수 없어요.</p>'+
      '<button type="button" class="rv-install" data-rinstall'+(isStandalone()?' hidden':'')+'>📲 홈 화면에 추가</button>'+
      '<button type="button" class="rv-leave" data-rleave>이 폰에서 회원 해제</button></div>';
  }
  function paintStats(){
    var el=$('v-stats');if(!el||!S.member||S.tab!=='stats')return;
    var mi=monthInfo(),met=metBooks(),total=S.rows.length,rd=readDays();
    var h='<div class="rv">'+viewHead((mi?mi.month+'월 ':'')+'읽기 통계','')+
      '<div class="rs-kpis">'+
        '<div class="rs-kpi"><span class="k">만난 책</span><span class="v">'+met+'<small> / '+S.books.length+'권</small></span></div>'+
        '<div class="rs-kpi"><span class="k">총 읽기</span><span class="v">'+total+'<small> 번</small></span></div>'+
        '<div class="rs-kpi"><span class="k">읽은 날</span><span class="v">'+rd+'<small>'+(mi&&mi.elapsed?' / '+mi.elapsed+'일':' 일')+'</small></span></div>'+
      '</div>';
    if(!total){el.innerHTML=h+'<p class="rv-empty" style="margin-top:18px">아직 기록이 없어요. 기록이 쌓이면 가장 많이 읽은 책과 유형별 통계가 여기에 나타나요.</p></div>';return;}
    // 가장 많이 반복한 책(같으면 자료 순서가 앞선 책)
    var fav=null,fc=0;S.books.forEach(function(b){var n=count(b.id);if(n>fc){fc=n;fav=b;}});
    if(fav)h+='<div class="rv-panel"><h3>가장 많이 반복한 책</h3><div class="fav">'+(fav.cover?'<img src="'+esc(fav.cover)+'" alt="">':'')+'<div><div class="ft">'+esc(fav.title)+'</div><div class="fx"><b>'+fc+'번</b> 읽었어요'+(fav.type?' · '+esc(fav.type):'')+'</div><div class="fx">아이가 계속 고르는 책은 표현이 귀에 붙고 있다는 신호예요.</div></div></div></div>';
    // 유형별 횟수(책의 유형 순서대로)
    var types=[],tc={};S.books.slice().sort(function(a,b){return (a.tier||9)-(b.tier||9);}).forEach(function(b){var t=b.type||'기타';if(!(t in tc)){tc[t]=0;types.push(t);}});
    S.rows.forEach(function(r){var b=S.byId[r.b];if(b){tc[b.type||'기타']++;}});
    var tmax=Math.max.apply(null,types.map(function(t){return tc[t];}))||1;
    var topT=types.slice().sort(function(a,b){return tc[b]-tc[a];})[0],zeroT=types.filter(function(t){return !tc[t];});
    h+='<div class="rv-panel"><h3>유형별 읽기 횟수</h3><div class="bars">'+types.map(function(t){return '<div class="br'+(t===topT?' top':'')+'"><span class="bl">'+esc(t)+'</span><span class="track"><i style="width:'+(tc[t]/tmax*100)+'%"></i></span><span class="bv">'+tc[t]+'</span></div>';}).join('')+'</div>'+
      '<div class="insight">우리 아이는 <b>'+esc(topT)+'</b> 책을 가장 자주 골랐어요.'+(zeroT.length?' 아직 안 읽은 유형: <b>'+zeroT.map(esc).join(', ')+'</b>. Read Aloud 영상으로 먼저 보여주면 시작이 쉬워요.':'')+'</div></div>';
    // 날짜별 흐름(스터디 달 기준)
    if(mi){
      var per=[],today=logicalToday();for(var d=1;d<=mi.days;d++){var ds=mi.year+'-'+pad(mi.month)+'-'+pad(d),n=0;S.rows.forEach(function(r){if(r.d===ds)n++;});per.push({d:d,ds:ds,n:n});}
      var pm=Math.max(3,Math.max.apply(null,per.map(function(p){return p.n;}))),W=320,H=84,bw=W/mi.days;
      var svg='<svg viewBox="0 0 '+W+' '+(H+14)+'" role="img" aria-label="'+mi.month+'월 날짜별 읽기 횟수"><line x1="0" y1="'+H+'" x2="'+W+'" y2="'+H+'" stroke="#E2E5DA"/>'+
        '<text x="'+W+'" y="9" text-anchor="end" font-size="8" fill="#565E4E">최대 '+pm+'번</text>';
      per.forEach(function(p,i){var x=i*bw+1.5,w=Math.max(bw-3,1);
        if(p.ds>today){svg+='<rect x="'+x+'" y="'+(H-2)+'" width="'+w+'" height="2" fill="#E2E5DA"/>';return;}
        var bh=Math.max(p.n/pm*(H-14),1.5);
        svg+='<rect x="'+x+'" y="'+(H-bh)+'" width="'+w+'" height="'+bh+'" rx="2" fill="'+(p.ds===today?'#B87343':(p.n?'#2F6E58':'#E2E5DA'))+'"><title>'+mi.month+'/'+p.d+' '+p.n+'번</title></rect>';});
      [1,8,15,22,29].forEach(function(d){if(d<=mi.days)svg+='<text x="'+((d-.5)*bw)+'" y="'+(H+11)+'" text-anchor="middle" font-size="8" fill="#565E4E">'+d+'</text>';});
      h+='<div class="rv-panel"><h3>날짜별 흐름</h3>'+svg+'</div>';
    }
    el.innerHTML=h+'</div>';
  }
  function paint(anim){paintTray(anim);paintCards();paintTabs(anim);paintShelf();paintStats();}

  /* ── 탭 ── */
  var studyY=0;
  function showTab(id){
    if(TAB_IDS.indexOf(id)<0)id='study';
    if(S.tab==='study'&&id!=='study')studyY=window.scrollY;
    S.tab=id;
    ['study','shelf','stats'].forEach(function(t){var v=$('v-'+t);if(v)v.hidden=t!==id;});
    try{history.replaceState(null,'',location.pathname+location.search+(id==='study'?'':'#'+id));}catch(e){}
    paint();hideToast();
    window.scrollTo(0,id==='study'?studyY:0);
    if(S.onEvent)S.onEvent('tab_view',{tab:id});
  }

  /* ── 스크롤하면 기록 줄을 작은 표지 줄로 ── */
  var compactOn=null;
  function onScroll(){
    var on=window.scrollY>140;if(on===compactOn)return;compactOn=on;
    var el=$('rtray');if(el)el.classList.toggle('compact',on);
  }

  /* ── 이벤트(한 번만 등록) ── */
  var wired=false;
  function wire(){
    if(wired)return;wired=true;
    document.addEventListener('click',function(e){
      if(!S)return;var t;
      if((t=e.target.closest('[data-rbook]'))){e.preventDefault();e.stopPropagation();record(+t.getAttribute('data-rbook'));return;}
      if((t=e.target.closest('[data-rtab]'))){showTab(t.getAttribute('data-rtab'));return;}
      if((t=e.target.closest('[data-rday]'))){S.recDay=t.getAttribute('data-rday');paintTray();return;}
      if((t=e.target.closest('[data-rdel]'))){remove(t.getAttribute('data-rdel'),false);return;}
      if((t=e.target.closest('[data-rleave]'))){openLeave();return;}
      if((t=e.target.closest('[data-rinstall]'))){install();if(S.onEvent)S.onEvent('install_click',{from:t.getAttribute('data-rinstall')||'shelf'});return;}
    },true); // 캡처 단계: 책 카드의 클릭 집계보다 먼저 처리
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('online',function(){if(S)flush();});
    document.addEventListener('visibilitychange',function(){if(S&&document.visibilityState==='visible'){S.recDay=logicalToday();paint();flush();pull();verifyMember();}});
  }

  window.NaiteReading={
    getCode:getCode,setCode:setCode, // 입장 화면(index.html)에서 사용
    install:install,isStandalone:isStandalone,inAppName:inAppName,externalHref:externalHref,
    mount:function(o){
      var books=(o.books||[]).map(function(b){return {id:+b.id,title:b.title,cover:b.cover,type:b.tier_label||'',tier:b.tier};});
      var byId={};books.forEach(function(b){byId[b.id]=b;});
      var code=getCode();
      S={client:o.client,theme:o.theme||{},books:books,byId:byId,monthLabel:o.monthLabel||'',onEvent:o.onEvent||null,onExpired:o.onExpired||null,onLeave:o.onLeave||null,
         reader:readerId(),code:code,member:!!code,recDay:logicalToday(),lastTap:{},inflight:null,gone:{},tab:'study',rows:[],outbox:[]};
      var st=load();S.rows=st.rows;S.outbox=st.outbox;
      wire();
      var h=(location.hash||'').slice(1);
      if(TAB_IDS.indexOf(h)>0)showTab(h);else{S.tab='study';paint();}
      compactOn=null;onScroll();flush();pull();verifyMember();
      setTimeout(offerInstallOnce,1200);
    }
  };
})();
