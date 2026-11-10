/* 나이테 스터디 — 읽기 기록 (record/app.html 전용)
 * 2026-11-03부터 비밀번호 없이 누구나 씀(migrate_open_app.sql). 기록 주인 = 기기별 ID(naite_reader).
 * 폰을 바꾸거나 앱을 지워도 이어 보려면 '기록 백업'(닉네임 + 숫자 4자리, backup_reader/restore_reader).
 * 하단 메뉴: 이번 달 책(id study) · 읽기 기록(기록하기+읽기 통계, 2026-11-07) · 독서 로드맵 · 인기 책장.
 * 기록하는 곳: 자료 탭 카드의 '읽었어요'(항상 오늘, 메시지에서 [어제로]) · 기록하기 탭 표지(오늘/어제 선택).
 * 기록하기 탭 위 달 칩으로 지난 달 책도 기록. 기록은 모든 달을 한 저장소(naite_reads_v2)에 모으고,
 * 읽기 통계는 '날짜 기준' — 이번 달에 읽은 기록이면 어느 달 책이든 이번 달로 셈.
 * 다른 책(스터디 책 아님): 기록하기 탭 '📚 다른 책도 읽었어요 +1' → 행 {b:0, o:제목, k:'_other'}, 서버 log_other/my_other_reads.
 *   통계 '총 읽기'·'오늘 N번'·인증 카드에는 포함, 반복한 책·유형별·책별 반응에는 넣지 않음.
 * 기록: 한 번 탭 = 1회. 화면에 먼저 반영 → 서버(log_read/undo_read)엔 뒤에서 전송,
 *       실패하면 outbox에 남겨 재전송(client_id로 중복 방지).
 * 사용: NaiteReading.mount({client, theme, books, monthLabel, onEvent}) — app.html render() 뒤에 호출.
 */
