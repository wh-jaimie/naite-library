# -*- coding: utf-8 -*-
"""challenge.json -> 엄마표영어 스터디 관리자 대시보드 + 공유 페이지 (self-republishing artifact) -> dashboard.html"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ch = json.load(open(os.path.join(HERE, "output", "challenge.json"), encoding="utf-8"))

# 시드 데이터: 주제별 5권(교사입력 필드는 빈값)
themes = {}
order = []
for t in ch["themes"]:
    key = t["key"]
    order.append(key)
    themes[key] = {
        "emoji": t["emoji"], "en": t["en"], "ko": t["ko"],
        "month_label": "", "subject": "", "read_method": "",
        "activities": "", "expressions": "",
        "books": [{"tier_label": b["tier_label"], "title": b["title"],
                   "author": b["author"], "cover": b["cover"], "reason": b["reason"]} for b in t["books"]],
    }
SEED = {"meta": {"current": order[0]}, "order": order, "themes": themes}

OUT = os.path.join(HERE, "output", "dashboard.html")
seed_json = json.dumps(SEED, ensure_ascii=False).replace("<", "\\u003c")

# 템플릿 (appcss / appcode / APP_DATA 구조; 자기 재발행)
TEMPLATE = r"""<style id="appcss">
*{box-sizing:border-box}
html,body{margin:0}
body{background:#F6F2E9;color:#2B2A26;font-family:'Nunito Sans',system-ui,-apple-system,'Segoe UI',AppleSDGothicNeo,'Malgun Gothic',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
:root{--surface:#FFFDF8;--line:#E2DAC9;--ink:#2B2A26;--soft:#6C665A;--teal:#0E7C7B;--tealD:#0A5E5D;--coral:#E8623C;--amber:#E9A63B;--sh:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07);--shL:0 10px 34px rgba(43,42,38,.14)}
.wrap{max-width:940px;margin:0 auto;padding:0 18px}
h1,h2,h3{font-family:Georgia,'Nanum Myeongjo',serif;margin:0;line-height:1.2}
a{color:var(--tealD)}
.tag{display:inline-block;font-size:.7rem;font-weight:800;color:#fff;padding:2px 8px;border-radius:6px}
/* header */
.top{position:sticky;top:0;z-index:20;background:rgba(246,242,233,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:12px;padding:11px 18px}
.brand{font-family:Georgia,serif;font-weight:700}
.top .sp{margin-left:auto;display:flex;gap:8px}
.btn{border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:.85rem;font-weight:700;padding:8px 13px;border-radius:9px;cursor:pointer;text-decoration:none;display:inline-block}
.btn.pri{background:var(--tealD);color:#fff;border-color:var(--tealD)}
.btn.cor{background:var(--coral);color:#fff;border-color:var(--coral)}
/* admin */
.adm{padding:22px 0 60px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--sh);margin-bottom:16px}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
label.f{display:block;font-size:.82rem;font-weight:800;color:var(--soft);margin:14px 0 5px}
input.t,select.t,textarea.t{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-size:.95rem;padding:10px 12px;border-radius:10px}
textarea.t{min-height:90px;resize:vertical;line-height:1.5}
.hint{font-size:.76rem;color:var(--soft);margin-top:4px}
.bk{display:flex;gap:10px;align-items:flex-start;border-top:1px dashed var(--line);padding-top:12px;margin-top:12px}
.bk img{width:52px;height:70px;object-fit:cover;border-radius:6px;flex:0 0 auto;background:#eee}
.bk .bf{flex:1;min-width:0}
.status{font-size:.85rem;font-weight:700;margin-left:auto}
.pill{font-size:.72rem;font-weight:800;color:var(--tealD)}
/* share page */
.share{padding:0 0 60px}
.hero{padding:40px 0 22px;text-align:center}
.hero .ml{font-size:.85rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--coral)}
.hero .em{font-size:3rem;line-height:1;margin:12px 0}
.hero h1{font-size:clamp(1.9rem,5vw,2.7rem)}
.hero .en{color:var(--soft);font-weight:700;margin-top:4px}
.hero .subj{max-width:60ch;margin:16px auto 0;color:var(--ink)}
.sec{margin-top:26px}
.sec h2{font-size:1.3rem;color:var(--tealD);border-bottom:2px solid var(--line);padding-bottom:7px;margin-bottom:14px}
.books{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}
.book{background:var(--surface);border:1px solid var(--line);border-radius:13px;overflow:hidden;box-shadow:var(--sh);display:flex;flex-direction:column}
.book .cv{aspect-ratio:3/4;background:#EDE6D6}
.book .cv img{width:100%;height:100%;object-fit:cover;display:block}
.book .bb{padding:10px 11px 12px;display:flex;flex-direction:column;gap:3px;flex:1}
.book .ty{font-size:.66rem;font-weight:800;color:#fff;background:var(--teal);align-self:flex-start;padding:2px 7px;border-radius:6px}
.book .bt{font-family:Georgia,serif;font-weight:700;font-size:.96rem;line-height:1.2;margin-top:4px}
.book .ba{font-size:.76rem;color:var(--soft)}
.book .br{font-size:.8rem;color:var(--soft);margin-top:4px}
.prose{white-space:pre-wrap}
ul.li{margin:0;padding-left:20px}
ul.li li{margin:5px 0}
.expr{list-style:none;padding:0;margin:0}
.expr li{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:7px 0;box-shadow:var(--sh)}
.expr .en2{font-weight:700}
.expr .ko2{color:var(--soft);font-size:.9rem}
.empty{color:var(--soft);font-style:italic}
.foot{border-top:1px solid var(--line);margin-top:36px;padding:22px 0 44px;color:var(--soft);font-size:.82rem;text-align:center}
@media print{.top,.noprint{display:none}.share{padding-top:10px}}
</style>

<div id="app"></div>

<script type="application/json" id="APP_DATA">/*SEED*/</script>
<script id="appcode">
(function(){
  var LT='<';
  var app=document.getElementById('app');
  function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var PUBLISHED=JSON.parse(document.getElementById('APP_DATA').textContent);
  var DRAFTKEY='joy-study-draft:'+location.pathname;
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function params(){return new URLSearchParams(location.search);}
  var isAdmin=params().has('admin');

  // ---- share page ----
  function parseExpr(txt){
    return (txt||'').split(/\n/).map(function(l){return l.trim();}).filter(Boolean).map(function(l){
      var m=l.split(/\s*[|\-–]\s*/);
      return {en:m[0]||'', ko:m.slice(1).join(' - ')||''};
    });
  }
  function parseList(txt){return (txt||'').split(/\n/).map(function(l){return l.trim();}).filter(Boolean);}

  function renderShare(data, key){
    var t=data.themes[key];
    if(!t){app.innerHTML='<div class="wrap"><p class="empty" style="padding:40px 0">공개된 주제가 아직 없어요.</p></div>';return;}
    var books=t.books.map(function(b){
      return '<div class="book">'+
        '<div class="cv">'+(b.cover?'<img loading="lazy" src="'+esc(b.cover)+'" alt="'+esc(b.title)+'">':'')+'</div>'+
        '<div class="bb"><span class="ty">'+esc(b.tier_label)+'</span>'+
        '<div class="bt">'+esc(b.title)+'</div>'+
        '<div class="ba">'+esc(b.author)+'</div>'+
        (b.reason?'<div class="br">'+esc(b.reason)+'</div>':'')+
        '</div></div>';
    }).join('');
    var acts=parseList(t.activities);
    var exprs=parseExpr(t.expressions);
    var h='';
    h+='<div class="share"><div class="wrap">';
    h+='<div class="hero">';
    h+='<div class="ml">'+(t.month_label?esc(t.month_label):'이번 달 영어책')+'</div>';
    h+='<div class="em">'+esc(t.emoji)+'</div>';
    h+='<h1>'+esc(t.ko)+'</h1><div class="en">'+esc(t.en)+'</div>';
    if(t.subject) h+='<p class="subj prose">'+esc(t.subject)+'</p>';
    h+='</div>';
    h+='<div class="sec"><h2>📚 이번 달 5권</h2><div class="books">'+books+'</div></div>';
    h+='<div class="sec"><h2>🗣️ 읽어주는 방법</h2>'+(t.read_method?'<div class="prose">'+esc(t.read_method)+'</div>':'<p class="empty">준비 중이에요.</p>')+'</div>';
    h+='<div class="sec"><h2>🎨 책 활용 아이디어</h2>'+(acts.length?'<ul class="li">'+acts.map(function(a){return '<li>'+esc(a)+'</li>';}).join('')+'</ul>':'<p class="empty">준비 중이에요.</p>')+'</div>';
    h+='<div class="sec"><h2>💬 관련 영어표현</h2>'+(exprs.length?'<ul class="expr">'+exprs.map(function(e){return '<li><span class="en2">'+esc(e.en)+'</span>'+(e.ko?' <span class="ko2">'+esc(e.ko)+'</span>':'')+'</li>';}).join('')+'</ul>':'<p class="empty">준비 중이에요.</p>')+'</div>';
    h+='<div class="foot">나이테 엄마표영어 스터디 · 매달 새로운 5권으로 함께해요</div>';
    h+='</div></div>';
    app.innerHTML=h;
  }

  // ---- admin ----
  var DATA;
  function saveDraft(){try{localStorage.setItem(DRAFTKEY,JSON.stringify(DATA));}catch(e){}}
  function loadDraft(){try{var r=localStorage.getItem(DRAFTKEY);return r?JSON.parse(r):null;}catch(e){return null;}}
  var dirty=false;
  function setDirty(v){dirty=v;var s=document.getElementById('st');if(s)s.textContent=v?'● 미발행 변경사항':'';}

  function renderAdmin(){
    DATA=loadDraft()||clone(PUBLISHED);
    var opts=DATA.order.map(function(k){var t=DATA.themes[k];return '<option value="'+k+'">'+esc(t.emoji+' '+t.ko+' ('+t.en+')')+'</option>';}).join('');
    var cur=DATA.meta.current;
    var h='';
    h+='<div class="top"><div class="wrap"><span class="brand">🛠️ 스터디 관리자</span>'+
       '<span class="sp"><button class="btn" id="prev">공유 미리보기</button>'+
       '<button class="btn cor" id="pub">저장 & 발행</button></span></div></div>';
    h+='<div class="adm"><div class="wrap">';
    h+='<div class="card"><div class="row"><div><label class="f" style="margin-top:0">이번 달 공개 주제</label>'+
       '<select class="t" id="curSel">'+DATA.order.map(function(k){var t=DATA.themes[k];return '<option value="'+k+'"'+(k===cur?' selected':'')+'>'+esc(t.emoji+' '+t.ko)+'</option>';}).join('')+'</select>'+
       '<div class="hint">부모들이 링크를 열면 이 주제가 보여요.</div></div>'+
       '<div style="flex:1"></div><span class="status" id="st"></span></div></div>';
    h+='<div class="card"><label class="f" style="margin-top:0">편집할 주제</label><select class="t" id="edSel">'+opts+'</select>'+
       '<div id="form"></div></div>';
    h+='</div></div>';
    app.innerHTML=h;
    document.getElementById('edSel').value=cur;
    renderForm(cur);
    document.getElementById('edSel').addEventListener('change',function(e){renderForm(e.target.value);});
    document.getElementById('curSel').addEventListener('change',function(e){DATA.meta.current=e.target.value;setDirty(true);saveDraft();});
    document.getElementById('prev').addEventListener('click',function(){previewShare(document.getElementById('edSel').value);});
    document.getElementById('pub').addEventListener('click',publish);
    window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue='';}});
  }

  function renderForm(key){
    var t=DATA.themes[key];
    var f=document.getElementById('form');
    var books=t.books.map(function(b,i){
      return '<div class="bk">'+(b.cover?'<img src="'+esc(b.cover)+'">':'<div style="width:52px;height:70px;background:#eee;border-radius:6px"></div>')+
        '<div class="bf"><span class="pill">'+esc(b.tier_label)+'</span>'+
        '<input class="t" style="margin:4px 0" data-bk="'+i+'" data-fld="title" value="'+esc(b.title)+'">'+
        '<input class="t" style="margin-bottom:4px;font-size:.82rem" data-bk="'+i+'" data-fld="author" value="'+esc(b.author)+'">'+
        '<input class="t" style="font-size:.82rem" data-bk="'+i+'" data-fld="reason" value="'+esc(b.reason)+'"></div></div>';
    }).join('');
    f.innerHTML=
      '<label class="f">월 라벨 <span class="hint">(예: 2026년 10월 · 1개월차)</span></label><input class="t" id="fml" value="'+esc(t.month_label)+'">'+
      '<label class="f">주제 소개 (엄마용)</label><textarea class="t" id="fsub" style="min-height:70px">'+esc(t.subject)+'</textarea>'+
      '<label class="f">읽어주는 방법</label><textarea class="t" id="frm">'+esc(t.read_method)+'</textarea>'+
      '<label class="f">책 활용 아이디어 <span class="hint">(한 줄에 하나씩)</span></label><textarea class="t" id="fact">'+esc(t.activities)+'</textarea>'+
      '<label class="f">관련 영어표현 <span class="hint">(한 줄에 하나 · "English - 한글" 형식)</span></label><textarea class="t" id="fexp">'+esc(t.expressions)+'</textarea>'+
      '<label class="f">이번 주제 5권 (제목·저자·설명 수정 가능)</label>'+books;
    function bind(id,fld){document.getElementById(id).addEventListener('input',function(e){t[fld]=e.target.value;setDirty(true);saveDraft();});}
    bind('fml','month_label');bind('fsub','subject');bind('frm','read_method');bind('fact','activities');bind('fexp','expressions');
    f.querySelectorAll('input[data-bk]').forEach(function(inp){
      inp.addEventListener('input',function(e){t.books[+e.target.dataset.bk][e.target.dataset.fld]=e.target.value;setDirty(true);saveDraft();});
    });
  }

  function addAdminEntry(){
    if(document.getElementById('adminFab'))return;
    var b=document.createElement('button');
    b.id='adminFab'; b.textContent='🛠 관리자';
    b.className='noprint';
    b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:50;background:#0A5E5D;color:#fff;border:none;border-radius:999px;padding:11px 16px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer';
    b.addEventListener('click',renderAdmin);
    document.body.appendChild(b);
  }
  function previewShare(key){
    renderShare(DATA,key);
    var bar=document.createElement('div');
    bar.id='pvbar'; bar.className='noprint';
    bar.style.cssText='position:fixed;left:0;right:0;top:0;z-index:60;background:#E8623C;color:#fff;text-align:center;padding:9px;font-weight:800;cursor:pointer';
    bar.textContent='← 미리보기(미발행) · 관리자로 돌아가기';
    bar.addEventListener('click',function(){bar.remove();renderAdmin();});
    document.body.appendChild(bar);
  }

  function buildDoc(data){
    var css=document.getElementById('appcss').textContent;
    var js=document.getElementById('appcode').textContent;
    var json=JSON.stringify(data).replace(/</g,'\\u003c');
    return '<!doctype html>'+LT+'html lang="ko">'+LT+'head>'+
      LT+'meta charset="utf-8">'+
      LT+'meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'+
      LT+'title>나이테 엄마표영어 스터디'+LT+'/title>'+
      LT+'style id="appcss">'+css+LT+'/style>'+LT+'/head>'+LT+'body>'+
      LT+'div id="app">'+LT+'/div>'+
      LT+'script type="application/json" id="APP_DATA">'+json+LT+'/script>'+
      LT+'script id="appcode">'+js+LT+'/script>'+LT+'/body>'+LT+'/html>';
  }

  async function publish(){
    var st=document.getElementById('st');
    var art=null;
    try{art=await claude.use('artifact');}catch(e){}
    if(!art){st.textContent='발행 기능을 쓸 수 없어요 (읽기 전용 뷰).';return;}
    st.textContent='발행 중…';
    try{
      try{localStorage.removeItem(DRAFTKEY);}catch(e){}
      await art.publish(buildDoc(DATA));
      dirty=false; st.textContent='발행됨! 새로고침됩니다…';
    }catch(e){
      if(e&&(e.code==='not_writer'||e.code==='not_granted'||e.code==='consent_required')) st.textContent='발행 권한이 없어요. 소유자 계정에서 편집하세요.';
      else if(e&&e.code==='conflict') st.textContent='다른 곳에서 먼저 저장됨 — 새로고침됩니다.';
      else st.textContent='발행 실패: '+((e&&(e.code||e.message))||'오류');
      saveDraft();
    }
  }

  // ---- route ----
  // 부모: 공유 화면. 소유자: 우하단 '관리자' 버튼 노출(자동 감지).
  renderShare(PUBLISHED, PUBLISHED.meta.current);
  (async function(){
    var u=null; try{u=await claude.use('user');}catch(e){}
    try{ if(u && ((u.isOwner&&u.isOwner())||(u.canEdit&&u.canEdit()))) addAdminEntry(); }catch(e){}
  })();
})();
</script>
"""

html = TEMPLATE.replace("/*SEED*/", seed_json)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print(f"생성: {OUT} ({len(html)//1024} KB), 주제 {len(order)}개")
