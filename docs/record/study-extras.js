/* 나이테 스터디 앱(record/) 추가 기능 — 2026-11-12 공개 앱에 먼저 적용(유료 잠금은 나중, 지금은 누구나 전부)
   원본: docs/pro/study-extras.js(유료 미리보기판과 같은 코드 · 고칠 땐 둘 다)
   R1 영어표현 듣기: 영어표현(#s-exp) 문장마다 🔊 듣기 · 천천히(0.7배). 브라우저 음성(Web Speech API, 영어 음성)
      ___ 빈칸·한글은 빼고 읽음. 영어 음성이 없는 기기는 안내 + 구글 번역(듣기 버튼 있음) 링크
   R2 미리 알아 두면 좋은 단어: 책별 한 줄 줄거리(books.plot) + 단어(books.words, 한 줄에 "word - 뜻") + 단어마다 🔊
      데이터가 하나도 없으면 탭·섹션 자체가 안 나옴
   app.html 쪽 훅: render()에서 app.innerHTML 직후 NaiteExtras.after(ctx), 자료 탭 목록에 's-words'(hasWords) */
(function(){
  'use strict';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var SPK='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';

  /* ── 듣기(Web Speech API) ── */
  var synth=window.speechSynthesis||null,voice=null,voicesTried=false;
  function pickVoice(){
    if(!synth)return null;
    var vs=synth.getVoices()||[],en=vs.filter(function(v){return /^en[-_]/i.test(v.lang)||/^en$/i.test(v.lang);});
    if(!en.length)return null;
    function f(re){return en.filter(function(v){return re.test(v.lang);});}
    var us=f(/en[-_]US/i),gb=f(/en[-_]GB/i),pool=us.length?us:(gb.length?gb:en);
    // 기기 기본·구글·삼성 음성을 먼저(대체로 더 자연스러움)
    return pool.filter(function(v){return v.localService&&/google|samsung|samantha|aaron|nicky/i.test(v.name);})[0]||pool.filter(function(v){return v.localService;})[0]||pool[0];
  }
  if(synth){voice=pickVoice();if(synth.addEventListener)synth.addEventListener('voiceschanged',function(){voice=pickVoice();});else synth.onvoiceschanged=function(){voice=pickVoice();};}
  // 빈칸(___) 빼고, 괄호 속 한글 메모도 빼고 읽기
  function clean(t){return String(t||'').replace(/_{2,}/g,' ').replace(/\([^)]*[ㄱ-힣][^)]*\)/g,' ').replace(/[ㄱ-힣]+/g,' ').replace(/\s+([?!.,])/g,'$1').replace(/\s{2,}/g,' ').trim();}
  function gtUrl(t){return 'https://translate.google.com/?sl=en&tl=ko&op=translate&text='+encodeURIComponent(clean(t));}
  var playing=null;
  function speak(text,slow,btn){
    var t=clean(text);if(!t)return;
    if(!synth||!window.SpeechSynthesisUtterance){noVoice(text,btn);return;}
    if(!voice)voice=pickVoice();
    // 음성 목록을 아직 못 받았을 수 있음(안드로이드 첫 실행) → 한 번 기다렸다가 다시
    if(!voice&&!voicesTried){voicesTried=true;setTimeout(function(){voice=pickVoice();if(voice)speak(text,slow,btn);else noVoice(text,btn);},400);return;}
    if(!voice){noVoice(text,btn);return;}
    synth.cancel();
    if(playing)playing.classList.remove('on');
    var u=new SpeechSynthesisUtterance(t);u.voice=voice;u.lang=voice.lang;u.rate=slow?0.7:0.95;u.pitch=1;
    if(btn){btn.classList.add('on');playing=btn;}
    u.onend=u.onerror=function(){if(btn)btn.classList.remove('on');if(playing===btn)playing=null;};
    synth.speak(u);
  }
  function noVoice(text,btn){
    var li=btn&&btn.closest('li,.xw-w');if(!li)return;
    var old=document.querySelector('.xs-novoice');if(old)old.remove();
    var p=document.createElement('p');p.className='xs-novoice';
    p.innerHTML='이 기기에는 영어 음성이 없어요. <a href="'+gtUrl(text)+'" target="_blank" rel="noopener">구글 번역에서 듣기 →</a>';
    li.appendChild(p);
  }
  function ttsBtns(text,small){
    return '<span class="xs-tts'+(small?' sm':'')+'"><button type="button" data-say="'+esc(text)+'" aria-label="듣기">'+SPK+(small?'':'<span>듣기</span>')+'</button>'+
      (small?'':'<button type="button" data-say="'+esc(text)+'" data-slow="1" aria-label="천천히 듣기"><span>천천히</span></button>')+'</span>';
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[data-say]');if(!b)return;e.preventDefault();e.stopPropagation();speak(b.getAttribute('data-say'),!!b.getAttribute('data-slow'),b);},true);

  /* ── 단어·줄거리 데이터 ── */
  // books.words: 한 줄에 하나 "word - 뜻" (구분: 띄어 쓴 ' - ', '|', '–'. fire-engine처럼 붙은 하이픈은 안 나눔)
  function parseWords(t){return String(t||'').split(/\n/).map(function(l){return l.trim().replace(/^[•·\-*]\s+/,'');}).filter(Boolean).map(function(l){
    var m=l.split(/\s*[|–]\s*|\s+-\s+/);return {en:(m[0]||'').trim(),ko:m.slice(1).join(' - ').trim()};}).filter(function(w){return w.en;}).slice(0,10);}
  function hasWords(books){return (books||[]).some(function(b){return (b.words&&String(b.words).trim())||(b.plot&&String(b.plot).trim());});}

  function wordsHtml(ctx){
    var books=ctx.books.filter(function(b){return (b.words&&String(b.words).trim())||(b.plot&&String(b.plot).trim());});
    if(!books.length)return '';
    var locked=0;
    var cards=books.map(function(b){
      if(ctx.open&&!ctx.open(b)){locked++;return '<div class="xw-card lock">'+(b.cover?'<img loading="lazy" src="'+esc(b.cover)+'" alt="">':'')+'<div><b>'+esc(b.title)+'</b><p>🔒 줄거리와 단어는 월간 스터디에서 볼 수 있어요</p></div></div>';}
      var ws=parseWords(b.words);
      return '<div class="xw-card">'+
        '<div class="xw-top">'+(b.cover?'<img loading="lazy" src="'+esc(b.cover)+'" alt="">':'')+'<div><b>'+esc(b.title)+'</b>'+
          (b.plot?'<p class="xw-plot">'+esc(b.plot)+'</p>':'')+'</div></div>'+
        (ws.length?'<ul class="xw-list">'+ws.map(function(w){return '<li class="xw-w"><span class="en">'+esc(w.en)+'</span>'+ttsBtns(w.en,true)+(w.ko?'<span class="ko">'+esc(w.ko)+'</span>':'')+'</li>';}).join('')+'</ul>':'')+
      '</div>';}).join('');
    return '<div class="sh"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2z"/><path d="M8 8h6M8 12h4"/></svg><h2>미리 알아 두면 좋은 단어</h2></div>'+
      '<p class="note">읽어 주기 전에 엄마가 한 번 훑어보세요. 아이에게 뜻을 외우게 할 필요는 없어요. 그림을 가리키며 단어를 들려주면 충분해요.</p>'+
      '<div class="xw-cards">'+cards+'</div>'+
      (locked&&ctx.more?ctx.more(locked):'');
  }

  function after(ctx){
    var app=ctx.app;if(!app)return;
    // R1: 영어표현 문장마다 듣기
    app.querySelectorAll('#s-exp .exp li').forEach(function(li){
      var e=li.querySelector('.e');if(!e||li.querySelector('.xs-tts'))return;
      e.insertAdjacentHTML('afterend',ttsBtns(e.textContent,false));
    });
    // R2: 단어·줄거리 섹션
    var sec=app.querySelector('#s-words');if(sec)sec.innerHTML=wordsHtml(ctx);
  }

  var css='.xs-tts{display:inline-flex;gap:6px;margin:6px 0 2px}'+
    '.xs-tts button{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line-2,#D4D9C9);background:var(--surface,#fff);color:var(--pine,#245648);border-radius:999px;padding:5px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;line-height:1}'+
    '.xs-tts button.on{background:var(--pine,#245648);color:#fff;border-color:transparent}'+
    '.xs-tts.sm{margin:0 0 0 4px;vertical-align:middle}.xs-tts.sm button{padding:4px 6px}'+
    '.sd .exp .xs-tts{display:flex}'+
    '.xs-novoice{margin:6px 0 0;font-size:12px;color:var(--muted,#8A917E)}.xs-novoice a{color:var(--pine,#245648);font-weight:700}'+
    '.xw-cards{display:flex;flex-direction:column;gap:12px}'+
    '.xw-card{background:var(--surface,#fff);border:1px solid var(--line,#E4E6DC);border-radius:16px;padding:14px;box-shadow:var(--shadow)}'+
    '.xw-top{display:flex;gap:12px;align-items:flex-start}.xw-top img,.xw-card.lock img{width:52px;flex:0 0 52px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.18)}'+
    '.xw-top b,.xw-card.lock b{display:block;font-family:var(--serif);font-size:15px;color:var(--ink)}'+
    '.xw-plot{margin:4px 0 0;font-size:14px;color:var(--ink-soft);line-height:1.55}'+
    '.xw-list{list-style:none;margin:12px 0 0;padding:10px 0 0;border-top:1px dashed var(--line-2,#D4D9C9);display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}'+
    '.xw-w{display:flex;flex-wrap:wrap;align-items:center;min-width:0}.xw-w .en{font-weight:800;font-size:15px;color:var(--ink)}.xw-w .ko{flex:0 0 100%;font-size:12.5px;color:var(--muted)}'+
    '.xw-card.lock{display:flex;gap:12px;align-items:center;opacity:.85}.xw-card.lock p{margin:3px 0 0;font-size:13px;color:var(--muted)}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  window.NaiteExtras={after:after,hasWords:hasWords,speak:speak,clean:clean,parseWords:parseWords};
})();
