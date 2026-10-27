/* 나이테 스터디 — 회원 읽기 기록 (record/app.html 전용, record/index.html 입장 화면은 비밀번호 저장·설치 안내만 사용)
 * 회원 입장(record/)에서 비밀번호를 넣은 기기만 app.html 에 들어옴. 비밀번호가 바뀌면 onExpired → 입장 화면으로.
 * 하단 메뉴: 이번 달 자료 · 우리 책장 · 읽기 통계.
 * 기록하는 곳: 자료 탭 카드의 '읽었어요'(항상 오늘, 메시지에서 [어제로]) · 우리 책장 표지(오늘/어제 선택).
 * 우리 책장 위 달 칩으로 지난 달 책도 기록. 기록은 모든 달을 한 저장소(naite_reads_v2)에 모으고,
 * 읽기 통계는 '날짜 기준' — 이번 달에 읽은 기록이면 어느 달 책이든 이번 달로 셈.
 * 다른 책(스터디 책 아님): 우리 책장 '📚 다른 책도 읽었어요 +1' → 행 {b:0, o:제목, k:'_other'}, 서버 log_other/my_other_reads.
 *   통계 '총 읽기'·'오늘 N번'·인증 카드에는 포함, 반복한 책·유형별·책별 반응에는 넣지 않음.
 * 기록: 한 번 탭 = 1회. 화면에 먼저 반영 → 서버(log_read/undo_read)엔 뒤에서 전송,
 *       실패하면 outbox에 남겨 재전송(client_id로 중복 방지). 기록 주인은 기기별 ID라 회원 비밀번호가 바뀌어도 이어짐.
 * 사용: NaiteReading.mount({client, theme, books, monthLabel, onEvent, onExpired}) — app.html render() 뒤에 호출.
 */