(function(){
  var CUTOFF_H=4;          // 새벽 4시 전 기록은 전날로
  var DOUBLE_TAP_MS=1500;  // 같은 책 1.5초 안 연속 탭은 1회
  var READER_KEY='naite_reader', MEMBER_KEY='naite_member', BACKUP_KEY='naite_backup_name';
  var TAB_IDS=['study','shelf','c120','shop','pick'],TAB_KEY='naite_last_tab'; // 2026-11-07: 기록하기+읽기 통계 → '읽기 기록'(shelf) 하나로. 옛 'stats'는 shelf로
  // c120·shop = 나이테 공개 페이지를 앱 안(iframe)에서 열어 아래 탭을 유지
  // 앱 안 페이지는 서비스워커(record/) 밖이라 폰 캐시가 옛 화면을 줄 수 있음 → 바꿀 때마다 EV 올리기(2026-11-07)
  var EV='20261111f',EMBED={c120:'../challenge.html?embed=record&v='+EV,shop:'../domestic.html?embed=record&v='+EV,pick:'../road.html?embed=record&v='+EV};
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
  function dateOf(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
  function dayFull(s){var d=dateOf(s);return (d.getMonth()+1)+'월 '+d.getDate()+'일 ('+WD[d.getDay()]+')';}
  function dayWord(s){var t=logicalToday();return s===t?'오늘':s===addDays(t,-1)?'어제':dayFull(s);}
  function shortTitle(t){t=String(t||'');return t.length>22?t.slice(0,20)+'…':t;}

  /* ── 예전 회원 비밀번호(이 기기) — 서버는 더 이상 확인하지 않지만 함수 인자로 그대로 보냄 ── */
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
  // 기록하기·읽기 통계에서 보는 달: 이번 달(오늘 기준)에서 S.viewOff 만큼 앞(지난 달)으로
  function mkMonth(y,mo){
    var t=logicalToday().split('-'),ty=+t[0],tm=+t[1],td=+t[2],dim=new Date(y,mo,0).getDate(),el=0;
    if(ty===y&&tm===mo)el=td;else if(ty*12+tm>y*12+mo)el=dim;
    return {year:y,month:mo,days:dim,elapsed:el};
  }
  function viewMonth(){
    var b=monthInfo();if(!b)return null;
    var d=new Date(b.year,b.month-1+(S.viewOff||0),1);return mkMonth(d.getFullYear(),d.getMonth()+1);
  }
  // 가장 이른 달: 기록이 있는 달 또는 공개된 스터디 달 중 가장 이른 달까지
  function minOff(){
    var b=monthInfo();if(!b)return 0;var base=b.year*12+b.month,lo=base;
    S.rows.forEach(function(r){var p=r.d.split('-');lo=Math.min(lo,+p[0]*12+(+p[1]));});
    (S.pubs||[]).forEach(function(t){var m=monthOf(t.month_label);if(m)lo=Math.min(lo,m.y*12+m.m);});
    return lo-base;
  }
  function monthNav(label){
    var off=S.viewOff||0;
    return '<span class="mnav"><button type="button" data-mprev aria-label="이전 달"'+(off>minOff()?'':' disabled')+'>‹</button><span class="ml">'+label+'</span>'+
      '<button type="button" data-mnext aria-label="다음 달"'+(off<0?'':' disabled')+'>›</button></span>';
  }
  // 그 달의 스터디 주제와 책(지난 달 책은 처음 볼 때 불러옴)
  function monthTheme(mi){
    if(!mi)return null;var hit=null;
    (S.pubs||[]).forEach(function(t){var m=monthOf(t.month_label);if(m&&m.y===mi.year&&m.m===mi.month)hit=t;});
    if(!hit&&!(S.viewOff||0))hit={key:S.home.key,ko:S.home.ko};
    return hit;
  }
  function viewBooks(mi){var t=monthTheme(mi);if(!t)return [];return shelfBooks(t.key)||[];}
  function monthRows(mi){if(!mi)return S.rows.slice();var pre=mi.year+'-'+pad(mi.month)+'-';return S.rows.filter(function(r){return r.d.indexOf(pre)===0;});}
  // 달력·달 이동·인증 카드 기준 = 오늘이 속한 달(지난 달 자료를 열어도 달력은 현재 기준) — 2026-11-04
  function monthInfo(){var t=logicalToday().split('-');return mkMonth(+t[0],+t[1]);}
  function studyMonth(){ // 열어 둔 자료의 달(month_label "2026년 10월 · 1개월차") — 자료 카드의 '이번 달 n번'용
    var m=/(\d{4})\s*년\s*(\d{1,2})\s*월/.exec(S.monthLabel||'');if(!m)return monthInfo();
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
      if(op.op==='add'&&res&&res.error==='member')return; // 서버가 아직 예전 함수(비밀번호 확인)면 outbox에 남겨 두고 다음에 재전송
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
  // src: 'card'(자료 탭 '읽었어요' — 항상 오늘) | 'shelf'(기록하기 탭 표지 — 선택한 날짜)
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
    offerBarOnce();
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
    save();paint();flush();stampOn(document.querySelector('.rk-other'));
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
  /* ── 기록 백업(닉네임 + 숫자 4자리) ── 폰을 바꾸거나 앱을 지워도 이어 보기 */
  function backupName(){try{return localStorage.getItem(BACKUP_KEY)||'';}catch(e){return '';}}
  function setBackupName(n){try{if(n)localStorage.setItem(BACKUP_KEY,n);else localStorage.removeItem(BACKUP_KEY);}catch(e){}}
  function checkBackup(){ // 다른 기기에서 닉네임을 바꾼 경우 등을 맞춤(오프라인·함수 없음이면 그대로)
    rpc('my_backup',{p_reader:S.reader}).then(function(d){if(!S||!d)return;var n=d.ok?d.name:'';if(n!==backupName()){setBackupName(n);paint();}},function(){});
  }
  var BK_ERR={name:'닉네임은 2~12자로 적어 주세요.',pin:'숫자 4자리를 넣어 주세요.',taken:'이미 다른 분이 쓰는 닉네임이에요. 다른 닉네임으로 해 주세요.',
    nomatch:'닉네임이나 숫자가 맞지 않아요.',locked:'여러 번 틀려서 잠시 막혔어요. 1시간 뒤 다시 해 주세요.'};
  function openBackup(mode){
    var cur=backupName();mode=mode||(cur?'done':'make');
    var form=function(btn){return '<form id="bkForm" autocomplete="off"><input id="bkName" class="pin" style="letter-spacing:0;font-size:1.05rem" maxlength="12" placeholder="닉네임 (예: 조이맘)" value="'+esc(mode==='make'?cur:'')+'">'+
      '<input id="bkPin" class="pin" style="margin-top:8px" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="숫자 4자리"><p class="err" id="bkErr"></p><button type="submit" class="pri">'+btn+'</button></form>';};
    var html=mode==='done'?'<h3>기록이 백업돼 있어요</h3><p class="sub">닉네임 <b>'+esc(cur)+'</b>. 새 폰이나 앱을 다시 깔았을 때 <b>이어보기</b>에 닉네임과 숫자 4자리를 넣으면 기록이 그대로 돌아와요.</p>'+
        '<button type="button" class="pri" data-sclose>확인</button><button type="button" class="subtle" data-bk="make">닉네임·숫자 바꾸기</button><button type="button" class="subtle" data-bk="restore">다른 백업 이어보기</button>'
      :mode==='make'?'<h3>기록 백업하기</h3><p class="sub">기록은 이 폰에 저장돼요. 닉네임과 숫자 4자리를 정해 두면 폰을 바꾸거나 앱을 지워도 이어서 볼 수 있어요. 숫자는 꼭 기억해 주세요.</p>'+form('백업하기')+
        '<button type="button" class="subtle" data-bk="restore">예전에 백업했어요 → 이어보기</button>'
      :'<h3>백업한 기록 이어보기</h3><p class="sub">예전에 정한 닉네임과 숫자 4자리를 넣어 주세요. 이 폰에 있던 기록도 함께 합쳐져요.</p>'+form('이어보기')+
        '<button type="button" class="subtle" data-bk="make">처음이에요 → 백업하기</button>';
    var sh=openSheet(html);
    var c=sh.querySelector('[data-sclose]');if(c)c.onclick=closeSheet;
    sh.querySelectorAll('[data-bk]').forEach(function(b){b.onclick=function(){openBackup(b.getAttribute('data-bk'));};});
    var f=sh.querySelector('#bkForm');if(!f)return;
    var nm=sh.querySelector('#bkName'),pn=sh.querySelector('#bkPin'),er=sh.querySelector('#bkErr'),go=f.querySelector('.pri');
    nm.oninput=pn.oninput=function(){er.textContent='';};
    f.onsubmit=function(e){
      e.preventDefault();
      var name=nm.value.trim(),pin=pn.value.trim();
      if(name.length<2){er.textContent=BK_ERR.name;nm.focus();return;}
      if(!/^[0-9]{4}$/.test(pin)){er.textContent=BK_ERR.pin;pn.focus();return;}
      go.disabled=true;var label=go.textContent;go.textContent='잠시만요…';
      var done=function(){go.disabled=false;go.textContent=label;};
      if(mode==='make'){
        rpc('backup_reader',{p_reader:S.reader,p_name:name,p_pin:pin}).then(function(d){
          done();if(!d||!d.ok){er.textContent=BK_ERR[d&&d.error]||'백업하지 못했어요. 잠시 뒤 다시 해 주세요.';return;}
          setBackupName(d.name||name);paint();openBackup('done');toast('기록을 백업했어요 ✓');
          if(S.onEvent)S.onEvent('backup_made',{});
        },function(){done();er.textContent='연결이 불안정해요. 잠시 뒤 다시 해 주세요.';});
      }else{
        rpc('restore_reader',{p_name:name,p_pin:pin,p_current:S.reader}).then(function(d){
          if(!d||!d.ok){done();er.textContent=BK_ERR[d&&d.error]||'이어보지 못했어요. 잠시 뒤 다시 해 주세요.';return;}
          if(S.onEvent)S.onEvent('backup_restored',{});
          // 기기 ID를 백업 쪽으로 바꾸고 다시 열면 모든 달 기록을 서버에서 다시 받아옴(안 보낸 기록은 outbox에 남아 새 ID로 전송)
          try{localStorage.setItem(READER_KEY,d.reader);}catch(e){}
          setBackupName(d.name||name);
          S.rows=S.rows.filter(function(r){return S.outbox.some(function(o){return o.c===r.c;});});save();
          location.reload();
        },function(){done();er.textContent='연결이 불안정해요. 잠시 뒤 다시 해 주세요.';});
      }
    };
  }

  /* ── 홈 화면 설치 ──
   * 안드로이드 크롬: 설치 창(beforeinstallprompt). 아이폰: 공유 → 홈 화면에 추가 안내.
   * 카카오톡 등 앱 안 브라우저: 설치가 안 되고 저장소도 따로라 기록이 이어지지 않음 → 다른 브라우저로 열기 안내. */
  var INSTALL_KEY='naite_install_offered',deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;});
  window.addEventListener('appinstalled',function(){deferredPrompt=null;document.querySelectorAll('[data-rinstall]').forEach(function(el){el.hidden=true;});var b=document.getElementById('rlInstBar');if(b)b.remove();});
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
  var HOWTO='<a class="pri" href="../install.html" style="background:#fff;color:#245648;border:1.5px solid #245648">📖 설치 방법 자세히 보기</a>';
  function guideHtml(){return guideBase()+HOWTO;}
  function guideBase(){
    var app=inAppName();if(app)return inAppHtml(app);
    if(isiOS())return '<p class="sub">아이폰은 사파리에서 <b>홈 화면에 추가</b>하면 앱으로 설치돼요.</p><ol class="steps"><li>화면 아래 <b>공유 버튼(⬆︎)</b>을 눌러요</li><li>목록을 내려 <b>홈 화면에 추가</b>를 골라요</li><li>오른쪽 위 <b>추가</b>를 누르면 끝!</li></ol>';
    return '<ol class="steps"><li>브라우저 오른쪽 위 <b>⋮ 메뉴</b>를 눌러요</li><li><b>앱 설치</b>(또는 <b>홈 화면에 추가</b>)를 골라요</li><li><b>설치</b>를 누르면 끝!</li></ol>';
  }
  function install(){
    if(deferredPrompt&&!inAppName()){var p=deferredPrompt;deferredPrompt=null;p.prompt();if(p.userChoice)p.userChoice.then(function(c){if(c&&c.outcome==='accepted')toast('앱을 설치했어요. 다음부터는 홈 화면의 나이테 스터디 앱으로 열어 주세요.');},function(){});return;}
    var sh=openSheet('<h3>📲 앱 설치하기</h3>'+guideHtml()+'<button type="button" class="subtle" data-sclose>닫기</button>');
    sh.querySelector('[data-sclose]').onclick=closeSheet;
  }
  var BAR_KEY='naite_install_bar_hide';
  // 앱 설치 띠: 처음 기록한 직후 한 번만(모든 탭 공통). 닫으면 다시 안 띄움
  function offerBarOnce(){setTimeout(function(){try{if(localStorage.getItem('naite_instbar_shown'))return;localStorage.setItem('naite_instbar_shown','1');}catch(e){return;}installBar();},4500);}
  function installBar(){
    if(isStandalone()||document.getElementById('rlInstBar'))return;
    try{var u=+localStorage.getItem(BAR_KEY)||0;if(u>Date.now())return;}catch(e){}
    var bar=document.createElement('div');bar.id='rlInstBar';bar.className='rl-instbar';
    bar.innerHTML=svg(18,'<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',2)+'<span class="t">앱으로 설치하면 다음부터 바로 열려요</span><button type="button" class="go" data-rinstall="bar">앱 설치하기</button><button type="button" class="x" aria-label="닫기">×</button>';
    bar.querySelector('.x').onclick=function(){try{localStorage.setItem(BAR_KEY,String(Date.now()+3650*864e5));}catch(e){}bar.remove();if(S&&S.onEvent)S.onEvent('install_bar_close',{});};
    document.body.appendChild(bar);
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
      // '처음 오셨나요?' 안내(#pn)가 열려 있으면 띄우지 않음 — 안내의 시작하기 1번이 이미 앱 설치(다음에 열 때 다시 제안)
      var pn=document.getElementById('pn');if(pn&&!pn.hidden)return;
      try{localStorage.setItem(INSTALL_KEY,String(Date.now()));}catch(e){}
      var app=inAppName();
      var sh=openSheet('<h3>앱으로 설치해 두세요</h3>'+
        (app?inAppHtml(app):'<p class="sub">매일 아이와 책을 읽고 바로 기록할 수 있게, 앱처럼 한 번에 열려요.</p>'+
          '<button type="button" class="pri" id="rlInstall">📲 앱 설치하기</button>')+
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
  function drawCard(day,photo){
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
      var dateTxt=(+p[1])+'월 '+(+p[2])+'일 ('+WD[dt.getDay()]+') · 나이테 한달5권 스터디';
      var dw=(day===logicalToday()?'오늘':day===addDays(logicalToday(),-1)?'어제':(+p[1])+'월 '+(+p[2])+'일'),head=dl.length?dw+' 영어책 '+dl.length+'권 읽었어요':'';
      var together=Object.keys(days).length?'이번 달 '+Object.keys(days).length+'일째 함께 읽는 중':'이번 달도 함께 읽는 중';
      if(photo){
        // ── 사진 카드: 엄마가 찍은 사진(가운데 맞춰 자르기)만. 사진 속 권수와 기록이 다를 수 있어 '몇 권' 문구·표지 줄은 넣지 않음
        var PH=1180;
        c.fillStyle='#1D463A';c.fillRect(0,0,W,H);
        var pr=Math.max(W/photo.width,PH/photo.height),pw=photo.width*pr,ph=photo.height*pr;
        c.save();c.beginPath();c.rect(0,0,W,PH);c.clip();c.drawImage(photo,(W-pw)/2,(PH-ph)/2,pw,ph);c.restore();
        var fade=c.createLinearGradient(0,PH-220,0,PH);fade.addColorStop(0,'rgba(29,70,58,0)');fade.addColorStop(1,'rgba(29,70,58,1)');c.fillStyle=fade;c.fillRect(0,PH-220,W,220);
        c.font='700 30px "Noto Sans KR",sans-serif';var tw=c.measureText(dateTxt).width;
        c.fillStyle='rgba(20,30,25,.62)';rrect(c,40,40,tw+48,62,31);c.fill();c.fillStyle='#F6F4EC';c.fillText(dateTxt,64,82);
        c.fillStyle='rgba(246,244,236,.16)';c.fillRect(60,H-130,W-120,2);
        c.fillStyle='#F6F4EC';c.font='700 32px "Noto Sans KR",sans-serif';
        c.fillText((S.home.emoji||'')+' '+(mi?mi.month+'월 ':'')+(S.home.ko||'')+' · '+together,60,H-74);
        c.font='700 28px "Gowun Batang",Georgia,serif';c.textAlign='right';c.globalAlpha=.85;c.fillText('@naite_library · 나이테',W-60,H-30);c.globalAlpha=1;c.textAlign='left';
        return new Promise(function(r3){try{cv.toBlob(function(bl){r3(bl);},'image/png');}catch(e){r3(null);}});
      }
      var g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#2E6B58');g.addColorStop(1,'#1D463A');c.fillStyle=g;c.fillRect(0,0,W,H);
      // 나이테 링(오른쪽 위 장식)
      c.strokeStyle='rgba(246,244,236,.10)';c.lineWidth=10;[300,230,160,90].forEach(function(r){c.beginPath();c.arc(W-60,90,r,0,Math.PI*2);c.stroke();});
      c.fillStyle='#F6F4EC';c.textBaseline='alphabetic';
      c.font='700 34px "Noto Sans KR",sans-serif';c.globalAlpha=.8;
      c.fillText((+p[1])+'월 '+(+p[2])+'일 ('+WD[dt.getDay()]+') · 나이테 한달5권 스터디',80,140);c.globalAlpha=1;
      c.font='700 78px "Gowun Batang",Georgia,serif';
      if(dl.length){c.fillText(dw+' 영어책',80,250);c.fillText(dl.length+'권 읽었어요',80,350);}
      else{c.font='260px sans-serif';c.textAlign='center';c.fillText('📚',W/2,760);c.textAlign='left';}
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
      c.fillText((S.home.emoji||'')+' '+(mi?mi.month+'월 ':'')+(S.home.ko||'')+' · '+together,80,H-100);
      c.font='700 30px "Gowun Batang",Georgia,serif';c.textAlign='right';c.globalAlpha=.85;c.fillText('@naite_library · 나이테',W-80,H-50);c.globalAlpha=1;c.textAlign='left';
      return new Promise(function(res){try{cv.toBlob(function(bl){res(bl);},'image/png');}catch(e){res(null);}});
    });
  }
  // 이미지 공유·저장 창(인증 카드·달력 공용)
  function fillShare(wrap,blobP,name,kind,meta,title){
    wrap.innerHTML='<p class="rv-empty">이미지를 만드는 중…</p>';
    blobP.then(function(blob){
      if(!blob){wrap.innerHTML='<p class="rv-empty">이미지를 만들지 못했어요. 이 화면을 캡처해서 올려 주세요.</p>';return;}
      var url=URL.createObjectURL(blob),file=null;
      try{file=new File([blob],name,{type:blob.type||'image/png'});}catch(e){}
      var canShare=!!(file&&navigator.canShare&&navigator.canShare({files:[file]}));
      wrap.innerHTML='<img class="sc-img" src="'+url+'" alt="'+esc(title)+'">'+
        (canShare?'<button type="button" class="pri" data-scshare>공유하기 (인스타·카카오톡 등)</button>':'')+
        '<a class="pri sc-save'+(canShare?' sec':'')+'" href="'+url+'" download="'+name+'">이미지 저장</a>'+
        '<p class="sc-tip">저장이 안 되면 이미지를 길게 눌러 저장하거나, 화면을 캡처해 주세요.</p>'+
        '<button type="button" class="subtle" data-sclose>닫기</button>';
      wrap.querySelector('[data-sclose]').onclick=closeSheet;
      wrap.querySelector('.sc-save').addEventListener('click',function(){if(S.onEvent)S.onEvent(kind+'_save',meta||{});});
      var sb=wrap.querySelector('[data-scshare]');
      if(sb)sb.onclick=function(){navigator.share({files:[file],title:'나이테 한달5권 스터디'}).then(function(){if(S.onEvent)S.onEvent(kind+'_share',meta||{});},function(){});};
    });
  }
  // 이미지 공유·저장 창(인증 카드·달력 공용). extra: 이미지 위에 넣을 조작 영역
  function shareSheet(title,sub,blobP,name,kind,meta,extra){
    var sh=openSheet('<h3>'+title+'</h3><p class="sub">'+sub+'</p>'+(extra||'')+'<div class="sc-wrap"></div>');
    if(S.onEvent)S.onEvent(kind+'_open',meta||{});
    fillShare(sh.querySelector('.sc-wrap'),blobP,name,kind,meta,title);
    return sh;
  }
  /* ── 인증 사진: 이 폰 안(IndexedDB)에만 날짜별 최대 3장. 서버에는 올리지 않음 ── */
  var PDB=null;
  function pdb(){
    if(!PDB)PDB=new Promise(function(res,rej){try{var r=indexedDB.open('naite_photos',1);r.onupgradeneeded=function(){r.result.createObjectStore('p');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};}catch(e){rej(e);}});
    return PDB;
  }
  function ptx(mode,fn){return pdb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction('p',mode);fn(tx.objectStore('p'));tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};});});}
  // 하루 여러 장: S.photoList[날짜]=[{k,b,u}] (찍은 순서). S.photoUrls/photoBlobs[날짜]는 그날 마지막 사진(달력 이미지·N일째 계산용)
  var PMAX=3;
  function pday(k){return String(k).slice(0,10);}
  function syncDay(day){
    var L=S.photoList[day];
    if(L&&L.length){S.photoBlobs[day]=L[L.length-1].b;S.photoUrls[day]=L[L.length-1].u;}
    else{delete S.photoList[day];delete S.photoBlobs[day];delete S.photoUrls[day];}
  }
  function addPhotoMem(k,blob){
    var day=pday(k),L=S.photoList[day]||(S.photoList[day]=[]);
    L.push({k:k,b:blob,u:URL.createObjectURL(blob)});L.sort(function(a,b){return a.k<b.k?-1:a.k>b.k?1:0;});syncDay(day);
  }
  function loadPhotos(){
    pdb().then(function(db){return new Promise(function(res){var o={},tx=db.transaction('p','readonly');
      tx.objectStore('p').openCursor().onsuccess=function(e){var c=e.target.result;if(c){o[c.key]=c.value;c.continue();}};
      tx.oncomplete=function(){res(o);};tx.onerror=function(){res(o);};});})
    .then(function(o){if(!S)return;Object.keys(o).forEach(function(k){addPhotoMem(k,o[k]);});paint();},function(){});
  }
  // 긴 변 1080px JPEG로 줄여서 저장(한 장 100~200KB). 하루 PMAX장이 넘으면 그날 가장 먼저 찍은 사진을 지움
  function savePhoto(day,im,cb){
    var r=Math.min(1,1080/Math.max(im.width,im.height)),cv=document.createElement('canvas');
    cv.width=Math.round(im.width*r);cv.height=Math.round(im.height*r);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
    cv.toBlob(function(bl){if(!bl||!S)return;
      var L=S.photoList[day]||[],k=L.length?day+'#'+Date.now():day,drop=[];
      addPhotoMem(k,bl);
      while(S.photoList[day].length>PMAX){var x=S.photoList[day].shift();URL.revokeObjectURL(x.u);drop.push(x.k);}
      syncDay(day);paint();
      ptx('readwrite',function(st){st.put(bl,k);drop.forEach(function(d){st.delete(d);});}).catch(function(){});
      if(cb)cb(k,drop.length);
    },'image/jpeg',.82);
  }
  function delPhoto(day,k){if(!S)return;
    var L=S.photoList[day]||[],keys=[];
    S.photoList[day]=L.filter(function(x){if(k&&x.k!==k)return true;URL.revokeObjectURL(x.u);keys.push(x.k);return false;});
    syncDay(day);paint();ptx('readwrite',function(st){keys.forEach(function(d){st.delete(d);});}).catch(function(){});
  }

  // 사진 파일 → 그릴 수 있는 이미지(사진 방향 정보 반영)
  function loadPhoto(f){
    var p=window.createImageBitmap?createImageBitmap(f,{imageOrientation:'from-image'}).catch(function(){return viaImg();}):viaImg();
    return p.then(shrink);
    function viaImg(){return new Promise(function(res,rej){var u=URL.createObjectURL(f),im=new Image();im.onload=function(){res(im);};im.onerror=rej;im.src=u;});}
  }
  function shrink(im){
    var w=im.width||im.naturalWidth,h=im.height||im.naturalHeight,r=2000/Math.max(w,h);
    if(!(r<1))return im;
    var c=document.createElement('canvas');c.width=Math.round(w*r);c.height=Math.round(h*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    if(im.close)im.close();
    return c;
  }
  // 앱 안에서 바로 찍기: 폰 카메라 앱으로 넘어가면 그 사이 안드로이드가 설치 앱을 닫아 사진이 안 들어오는 경우가 있어서
  function canCamera(){return !!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.isSecureContext!==false);}
  // 인증 사진 오버레이(리본·프레임·필름): 찍는 화면에 실시간으로 띄우고, 찍은 사진에 같은 모양으로 그려 넣음
  var TPLS=[['ribbon','리본'],['frame','프레임'],['film','필름']];
  function getTpl(){try{var t=localStorage.getItem('naite_stamp_tpl');return /^(ribbon|frame|film)$/.test(t)?t:'ribbon';}catch(e){return 'ribbon';}}
  function setTpl(t){try{localStorage.setItem('naite_stamp_tpl',t);}catch(e){}}
  function stampLines(day){
    var t=logicalToday(),isT=!day||day===t;day=day||t;
    var d=new Date(),dd=dateOf(day),h=d.getHours(),pre=day.slice(0,8),days={};
    // 'N일째' = 이번 달 1일~그날까지 책을 기록했거나 인증샷을 찍은 날 수(그날 포함). 2026-11-10: 예전엔 책 기록한 날만 세서, 사진만 찍은 날이 끼면 같은 숫자가 반복됐음
    S.rows.forEach(function(r){if(r.d.indexOf(pre)===0&&r.d<=day)days[r.d]=1;});
    Object.keys(S.photoUrls||{}).forEach(function(k){if(k.indexOf(pre)===0&&k<=day)days[k]=1;});days[day]=1;
    return {a:(dd.getMonth()+1)+'월 '+dd.getDate()+'일 ('+WD[dd.getDay()]+')',b:isT?(h<12?'오전 ':'오후 ')+((h%12)||12)+':'+pad(d.getMinutes()):'',
      c:'나이테 한달5권 스터디 · '+(dd.getMonth()+1)+'월 '+cntKeys(days)+'일째',ig:'@naite_library'};
  }
  var OVL_RING='<svg class="ovl-ring" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="17" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="11" stroke="#fff" stroke-width="2" opacity=".72"/><circle cx="20" cy="20" r="5.5" stroke="#fff" stroke-width="2" opacity=".5"/><circle cx="20" cy="4.5" r="2.4" fill="#E3A869"/></svg>';
  var OVL_IG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  var OVL_LOCK_RING='<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="17" stroke="#fff" stroke-width="2.2"/><circle cx="20" cy="20" r="11" stroke="#fff" stroke-width="2.2" opacity=".72"/><circle cx="20" cy="20" r="5.5" stroke="#fff" stroke-width="2.2" opacity=".5"/><circle cx="20" cy="3.6" r="2.6" fill="#E3A869"/></svg>';
  function ovlHtml(tpl){return '<div class="ovl t-'+tpl+'" aria-hidden="true"><div class="ovl-scrim"></div><div class="ovl-frame"></div><div class="ovl-body">'+OVL_RING+
    '<div class="ovl-lock">'+OVL_LOCK_RING+'<span>나이테</span></div><i class="ovl-rule"></i>'+
    '<div class="ovl-date" data-s1></div><div class="ovl-time" data-s2></div><div class="ovl-sub"><span class="sep"></span><span data-s3></span></div><div class="ovl-ig">'+OVL_IG+'<span>@naite_library</span></div></div></div>';}
  // 캔버스에 같은 오버레이 그리기(디자인 기준 폭 352px → u 배율)
  function stampFonts(){
    if(!document.fonts||!document.fonts.load)return Promise.resolve();
    return Promise.all([document.fonts.load('700 40px "Gowun Batang"','나이테 0123456789월일오전후금토 ()'),document.fonts.load('700 26px "Noto Sans KR"','한달5권 스터디 월일째 @naite_library')]).catch(function(){});
  }
  function drawRibbon(c,W,H,day){
    var L=stampLines(day),k=W/1440,serif='"Gowun Batang",Georgia,serif',sans='"Noto Sans KR",sans-serif',cx=W/2;
    c.save();
    var g=c.createLinearGradient(0,H,0,0);g.addColorStop(0,'rgba(14,20,11,.5)');g.addColorStop(.22,'rgba(14,20,11,.2)');g.addColorStop(.42,'rgba(14,20,11,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    function sh(){c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=14*k;c.shadowOffsetX=0;c.shadowOffsetY=2*k;}
    function ls(v){try{c.letterSpacing=v;}catch(e){}}
    c.textAlign='left';c.textBaseline='middle';c.fillStyle='#fff';
    var y=H-H*0.05,f;
    // @naite_library + 아이콘
    f=26*k;c.font='700 '+f+'px '+sans;var ig='@naite_library',iw=f*.9,tw=c.measureText(ig).width,tot=iw+10*k+tw,x0=cx-tot/2,ly=y-f*.7;
    sh();c.globalAlpha=.88;c.strokeStyle='#fff';c.lineWidth=2.4*k;rrect(c,x0+iw*.1,ly-iw*.4,iw*.8,iw*.8,iw*.22);c.stroke();c.beginPath();c.arc(x0+iw/2,ly,iw*.18,0,Math.PI*2);c.stroke();
    c.fillText(ig,x0+iw+10*k,ly);c.globalAlpha=1;
    y=ly-f*.7-16*k;
    // 부제: 꿀색 점 + 한달5권 스터디 · 10월 N일째
    f=26*k;c.font='700 '+f+'px '+sans;ls((f*.04)+'px');var subT=L.c.replace(/^나이테 /,''),sw=c.measureText(subT).width,dot=8*k,st=dot+10*k+sw,sx=cx-st/2,sy=y-f*.7;
    c.globalAlpha=.92;c.fillStyle='#E3A869';c.beginPath();c.arc(sx+dot/2,sy,dot/2,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.fillText(subT,sx+dot+10*k,sy);c.globalAlpha=1;ls('0px');
    y=sy-f*.7-10*k;
    // 날짜(+시간) 한 줄
    f=36*k;c.font='700 '+f+'px '+serif;c.textAlign='center';var dl=L.b?L.a+' '+L.b:L.a,dy=y-f*.7;c.fillText(dl,cx,dy);
    y=dy-f*.7-22*k;
    // 가는 선
    c.shadowColor='transparent';c.fillStyle='rgba(255,255,255,.55)';c.fillRect(cx-140*k,y-1.5*k,280*k,1.5*k);
    y=y-1.5*k-28*k;
    // 락업: 링 마크 112 + 간격 20 + 나이테 96
    var R=112*k,gap=20*k;f=96*k;c.font='700 '+f+'px '+serif;ls((-f*.01)+'px');var nw=c.measureText('나이테').width,lw=R+gap+nw,lx=cx-lw/2,lcy=y-R/2;
    c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=18*k;c.shadowOffsetY=4*k;
    var s2=R/40,rx=lx+R/2;c.strokeStyle='#fff';c.lineWidth=2.2*s2;
    [[17,1],[11,.72],[5.5,.5]].forEach(function(q){c.globalAlpha=q[1];c.beginPath();c.arc(rx,lcy,q[0]*s2,0,Math.PI*2);c.stroke();});
    c.globalAlpha=1;c.fillStyle='#E3A869';c.beginPath();c.arc(rx,lcy-R/2+3.6*s2,2.6*s2,0,Math.PI*2);c.fill();
    c.fillStyle='#fff';c.textAlign='left';c.fillText('나이테',lx+R+gap,lcy+f*.04);ls('0px');
    c.restore();
  }
  function drawOvl(c,W,H,tpl,day){
    if(tpl==='ribbon'){drawRibbon(c,W,H,day);return;}
    var L=stampLines(day),u=W/352,film=tpl==='film',mono='ui-monospace,"Roboto Mono",monospace',serif='"Gowun Batang",Georgia,serif',sans='"Noto Sans KR",sans-serif';
    c.save();
    var g;
    if(tpl==='ribbon'){g=c.createLinearGradient(0,H,0,0);g.addColorStop(.02,'rgba(14,20,11,.78)');g.addColorStop(.30,'rgba(14,20,11,.28)');g.addColorStop(.56,'rgba(14,20,11,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
    else if(tpl==='frame'){g=c.createLinearGradient(0,H,0,0);g.addColorStop(.01,'rgba(14,20,11,.42)');g.addColorStop(.28,'rgba(14,20,11,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
      c.strokeStyle='rgba(255,248,236,.9)';c.lineWidth=1.6*u;rrect(c,13*u,13*u,W-26*u,H-26*u,9*u);c.stroke();}
    else{g=c.createRadialGradient(W,H,0,W,H,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,.36)');g.addColorStop(.5,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
    var fs=film?17:tpl==='frame'?20:23,big=fs*u,lh=big*1.12,sub=(film?11:12.5)*u,igf=11*u,ring=26*u;
    var bottom=(film?16:tpl==='frame'?26:22)*u,cx=W/2,right=W-16*u,align=film?'right':'center';
    var y=H-bottom; // 아래에서 위로 쌓기
    function shadow(col,b){c.shadowColor=col;c.shadowBlur=b*u;c.shadowOffsetY=0;}
    function text(t,font,col,yy,ls){c.font=font;c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.fillText(t,film?right:cx,yy);}
    // @handle + 아이콘
    c.font='700 '+igf+'px '+(film?mono:sans);var igw=c.measureText(L.ig).width,iw=12*u,tot=iw+5*u+igw,ix=film?right-tot:cx-tot/2,iy=y-igf*.75;
    shadow(film?'rgba(0,0,0,0)':'rgba(0,0,0,.5)',6);c.globalAlpha=film?.92:.85;
    var igc=film?'#FFD6A8':'#fff';c.strokeStyle=igc;c.lineWidth=2.1*u*.5;rrect(c,ix+iw*.125,iy-iw*.375,iw*.75,iw*.75,iw*.21);c.stroke();c.beginPath();c.arc(ix+iw/2,iy,iw/6,0,Math.PI*2);c.stroke();
    c.fillStyle=igc;c.textAlign='left';c.textBaseline='middle';c.fillText(L.ig,ix+iw+5*u,iy);c.globalAlpha=1;
    y=iy-igf*.75-6*u;
    // 스터디 줄(점 + 글)
    c.font='700 '+sub+'px '+(film?mono:sans);var sw=c.measureText(L.c).width,dot=5*u,stot=dot+8*u+sw,sx=film?right-stot:cx-stot/2,sy=y-sub*.75;
    shadow(film?'rgba(255,150,60,.4)':'rgba(0,0,0,.5)',8);
    c.fillStyle=film?'#FFBE7A':'#B87343';c.beginPath();c.arc(sx+dot/2,sy,dot/2,0,Math.PI*2);c.fill();
    c.fillStyle=film?'#FFD6A8':'#fff';c.textAlign='left';c.fillText(L.c,sx+dot+8*u,sy);
    y=sy-sub*.75-7*u;
    // 시간, 날짜
    var bf=film?'700 '+big+'px '+mono:'700 '+big+'px '+serif,bc=film?'#FFBE7A':'#fff';
    shadow(film?'rgba(255,150,60,.5)':'rgba(0,0,0,.5)',film?12:14);
    if(L.b){text(L.b,bf,bc,y-lh/2);y-=lh;}text(L.a,bf,bc,y-lh/2);y-=lh;
    // 링 마크(리본·프레임)
    if(!film){c.shadowBlur=0;var rr=ring/2,rx=cx,ry=y-(tpl==='frame'?7:9)*u-rr;c.strokeStyle='#fff';c.lineWidth=2*u*26/40;
      [[17,1],[11,.72],[5.5,.5]].forEach(function(k){c.globalAlpha=k[1];c.beginPath();c.arc(rx,ry,rr*k[0]/20,0,Math.PI*2);c.stroke();});
      c.globalAlpha=1;c.fillStyle='#E3A869';c.beginPath();c.arc(rx,ry-rr*15.5/20,rr*2.4/20,0,Math.PI*2);c.fill();}
    c.restore();
  }
  function openCamera(opt){
    opt=opt||{};var facing='environment',tpl=getTpl();
    function getStream(){return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1440}},audio:false});}
    return getStream().then(function(stream){
      return new Promise(function(res){
        var ov=document.createElement('div');ov.className='rl-cam';
        ov.innerHTML='<div class="rl-cam-top"><button type="button" class="cam-x" data-camx aria-label="닫기">'+svg(16,IC.x,2.4)+'</button><span class="lbl">'+(opt.stamp?'인증샷 찍기':'사진 찍기')+'</span><span style="width:34px"></span></div>'+
          '<div class="rl-cam-stage"><div class="rl-frame"><video playsinline autoplay muted></video>'+(opt.stamp?ovlHtml(tpl):'')+'</div></div>'+
          '<div class="rl-cam-bottom">'+(opt.stamp?'<div class="rl-styles" role="group" aria-label="글씨 디자인">'+TPLS.map(function(t){return '<button type="button" class="schip" data-tpl="'+t[0]+'" aria-pressed="'+(t[0]===tpl)+'">'+t[1]+'</button>';}).join('')+'</div>':'')+
          '<div class="cam-row"><button type="button" class="cam-cancel" data-camx>취소</button><button type="button" class="shot" data-camshot aria-label="사진 찍기"></button>'+
          '<button type="button" class="flip" data-camflip aria-label="앞뒤 카메라 바꾸기">'+svg(22,IC.flip,2)+'</button></div></div>';
        document.body.appendChild(ov);
        var v=ov.querySelector('video'),frame=ov.querySelector('.rl-frame'),tick=null;
        function attach(st){stream=st;v.srcObject=st;try{v.play();}catch(e){}v.classList.toggle('mirror',facing==='user');}
        function fit(){if(!v.videoWidth)return;var ar=v.videoWidth/v.videoHeight;frame.style.aspectRatio=v.videoWidth+' / '+v.videoHeight;frame.style.width='min(100cqw, calc(100cqh * '+ar.toFixed(4)+'))';}
        v.addEventListener('loadedmetadata',fit);v.addEventListener('resize',fit);
        function paintStamp(){if(!opt.stamp)return;var L=stampLines(opt.day),rb=tpl==='ribbon';ov.querySelector('[data-s1]').textContent=rb&&L.b?L.a+' '+L.b:L.a;ov.querySelector('[data-s2]').textContent=rb?'':L.b;ov.querySelector('[data-s3]').textContent=rb?L.c.replace(/^나이테 /,''):L.c;}
        paintStamp();if(opt.stamp)tick=setInterval(paintStamp,10000);
        ov.querySelectorAll('[data-tpl]').forEach(function(b){b.onclick=function(){tpl=b.getAttribute('data-tpl');setTpl(tpl);
          ov.querySelectorAll('[data-tpl]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});
          var o=ov.querySelector('.ovl');o.className='ovl t-'+tpl;paintStamp();};});
        attach(stream);
        function stop(){stream.getTracks().forEach(function(t){t.stop();});}
        function end(r){clearInterval(tick);stop();ov.remove();res(r);}
        ov.querySelectorAll('[data-camx]').forEach(function(b){b.onclick=function(){end(null);};});
        ov.querySelector('[data-camflip]').onclick=function(){facing=facing==='user'?'environment':'user';stop();getStream().then(attach,function(){toast('카메라를 바꾸지 못했어요.');});};
        ov.querySelector('[data-camshot]').onclick=function(){
          if(!v.videoWidth)return;
          var c=document.createElement('canvas'),W=c.width=v.videoWidth,H=c.height=v.videoHeight,x=c.getContext('2d');
          if(facing==='user'){x.save();x.translate(W,0);x.scale(-1,1);x.drawImage(v,0,0);x.restore();}else x.drawImage(v,0,0);
          if(!opt.stamp){end(c);return;}
          var t0=tpl;stampFonts().then(function(){drawOvl(x,W,H,t0,opt.day);c.tpl=t0;end(c);});};
      });
    });
  }
  // 날짜 스탬프 사진: 바로 카메라 → 찍은 사진(오버레이 포함)이 곧 인증 사진, 달력에도 저장
  function openStampCamera(day){
    day=day||logicalToday();
    if(!canCamera()){toast('이 폰에서는 앱 안 카메라를 열 수 없어요. 앨범 사진으로 넣어 주세요.');openStampAlbum(day);return;}
    if(S.onEvent)S.onEvent('stamp_camera_open',{day:day});
    openCamera({stamp:true,day:day}).then(function(c){if(c)showStampResult(day,c);},
      function(e){toast('카메라를 열지 못했어요. 카메라 권한을 허용해 주세요.');if(S.onEvent)S.onEvent('camera_fail',{err:(e&&e.name)||'',from:'stamp'});});
  }
  // 앨범 사진에 그날 날짜 스탬프를 넣기(지난 날 기록용)
  function openStampAlbum(day){
    var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
    inp.onchange=function(){clearPick();var f=inp.files&&inp.files[0];if(!f)return;
      loadPhoto(f).then(function(im){
        var c=document.createElement('canvas'),W=c.width=im.width||im.naturalWidth,H=c.height=im.height||im.naturalHeight,x=c.getContext('2d'),tpl=getTpl();
        x.drawImage(im,0,0,W,H);stampFonts().then(function(){drawOvl(x,W,H,tpl,day);c.tpl=tpl;showStampResult(day,c);});if(S.onEvent)S.onEvent('stamp_album',{day:day});
      },function(){toast('사진을 열지 못했어요. 다른 사진으로 해 주세요.');});};
    markPick();inp.click();
  }
  function showStampResult(day,c){
    var savedK=null;
    savePhoto(day,c,function(k,dropped){savedK=k;if(dropped)toast('하루 사진은 '+PMAX+'장까지예요. 가장 먼저 찍은 사진을 지웠어요.');});
    var meta={day:day,tpl:c.tpl||''},ov=document.createElement('div'),noRec=!S.rows.some(function(r){return r.d===day;});ov.className='rl-cam rl-after';
    ov.innerHTML='<div class="rl-cam-top"><button type="button" class="cam-x" data-ax aria-label="닫기">'+svg(16,IC.x,2.4)+'</button><span class="at">'+esc(dayWord(day))+' 인증샷</span><span style="width:34px"></span></div>'+
      '<div class="rl-photo"><p class="rv-empty">이미지를 만드는 중…</p></div>'+
      '<div class="rl-saved">'+svg(17,IC.check,2.6)+'달력에 저장했어요<button type="button" data-agocal>달력에서 보기</button></div>'+
      (noRec?'<div class="rl-ask"><span>이날 읽은 책도 기록할까요?</span><button type="button" data-arec>책 기록하기</button></div>':'')+
      '<div class="rl-after-actions"><div class="row"></div><p class="rl-note" hidden></p><button type="button" class="retake" data-aretake>다시 찍기</button></div>';
    document.body.appendChild(ov);document.documentElement.classList.add('rl-lock');
    function close(){ov.remove();document.documentElement.classList.remove('rl-lock');}
    ov.querySelector('[data-ax]').onclick=close;
    ov.querySelector('[data-agocal]').onclick=function(){close();goCal(day);};
    var ar=ov.querySelector('[data-arec]');if(ar)ar.onclick=function(){close();openRecordSheet(day);};
    ov.querySelector('[data-aretake]').onclick=function(){if(savedK)delPhoto(day,savedK);close();openStampCamera(day);};
    if(S.onEvent)S.onEvent('stamp_photo_open',meta);
    c.toBlob(function(blob){
      if(!blob){ov.querySelector('.rl-photo').innerHTML='<p class="rv-empty">이미지를 만들지 못했어요.</p>';return;}
      var url=URL.createObjectURL(blob),name='naite-'+day+'.jpg',file=null;
      try{file=new File([blob],name,{type:'image/jpeg'});}catch(e){}
      var canShare=!!(file&&navigator.canShare&&navigator.canShare({files:[file]}));
      ov.querySelector('.rl-photo').innerHTML='<img src="'+url+'" alt="'+esc(dayWord(day))+' 인증 사진">';
      var row=ov.querySelector('.rl-after-actions .row'),note=ov.querySelector('.rl-note');
      row.innerHTML='<button type="button" class="rk-btn fill" data-ashare>'+svg(17,IC.share)+'인스타·카톡 공유</button>'+
        '<a class="rk-btn out" href="'+url+'" download="'+name+'" data-asave>'+svg(17,IC.save)+'이미지 저장</a>';
      row.querySelector('[data-asave]').addEventListener('click',function(){if(S.onEvent)S.onEvent('stamp_photo_save',meta);});
      row.querySelector('[data-ashare]').onclick=function(){
        if(!canShare){note.hidden=false;note.textContent='이 브라우저에서는 바로 공유가 안 돼요. 이미지 저장 후 인스타·카카오톡에서 올려 주세요.';return;}
        navigator.share({files:[file],title:'나이테 한달5권 스터디'}).then(function(){if(S.onEvent)S.onEvent('stamp_photo_share',meta);},function(){});};
    },'image/jpeg',.9);
  }
  // 사진 고르러 나간 사이 앱이 다시 시작됐는지 알아보기 위한 표시
  function markPick(){try{localStorage.setItem('naite_pick',String(Date.now()));}catch(e){}}
  function clearPick(){try{localStorage.removeItem('naite_pick');}catch(e){}}
  function openShareCard(day){
    shareSheet(dayWord(day)+' 읽은 책 카드','오픈채팅에 올리면 미션 \'매일 읽어주고 인증하기\' 완료!',drawCard(day,null),'naite-'+day+'.png','share_card',{day:day});
  }

  /* ── 이번 달 읽기 달력: 날짜 칸마다 그날 읽은 표지(같은 책은 한 번, ×횟수) ── */
  // 하루 기록 → 책별로 묶기(스터디 책은 표지, 다른 책은 📚 칸)
  function dayItems(day){
    var list=[],at={};
    S.rows.filter(function(r){return r.d===day;}).sort(function(a,b){return a.t-b.t;}).forEach(function(r){
      var id=r.k==='_other'?'o:'+(r.o||''):'b:'+r.b;
      if(!(id in at)){var b=r.k==='_other'?null:S.byId[r.b];at[id]=list.length;list.push({id:id,n:0,other:r.k==='_other',title:r.k==='_other'?(r.o||'다른 책'):((b&&b.title)||''),cover:b&&b.cover});}
      list[at[id]].n++;
    });
    return list;
  }
  function monthGrid(mi){ // [[null|'yyyy-mm-dd' x7] x 주]
    var first=new Date(mi.year,mi.month-1,1).getDay(),cells=[],w=[];
    for(var i=0;i<first;i++)w.push(null);
    for(var d=1;d<=mi.days;d++){w.push(mi.year+'-'+pad(mi.month)+'-'+pad(d));if(w.length===7){cells.push(w);w=[];}}
    if(w.length){while(w.length<7)w.push(null);cells.push(w);}
    return cells;
  }
  function dayInfo(ds){var it=dayItems(ds);return {it:it,sum:it.reduce(function(a,x){return a+x.n;},0),ph:S.photoUrls[ds],pl:S.photoList[ds]||[]};}
  function calendarHtml(mi,hint){
    var today=logicalToday();
    return '<div class="ncal"><div class="ncal-wd">'+['일','월','화','수','목','금','토'].map(function(x,i){return '<span'+(i===0?' class="sun"':'')+'>'+x+'</span>';}).join('')+'</div><div class="ncal-grid">'+
      monthGrid(mi).map(function(w){return w.map(function(ds,i){
        if(!ds)return '<div class="nc empty"></div>';
        // 그날 사진(최근 것 먼저) + 읽은 책 표지를 한 칸에 섞어서. 장수에 따라 1·2·3·4열로 줄어듦(최대 16칸)
        var D=dayInfo(ds),it=D.it,th='',tl=[];
        D.pl.slice().reverse().forEach(function(x){tl.push('<span class="mc ph"><img src="'+x.u+'" alt=""><i>'+svg(8,IC.cam,2.6)+'</i></span>');});
        it.forEach(function(x){tl.push('<span class="mc'+(x.other?' o':'')+'">'+(x.cover?'<img src="'+esc(x.cover)+'" alt="'+esc(x.title)+'" loading="lazy">':'<i>📚</i>')+(x.n>1?'<b class="rn">'+x.n+'</b>':'')+'</span>');});
        if(tl.length>16){var more=tl.length-15;tl=tl.slice(0,15);tl.push('<span class="mc more">+'+more+'</span>');}
        var cols=tl.length<=1?1:tl.length<=4?2:tl.length<=9?3:4;
        if(tl.length)th='<span class="mg c'+cols+(tl.length===1&&D.pl.length?' p1':'')+'">'+tl.join('')+'</span>';
        var badge='';
        var cls='nc'+(ds===today?' today':'')+(ds>today?' future':'')+(D.ph?' has-p':'')+(it.length||D.ph?' has':'');
        return '<div class="'+cls+'"'+(ds<=today?' data-rcal="'+ds+'" role="button" tabindex="0" aria-label="'+(+ds.slice(5,7))+'월 '+(+ds.slice(8))+'일 '+(it.length||D.ph?'기록 보기':'기록하기')+'"':'')+'>'+
          '<span class="dn'+(i===0?' sun':'')+'">'+(+ds.slice(8))+'</span>'+badge+(th?'<span class="th">'+th+'</span>':'')+
          (hint&&ds===today?'<span class="cal-finger" aria-hidden="true">👆</span>':'')+'</div>';
      }).join('');}).join('')+'</div></div>';
  }
  function goCal(day){
    showTab('shelf');
    setTimeout(function(){var c=document.querySelector('[data-rcal="'+day+'"]');if(!c)return;
      try{c.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){c.scrollIntoView();}
      c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');},80);
    if(S.onEvent)S.onEvent('cal_from_card',{day:day});
  }
  // 기록된 날짜: 그날 읽은 책·사진 보기. 기록도 사진도 없으면 바로 기록창
  // 하루 모아 공유 이미지(4:5): 날짜 + 인증 사진(찍은 순서) + 읽은 책 표지. 칸에 맞춰 잘라서 깔끔하게
  function drawDayCard(day){
    var pl=S.photoList[day]||[],it=dayItems(day),dd=dateOf(day);
    var W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;var c=cv.getContext('2d');
    var serif='"Gowun Batang",Georgia,serif',sans='"Noto Sans KR",sans-serif',title=(dd.getMonth()+1)+'월 '+dd.getDate()+'일 ('+WD[dd.getDay()]+')';
    return Promise.all([document.fonts&&document.fonts.load?Promise.all([document.fonts.load('700 76px "Gowun Batang"',title+' '+stampLines(day).c),document.fonts.load('800 30px "Noto Sans KR"','@naite_library ×0123456789')]).catch(function(){}):null]
      .concat(pl.map(function(x){return loadImg(x.u);})).concat(it.map(function(x){return loadImg(x.cover);}))).then(function(res){
      var photos=res.slice(1,1+pl.length),books=it.map(function(x,i){return {im:res[1+pl.length+i],n:x.n,other:x.other};});
      function tile(im,x,y,w,h,r,other){c.save();c.shadowColor='rgba(0,0,0,.25)';c.shadowBlur=14;c.shadowOffsetY=5;rrect(c,x,y,w,h,r);c.fillStyle=other?'#F3E7DA':'#EBEDE3';c.fill();c.restore();
        c.save();rrect(c,x,y,w,h,r);c.clip();
        if(im){var k=Math.max(w/im.width,h/im.height);c.drawImage(im,x+(w-im.width*k)/2,y+(h-im.height*k)/2,im.width*k,im.height*k);}
        else{c.font=Math.round(w*.4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('📚',x+w/2,y+h/2);c.textAlign='left';c.textBaseline='alphabetic';}
        c.restore();}
      function badge(n,x,y){var t='×'+n;c.font='800 26px '+sans;var w=c.measureText(t).width+22;rrect(c,x-w+8,y-10,w,38,19);c.fillStyle='#B87343';c.fill();c.fillStyle='#fff';c.textAlign='center';c.fillText(t,x-w/2+8,y+18);c.textAlign='left';}
      var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#F4F3EC');g.addColorStop(1,'#E8E7DC');c.fillStyle=g;c.fillRect(0,0,W,H);
      c.save();c.strokeStyle='rgba(36,86,72,.2)';c.lineWidth=1.6;
      for(var k=1;k<=8;k++){var R=19*k;c.beginPath();for(var t=0;t<=64;t++){var a=t/64*Math.PI*2,q=R*(1+.09*Math.sin(3*a+k*.7)+.05*Math.sin(5*a+k*1.3));var px=1010+q*Math.cos(a)*1.12,py=96+q*Math.sin(a);t?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();}
      c.restore();
      var mx=90,my=92;c.lineWidth=3.4;c.strokeStyle='#245648';
      [[28,1],[19,.75],[10,.5]].forEach(function(q){c.globalAlpha=q[1];c.beginPath();c.arc(mx,my,q[0],0,Math.PI*2);c.stroke();});c.globalAlpha=1;
      c.fillStyle='#B87343';c.beginPath();c.arc(mx,my-27,4,0,Math.PI*2);c.fill();
      c.fillStyle='#245648';c.font='700 34px '+serif;c.textBaseline='middle';c.fillText('나이테',136,my+2);c.textBaseline='alphabetic';
      c.fillStyle='#23291F';c.font='700 76px '+serif;c.fillText(title,58,222);
      c.fillStyle='#545C4B';c.font='700 36px '+serif;c.fillText(stampLines(day).c,60,280); // '나이테 한달5권 스터디 · 11월 N일째' (인증 사진 스탬프와 같은 계산)
      var top=330,bot=1235,L=58,cw=W-116,n=photos.length,m=books.length;
      var coverH=n&&m?(m>5?190:250):0,gap=28,pBot=bot-(coverH?coverH+gap:0),ph=pBot-top;
      if(n===1){var w=Math.min(cw,ph*.75),h=w/.75;if(h>ph){h=ph;w=h*.75;}tile(photos[0],L+(cw-w)/2,top+(ph-h)/2,w,h,22);}
      else if(n===2){var w2=(cw-20)/2,h2=Math.min(ph,w2/.75);photos.forEach(function(im,i){tile(im,L+i*(w2+20),top+(ph-h2)/2,w2,h2,20);});}
      else if(n>=3){var w3=(cw-20*(n-1))/n,h3=Math.min(ph,w3/.75);photos.forEach(function(im,i){tile(im,L+i*(w3+20),top+(ph-h3)/2,w3,h3,18);});}
      if(m&&!n){ // 표지만: 큰 격자
        var cols=m<=2?m:m<=4?2:m<=9?3:4,rows=Math.ceil(m/cols),gg=30,rowH=bot-top,bh=(rowH-gg*(rows-1))/rows,bw=Math.min(bh*.75,(cw-gg*(cols-1))/cols);bh=bw/.75;
        var x0=L+(cw-(cols*bw+(cols-1)*gg))/2,y0=top+(rowH-(rows*bh+(rows-1)*gg))/2;
        books.forEach(function(b,i){var x=x0+(i%cols)*(bw+gg),y=y0+Math.floor(i/cols)*(bh+gg);tile(b.im,x,y,bw,bh,12,b.other);if(b.n>1)badge(b.n,x+bw,y);});
      }else if(m){ // 사진 아래 표지 한 줄
        var cy=pBot+gap,bh4=coverH,bw4=bh4*.75,g4=m>1?Math.min(24,(cw-m*bw4)/(m-1)):0;
        if(m*bw4+(m-1)*g4>cw){g4=16;bw4=(cw-(m-1)*g4)/m;bh4=bw4/.75;}
        var x4=L+(cw-(m*bw4+(m-1)*g4))/2;
        books.forEach(function(b,i){var x=x4+i*(bw4+g4),y=cy+(coverH-bh4);tile(b.im,x,y,bw4,bh4,10,b.other);if(b.n>1)badge(b.n,x+bw4,y);});
      }
      c.font='700 34px '+sans;var hs='@naite_library',hw=c.measureText(hs).width,ix=(W-(hw+50))/2,iy=1290;
      c.strokeStyle='#245648';c.lineWidth=3;rrect(c,ix,iy-17,34,34,9);c.stroke();c.beginPath();c.arc(ix+17,iy,8,0,Math.PI*2);c.stroke();c.fillStyle='#245648';c.beginPath();c.arc(ix+26.5,iy-8.5,2.2,0,Math.PI*2);c.fill();
      c.textBaseline='middle';c.fillText(hs,ix+50,iy+1);
      return new Promise(function(r2){try{cv.toBlob(function(bl){r2(bl);},'image/jpeg',.9);}catch(e){r2(null);}});
    });
  }
  function openDay(day){
    var it=dayItems(day),pl=(S.photoList[day]||[]).slice(),ph=pl.length?pl[pl.length-1].u:null,sel=pl.length-1;
    if(!it.length&&!ph){openRecordSheet(day);return;}
    var sum=it.reduce(function(a,x){return a+x.n;},0),collage=!(pl.length===1&&!it.length),card=null;
    // 한 화면에 다 들어오게: 작은 갤러리 + 공유·저장·기록하기 + 글자 링크. 인증 사진 찍기는 '기록하기'(표지 누르기 + 날짜 스탬프 사진) 안에
    var sh=openSheet('<div class="cd-day"><div class="cd-head"><h3>'+esc(dayFull(day))+'</h3><span class="sub">'+(sum?'영어책 '+sum+'권':'사진만 있어요')+'</span></div>'+
      // 사진(최근 것 먼저) + 읽은 책 표지를 옆으로 넘겨 보기
      '<div class="cd-gal'+(pl.length+it.length===1?' solo':'')+'">'+
        pl.map(function(x,pi){return {x:x,pi:pi};}).reverse().map(function(o){return '<figure class="gi ph" data-gpi="'+o.pi+'"><img src="'+o.x.u+'" alt="이날 인증 사진"><figcaption>'+svg(11,IC.cam,2.4)+'인증샷</figcaption></figure>';}).join('')+
        it.map(function(x){return '<figure class="gi bk'+(x.other?' o':'')+'"><span class="cv">'+(x.cover?'<img src="'+esc(x.cover)+'" alt="">':'<i>📚</i>')+'</span><figcaption><b>'+esc(x.title)+'</b>'+(x.n>1?' <em>×'+x.n+'</em>':'')+'</figcaption></figure>';}).join('')+
      '</div>'+
      '<div class="cd-acts">'+
        '<button type="button" data-dshare>'+svg(18,IC.share)+'<span>공유</span></button>'+
        '<a class="'+(collage?'wait':'')+'" href="'+(collage?'#':ph)+'" download="naite-'+day+'.jpg" data-dsave>'+svg(18,IC.save)+'<span>저장</span></a>'+
        '<button type="button" class="fill" data-dadd>'+svg(18,IC.plus,2.4)+'<span>기록하기</span></button>'+
      '</div>'+
      '<p class="rl-note cd-note" hidden></p>'+
      '<div class="cd-links">'+
        (ph?'<button type="button" data-cddel>'+(pl.length>1?'고른 사진 지우기':'사진 지우기')+'</button>':'')+
        '<button type="button" data-sclose>닫기</button></div></div>');
    sh.querySelector('[data-sclose]').onclick=closeSheet;
    sh.querySelector('[data-dadd]').onclick=function(){openRecordSheet(day);};
    var gal=sh.querySelector('.cd-gal'),ds=sh.querySelector('[data-dsave]'),dsh=sh.querySelector('[data-dshare]'),db=sh.querySelector('[data-cddel]');
    // 고른 사진(테두리) = '고른 사진 지우기' 대상. 처음엔 마지막에 찍은 사진
    function pick(pi){sel=pi;
      [].forEach.call(sh.querySelectorAll('[data-gpi]'),function(f){f.classList.toggle('on',pl.length>1&&+f.dataset.gpi===pi);});
      if(db){delete db.dataset.sure;db.textContent=pl.length>1?'고른 사진 지우기':'사진 지우기';}}
    if(pl.length){pick(sel);[].forEach.call(gal.querySelectorAll('[data-gpi]'),function(f){f.onclick=function(){pick(+f.dataset.gpi);};});}
    // 공유·저장: 사진 1장뿐인 날은 그 사진, 아니면 사진+표지를 모은 한 장
    if(collage)drawDayCard(day).then(function(bl){if(!bl||!document.body.contains(sh))return;card=bl;ds.href=URL.createObjectURL(bl);ds.classList.remove('wait');},function(){});
    ds.addEventListener('click',function(e){if(collage&&!card){e.preventDefault();toast('이미지를 만드는 중이에요. 잠깐만요.');return;}if(S.onEvent)S.onEvent(collage?'day_card_save':'day_photo_save',{day:day});});
    dsh.onclick=function(){
      var bl=collage?card:pl[0].b,file=null,nt=sh.querySelector('.cd-note');
      if(!bl){toast('이미지를 만드는 중이에요. 잠깐만요.');return;}
      try{file=new File([bl],'naite-'+day+'.jpg',{type:bl.type||'image/jpeg'});}catch(e){}
      if(!(file&&navigator.canShare&&navigator.canShare({files:[file]}))){nt.hidden=false;nt.textContent='이 브라우저에서는 바로 공유가 안 돼요. 이미지 저장 후 인스타·카카오톡에서 올려 주세요.';return;}
      navigator.share({files:[file],title:'나이테 한달5권 스터디'}).then(function(){if(S.onEvent)S.onEvent(collage?'day_card_share':'day_photo_share',{day:day});},function(){});};
    if(db)db.onclick=function(){if(!db.dataset.sure){db.dataset.sure='1';db.textContent='한 번 더 누르면 사진이 지워져요';return;}
      var k=pl[sel].k,left=pl.length-1;delPhoto(day,k);
      if(left>0){openDay(day);toast('사진을 지웠어요.');}else{closeSheet();toast('사진을 지웠어요. 읽기 기록은 그대로예요.');}};
    if(S.onEvent)S.onEvent('cal_day_open',{day:day,photo:!!ph,photos:pl.length});
  }
  // 날짜 기록창: 그 날짜를 고른 뒤 읽은 책을 표지로 누르기 + 다른 책 + 날짜 스탬프 사진
  function openRecordSheet(day){
    var key=S.home.key,last=null,showOther=false;
    var sh=openSheet('<div class="rk-rs"><h3>'+esc(dayWord(day))+(dayWord(day)===dayFull(day)?'':' <small>'+esc(dayFull(day))+'</small>')+' 기록</h3>'+
      '<p class="sub">읽은 책 표지를 누르면 기록돼요. 여러 번 읽었으면 여러 번 눌러요.</p><div data-rsbody></div></div>');
    var box=sh.querySelector('[data-rsbody]');
    S.recSheet={day:day,render:render};
    function n(bid){var k=0;S.rows.forEach(function(r){if(r.b===bid&&r.d===day&&r.k!=='_other')k++;});return k;}
    function render(stampBid){
      if(!document.body.contains(box)){S.recSheet=null;return;}
      var themes=shelfThemes(),books=shelfBooks(key),od=0,sum=0;
      S.rows.forEach(function(r){if(r.d===day){sum++;if(r.k==='_other')od++;}});
      var keepTitle=(box.querySelector('#rsTitle')||{}).value||'';
      box.innerHTML=(themes.length>1?'<div class="rs-months rk-months" role="group" aria-label="어느 달 책">'+themes.map(function(t){
          return '<button type="button" class="rk-mpill" data-rsk="'+esc(t.key)+'" aria-pressed="'+(t.key===key)+'"><span class="mi"></span>'+esc(themeName(t).replace(' ',' · '))+'</button>';}).join('')+'</div>':'')+
        (books?'<div class="rk-grid3">'+books.map(function(b){var k=n(b.id);
          return '<button type="button" class="rk-book'+(k?' read':' unread')+'" data-sb="'+b.id+'" aria-label="'+esc(b.title)+' 읽음 기록, 이날 '+k+'번">'+
            '<span class="rk-cover">'+(b.cover?'<img src="'+esc(b.cover)+'" alt="">':'<span class="ttl">'+esc(shortTitle(b.title))+'</span>')+(k?'<span class="rk-chip">'+k+'번</span>':'')+'<span class="rk-tap">+1</span></span>'+
            '<span class="rk-meta"><span class="bt">'+esc(shortTitle(b.title.split(',')[0]))+'</span></span></button>';}).join('')+
          '<button type="button" class="rk-book rk-other'+(od?' read':'')+'" data-so aria-label="다른 책 읽음 기록, 이날 '+od+'번">'+
            '<span class="rk-cover">'+svg(26,IC.map,1.9)+'<span class="ot">다른 책</span>'+(od?'<span class="rk-chip">'+od+'번</span>':'')+'</span>'+
            '<span class="rk-meta"><span class="bt">스터디 외 책</span></span></button></div>'
          :'<p class="rv-empty">책을 불러오는 중…</p>')+
        '<div class="rk-oform"'+(showOther?'':' hidden')+'><div class="row"><input id="rsTitle" maxlength="80" placeholder="책 제목(안 적어도 돼요)" value="'+esc(keepTitle)+'"><button type="button" data-sotitle>기록</button></div>'+
          (otherTitles().length?'<div class="rs-otitles"><span>최근 읽은 다른 책</span>'+otherTitles().map(function(t){return '<button type="button" data-sot="'+esc(t)+'">'+esc(shortTitle(t))+'</button>';}).join('')+'</div>':'')+'</div>'+
        '<p class="rk-status" aria-live="polite">'+(last?'<b>'+esc(last.t)+'</b> 기록했어요 · '+dayWord(day)+' 모두 '+sum+'권 <button type="button" data-sundo>취소</button>':(sum?dayWord(day)+' 모두 <b>'+sum+'권</b> 기록했어요':'&nbsp;'))+'</p>'+
        '<div class="rk-dayacts"><button type="button" class="rk-btn out" data-sstamp>'+svg(17,IC.cam)+'인증샷 찍기'+'</button>'+
          '<button type="button" class="rk-btn fill" data-sdone>완료</button></div>'+
        '<button type="button" class="subtle" data-salbum>앨범 사진에 날짜 스탬프 넣기</button>'+
        ((S.photoList[day]||[]).length>=PMAX?'<p class="cd-max">사진은 하루 '+PMAX+'장까지예요. 더 찍으면 가장 먼저 찍은 사진이 지워져요.</p>':'');
      if(stampBid!=null)stampOn(box.querySelector(stampBid==='o'?'[data-so]':'[data-sb="'+stampBid+'"]'),day);
    }
    function added(row,label,id){if(!row)return;last={c:row.c,t:label};render(id);try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}}
    box.onclick=function(e){
      var t;
      if((t=e.target.closest('[data-sb]'))){var bid=+t.getAttribute('data-sb');added(addRead(bid,day),shortTitle((S.byId[bid]||{}).title||''),bid);return;}
      if((t=e.target.closest('[data-so]'))){showOther=true;render();var ip=box.querySelector('#rsTitle');try{ip.focus();}catch(x){}return;}
      if((t=e.target.closest('[data-sotitle]'))){var v=String(box.querySelector('#rsTitle').value||'').trim().slice(0,80);box.querySelector('#rsTitle').value='';added(addOtherRead(v,day),'📚 '+(v?shortTitle(v):'다른 책'),'o');return;}
      if((t=e.target.closest('[data-sot]'))){var o=t.getAttribute('data-sot');added(addOtherRead(o,day),'📚 '+shortTitle(o),'o');return;}
      if((t=e.target.closest('[data-rsk]'))){key=t.getAttribute('data-rsk');render();return;}
      if((t=e.target.closest('[data-sundo]'))){if(last){dropRow(last.c);save();paint();flush();last=null;render();}return;}
      if((t=e.target.closest('[data-sstamp]'))){closeSheet();openStampCamera(day);return;}
      if((t=e.target.closest('[data-salbum]'))){closeSheet();openStampAlbum(day);return;}
      if((t=e.target.closest('[data-sdone]'))){closeSheet();return;}
    };
    render();
    if(S.onEvent)S.onEvent('record_sheet_open',{day:day,past:day!==logicalToday()});
  }
  // 기록창에서 쓰는 조용한 기록(토스트 없이). 같은 책 1.5초 안 연타는 1회
  function addRead(bid,day){
    if(!S.member)return null;
    var now=Date.now(),k='s'+bid+day;if(S.lastTap[k]&&now-S.lastTap[k]<DOUBLE_TAP_MS)return null;S.lastTap[k]=now;
    var row=addRow(bid,day);save();paint();flush();offerBarOnce();return row;
  }
  function addOtherRead(title,day){
    if(!S.member)return null;
    var now=Date.now(),k='so'+title+day;if(S.lastTap[k]&&now-S.lastTap[k]<DOUBLE_TAP_MS)return null;S.lastTap[k]=now;
    var row=addOther(title,day);save();paint();flush();offerBarOnce();if(S.onEvent)S.onEvent('other_read',{titled:!!title});return row;
  }
  function drawMonthCard(mi){
    var W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;var c=cv.getContext('2d');
    var grid=monthGrid(mi),rows=monthRows(mi),days={},info={},srcs={},today=logicalToday();
    rows.forEach(function(r){days[r.d]=1;});
    grid.forEach(function(w){w.forEach(function(ds){if(!ds)return;var D=dayInfo(ds);info[ds]=D;
      D.tiles=D.pl.slice().reverse().map(function(x){return {src:x.u,ph:1};}).concat(D.it.map(function(x){return {src:x.cover,other:x.other,n:x.n};}));
      if(D.tiles.length>16){D.more=D.tiles.length-15;D.tiles=D.tiles.slice(0,15);}
      D.tiles.forEach(function(t){if(t.src)srcs[t.src]=1;});});});
    var list=Object.keys(srcs),serif='"Gowun Batang",Georgia,serif',sans='"Noto Sans KR",sans-serif';
    return Promise.all([document.fonts&&document.fonts.load?Promise.all([document.fonts.load('700 76px "Gowun Batang"','10월 읽기 나이테 한 달 동안 권 일을 함께 읽었어요'),document.fonts.load('700 30px "Noto Sans KR"','일월화수목금토@naite_library 0123456789')]).catch(function(){}):null]
      .concat(list.map(loadImg))).then(function(res){
      var img={};list.forEach(function(k,i){img[k]=res[i+1];});
      var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#F4F3EC');g.addColorStop(1,'#E8E7DC');c.fillStyle=g;c.fillRect(0,0,W,H);
      // 오른쪽 위 나이테 결 장식
      c.save();c.strokeStyle='rgba(36,86,72,.22)';c.lineWidth=1.6;
      for(var k=1;k<=8;k++){var R=19*k;c.beginPath();for(var t=0;t<=64;t++){var a=t/64*Math.PI*2,rr=R*(1+.09*Math.sin(3*a+k*.7)+.05*Math.sin(5*a+k*1.3));var x=1010+rr*Math.cos(a)*1.12,y=96+rr*Math.sin(a);t?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();}
      c.restore();
      // 링 마크 + 나이테
      var mx=90,my=92;c.lineWidth=3.4;c.strokeStyle='#245648';
      [[28,1],[19,.75],[10,.5]].forEach(function(q){c.globalAlpha=q[1];c.beginPath();c.arc(mx,my,q[0],0,Math.PI*2);c.stroke();});c.globalAlpha=1;
      c.fillStyle='#B87343';c.beginPath();c.arc(mx,my-27,4,0,Math.PI*2);c.fill();
      c.fillStyle='#245648';c.font='700 34px '+serif;c.textBaseline='middle';try{c.letterSpacing='-0.34px';}catch(e){}c.fillText('나이테',136,my+2);try{c.letterSpacing='0px';}catch(e){}
      // 제목·요약
      c.textBaseline='alphabetic';c.fillStyle='#23291F';c.font='700 76px '+serif;c.fillText(mi.month+'월 읽기 나이테',58,212);
      var parts=[['한 달 동안 ','#545C4B'],[rows.length+'권','#B87343'],[', ','#545C4B'],[cntKeys(days)+'일','#B87343'],['을 함께 읽었어요','#545C4B']],x0=60;
      c.font='700 42px '+serif;parts.forEach(function(q){c.fillStyle=q[1];c.fillText(q[0],x0,276);x0+=c.measureText(q[0]).width;});
      // 요일
      var GX=59,GW=962,gap=10,cw=(GW-gap*6)/7,top=356,bottom=1228,nr=grid.length,ch=(bottom-top-gap*(nr-1))/nr;
      c.font='700 26px '+sans;c.textAlign='center';
      ['일','월','화','수','목','금','토'].forEach(function(d,i){c.fillStyle=i===0?'#B87343':'#8A917E';c.fillText(d,GX+i*(cw+gap)+cw/2,top-22);});
      grid.forEach(function(w,ri){w.forEach(function(ds,ci){
        var x=GX+ci*(cw+gap),y=top+ri*(ch+gap),D=ds?info[ds]:null,has=D&&D.tiles.length;
        if(has){c.save();c.shadowColor='rgba(35,41,31,.10)';c.shadowBlur=14;c.shadowOffsetY=4;rrect(c,x,y,cw,ch,16);c.fillStyle='#FAF9F4';c.fill();c.restore();}
        else{rrect(c,x,y,cw,ch,16);c.fillStyle='rgba(255,255,255,.18)';c.fill();c.save();c.setLineDash([5,5]);c.strokeStyle='rgba(35,41,31,.10)';c.lineWidth=1.5;c.stroke();c.restore();}
        if(ds&&ds===today){rrect(c,x+1.5,y+1.5,cw-3,ch-3,15);c.strokeStyle='#B87343';c.lineWidth=3.5;c.stroke();}
        if(!ds)return;
        c.textAlign='left';c.font='700 26px '+sans;c.fillStyle=ci===0?(has?'#B87343':'rgba(184,115,67,.6)'):(has?'#3A4034':'#A8AD9E');c.fillText(String(+ds.slice(8)),x+14,y+38);
        if(!has)return;
        var ay=y+52,ah=ch-62;
        function cover(src,bx,by,bw,bh,other){c.save();c.shadowColor='rgba(0,0,0,.22)';c.shadowBlur=6;c.shadowOffsetY=2;rrect(c,bx,by,bw,bh,7);c.fillStyle='#EBEDE3';c.fill();c.restore();
          c.save();rrect(c,bx,by,bw,bh,7);c.clip();var im=src&&img[src];
          if(im){var r=Math.max(bw/im.width,bh/im.height);c.drawImage(im,bx+(bw-im.width*r)/2,by+(bh-im.height*r)/2,im.width*r,im.height*r);}
          else if(other){c.fillStyle='#F3E7DA';c.fillRect(bx,by,bw,bh);c.font=Math.round(bw*.45)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('📚',bx+bw/2,by+bh/2);c.textBaseline='alphabetic';}
          c.restore();}
        // 달력 칸과 같은 규칙: 사진 + 표지를 섞어 1·2·3·4열 격자
        var T=D.tiles,n=T.length+(D.more?1:0),cols=n<=1?1:n<=4?2:n<=9?3:4,rws=Math.ceil(n/cols),g2=cols>2?4:6,pad=cols===1?12:8;
        var p1=n===1&&T[0].ph,tw=(cw-pad*2-g2*(cols-1))/cols,tr=p1?1:4/3,th=tw*tr;
        if(rws*th+(rws-1)*g2>ah){th=(ah-(rws-1)*g2)/rws;tw=th/tr;}
        if(n===1&&!p1){th=Math.min(ah,(cw-40)/.75);tw=th*.75;}
        var gw2=cols*tw+(cols-1)*g2,gx=x+(cw-gw2)/2,gy=ay+Math.max(0,(ah-(rws*th+(rws-1)*g2))/2)*(n>4?0:1);
        T.forEach(function(t,k){var bx=gx+(k%cols)*(tw+g2),by=gy+Math.floor(k/cols)*(th+g2);cover(t.src,bx,by,tw,th,t.other);
          if(t.n>1){var fs=Math.max(12,Math.round(tw*.32));c.font='800 '+fs+'px '+sans;var bw3=c.measureText(String(t.n)).width+fs*.6;
            c.fillStyle='#B87343';rrect(c,bx+tw-bw3,by,bw3,fs*1.25,5);c.fill();c.fillStyle='#fff';c.textAlign='center';c.fillText(String(t.n),bx+tw-bw3/2,by+fs*1.02);c.textAlign='left';}});
        if(D.more){var mk=T.length,mx2=gx+(mk%cols)*(tw+g2),my2=gy+Math.floor(mk/cols)*(th+g2);c.fillStyle='#545C4B';c.font='800 '+Math.round(tw*.4)+'px '+sans;c.textAlign='center';c.fillText('+'+D.more,mx2+tw/2,my2+th/2+tw*.14);c.textAlign='left';}
      });});
      // 아래: 인스타 아이콘 + @naite_library
      c.textAlign='left';c.font='700 36px '+sans;var hs='@naite_library',hw=c.measureText(hs).width,ix=(W-(hw+50))/2,iy=1282;
      c.strokeStyle='#245648';c.lineWidth=3;rrect(c,ix,iy-17,34,34,9);c.stroke();c.beginPath();c.arc(ix+17,iy,8,0,Math.PI*2);c.stroke();c.fillStyle='#245648';c.beginPath();c.arc(ix+26.5,iy-8.5,2.2,0,Math.PI*2);c.fill();
      c.textBaseline='middle';c.fillText(hs,ix+50,iy+1);
      return new Promise(function(r2){try{cv.toBlob(function(bl){r2(bl);},'image/png');}catch(e){r2(null);}});
    });
  }
  function openMonthCard(){
    var mi=viewMonth();if(!mi)return;
    shareSheet(mi.month+'월 읽기 달력','인스타·카카오톡에 올려 이번 달을 자랑해 보세요.',drawMonthCard(mi),'naite-'+mi.year+'-'+pad(mi.month)+'.png','month_card',{month:mi.year+'-'+pad(mi.month)});
  }

  /* ── 그리기 ── */
  function coverImg(b){return b.cover?'<img src="'+esc(b.cover)+'" alt="">':'<span class="nt">'+esc(shortTitle(b.title))+'</span>';}
  function bump(bid,src){
    var el=document.querySelector('[data-rbook="'+bid+'"][data-src="'+src+'"]');if(!el)return;
    el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
    if(src==='shelf')stampOn(el);
  }
  // 누른 표지에 '오늘' 도장이 쾅
  function stampOn(el,day){
    var cv=el&&el.querySelector('.rk-cover');if(!cv)return;
    var d=day||S.recDay,w=d===logicalToday()?'오늘':d===addDays(logicalToday(),-1)?'어제':(+d.slice(8))+'일',st=document.createElement('span');st.className='rk-stamp';st.setAttribute('aria-hidden','true');
    st.innerHTML='<svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" fill="rgba(255,255,255,.82)" stroke="#B87343" stroke-width="3"/><circle cx="40" cy="40" r="27" stroke="#B87343" stroke-width="2" opacity=".6"/><text x="40" y="48" text-anchor="middle" font-family="Gowun Batang,serif" font-weight="700" font-size="22" fill="#B87343">'+w+'</text></svg>';
    cv.appendChild(st);setTimeout(function(){if(st.parentNode)st.remove();},1500);
  }
  function paintCards(){
    var mi=studyMonth();
    document.querySelectorAll('[data-rrow]').forEach(function(el){
      el.hidden=false;
      var bid=+el.getAttribute('data-rrow'),pre=mi?mi.year+'-'+pad(mi.month)+'-':'',n=0,ld=lastDay(bid);
      S.rows.forEach(function(r){if(r.b===bid&&(!pre||r.d.indexOf(pre)===0))n++;});
      el.innerHTML='<span class="st'+(n?' done':'')+'">'+(n?svg(14,IC.check,2.4)+'이번 달 <b>'+n+'번</b> · 마지막 '+dayLabel(ld,true):'아직 안 읽었어요')+'</span>'+
        '<button type="button" class="rbtn'+(n?' again':'')+'" data-rbook="'+bid+'" data-src="card">'+(n?'한 번 더':'읽었어요')+'</button>';
    });
    // 이번 달 자료 위 진행 점: 5권 중 N권 만났어요(채운 점은 왼쪽부터)
    var pg=document.querySelector('[data-rprog]');
    if(pg&&S.books.length){var m=met(S.books);
      pg.innerHTML='<div class="dots">'+S.books.map(function(b,i){return '<i class="'+(i<m?'on':'')+'"></i>';}).join('')+'</div><span class="pt">'+S.books.length+'권 중 <b>'+m+'권</b> 만났어요</span>';}
    paintToday();
  }
  // 스터디 탭 오른쪽 아래 떠 있는 '오늘 기록' 버튼 → 누르면 인증샷·책 기록·공유 메뉴 — 2026-11-04
  function paintToday(){
    var el=$('tdFab');
    if(!el){el=document.createElement('div');el.id='tdFab';el.className='td-fab';document.body.appendChild(el);}
    // 이번 달 자료 + 읽기 기록 화면에(읽기 기록 머리의 '오늘 기록' 버튼 대신)
    el.hidden=S.tab!=='study'&&S.tab!=='shelf';if(el.hidden){el.classList.remove('open');return;}
    var d=logicalToday(),inf=dayInfo(d),done=inf.sum||inf.ph,open=el.classList.contains('open');
    el.innerHTML='<div class="td-menu" role="menu">'+
        (done?'<button type="button" role="menuitem" data-tshare>'+svg(18,IC.share)+'오늘 기록 공유</button>':'')+
        '<button type="button" role="menuitem" data-tbook>'+svg(18,IC.study)+(inf.sum?'책 더 기록':'읽은 책 기록')+'</button>'+
        '<button type="button" role="menuitem" class="pri" data-tcam>'+svg(18,IC.cam)+'인증샷 찍기'+'</button>'+
      '</div>'+
      '<button type="button" class="td-main'+(done?' done':'')+'" data-tfab aria-expanded="'+open+'">'+
        (open?svg(18,IC.x,2.4)+'닫기':done?svg(18,IC.check,2.6)+'오늘 '+(inf.sum?inf.sum+'권':'사진'):svg(18,IC.shelf)+'오늘 기록')+'</button>';
  }
  function fabToggle(on){var el=$('tdFab');if(!el)return;el.classList.toggle('open',on);paintToday();}
  /* ── 나이테 라인 아이콘 ── */
  function svg(w,inner,sw){return '<svg width="'+w+'" height="'+w+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||2.1)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>';}
  var IC={
    cam:'<path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L19 6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.4"/>',
    card:'<rect x="3" y="5" width="18" height="14" rx="2.4"/><circle cx="8.5" cy="10" r="1.8"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16" rx="2.4"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    hand:'<path d="M9 11.5V6a2 2 0 1 1 4 0v5"/><path d="M13 7a2 2 0 0 1 4 0v4M17 9a2 2 0 0 1 4 0v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L5 14"/>',
    map:'<path d="M4 19V7l6-3 6 3 4-2v12l-4 2-6-3-6 3z"/><path d="M10 4v12M16 7v12"/>',
    x:'<path d="M6 6l12 12M18 6L6 18"/>',
    flip:'<path d="M3 7h3l1.5-2h9L18 7h3v12H3z"/><path d="M9 13a3 3 0 0 0 5 2M15 11a3 3 0 0 0-5-2"/><path d="M8.5 15.5L9 13l2.5.5M15.5 10.5L15 13l-2.5-.5"/>',
    check:'<path d="M5 12l5 5L20 6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    share:'<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3M8 7l4-4 4 4"/>',
    save:'<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/><path d="M12 3v12M8 11l4 4 4-4"/>',
    study:'<path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 1-2-2z"/><path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 0 2-2z"/>',
    shelf:'<path d="M12 20h8"/><path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    stats:'<path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/>',
    c120:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    shop:'<path d="M12 4l2.3 4.7 5.2.8-3.7 3.6.9 5.1L12 15.8 7.3 18.3l.9-5.1L4.5 9.5l5.2-.8z"/>',
    pick:'<path d="M12 20.5s-7.2-4.5-9.1-9A5 5 0 0 1 12 6.8a5 5 0 0 1 9.1 4.7c-1.9 4.5-9.1 9-9.1 9z"/>'
  };
  var RING='<svg class="rk-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="20" stroke="#245648" stroke-width="2.4"/><circle cx="24" cy="24" r="13.5" stroke="#245648" stroke-width="2.4" opacity=".75"/><circle cx="24" cy="24" r="7" stroke="#245648" stroke-width="2.4" opacity=".5"/><circle cx="24" cy="5" r="2.6" fill="#B87343"/></svg>';
  function paintTabs(anim){
    var el=$('rtabs');if(!el)return;
    var T={study:[svg(22,IC.study,1.9),'이번 달 책'],shelf:[svg(22,IC.stats,1.9),'읽기 기록'],c120:[svg(22,IC.c120,1.9),'독서 로드맵'],shop:[svg(22,IC.shop,1.9),'인기 책장'],pick:[svg(22,IC.pick,1.9),'나이테 Pick']};
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
        S.loaded[key]={books:d&&d.ok?rememberBooks(key,d.books):[],failed:!(d&&d.ok)};
        paint();pull(key);
      },function(){if(S){S.loaded[key]={failed:true};paint();}});
    }
    return null;
  }
  function paintShelf(){
    var el=$('v-shelf');if(!el||!S.member||S.tab!=='shelf')return;
    var recent=S.rows.slice().sort(function(a,b){return a.d===b.d?b.t-a.t:(a.d<b.d?1:-1);}).slice(0,30);
    var mi=viewMonth(),mrows=mi?monthRows(mi):[],mdays={},off=S.viewOff||0;mrows.forEach(function(r){mdays[r.d]=1;});
    if(S.recSheet)S.recSheet.render();
    // 읽기 기록(2026-11-07): 기록하기 + 읽기 통계를 한 화면으로 — 달 넘기기 하나, 숫자 3개 → 달력 → 통계 카드 → 최근 기록·백업
    el.innerHTML='<div class="rv rk">'+
      '<div class="rk-calhead rk-onehead"><h2>'+(mi?monthNav((mi.year!==monthInfo().year?mi.year+'년 ':'')+mi.month+'월 읽기 기록'):'읽기 기록')+'</h2></div>'+
      (mi?statsKpi(mi)+calendarHtml(mi,!S.rows.length&&!off):'')+
      '<div class="rk-hint">'+svg(15,IC.hand,2.2)+'<span>날짜를 누르면 그날 읽은 책을 <b>표지로</b> 기록하거나 <b>사진으로</b> 남겨요</span></div>'+
      '<div id="v-statsin"></div>'+
      '<h3 class="rv-h3">최근 기록</h3>'+
      (recent.length?'<ul class="rs-list'+(S.recentOpen?' open':'')+'">'+recent.map(function(r,i){var b=r.k==='_other'?{title:'📚 '+(r.o||'다른 책')}:(S.byId[r.b]||{title:'(지난 달 책)'});
        return '<li'+(i>=5?' class="x"':'')+'><span class="dl">'+dayLabel(r.d,true).replace('/','.')+'</span>'+(b.cover?'<img src="'+esc(b.cover)+'" alt="">':'')+'<span class="tt">'+esc(b.title)+'</span><button type="button" data-rdel="'+esc(r.c)+'" aria-label="'+esc(b.title)+' '+dayLabel(r.d)+' 기록 지우기">지우기</button></li>';}).join('')+'</ul>'+
          (recent.length>5?'<button type="button" class="rs-more" data-rmore>'+(S.recentOpen?'접기':'더 보기 ('+(recent.length-5)+'개)')+'</button>':'')
        :'<p class="rv-empty">아직 기록이 없어요. 위 달력의 날짜나 \'오늘 기록\' 버튼으로 기록하면 여기에 쌓여요.</p>')+
      (backupName()?'<p class="rv-note">기록이 <b>'+esc(backupName())+'</b> 이름으로 백업돼 있어요. 폰을 바꿔도 이어보기로 다시 볼 수 있어요.</p>'
        :'<p class="rv-note">기록은 이 폰(브라우저)에 저장돼요. 폰을 바꾸거나 앱을 지워도 이어 보려면 <b>기록 백업</b>을 해 두세요.</p>')+
      '<div class="rk-footlinks">'+(isStandalone()?'':'<button type="button" class="rv-leave" data-rinstall="shelf">'+svg(14,'<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',2)+'앱 설치하기</button><span aria-hidden="true">·</span>')+
        '<button type="button" class="rv-leave" data-rbackup>'+(backupName()?'기록 백업됨 · '+esc(backupName()):'기록 백업 · 이어보기')+'</button></div></div>';
    paintStats(); // 통계 카드는 같은 화면 안(v-statsin)에 — paintShelf만 다시 그려도 함께 그려지게
  }
  // 읽기 기록 맨 위 숫자 3개(이번 달 책 · 총 읽기 · 읽은 날)
  function statsKpi(mi){
    var rows=monthRows(mi),total=rows.length,days={},homeIds={},off=S.viewOff||0,vb=viewBooks(mi);
    rows.forEach(function(r){days[r.d]=1;});
    vb.forEach(function(b){homeIds[b.id]=1;});
    var metM=vb.filter(function(b){return rows.some(function(r){return r.b===b.id;});}).length;
    var others=rows.filter(function(r){return r.k==='_other';}).length,study=total-others;
    var past=rows.filter(function(r){return r.k!=='_other'&&!homeIds[r.b];}).length;
    return '<div class="st-kpi">'+
        '<div class="k"><div class="lb">'+(off?mi.month+'월 책':'이번 달 책')+'</div><div class="v">'+metM+'<s> / '+(vb.length||5)+'권</s></div></div>'+
        '<div class="k"><div class="lb">총 읽기</div><div class="v">'+total+'<s> 번</s></div></div>'+
        '<div class="k"><div class="lb">읽은 날</div><div class="v">'+cntKeys(days)+'<s>'+(mi.elapsed?' / '+mi.elapsed+'일':' 일')+'</s></div></div>'+
      '</div>'+
      (others?'<p class="st-line">스터디 책 <b>'+study+'번</b> · 다른 책 <b>'+others+'번</b></p>':'')+
      (past&&vb.length?'<p class="st-line">스터디 책 중 <b>다른 달 책 다시 읽기 '+past+'번</b>이 들어 있어요.</p>':'')+
      '<div class="rk-kpigap"></div>';
  }
  // 통계 탭 공유 카드 썸네일: 기록·사진이 바뀌었을 때만 다시 그림
  function monthThumb(mi){
    var last=S.rows.reduce(function(a,r){return Math.max(a,r.t||0);},0);
    var sig=mi.year+'-'+mi.month+'|'+S.rows.length+'|'+last+'|'+Object.keys(S.photoUrls).sort().join(',');
    if(S.thumb&&(S.thumb.sig===sig))return;
    S.thumb={sig:sig,url:S.thumb&&S.thumb.url};
    drawMonthCard(mi).then(function(bl){
      if(!bl||!S||!S.thumb||S.thumb.sig!==sig)return;
      if(S.thumb.url)URL.revokeObjectURL(S.thumb.url);
      S.thumb.url=URL.createObjectURL(bl);
      var b=document.querySelector('.st-sharecard .thumb');if(b)b.innerHTML='<img src="'+S.thumb.url+'" alt="">';
    },function(){});
  }
  function paintStats(){
    // 읽기 기록 화면 안의 통계 카드(제목·숫자 3개는 위 statsKpi, 날짜별 흐름은 달력과 같은 정보라 뺌)
    var el=$('v-statsin');if(!el||!S.member||S.tab!=='shelf')return;
    var mi=viewMonth(),rows=monthRows(mi),total=rows.length,off=S.viewOff||0,vb=viewBooks(mi);
    function cnt(bid){var n=0;rows.forEach(function(r){if(r.b===bid)n++;});return n;}
    var h='<div class="st">';
    var mPre=mi?mi.year+'-'+pad(mi.month)+'-':'',hasP=!!mi&&Object.keys(S.photoUrls).some(function(d){return d.indexOf(mPre)===0;});
    if(mi&&(total||hasP)){
      h+='<div class="st-card st-sharecard"><h2>'+(off?mi.month+'월':'이번 달')+' 나이테 공유</h2><div class="row"><button type="button" class="thumb" data-rmonth aria-label="달력 이미지 크게 보기">'+(S.thumb&&S.thumb.url?'<img src="'+S.thumb.url+'" alt="">':'')+'</button>'+
        '<p>표지와 인증 사진이 담긴 한 달 달력이에요</p></div>'+
        '<button type="button" class="st-share" data-rmonth>'+svg(18,IC.share)+'달력 이미지로 저장·공유</button></div>';
      monthThumb(mi);
    }
    if(!total){el.innerHTML=h+'</div>';return;} // 기록이 없으면 통계 카드는 숨김(아래 최근 기록에 안내가 있음)
    // 이번 달에 읽은 책들(지난 달 책 포함)
    var readIds={};rows.forEach(function(r){if(r.k!=='_other')readIds[r.b]=1;});
    var readBooks=Object.keys(readIds).map(function(id){return S.byId[+id]||{id:+id,title:'(지난 달 책)',type:''};});
    // 가장 많이 반복한 책: 2번 이상 읽은 책 중 최다. 동점이면 모두 보여줌
    var fmax=0;readBooks.forEach(function(b){fmax=Math.max(fmax,cnt(b.id));});
    var favs=fmax>=2?readBooks.filter(function(b){return cnt(b.id)===fmax;}):[];
    h+='<div class="st-card"><h2>가장 많이 반복한 책</h2>';
    if(!favs.length)h+='<p class="st-soft">아직 두 번 이상 읽은 책이 없어요. 아이가 다시 가져오는 책이 생기면 여기에 나타나요.</p>';
    else if(favs.length===1){var fav=favs[0];
      h+='<div class="st-top"><span class="cv"><span class="fb">'+esc(shortTitle(fav.title))+'</span>'+(fav.cover?'<img src="'+esc(fav.cover)+'" alt="" onerror="this.remove()">':'')+'</span>'+
        '<div class="info"><div class="tt">'+esc(fav.title)+'</div><div class="cnt"><b>'+fmax+'번</b> 읽었어요'+(fav.type?' · '+esc(fav.type):'')+'</div><div class="say">아이가 계속 고르는 책은 표현이 귀에 붙고 있다는 신호예요.</div></div></div>';}
    else h+='<div class="st-favs">'+favs.map(function(b){return '<span class="cv"><span class="fb">'+esc(shortTitle(b.title))+'</span>'+(b.cover?'<img src="'+esc(b.cover)+'" alt="'+esc(b.title)+'" onerror="this.remove()">':'')+'</span>';}).join('')+'</div>'+
      '<div class="st-say">'+favs.length+'권을 똑같이 <b>'+fmax+'번</b>씩 읽었어요.</div>';
    h+='</div>';
    // 유형별 횟수(최다=클레이, 나머지=세이지). 동점 1위는 모두 강조
    var types=[],tc={};
    vb.slice().sort(function(a,b){return (a.tier||9)-(b.tier||9);}).forEach(function(b){var t=b.type||'기타';if(!(t in tc)){tc[t]=0;types.push(t);}});
    rows.forEach(function(r){if(r.k==='_other')return;var b=S.byId[r.b];var t=(b&&b.type)||'기타';if(!(t in tc)){tc[t]=0;types.push(t);}tc[t]++;});
    types=types.map(function(t,i){return [t,i];}).sort(function(a,b){return tc[b[0]]-tc[a[0]]||a[1]-b[1];}).map(function(x){return x[0];}); // 많이 읽은 순(같으면 원래 순서)
    var tmax=Math.max.apply(null,types.map(function(t){return tc[t];}))||0;
    var tops=tmax?types.filter(function(t){return tc[t]===tmax;}):[],zeroT=types.filter(function(t){return !tc[t];});
    var msg=tops.length===1?'우리 아이는 <b>'+esc(tops[0])+'</b> 책을 가장 자주 골랐어요.'
      :(tops.length===types.length?'여러 유형을 골고루 읽었어요.':'우리 아이는 <b>'+tops.map(esc).join(', ')+'</b> 책을 가장 자주 골랐어요.');
    h+='<div class="st-card st-types"><h2>유형별 읽기 횟수</h2>'+types.map(function(t){return '<div class="row'+(tops.indexOf(t)>=0&&tops.length<types.length?' max':'')+'"><span class="tl">'+esc(t)+'</span><span class="track"><i style="width:'+(tmax?tc[t]/tmax*100:0)+'%"></i></span><span class="tv">'+tc[t]+'</span></div>';}).join('')+
      '<div class="typebox">'+msg+(zeroT.length?' 아직 안 읽은 유형: <b>'+zeroT.map(esc).join(', ')+'</b>. Read Aloud 영상으로 먼저 보여주면 시작이 쉬워요.':'')+'</div></div>';
    el.innerHTML=h+'</div>';
  }
  function cntKeys(o){return Object.keys(o).length;}
  function paint(anim){paintCards();paintTabs(anim);paintShelf();}

  /* ── 탭 ── */
  // 나이테 120(앱 안 iframe): 자료가 공개된 주제에만 '📖 스터디 자료 보기' → 앱 안에서 그 달 자료(?m=키)
  // 공개 사이트 challenge.html 에는 아무것도 안 붙음(회원 앱이 iframe 안에 끼워 넣는 것)
  function studyLinks(f){
    var d;try{d=f.contentDocument;}catch(e){return;}if(!d||!d.body)return;
    if(!d.getElementById('rlStudyCss')){var st=d.createElement('style');st.id='rlStudyCss';
      st.textContent='.rl-study{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;background:#E4EEE7;color:#245648;font-weight:800;font-size:.74rem;line-height:1.3;text-decoration:none;border:1px solid #CFE0D6;white-space:nowrap}';
      d.head.appendChild(st);}
    function apply(){
      var pub={};(S&&S.pubs||[]).forEach(function(t){pub[t.key]=1;});
      d.querySelectorAll('.theme[data-key]').forEach(function(el){
        var k=el.getAttribute('data-key'),has=el.querySelector('.rl-study');if(el.querySelector('.c120-study'))return; // 사이트판이 이미 붙였으면 또 붙이지 않음;
        if(!pub[k]){if(has)has.remove();return;}
        if(has)return;
        var a=d.createElement('a');a.className='rl-study';a.href='#';a.textContent='📖 스터디 자료';
        a.addEventListener('click',function(ev){ev.preventDefault();if(S&&S.onEvent)S.onEvent('c120_study_open',{theme:k});
          try{localStorage.setItem(TAB_KEY,'study');}catch(e){}
          location.href='app.html'+(k===S.home.key?'':'?m='+encodeURIComponent(k));});
        var th=el.querySelector('.th');if(th)th.insertBefore(a,th.querySelector('.done'));else el.insertBefore(a,el.firstChild);
      });
    }
    apply();
    var body=d.getElementById('course-body')||d.body;
    try{new f.contentWindow.MutationObserver(function(){apply();}).observe(body,{childList:true,subtree:true});}catch(e){}
    if(!(S&&S.pubs&&S.pubs.length))rpc('list_published').then(function(list){if(S){S.pubs=list||S.pubs;apply();}},function(){});
  }
  var studyY=0,T_NAME={c120:'독서 로드맵(나이테 120)',shop:'국내 인기 책장',pick:'나이테 Pick'};
  function showTab(id){
    if(id==='stats')id='shelf';
    if(TAB_IDS.indexOf(id)<0)id='study';
    if(S.tab==='study'&&id!=='study')studyY=window.scrollY;
    S.tab=id;
    TAB_IDS.forEach(function(t){var v=$('v-'+t);if(v)v.hidden=t!==id;});
    if(EMBED[id]){var v=$('v-'+id),tb=$('rtabs');
      if(v){v.style.bottom=(tb?tb.offsetHeight:64)+'px';
        if(!v.firstChild){var f=document.createElement('iframe');f.src=EMBED[id];f.title=T_NAME[id];f.allow='web-share; clipboard-write';f.loading='eager';if(id==='c120')f.addEventListener('load',function(){studyLinks(f);});v.appendChild(f);}}}
    try{history.replaceState(history.state,'',location.pathname+location.search+(id==='study'?'':'#'+id));}catch(e){} // state 유지(뒤로가기 표시)
    try{localStorage.setItem(TAB_KEY,id);}catch(e){}
    paint();hideToast();
    if(!EMBED[id])window.scrollTo(0,id==='study'?studyY:0);
    if(S.onEvent)S.onEvent('tab_view',{tab:id});
  }

  /* ── 폰 뒤로가기(2026-11-07): 위에 열린 창이나 다른 탭에서는 앱을 나가지 않고 한 단계 전으로 ──
     열린 것(카메라·아래 창·오늘 기록 메뉴·공지/처음 오셨나요?·자료 아닌 탭)이 생기면 기록을 한 칸 쌓고,
     뒤로가기가 오면 맨 위 것 하나만 닫음. 버튼으로 닫으면 쌓아 둔 칸을 조용히 되돌림. */
  var BG={on:false,skip:0};
  function layerOpen(){
    if(document.querySelector('.rl-cam'))return true;
    if(sheetEl&&!sheetEl.hidden)return true;
    var f=$('tdFab');if(f&&!f.hidden&&f.classList.contains('open'))return true;
    var pn=document.getElementById('pn');if(pn&&!pn.hidden)return true;
    return !!(S&&S.tab&&S.tab!=='study');
  }
  function closeTop(){
    var cams=document.querySelectorAll('.rl-cam');
    if(cams.length){var c=cams[cams.length-1],x=c.querySelector('[data-camx],[data-ax]');if(x)x.click();else{c.remove();document.documentElement.classList.remove('rl-lock');}return;}
    if(sheetEl&&!sheetEl.hidden){closeSheet();return;}
    var f=$('tdFab');if(f&&f.classList.contains('open')){fabToggle(false);return;}
    var pn=document.getElementById('pn');if(pn&&!pn.hidden){var pc=pn.querySelector('[data-pnclose]');if(pc)pc.click();else pn.hidden=true;return;}
    if(S&&S.tab!=='study')showTab('study');
  }
  function syncBack(){
    var open=layerOpen();
    if(open&&!BG.on){BG.on=true;try{history.pushState({naiteBack:1},'',location.href);}catch(e){BG.on=false;}}
    else if(!open&&BG.on){BG.on=false;if(history.state&&history.state.naiteBack){BG.skip++;history.back();}}
  }
  var backWired=false;
  function wireBack(){
    if(backWired)return;backWired=true;
    window.addEventListener('popstate',function(){
      if(BG.skip){BG.skip--;return;}
      if(!BG.on)return;
      BG.on=false;closeTop();
      setTimeout(syncBack,0); // 아직 열린 게 남아 있으면 다시 한 칸
    });
    var q=0;new MutationObserver(function(){if(q)return;q=setTimeout(function(){q=0;syncBack();},0);})
      .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
    syncBack();
  }

  /* ── 이벤트(한 번만 등록) ── */
  var wired=false;
  function wire(){
    if(wired)return;wired=true;wireBack();
    document.addEventListener('click',function(e){
      if(!S)return;var t;
      if($('tdFab')&&$('tdFab').classList.contains('open')&&!e.target.closest('#tdFab'))fabToggle(false);
      if((t=e.target.closest('[data-rbook]'))){e.preventDefault();e.stopPropagation();record(+t.getAttribute('data-rbook'),t.getAttribute('data-src')||'card');return;}
      if((t=e.target.closest('[data-rtab]'))){if(t.tagName==='A')e.preventDefault();showTab(t.getAttribute('data-rtab'));return;} // a href=#… 이 주소 기록을 쌓지 않게(뒤로가기 처리와 엉키지 않도록)
      if((t=e.target.closest('[data-rday]'))){S.recDay=t.getAttribute('data-rday');paintShelf();return;}
      if((t=e.target.closest('[data-rshelf]'))){S.shelfKey=t.getAttribute('data-rshelf');S.shelfScroll=true;paintShelf();if(S.onEvent)S.onEvent('shelf_month',{theme:S.shelfKey});return;}
      if((t=e.target.closest('[data-rdel]'))){remove(t.getAttribute('data-rdel'),false);return;}
      if((t=e.target.closest('[data-rbackup]'))){openBackup();return;}
      if((t=e.target.closest('[data-rshare]'))){openShareCard(t.getAttribute('data-rshare'));return;}
      if((t=e.target.closest('[data-rmonth]'))){openMonthCard();return;}
      if((t=e.target.closest('[data-rstamp]'))){openStampCamera();return;}
      if((t=e.target.closest('[data-rtoday]'))){openRecordSheet(logicalToday());return;}
      if((t=e.target.closest('[data-tfab]'))){var fo=!$('tdFab').classList.contains('open');fabToggle(fo);if(fo&&S.onEvent)S.onEvent('today_fab',{});return;}
      if((t=e.target.closest('[data-tcam]'))){fabToggle(false);openStampCamera(logicalToday());if(S.onEvent)S.onEvent('today_cam',{});return;}
      if((t=e.target.closest('[data-tbook]'))){fabToggle(false);openRecordSheet(logicalToday());if(S.onEvent)S.onEvent('today_book',{});return;}
      if((t=e.target.closest('[data-tshare]'))){fabToggle(false);openShareCard(logicalToday());if(S.onEvent)S.onEvent('today_share',{});return;}
      if((t=e.target.closest('[data-mprev]'))){if(!t.disabled){S.viewOff=(S.viewOff||0)-1;paint();if(S.onEvent)S.onEvent('month_nav',{off:S.viewOff,tab:S.tab});}return;}
      if((t=e.target.closest('[data-mnext]'))){if(!t.disabled){S.viewOff=Math.min(0,(S.viewOff||0)+1);paint();}return;}
      if((t=e.target.closest('[data-rmore]'))){S.recentOpen=!S.recentOpen;paintShelf();return;}
      if((t=e.target.closest('[data-rcal]'))){openDay(t.getAttribute('data-rcal'));return;}
      if((t=e.target.closest('[data-rother]'))){recordOther(t.getAttribute('data-rother'));return;}
      if((t=e.target.closest('[data-rinstall]'))){install();if(S.onEvent)S.onEvent('install_click',{from:t.getAttribute('data-rinstall')||'shelf'});return;}
    },true); // 캡처 단계: 책 카드의 클릭 집계보다 먼저 처리
    document.addEventListener('keydown',function(e){var t;if(S&&(e.key==='Enter'||e.key===' ')&&(t=e.target.closest&&e.target.closest('[data-rcal]'))){e.preventDefault();openDay(t.getAttribute('data-rcal'));}});
    window.addEventListener('online',function(){if(S)flush();});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')setTimeout(clearPick,1500);if(S&&document.visibilityState==='visible'){S.recDay=logicalToday();paint();flush();pull();pullOther();if(S.shelfKey&&S.shelfKey!==S.home.key)pull(S.shelfKey);}});
  }

  window.NaiteReading={
    getCode:getCode,setCode:setCode,openBackup:function(m){if(S)openBackup(m);},
    install:install,installBar:installBar,isStandalone:isStandalone,inAppName:inAppName,externalHref:externalHref,toast:toast,
    mount:function(o){
      var code=getCode(),theme=o.theme||{};
      S={client:o.client,theme:theme,books:[],byId:loadMeta(),monthLabel:o.monthLabel||'',onEvent:o.onEvent||null,
         reader:readerId(),code:code,member:true,recDay:logicalToday(),lastTap:{},inflight:null,gone:{},tab:'study',rows:[],outbox:[],
         home:{key:theme.key,ko:theme.ko,emoji:theme.emoji,monthLabel:o.monthLabel||''},pubs:[],loaded:{},shelfKey:theme.key,photoBlobs:{},photoUrls:{},photoList:{}};
      S.books=rememberBooks(theme.key,o.books);
      var st=load();S.rows=st.rows;S.outbox=st.outbox;
      S.rows.forEach(function(r){if(!r.k)r.k=(S.byId[r.b]||{}).k||theme.key;});
      // 공개된 달 목록(기록하기 탭 달 칩)
      rpc('list_published').then(function(list){if(!S)return;S.pubs=list||[];(S.pubs||[]).forEach(function(t){if(t.key!==S.home.key)shelfBooks(t.key);});paint();},function(){});
      wire();
      loadPhotos();
      try{var pk=+localStorage.getItem('naite_pick');clearPick();
        if(pk&&Date.now()-pk<180000){setTimeout(function(){toast('사진을 고르는 사이 앱이 다시 시작됐어요. 인증 카드에서 📷 바로 찍기로 해 주세요.');},900);if(S.onEvent)S.onEvent('photo_reload',{});}}catch(e){}
      // 주소의 #탭 → 없으면 마지막에 보던 탭(앱을 다시 열 때)
      // ?tab=month|log|stats|c120|shop(메인 버튼) 또는 #study|shelf|stats|c120|shop
      var qt=(new URLSearchParams(location.search)).get('tab')||'',QT={month:'study',log:'shelf',stats:'shelf'};
      var h=QT[qt]||qt||(location.hash||'').slice(1),last='';try{last=localStorage.getItem(TAB_KEY)||'';}catch(e){}
      if(h==='stats')h='shelf';if(last==='stats')last='shelf';
      // 주소로 바로 온 탭(메인의 나이테 120·인기 책장 버튼 등)은 그대로, 마지막 탭이 앱 안 페이지면 자료 탭으로
      if(TAB_IDS.indexOf(h)<0){h=last;if(EMBED[h])h='study';}
      if(TAB_IDS.indexOf(h)>0)showTab(h);else{S.tab='study';paint();}
      flush();pull();pullOther();checkBackup();
      setTimeout(offerInstallOnce,1200);
    }
  };
})();