(function(){
  var CUTOFF_H=4;          // 새벽 4시 전 기록은 전날로
  var DOUBLE_TAP_MS=1500;  // 같은 책 1.5초 안 연속 탭은 1회
  var READER_KEY='naite_reader', MEMBER_KEY='naite_member';
  var TAB_IDS=['study','shelf','stats','c120','shop'],TAB_KEY='naite_last_tab';
  // c120·shop = 나이테 공개 페이지를 앱 안(iframe)에서 열어 아래 탭을 유지
  var EMBED={c120:'../challenge.html?embed=record',shop:'../domestic.html?embed=record'};
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

  /* ── 기록 저장소: 모든 달 기록을 한 곳에(행마다 k=주제) ── */
  var STORE_KEY='naite_reads_v2',META_KEY='naite_bookmeta';
  function load(){
    var st={rows:[],outbox:[]};
    try{var j=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(j&&j.rows&&j.outbox)st=j;}catch(e){}
    // 예전 달별 저장소(naite_reads_<주제>)가 남아 있으면 합치고 지움
    try{
      var old=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('naite_reads_')===0&&k!==STORE_KEY)old.push(k);}
      old.forEach(function(k){
        var theme=k.slice('naite_reads_'.length),j=null;try{j=JSON.parse(localStorage.getItem(k)||'null');}catch(e){}
        if(j&&j.rows){
          j.rows.forEach(function(r){if(!st.rows.some(function(x){return x.c===r.c;})){r.k=r.k||theme;st.rows.push(r);}});
          (j.outbox||[]).forEach(function(o){if(!st.outbox.some(function(x){return x.op===o.op&&x.c===o.c;}))st.outbox.push(o);});
        }
        localStorage.removeItem(k);
      });
      if(old.length)localStorage.setItem(STORE_KEY,JSON.stringify(st));
    }catch(e){}
    return st;
  }
  function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify({rows:S.rows,outbox:S.outbox}));}catch(e){}}
  // 책 정보(제목·표지·유형·주제)를 기억 → 지난 달 책도 통계·최근 기록에 이름이 나옴
  function loadMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};}catch(e){return {};}}
  function rememberBooks(key,books){
    var list=(books||[]).map(function(b){var m={id:+b.id,title:b.title,cover:b.cover,type:b.tier_label||b.type||'',tier:b.tier,k:key};S.byId[m.id]=m;return m;});
    try{localStorage.setItem(META_KEY,JSON.stringify(S.byId));}catch(e){}
    return list;
  }

  /* ── 집계 ── */
  function count(bid,day){var n=0;S.rows.forEach(function(r){if(r.b===bid&&(day==null||r.d===day))n++;});return n;}
  function lastDay(bid){var m='';S.rows.forEach(function(r){if(r.b===bid&&r.d>m)m=r.d;});return m;}
  function met(books){return books.filter(function(b){return count(b.id);}).length;}
  function themeTotal(books){var ids={};books.forEach(function(b){ids[b.id]=1;});return S.rows.filter(function(r){return ids[r.b];}).length;}
  // 날짜 기준: 이번 스터디 달(yyyy-mm)에 읽은 기록
  function monthRows(mi){if(!mi)return S.rows.slice();var pre=mi.year+'-'+pad(mi.month)+'-';return S.rows.filter(function(r){return r.d.indexOf(pre)===0;});}
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
    var p=op.op==='add'?(op.k==='_other'?rpc('log_other',{p_reader:st.reader,p_client_id:op.c,p_title:op.o||'',p_read_on:op.d,p_code:st.code})
                                         :rpc('log_read',{p_reader:st.reader,p_client_id:op.c,p_book_id:op.b,p_read_on:op.d,p_code:st.code}))
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
  function pull(key){
    key=key||S.home.key;
    if(!S.reader||!S.member||!key)return;
    var since=Date.now();
    rpc('my_reads',{p_reader:S.reader,p_theme:key}).then(function(list){
      if(!S)return;
      var rows=(list||[]).map(function(r){return {c:r.client_id,b:+r.book_id,d:r.read_on,t:Date.parse(r.created_at)||0,k:key};});
      function has(c){return rows.some(function(r){return r.c===c;});}
      var mine=function(r){return r.k===key;};
      // 아직 서버에 못 보낸 변경, 조회 중에 생긴 기록·삭제를 위에 덮어씀(이 주제 것만)
      S.outbox.forEach(function(op){
        var bk=(S.byId[op.b]||{}).k;
        if(op.op==='add'){if((bk===key||op.k===key)&&!has(op.c))rows.push({c:op.c,b:op.b,d:op.d,t:op.t||Date.now(),k:key});}
        else rows=rows.filter(function(r){return r.c!==op.c;});
      });
      S.rows.forEach(function(r){if(mine(r)&&r.t>=since&&!has(r.c))rows.push(r);});
      rows=rows.filter(function(r){return !S.gone[r.c];});
      S.rows=S.rows.filter(function(r){return !mine(r);}).concat(rows);
      S.rows.sort(function(a,b){return a.t-b.t;});
      save();paint();
    },function(){});
  }
  function pullOther(){
    if(!S.reader||!S.member)return;
    var since=Date.now();
    rpc('my_other_reads',{p_reader:S.reader}).then(function(list){
      if(!S)return;
      var rows=(list||[]).map(function(r){return {c:r.client_id,b:0,o:r.other_title||'',d:r.read_on,t:Date.parse(r.created_at)||0,k:'_other'};});
      function has(c){return rows.some(function(r){return r.c===c;});}
      var mine=function(r){return r.k==='_other';};
      S.outbox.forEach(function(op){
        if(op.op==='add'){if(op.k==='_other'&&!has(op.c))rows.push({c:op.c,b:0,o:op.o||'',d:op.d,t:op.t||Date.now(),k:'_other'});}
        else rows=rows.filter(function(r){return r.c!==op.c;});
      });
      S.rows.forEach(function(r){if(mine(r)&&r.t>=since&&!has(r.c))rows.push(r);});
      rows=rows.filter(function(r){return !S.gone[r.c];});
      S.rows=S.rows.filter(function(r){return !mine(r);}).concat(rows);
      S.rows.sort(function(a,b){return a.t-b.t;});
      save();paint();
    },function(){}); // DB에 아직 함수가 없거나 오프라인이면 기기 기록 그대로
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
  function addRow(bid,day){
    var k=(S.byId[bid]||{}).k||S.home.key;
    var row={c:hex(12),b:bid,d:day,t:Date.now(),k:k};
    S.rows.push(row);S.outbox.push({op:'add',c:row.c,b:bid,d:day,t:row.t,k:k});
    return row;
  }
  // 화면에서 빼고, 아직 안 보낸 추가면 outbox에서 지우기만·이미 보냈거나 보내는 중이면 삭제 요청
  function dropRow(c){
    var row=S.rows.filter(function(r){return r.c===c;})[0];if(!row)return null;
    S.rows=S.rows.filter(function(r){return r.c!==c;});
    S.gone[c]=1;
    var pend=S.outbox.filter(function(o){return o.op==='add'&&o.c===c;})[0];
    if(pend&&S.inflight!==pend)S.outbox=S.outbox.filter(function(o){return o!==pend;});
    else S.outbox.push({op:'del',c:c});
    S.lastTap={};
    return row;
  }
  // src: 'card'(자료 탭 '읽었어요' — 항상 오늘) | 'shelf'(우리 책장 표지 — 선택한 날짜)
  function record(bid,src){
    if(!S.member)return;
    var now=Date.now(),key=src+bid;
    if(S.lastTap[key]&&now-S.lastTap[key]<DOUBLE_TAP_MS){bump(bid,src);return;}
    S.lastTap[key]=now;
    var today=logicalToday(),row=addRow(bid,src==='shelf'?S.recDay:today);
    save();paint();bump(bid,src);
    try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}
    var b=S.byId[bid],acts=[];
    if(row.d===today)acts.push(['어제로',function(){moveToYesterday(row);}]);
    acts.push(['취소',function(){remove(row.c,true);}]);
    toast('<b>'+esc(shortTitle(b.title))+'</b> '+dayLabel(row.d)+' '+count(bid,row.d)+'번째 기록 ✓',acts);
    flush();
  }
  function addOther(title,day){
    var row={c:hex(12),b:0,o:title||'',d:day,t:Date.now(),k:'_other'};
    S.rows.push(row);S.outbox.push({op:'add',c:row.c,b:0,o:row.o,d:day,t:row.t,k:'_other'});
    return row;
  }
  // 다른 책 기록(제목은 선택). 같은 제목 1.5초 안 연타는 1회
  function recordOther(title){
    if(!S.member)return;
    title=String(title||'').trim().slice(0,80);
    var now=Date.now(),key='other:'+title;
    if(S.lastTap[key]&&now-S.lastTap[key]<DOUBLE_TAP_MS)return;
    S.lastTap[key]=now;
    var today=logicalToday(),row=addOther(title,S.recDay);
    save();paint();flush();
    try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}
    var acts=[];
    if(!title)acts.push(['제목 넣기',function(){askTitle(row);}]);
    else if(row.d===today)acts.push(['어제로',function(){moveToYesterday(row);}]);
    acts.push(['취소',function(){remove(row.c,true);}]);
    toast('<b>📚 '+esc(title?shortTitle(title):'다른 책')+'</b> '+dayLabel(row.d)+' 기록 ✓',acts);
    if(S.onEvent)S.onEvent('other_read',{titled:!!title});
  }
  // 방금 기록에 제목 붙이기(지우고 같은 날짜로 제목 넣어 다시 저장)
  function askTitle(row){
    var sh=openSheet('<h3>어떤 책을 읽었나요?</h3><p class="sub">한 번 넣은 제목은 다음부터 버튼으로 떠서, 같은 책을 또 읽으면 누르기만 하면 돼요.</p>'+
      '<form id="otForm" autocomplete="off"><input id="otTitle" class="pin" style="letter-spacing:0;font-size:1.05rem;text-align:left" maxlength="80" placeholder="예: 엄마랑 읽은 Goodnight Moon"><button type="submit" class="pri">저장</button></form>'+
      '<button type="button" class="subtle" data-sclose>제목 없이 둘게요</button>');
    var inp=sh.querySelector('#otTitle');setTimeout(function(){try{inp.focus();}catch(e){}},60);
    sh.querySelector('[data-sclose]').onclick=closeSheet;
    sh.querySelector('#otForm').addEventListener('submit',function(e){
      e.preventDefault();var t=String(inp.value||'').trim().slice(0,80);closeSheet();if(!t)return;
      if(!dropRow(row.c))return;
      addOther(t,row.d);save();paint();flush();
      toast('<b>📚 '+esc(shortTitle(t))+'</b> 제목을 넣었어요 ✓');
    });
  }
  // 지금까지 넣은 다른 책 제목(최근 순, 중복 없이)
  function otherTitles(){
    var seen={},list=[];
    S.rows.slice().sort(function(a,b){return b.t-a.t;}).forEach(function(r){if(r.k==='_other'&&r.o&&!seen[r.o]){seen[r.o]=1;list.push(r.o);}});
    return list.slice(0,8);
  }
  function moveToYesterday(row){
    if(!dropRow(row.c))return;
    var y=addDays(logicalToday(),-1),moved=row.k==='_other'?addOther(row.o,y):addRow(row.b,y);
    save();paint();flush();
    toast('어제('+md(y)+') 기록으로 옮겼어요 ✓',[['취소',function(){remove(moved.c,true);}]]);
  }
  function remove(c,silent){
    var row=dropRow(c);if(!row)return;
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
    else S.outbox.push({op:'add',c:row.c,b:row.b,o:row.o,d:row.d,t:row.t,k:row.k});
    save();paint();flush();toast('기록을 되돌렸어요.');
  }

  /* ── 토스트 ── */
  var toastEl=null,toastT=null;
  // acts: [[라벨, 함수], ...] 또는 (라벨, 함수)
  function toast(html,acts,act){
    if(typeof acts==='string')acts=[[acts,act]];acts=acts||[];
    if(!toastEl){toastEl=document.createElement('div');toastEl.className='rl-toast';toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');document.body.appendChild(toastEl);}
    toastEl.innerHTML='<span class="tx">'+html+'</span>'+acts.map(function(a,i){return '<button type="button"'+(i?' class="sub"':'')+'>'+esc(a[0])+'</button>';}).join('');
    toastEl.querySelectorAll('button').forEach(function(btn,i){btn.onclick=function(){hideToast();acts[i][1]();};});
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

  /* ── 인증 카드: 그날 읽은 표지·횟수를 4:5 이미지로 → 공유(카카오톡 등)·저장 ── */
  var WD=['일','월','화','수','목','금','토'];
  function loadImg(src){return new Promise(function(res){if(!src){res(null);return;}var im=new Image();im.crossOrigin='anonymous';im.onload=function(){res(im);};im.onerror=function(){res(null);};im.src=src;});}
  function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function wrapText(c,t,x,y,maxW,lh,maxLines){var words=String(t).split(' '),line='',n=0;for(var i=0;i<words.length;i++){var test=line?line+' '+words[i]:words[i];if(c.measureText(test).width>maxW&&line){c.fillText(line,x,y+n*lh);n++;line=words[i];if(n>=maxLines-1){break;}}else line=test;}if(n<maxLines)c.fillText(line,x,y+n*lh);}
  function drawCard(day){
    var dl=S.rows.filter(function(r){return r.d===day;}),order=[],cnt={},info={};
    dl.slice().sort(function(a,b){return a.t-b.t;}).forEach(function(r){var id=r.k==='_other'?'o:'+(r.o||''):r.b;
      if(!(id in cnt)){cnt[id]=0;order.push(id);info[id]=r.k==='_other'?{title:r.o||'다른 책',other:true}:(S.byId[r.b]||{title:''});}cnt[id]++;});
    var p=day.split('-'),dt=new Date(+p[0],+p[1]-1,+p[2]),mi=monthInfo();
    var pre=p[0]+'-'+p[1]+'-',days={};S.rows.forEach(function(r){if(r.d.indexOf(pre)===0&&r.d<=day)days[r.d]=1;});
    var W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;var c=cv.getContext('2d');
    var shown=order.slice(0,6),more=order.length-shown.length;
    return Promise.all([document.fonts&&document.fonts.load?Promise.all([document.fonts.load('700 72px "Gowun Batang"'),document.fonts.load('700 36px "Noto Sans KR"')]).catch(function(){}):null]
      .concat(shown.map(function(id){return loadImg(info[id].other?null:info[id].cover);}))).then(function(res){
      var imgs=res.slice(1);
      var g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#2E6B58');g.addColorStop(1,'#1D463A');c.fillStyle=g;c.fillRect(0,0,W,H);
      // 나이테 링(오른쪽 위 장식)
      c.strokeStyle='rgba(246,244,236,.10)';c.lineWidth=10;[300,230,160,90].forEach(function(r){c.beginPath();c.arc(W-60,90,r,0,Math.PI*2);c.stroke();});
      c.fillStyle='#F6F4EC';c.textBaseline='alphabetic';
      c.font='700 34px "Noto Sans KR",sans-serif';c.globalAlpha=.8;
      c.fillText((+p[1])+'월 '+(+p[2])+'일 ('+WD[dt.getDay()]+') · 나이테 스터디',80,140);c.globalAlpha=1;
      c.font='700 78px "Gowun Batang",Georgia,serif';
      c.fillText((day===logicalToday()?'오늘':day===addDays(logicalToday(),-1)?'어제':(+p[1])+'월 '+(+p[2])+'일')+' 영어책',80,250);
      c.fillText(dl.length+'번 읽었어요',80,350);
      // 표지 격자(최대 6권: 3열)
      var n=shown.length,cols=n<=2?n:3,cw=n<=2?300:270,ch=Math.round(cw*4/3),gap=40,gw=cols*cw+(cols-1)*gap,x0=(W-gw)/2,rowsN=Math.ceil(n/cols)||1,gh=rowsN*ch+(rowsN-1)*50,y0=Math.round(400+Math.max(0,(H-200-400-gh)/2));
      shown.forEach(function(id,i){
        var b=info[id],col=i%cols,row=Math.floor(i/cols),x=x0+col*(cw+gap),y=y0+row*(ch+50),im=imgs[i];
        c.save();c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=24;c.shadowOffsetY=10;rrect(c,x,y,cw,ch,14);c.fillStyle='#EBEDE3';c.fill();c.restore();
        c.save();rrect(c,x,y,cw,ch,14);c.clip();
        if(im){var r=Math.max(cw/im.width,ch/im.height),iw=im.width*r,ih=im.height*r;c.drawImage(im,x+(cw-iw)/2,y+(ch-ih)/2,iw,ih);}
        else if(b.other){c.fillStyle='#F6E6D8';c.fillRect(x,y,cw,ch);c.font='88px sans-serif';c.textAlign='center';c.fillText('📚',x+cw/2,y+ch*0.42);c.textAlign='left';c.fillStyle='#6b4220';c.font='700 30px "Noto Sans KR",sans-serif';wrapText(c,b.title,x+24,y+ch*0.6,cw-48,40,4);}
        else{c.fillStyle='#565E4E';c.font='700 30px "Noto Sans KR",sans-serif';wrapText(c,b.title,x+20,y+60,cw-40,40,5);}
        c.restore();
        if(cnt[id]>1){var bx=x+cw-20,by=y+20;c.fillStyle='#D1965C';c.beginPath();c.arc(bx,by,40,0,Math.PI*2);c.fill();c.fillStyle='#1f1a14';c.font='800 34px "Noto Sans KR",sans-serif';c.textAlign='center';c.fillText('×'+cnt[id],bx,by+12);c.textAlign='left';}
      });
      if(more>0){c.fillStyle='#F6F4EC';c.font='700 34px "Noto Sans KR",sans-serif';c.textAlign='center';c.fillText('+ '+more+'권 더',W/2,H-230);c.textAlign='left';}
      // 아래 줄
      c.fillStyle='rgba(246,244,236,.16)';c.fillRect(80,H-170,W-160,2);
      c.fillStyle='#F6F4EC';c.font='700 36px "Noto Sans KR",sans-serif';
      c.fillText((S.home.emoji||'')+' '+(mi?mi.month+'월 ':'')+(S.home.ko||'')+' · 이번 달 '+Object.keys(days).length+'일째 함께 읽는 중',80,H-100);
      c.font='700 30px "Gowun Batang",Georgia,serif';c.textAlign='right';c.globalAlpha=.85;c.fillText('나이테 스터디',W-80,H-50);c.globalAlpha=1;c.textAlign='left';
      return new Promise(function(res){try{cv.toBlob(function(bl){res(bl);},'image/png');}catch(e){res(null);}});
    });
  }
  function openShareCard(day){
    var sh=openSheet('<h3>'+(day===logicalToday()?'오늘':'어제')+'의 인증 카드</h3><p class="sub">오픈채팅에 올리면 미션 \'매일 읽어주고 인증하기\' 완료!</p><div class="sc-wrap"><p class="rv-empty">카드를 만드는 중…</p></div>');
    if(S.onEvent)S.onEvent('share_card_open',{day:day});
    drawCard(day).then(function(blob){
      var wrap=sh.querySelector('.sc-wrap');if(!wrap)return;
      if(!blob){wrap.innerHTML='<p class="rv-empty">이미지를 만들지 못했어요. 이 화면을 캡처해서 올려 주세요.</p>';return;}
      var url=URL.createObjectURL(blob),name='naite-'+day+'.png',file=null;
      try{file=new File([blob],name,{type:'image/png'});}catch(e){}
      var canShare=!!(file&&navigator.canShare&&navigator.canShare({files:[file]}));
      wrap.innerHTML='<img class="sc-img" src="'+url+'" alt="'+day+' 인증 카드">'+
        (canShare?'<button type="button" class="pri" id="scShare">공유하기 (카카오톡 등)</button>':'')+
        '<a class="pri sc-save'+(canShare?' sec':'')+'" href="'+url+'" download="'+name+'">이미지 저장</a>'+
        '<p class="sc-tip">저장이 안 되면 카드를 길게 눌러 저장하거나, 화면을 캡처해 주세요.</p>'+
        '<button type="button" class="subtle" data-sclose>닫기</button>';
      wrap.querySelector('[data-sclose]').onclick=closeSheet;
      wrap.querySelector('.sc-save').addEventListener('click',function(){if(S.onEvent)S.onEvent('share_card_save',{day:day});});
      var sb=wrap.querySelector('#scShare');
      if(sb)sb.onclick=function(){
        navigator.share({files:[file],title:'나이테 스터디 인증'}).then(function(){if(S.onEvent)S.onEvent('share_card_share',{day:day});},function(){});
      };
    });
  }

  /* ── 그리기 ── */
  function coverImg(b){return b.cover?'<img src="'+esc(b.cover)+'" alt="">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>';}
  function bump(bid,src){
    var el=document.querySelector('[data-rbook="'+bid+'"][data-src="'+src+'"]');if(!el)return;
    el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
  }
  function paintCards(){
    var mi=monthInfo();
    document.querySelectorAll('[data-rrow]').forEach(function(el){
      el.hidden=false;
      var bid=+el.getAttribute('data-rrow'),pre=mi?mi.year+'-'+pad(mi.month)+'-':'',n=0,ld=lastDay(bid);
      S.rows.forEach(function(r){if(r.b===bid&&(!pre||r.d.indexOf(pre)===0))n++;});
      el.innerHTML='<span class="rmeta">'+(n?'이번 달 <b>'+n+'번</b> · 마지막 '+dayLabel(ld,true):'아직 안 읽었어요')+'</span>'+
        '<button type="button" class="rbtn" data-rbook="'+bid+'" data-src="card">📖 읽었어요</button>';
    });
  }
  function paintTabs(anim){
    var el=$('rtabs');if(!el)return;
    var T={study:['📚','이번 달 자료'],shelf:['🗂️','우리 책장'],stats:['📊','읽기 통계'],c120:['🎯','나이테 120'],shop:['🛒','인기 책장']};
    el.innerHTML='<div class="in" role="tablist">'+TAB_IDS.map(function(id){
      return '<button type="button" role="tab" class="rtab'+(EMBED[id]?' go':'')+'" data-rtab="'+id+'" aria-selected="'+(S.tab===id)+'"><span class="ic" aria-hidden="true">'+T[id][0]+'</span>'+T[id][1]+'</button>';}).join('')+'</div>';
    if(anim){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');}
  }
  function stack(n){var s=[],k=Math.min(n-1,5);for(var i=1;i<=k;i++){s.push((i*3)+'px '+(-i*3)+'px 0 -1px #FCFCF8');s.push((i*3)+'px '+(-i*3)+'px 0 0 #CBD0C1');}return s.length?'box-shadow:'+s.join(',')+';':'';}
  function viewHead(title,sub,emoji){
    return '<div class="rv-hd"><div class="em">'+esc(emoji||S.theme.emoji||'📚')+'</div><h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>';
  }
  function monthOf(label){var m=/(\d{4})\s*년\s*(\d{1,2})\s*월/.exec(label||'');return m?{y:+m[1],m:+m[2]}:null;}
  function themeName(t){var mo=monthOf(t.month_label);return (mo?mo.m+'월 ':'')+(t.ko||'');}
  // 공개된 달 목록(최근 달 먼저). 이번 달(home)은 항상 맨 앞
  function shelfThemes(){
    var list=(S.pubs||[]).slice();
    if(!list.some(function(t){return t.key===S.home.key;}))list.push({key:S.home.key,ko:S.home.ko,emoji:S.home.emoji,month_label:S.home.monthLabel});
    list.sort(function(a,b){if(a.key===S.home.key)return -1;if(b.key===S.home.key)return 1;var x=monthOf(a.month_label),y=monthOf(b.month_label);return (y?y.y*12+y.m:-1)-(x?x.y*12+x.m:-1)||((a.sort||0)-(b.sort||0));});
    return list;
  }
  // 고른 달의 책(이번 달은 이미 있음, 지난 달은 처음 고를 때 불러옴)
  function shelfBooks(key){
    if(key===S.home.key)return S.books;
    var t=S.loaded[key];if(t&&t.books)return t.books;
    if(!t||!t.loading){
      S.loaded[key]={loading:true};
      rpc('get_study_member',{p_key:key,p_code:S.code}).then(function(d){
        if(!S)return;
        if(d&&d.error==='member'){expire();return;}
        S.loaded[key]={books:d&&d.ok?rememberBooks(key,d.books):[],failed:!(d&&d.ok)};
        paintShelf();pull(key);
      },function(){if(S){S.loaded[key]={failed:true};paintShelf();}});
    }
    return null;
  }
  function paintShelf(){
    var el=$('v-shelf');if(!el||!S.member||S.tab!=='shelf')return;
    var themes=shelfThemes(),key=S.shelfKey||S.home.key,th=themes.filter(function(t){return t.key===key;})[0]||themes[0];
    key=th.key;S.shelfKey=key;
    var books=shelfBooks(key),isHome=key===S.home.key;
    var recent=S.rows.slice().sort(function(a,b){return a.d===b.d?b.t-a.t:(a.d<b.d?1:-1);}).slice(0,30);
    var today=logicalToday(),yest=addDays(today,-1),isT=S.recDay===today,dn=isT?'오늘':'어제',sum=0;
    S.rows.forEach(function(r){if(r.d===S.recDay)sum++;});
    var chips=themes.length>1?'<div class="rs-months" role="group" aria-label="책장 달 고르기">'+themes.map(function(t){
      return '<button type="button" data-rshelf="'+esc(t.key)+'" aria-pressed="'+(t.key===key)+'">'+esc(t.emoji||'')+' '+esc(themeName(t))+(t.key===S.home.key?' <small>이번 달</small>':'')+'</button>';}).join('')+'</div>':'';
    var body;
    if(!books){
      var lt=S.loaded[key]||{};
      body=lt.failed?'<p class="rv-empty">책을 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>':'<p class="rv-empty">책장을 불러오는 중…</p>';
    }else{
      var planks=[];for(var i=0;i<books.length;i+=3)planks.push(books.slice(i,i+3));
      body='<div class="rs-shelf">'+planks.map(function(p){return '<div class="rs-plank">'+p.map(function(b){var n=count(b.id),dc=count(b.id,S.recDay);
        return '<button type="button" class="rs-book'+(n?'':' unread')+'" data-rbook="'+b.id+'" data-src="shelf" aria-label="'+esc(b.title)+' '+dn+' 읽음 기록, '+dn+' '+dc+'번">'+
          '<span class="cv">'+(b.cover?'<img src="'+esc(b.cover)+'" alt="" style="'+stack(n)+'">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>')+
          (n?'':'<span class="pl" aria-hidden="true">+</span>')+(n?'<span class="x">×'+n+'</span>':'')+(dc?'<span class="td">'+dn+' '+dc+'</span>':'')+'</span>'+
          '<span class="lb">'+(n?'마지막 '+dayLabel(lastDay(b.id),true):'아직이에요')+'</span></button>';}).join('')+'</div>';}).join('')+'</div>'+
        '<p class="rs-legend">'+(isHome?'많이 읽은 책일수록 뒤에 책장이 쌓여 두꺼워져요. 흐린 책은 아직 안 읽은 책이에요.':'지난 달 책도 다시 읽으면 표지를 눌러 기록해요. 이번 달 통계에 함께 들어가요.')+'</p>';
    }
    el.innerHTML='<div class="rv">'+chips+
      viewHead(esc(themeName(th))+' 책장',books?books.length+'권 중 <b>'+met(books)+'권</b> 만났어요 · 모두 '+themeTotal(books)+'번 읽었어요':'',th.emoji)+
      '<div class="rs-rec"><span class="big">'+dn+' <b>'+sum+'번</b> 읽었어요</span>'+
        '<span class="rs-chip" role="group" aria-label="기록 날짜"><button type="button" data-rday="'+today+'" aria-pressed="'+isT+'">오늘</button><button type="button" data-rday="'+yest+'" aria-pressed="'+(!isT)+'">어제</button></span></div>'+
      '<p class="rs-hint">표지를 누를 때마다 '+(isT?'오늘':'어제('+md(yest)+')')+' 1번 읽음으로 기록돼요</p>'+
      '<div class="rs-other"><button type="button" class="rs-other-btn" data-rother="">📚 다른 책도 읽었어요 <b>+1</b></button>'+
        (otherTitles().length?'<div class="rs-otitles" aria-label="전에 넣은 다른 책">'+otherTitles().map(function(t){var n=0;S.rows.forEach(function(r){if(r.k==='_other'&&r.o===t)n++;});
          return '<button type="button" data-rother="'+esc(t)+'">'+esc(shortTitle(t))+(n>1?' <small>×'+n+'</small>':'')+'</button>';}).join('')+'</div>':'')+'</div>'+
      (sum?'<button type="button" class="rs-share" data-rshare="'+S.recDay+'">📸 '+dn+' 인증 카드 만들기</button>':'')+body+
      '<h3 class="rv-h3">최근 기록</h3>'+
      (recent.length?'<ul class="rs-list">'+recent.map(function(r){var b=r.k==='_other'?{title:'📚 '+(r.o||'다른 책')}:(S.byId[r.b]||{title:'(지난 달 책)'});
        return '<li><span class="dl">'+dayLabel(r.d)+'</span>'+(b.cover?'<img src="'+esc(b.cover)+'" alt="">':'')+'<span class="tt">'+esc(b.title)+'</span><button type="button" data-rdel="'+esc(r.c)+'" aria-label="'+esc(b.title)+' '+dayLabel(r.d)+' 기록 지우기">지우기</button></li>';}).join('')+'</ul>'
        :'<p class="rv-empty">아직 기록이 없어요. 위의 표지나 이번 달 자료의 \'읽었어요\'를 누르면 여기에 쌓여요.</p>')+
      '<p class="rv-note">기록은 이 폰(브라우저)에 연결돼 있어요. 회원 비밀번호가 바뀌어도 이어지지만, 다른 기기에서는 보이지 않고 브라우저 데이터를 지우면 이어서 볼 수 없어요.</p>'+
      '<button type="button" class="rv-install" data-rinstall'+(isStandalone()?' hidden':'')+'>📲 홈 화면에 추가</button>'+
      '<button type="button" class="rv-leave" data-rleave>이 폰에서 회원 해제</button></div>';
    var on=el.querySelector('.rs-months [aria-pressed="true"]');if(on&&on.scrollIntoView&&S.shelfScroll){try{on.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}S.shelfScroll=false;}
  }
  function paintStats(){
    var el=$('v-stats');if(!el||!S.member||S.tab!=='stats')return;
    var mi=monthInfo(),rows=monthRows(mi),total=rows.length,days={},homeIds={};
    rows.forEach(function(r){days[r.d]=1;});
    S.books.forEach(function(b){homeIds[b.id]=1;});
    var others=rows.filter(function(r){return r.k==='_other';}).length,study=total-others;
    var past=rows.filter(function(r){return r.k!=='_other'&&!homeIds[r.b];}).length;
    function cnt(bid){var n=0;rows.forEach(function(r){if(r.b===bid)n++;});return n;}
    var h='<div class="rv">'+viewHead((mi?mi.month+'월 ':'')+'읽기 통계','')+
      '<div class="rs-kpis">'+
        '<div class="rs-kpi"><span class="k">이번 달 책</span><span class="v">'+met(S.books)+'<small> / '+S.books.length+'권</small></span></div>'+
        '<div class="rs-kpi"><span class="k">총 읽기</span><span class="v">'+total+'<small> 번</small></span></div>'+
        '<div class="rs-kpi"><span class="k">읽은 날</span><span class="v">'+cntKeys(days)+'<small>'+(mi&&mi.elapsed?' / '+mi.elapsed+'일':' 일')+'</small></span></div>'+
      '</div>'+
      (others?'<p class="rs-past">📘 스터디 책 <b>'+study+'번</b> · 📚 다른 책 <b>'+others+'번</b></p>':'')+
      (past?'<p class="rs-past">🔁 스터디 책 중 <b>지난 달 책 다시 읽기 '+past+'번</b>이 들어 있어요.</p>':'');
    if(!total){el.innerHTML=h+'<p class="rv-empty" style="margin-top:18px">이번 달 기록이 아직 없어요. 기록이 쌓이면 가장 많이 읽은 책과 유형별 통계가 여기에 나타나요.</p></div>';return;}
    // 이번 달에 읽은 책들(지난 달 책 포함)
    var readIds={};rows.forEach(function(r){if(r.k!=='_other')readIds[r.b]=1;});
    var readBooks=Object.keys(readIds).map(function(id){return S.byId[+id]||{id:+id,title:'(지난 달 책)',type:''};});
    // 가장 많이 반복한 책: 2번 이상 읽은 책 중 최다. 동점이면 모두 보여줌
    var fmax=0;readBooks.forEach(function(b){fmax=Math.max(fmax,cnt(b.id));});
    var favs=fmax>=2?readBooks.filter(function(b){return cnt(b.id)===fmax;}):[];
    h+='<div class="rv-panel"><h3>가장 많이 반복한 책</h3>';
    if(!favs.length)h+='<p class="rv-soft">아직 두 번 이상 읽은 책이 없어요. 아이가 다시 가져오는 책이 생기면 여기에 나타나요.</p>';
    else if(favs.length===1){var fav=favs[0];
      h+='<div class="fav">'+(fav.cover?'<img src="'+esc(fav.cover)+'" alt="">':'')+'<div><div class="ft">'+esc(fav.title)+'</div><div class="fx"><b>'+fmax+'번</b> 읽었어요'+(fav.type?' · '+esc(fav.type):'')+'</div><div class="fx">아이가 계속 고르는 책은 표현이 귀에 붙고 있다는 신호예요.</div></div></div>';}
    else h+='<div class="favs">'+favs.map(function(b){return '<div>'+(b.cover?'<img src="'+esc(b.cover)+'" alt="'+esc(b.title)+'">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>')+'</div>';}).join('')+'</div>'+
      '<div class="fx">'+favs.length+'권을 똑같이 <b>'+fmax+'번</b>씩 읽었어요.</div>';
    h+='</div>';
    // 유형별 횟수(이번 달 책의 유형 순서 + 지난 달 책에만 있는 유형). 동점 1위는 모두 강조
    var types=[],tc={};
    S.books.slice().sort(function(a,b){return (a.tier||9)-(b.tier||9);}).forEach(function(b){var t=b.type||'기타';if(!(t in tc)){tc[t]=0;types.push(t);}});
    rows.forEach(function(r){if(r.k==='_other')return;var b=S.byId[r.b];var t=(b&&b.type)||'기타';if(!(t in tc)){tc[t]=0;types.push(t);}tc[t]++;});
    var tmax=Math.max.apply(null,types.map(function(t){return tc[t];}))||0;
    var tops=tmax?types.filter(function(t){return tc[t]===tmax;}):[],zeroT=types.filter(function(t){return !tc[t];});
    var msg=tops.length===1?'우리 아이는 <b>'+esc(tops[0])+'</b> 책을 가장 자주 골랐어요.'
      :(tops.length===types.length?'여러 유형을 골고루 읽었어요.':'우리 아이는 <b>'+tops.map(esc).join(', ')+'</b> 책을 가장 자주 골랐어요.');
    h+='<div class="rv-panel"><h3>유형별 읽기 횟수</h3><div class="bars">'+types.map(function(t){return '<div class="br'+(tops.indexOf(t)>=0&&tops.length<types.length?' top':'')+'"><span class="bl">'+esc(t)+'</span><span class="track"><i style="width:'+(tmax?tc[t]/tmax*100:0)+'%"></i></span><span class="bv">'+tc[t]+'</span></div>';}).join('')+'</div>'+
      '<div class="insight">'+msg+(zeroT.length?' 아직 안 읽은 유형: <b>'+zeroT.map(esc).join(', ')+'</b>. Read Aloud 영상으로 먼저 보여주면 시작이 쉬워요.':'')+'</div></div>';
    // 날짜별 흐름(스터디 달 기준)
    if(mi){
      var per=[],today=logicalToday();for(var d=1;d<=mi.days;d++){var ds=mi.year+'-'+pad(mi.month)+'-'+pad(d),n=0;rows.forEach(function(r){if(r.d===ds)n++;});per.push({d:d,ds:ds,n:n});}
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
  function cntKeys(o){return Object.keys(o).length;}
  function paint(anim){paintCards();paintTabs(anim);paintShelf();paintStats();}

  /* ── 탭 ── */
  var studyY=0,T_NAME={c120:'나이테 120',shop:'국내 인기 책장'};
  function showTab(id){
    if(TAB_IDS.indexOf(id)<0)id='study';
    if(S.tab==='study'&&id!=='study')studyY=window.scrollY;
    S.tab=id;
    TAB_IDS.forEach(function(t){var v=$('v-'+t);if(v)v.hidden=t!==id;});
    if(EMBED[id]){var v=$('v-'+id),tb=$('rtabs');
      if(v){v.style.bottom=(tb?tb.offsetHeight:64)+'px';
        if(!v.firstChild){var f=document.createElement('iframe');f.src=EMBED[id];f.title=T_NAME[id];f.loading='eager';v.appendChild(f);}}}
    try{history.replaceState(null,'',location.pathname+location.search+(id==='study'?'':'#'+id));}catch(e){}
    try{localStorage.setItem(TAB_KEY,id);}catch(e){}
    paint();hideToast();
    if(!EMBED[id])window.scrollTo(0,id==='study'?studyY:0);
    if(S.onEvent)S.onEvent('tab_view',{tab:id});
  }

  /* ── 이벤트(한 번만 등록) ── */
  var wired=false;
  function wire(){
    if(wired)return;wired=true;
    document.addEventListener('click',function(e){
      if(!S)return;var t;
      if((t=e.target.closest('[data-rbook]'))){e.preventDefault();e.stopPropagation();record(+t.getAttribute('data-rbook'),t.getAttribute('data-src')||'card');return;}
      if((t=e.target.closest('[data-rtab]'))){showTab(t.getAttribute('data-rtab'));return;}
      if((t=e.target.closest('[data-rday]'))){S.recDay=t.getAttribute('data-rday');paintShelf();return;}
      if((t=e.target.closest('[data-rshelf]'))){S.shelfKey=t.getAttribute('data-rshelf');S.shelfScroll=true;paintShelf();if(S.onEvent)S.onEvent('shelf_month',{theme:S.shelfKey});return;}
      if((t=e.target.closest('[data-rdel]'))){remove(t.getAttribute('data-rdel'),false);return;}
      if((t=e.target.closest('[data-rleave]'))){openLeave();return;}
      if((t=e.target.closest('[data-rshare]'))){openShareCard(t.getAttribute('data-rshare'));return;}
      if((t=e.target.closest('[data-rother]'))){recordOther(t.getAttribute('data-rother'));return;}
      if((t=e.target.closest('[data-rinstall]'))){install();if(S.onEvent)S.onEvent('install_click',{from:t.getAttribute('data-rinstall')||'shelf'});return;}
    },true); // 캡처 단계: 책 카드의 클릭 집계보다 먼저 처리
    window.addEventListener('online',function(){if(S)flush();});
    document.addEventListener('visibilitychange',function(){if(S&&document.visibilityState==='visible'){S.recDay=logicalToday();paint();flush();pull();pullOther();if(S.shelfKey&&S.shelfKey!==S.home.key)pull(S.shelfKey);verifyMember();}});
  }

  window.NaiteReading={
    getCode:getCode,setCode:setCode, // 입장 화면(index.html)에서 사용
    install:install,isStandalone:isStandalone,inAppName:inAppName,externalHref:externalHref,toast:toast,
    mount:function(o){
      var code=getCode(),theme=o.theme||{};
      S={client:o.client,theme:theme,books:[],byId:loadMeta(),monthLabel:o.monthLabel||'',onEvent:o.onEvent||null,onExpired:o.onExpired||null,onLeave:o.onLeave||null,
         reader:readerId(),code:code,member:!!code,recDay:logicalToday(),lastTap:{},inflight:null,gone:{},tab:'study',rows:[],outbox:[],
         home:{key:theme.key,ko:theme.ko,emoji:theme.emoji,monthLabel:o.monthLabel||''},pubs:[],loaded:{},shelfKey:theme.key};
      S.books=rememberBooks(theme.key,o.books);
      var st=load();S.rows=st.rows;S.outbox=st.outbox;
      S.rows.forEach(function(r){if(!r.k)r.k=(S.byId[r.b]||{}).k||theme.key;});
      // 공개된 달 목록(우리 책장 달 칩)
      rpc('list_published').then(function(list){if(!S)return;S.pubs=list||[];paintShelf();},function(){});
      wire();
      // 주소의 #탭 → 없으면 마지막에 보던 탭(앱을 다시 열 때)
      var h=(location.hash||'').slice(1),last='';try{last=localStorage.getItem(TAB_KEY)||'';}catch(e){}
      if(TAB_IDS.indexOf(h)<0)h=last;
      if(EMBED[h])h='study';
      if(TAB_IDS.indexOf(h)>0)showTab(h);else{S.tab='study';paint();}
      flush();pull();pullOther();verifyMember();
      setTimeout(offerInstallOnce,1200);
    }
  };
})();
