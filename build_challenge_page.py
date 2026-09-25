# -*- coding: utf-8 -*-
"""challenge.json -> 나이테 120 (파닉스 전 첫 영어책 코스) 페이지 (challenge.html)"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "output", "challenge.json")
OUT = os.path.join(HERE, "output", "challenge.html")
data = json.load(open(DATA, encoding="utf-8"))
payload = json.dumps(data, ensure_ascii=False)

TEMPLATE = r"""<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>나이테 120 — 파닉스 전, 첫 영어책 코스</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
:root{
  --ground:#E4E7DD;--surface:#FCFCF8;--surface-2:#EBEDE3;--ink:#23291F;--ink-soft:#565E4E;
  --line:#E2E5DA;--teal:#2F6E58;--teal-deep:#245648;--coral:#B87343;--amber:#D1965C;--plum:#4F9A72;
  --shadow:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07);--shadow-lg:0 10px 34px rgba(43,42,38,.14);
  --t1:#245648;--t2:#2F6E58;--t3:#4F9A72;--t4:#B87343;--t5:#7A4520;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#1B1A17;--surface:#242220;--surface-2:#2E2B27;--ink:#F1ECE1;--ink-soft:#A8A090;--line:#3A362F;
  --teal:#3FB0AE;--teal-deep:#5CC6C4;--coral:#F27E5B;--amber:#F0B857;--plum:#C08FD0;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.4);--shadow-lg:0 12px 38px rgba(0,0,0,.55);
  --t1:#74C29A;--t2:#5FB088;--t3:#4F9A72;--t4:#D69E68;--t5:#E0AD7B;}}
:root[data-theme="dark"]{
  --ground:#1B1A17;--surface:#242220;--surface-2:#2E2B27;--ink:#F1ECE1;--ink-soft:#A8A090;--line:#3A362F;
  --teal:#3FB0AE;--teal-deep:#5CC6C4;--coral:#F27E5B;--amber:#F0B857;--plum:#C08FD0;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.4);--shadow-lg:0 12px 38px rgba(0,0,0,.55);
  --t1:#74C29A;--t2:#5FB088;--t3:#4F9A72;--t4:#D69E68;--t5:#E0AD7B;}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);font-family:'Noto Sans KR',system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:20px}
h1,h2,h3{font-family:'Gowun Batang',Georgia,serif;font-weight:600;line-height:1.14;text-wrap:balance;margin:0}
.tnum{font-variant-numeric:tabular-nums}
a{color:var(--teal-deep)}
header.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;background:color-mix(in srgb,var(--ground) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:14px;padding-block:12px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Gowun Batang',serif;font-weight:700;font-size:1.05rem;white-space:nowrap}
.brand .mark{width:30px;height:30px;border-radius:9px;flex:0 0 auto;background:linear-gradient(135deg,var(--coral),var(--amber));display:grid;place-items:center;color:#fff;font-size:1rem;box-shadow:var(--shadow)}
.top .back{margin-left:auto;font-size:.85rem;font-weight:700;text-decoration:none;border:1px solid var(--line);background:var(--surface);padding:8px 13px;border-radius:999px}
.themebtn{border:1px solid var(--line);background:var(--surface);color:var(--ink);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;flex:0 0 auto}
.hero{padding-block:42px 8px}
.eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--coral)}
.hero h1{font-size:clamp(2rem,5.6vw,3.35rem);margin:.35em 0 .3em;font-weight:700}
.hero p.lead{font-size:1.06rem;color:var(--ink-soft);max-width:60ch}
/* 진행률 + 코스 */
.panel{margin-top:24px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow)}
.panel .r1{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.panel .big{font-family:'Gowun Batang',serif;font-weight:700;font-size:1.9rem;color:var(--coral)}
.panel .sub{font-size:.9rem;color:var(--ink-soft)}
.panel .reset{margin-left:auto;border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);font:inherit;font-size:.76rem;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer}
.bar{height:14px;border-radius:999px;background:var(--surface-2);overflow:hidden;margin-top:12px}
.bar>i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--t1),var(--amber),var(--coral));transition:width .4s}
.course{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.course button{flex:1;min-width:180px;text-align:left;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:14px;padding:13px 15px;cursor:pointer;box-shadow:var(--shadow)}
.course button.active{border-color:var(--coral);box-shadow:0 0 0 2px var(--coral) inset,var(--shadow)}
.course .ct{font-family:'Gowun Batang',serif;font-weight:700;font-size:1.05rem}
.course .cd{font-size:.8rem;color:var(--ink-soft);margin-top:2px}
.note{font-size:.8rem;color:var(--ink-soft);margin-top:14px;max-width:74ch}
/* 계단 범례 */
.legend{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 6px}
.lg{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:700;color:var(--ink-soft)}
.lg .sw{width:12px;height:12px;border-radius:4px}
/* 월/주제 */
.month{margin-top:26px}
.month>.mh{font-family:'Gowun Batang',serif;font-weight:700;font-size:1.05rem;color:var(--coral);margin:0 2px 10px;
  border-bottom:2px solid var(--line);padding-bottom:6px}
.theme{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px 16px 18px;box-shadow:var(--shadow);margin-bottom:16px}
.theme .th{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 2px 14px}
.theme .th .emo{font-size:1.5rem;line-height:1}
.theme .th h3{font-size:1.2rem}
.theme .th .en{font-size:.82rem;color:var(--ink-soft);font-weight:700}
.theme .th .done{margin-left:auto;font-size:.76rem;font-weight:800;color:var(--teal-deep)}
.ladder{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.step{display:flex;flex-direction:column;gap:6px;position:relative}
.step .tier{font-size:.66rem;font-weight:800;color:#fff;padding:2px 7px;border-radius:6px;align-self:flex-start}
.step .cover{position:relative;aspect-ratio:3/4;border-radius:9px;overflow:hidden;background:var(--surface-2);box-shadow:var(--shadow);cursor:pointer}
.step .cover img{width:100%;height:100%;object-fit:cover;display:block}
.step .cover .ph{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:8px;text-align:center;color:#fff;background:linear-gradient(150deg,var(--teal),var(--teal-deep))}
.step .cover .ph .pt{font-family:'Gowun Batang',serif;font-weight:600;font-size:.72rem;line-height:1.15}
.step .cover.noimg .ph{display:flex}
.step .cover .chk{position:absolute;inset:0;background:rgba(36,86,72,.55);display:none;align-items:center;justify-content:center;font-size:1.6rem;color:#fff}
.step.seen .cover .chk{display:flex}
.step .pop{position:absolute;top:6px;right:6px;background:color-mix(in srgb,var(--ink) 80%,transparent);color:#fff;
  font-size:.62rem;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:var(--shadow)}
.step .krb{position:absolute;top:6px;left:6px;background:#c0392b;color:#fff;
  font-size:.6rem;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:var(--shadow)}
.step .tt{font-size:.76rem;font-weight:700;line-height:1.2}
.step .au{font-size:.68rem;color:var(--ink-soft)}
.step .aw{font-size:.64rem;font-weight:800;color:#7a5a00;background:#f3e9c9;border-radius:6px;padding:2px 6px;align-self:flex-start;margin-top:2px}
.step .lib{font-size:.64rem;font-weight:800;color:#8a5a1a;background:#fbeee0;border-radius:6px;padding:2px 6px;align-self:flex-start;margin-top:2px}
.step .rs{font-size:.68rem;color:var(--ink-soft);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media (max-width:760px){.ladder{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
  .step .rs{display:none}.step .au{display:none}}
@media (max-width:520px){.ladder{grid-template-columns:repeat(3,1fr);gap:10px}.step .rs{display:-webkit-box}.step .au{display:block}}
footer{border-top:1px solid var(--line);margin-top:34px;padding-block:26px 42px}
footer p{color:var(--ink-soft);font-size:.82rem;margin:.3em 0}
.share{margin-top:14px;width:100%;border:none;background:linear-gradient(135deg,var(--coral),var(--amber));color:#fff;font:inherit;font-weight:800;font-size:.95rem;padding:12px;border-radius:12px;cursor:pointer;box-shadow:var(--shadow)}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.62);display:none;align-items:center;justify-content:center;z-index:100;padding:20px}
.ov.on{display:flex}
.ovb{background:var(--surface);border-radius:18px;padding:16px;max-width:360px;width:100%;box-shadow:var(--shadow-lg);text-align:center}
.ovb img{width:100%;border-radius:12px;display:block;background:#1C1E17}
.ovb .btns{display:flex;gap:8px;margin-top:12px}
.ovb .btns button{flex:1;border:none;font:inherit;font-weight:800;font-size:.9rem;padding:11px;border-radius:10px;cursor:pointer}
.ovb .save{background:var(--teal-deep);color:#fff}
.ovb .close{background:var(--surface-2);color:var(--ink)}
.ovb .hint2{font-size:.74rem;color:var(--ink-soft);margin:10px 0 0}
</style>

<header class="top"><div class="wrap">
  <div class="brand"><span class="mark">120</span><span>나이테 120</span></div>
  <a class="back" href="index.html">← 전체 책장</a>
  <button class="themebtn" id="theme" title="테마 전환">◐</button>
</div></header>

<main class="wrap">
  <section class="hero">
    <div class="eyebrow">파닉스 전, 첫 영어책 코스</div>
    <h1>나이테 120</h1>
    <p class="lead"><strong>매번 고르지 않아도 되는 120권의 영어 그림책.</strong><br>
      뭘 읽지? → 검색 → 후기 → 주문 → 실패 → 또 검색. 이 반복을 없앴어요.
      <strong>24개 주제 × 5권</strong>, 각 주제는 <strong>조작북·반복·라임·유머·스토리</strong>
      5가지 유형을 골고루 담았습니다. 순서·반복은 자유예요.</p>

    <div class="panel">
      <div class="r1">
        <span class="big" id="prBig">0 / 120</span>
        <span class="sub" id="prSub">읽어준 책을 체크하면 진행률이 쌓여요</span>
        <button class="reset" id="prReset">기록 초기화</button>
      </div>
      <div class="bar"><i id="prBar"></i></div>
      <div class="course" id="course">
        <button data-c="1y" class="active"><div class="ct">🚀 1년 코스</div><div class="cd">월 2주제 · 10권 × 12개월</div></button>
        <button data-c="2y"><div class="ct">🌱 2년 코스</div><div class="cd">월 1주제 · 5권 × 24개월</div></button>
      </div>
      <button class="share" id="prShare">🖼️ 진행 이미지 만들기 · 공유</button>
    </div>
    <p class="note">※ 120권은 엄마표 영어를 <strong>시작하고 지속하기 위한 큐레이션 코스</strong>예요.
      학습 효과를 보장하는 학습지가 아니라, 좋은 영어책을 충분히 만나는 경험에 초점을 둡니다.
      한 권을 여러 번 읽어도, 순서를 바꿔도 괜찮아요.<br>
      표지의 <strong>🌍 세계 인기</strong> 는 전세계 인기 그림책 106권에 든 책, <strong>🇰🇷 국내 인기</strong> 는 국내 서점 통합 베스트예요.</p>

    <div class="legend" id="legend"></div>
  </section>

  <section><div id="course-body"></div></section>
</main>

<div class="ov" id="ov"><div class="ovb">
  <img id="ovimg" alt="나이테 120 진행 이미지">
  <div class="btns"><button class="save" id="ovShare">📤 공유</button><button class="save" id="ovSave">💾 저장</button><button class="close" id="ovClose">닫기</button></div>
  <p class="hint2">이미지를 저장하거나 공유해 보세요. (모바일에서는 공유 시 인스타·카톡 등으로 바로 보낼 수 있어요.)</p>
</div></div>

<footer><div class="wrap">
  <p><strong>나이테 120</strong> · 파닉스 전, 첫 영어책 코스 — 나이테 영어도서관</p>
  <p>큐레이션: 전세계 인기(Goodreads) + 주제·난이도 설계 · 표지: Open Library</p>
</div></footer>

<script>
const P=/*DATA*/;const {themes,tier_labels,total}=P;
const esc=s=>(s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tvar=t=>`var(--t${t})`;
// 표시 순서: 조작북(1) → 반복(3) → 라임(2) → 유머(4) → 스토리(5). 번호·색은 표시 위치 기준.
const DORD=[1,3,2,4,5];const POS={};DORD.forEach((t,i)=>POS[t]=i+1);
let course='1y';
// 봤어요 기록
const KEY='joy-challenge-seen';let seen=new Set();
try{const r=localStorage.getItem(KEY);if(r)seen=new Set(JSON.parse(r));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify([...seen]));}catch(e){}};
window._imgErr=el=>{el.parentElement.classList.add('noimg');el.remove();};

// 범례
document.getElementById('legend').innerHTML='<span class="lg" style="color:var(--ink)">5가지 유형:</span>'+
  DORD.map(t=>`<span class="lg"><span class="sw" style="background:var(--t${POS[t]})"></span>${POS[t]}. ${esc(tier_labels[t])}</span>`).join('');

function stepHTML(b){
  return `<div class="step${seen.has(b.id)?' seen':''}" data-id="${b.id}">
    <span class="tier" style="background:var(--t${POS[b.tier]})">${POS[b.tier]}. ${esc(b.tier_label)}</span>
    <div class="cover" data-id="${b.id}" role="button" tabindex="0" title="봤어요 체크">
      ${b.cover?`<img loading="lazy" src="${esc(b.cover)}" alt="${esc(b.title)}" onerror="_imgErr(this)">`:''}
      <div class="ph"><div class="pt">${esc(b.title)}</div></div>
      ${b.pop_rank?`<span class="pop">🌍 세계 인기</span>`:''}
      ${b.kr_popular?`<span class="krb">🇰🇷 국내 인기</span>`:''}
      <div class="chk">✓</div>
    </div>
    <div class="tt">${esc(b.title)}</div>
    <div class="au">${esc(b.author)}</div>
    ${b.award?`<div class="aw">${esc(b.award)}</div>`:''}
    ${b.lib_loans?`<div class="lib">📚 도서관 ${b.lib_loans}회</div>`:''}
    <div class="rs">${esc(b.reason)}</div>
  </div>`;
}
function themeHTML(t){
  const done=t.books.filter(b=>seen.has(b.id)).length;
  return `<div class="theme" data-key="${esc(t.key)}">
    <div class="th"><span class="emo">${t.emoji}</span><h3>${esc(t.ko)}</h3>
      <span class="en">${esc(t.en)}</span><span class="done tnum" data-role="done">${done}/5</span></div>
    <div class="ladder">${[...t.books].sort((a,b)=>POS[a.tier]-POS[b.tier]).map(stepHTML).join('')}</div>
  </div>`;
}
function renderBody(){
  const per = course==='1y'?2:1;
  const months = Math.ceil(themes.length/per);
  let html='';
  for(let m=0;m<months;m++){
    const slice=themes.slice(m*per,m*per+per);
    html+=`<div class="month"><div class="mh">${m+1}개월차</div>${slice.map(themeHTML).join('')}</div>`;
  }
  document.getElementById('course-body').innerHTML=html;
}
function updateProgress(){
  const done=seen.size, pct=Math.round(done/total*100);
  document.getElementById('prBig').textContent=`${done} / ${total}`;
  document.getElementById('prBar').style.width=pct+'%';
  document.getElementById('prSub').textContent = done===0
    ? '읽어준 책을 체크하면 진행률이 쌓여요'
    : `${total}권 중 ${done}권 완료 · ${pct}%` + (done>=total?' 🎉 120권 완주!':'');
}
function toggle(id){
  if(seen.has(id))seen.delete(id);else seen.add(id);
  save();updateProgress();
  document.querySelectorAll(`.step[data-id="${CSS.escape(id)}"]`).forEach(s=>s.classList.toggle('seen',seen.has(id)));
  // 주제별 done 갱신
  document.querySelectorAll('.theme').forEach(th=>{
    const steps=[...th.querySelectorAll('.step')];
    const d=steps.filter(s=>s.classList.contains('seen')).length;
    const el=th.querySelector('[data-role=done]');if(el)el.textContent=`${d}/5`;
  });
}
document.getElementById('course-body').addEventListener('click',e=>{
  const c=e.target.closest('.cover');if(c)toggle(c.dataset.id);
});
document.getElementById('course-body').addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')){const c=e.target.closest('.cover');if(c){e.preventDefault();toggle(c.dataset.id);}}
});
document.getElementById('course').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;course=b.dataset.c;
  document.querySelectorAll('#course button').forEach(x=>x.classList.toggle('active',x===b));renderBody();
});
document.getElementById('prReset').addEventListener('click',()=>{
  if(seen.size&&confirm('챌린지 기록을 모두 지울까요?')){seen.clear();save();updateProgress();renderBody();}
});
const root=document.documentElement;
try{const t=localStorage.getItem('joy-theme');if(t)root.setAttribute('data-theme',t);}catch(e){}
document.getElementById('theme').addEventListener('click',()=>{
  const cur=root.getAttribute('data-theme');const dark=cur?cur==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
  const n=dark?'light':'dark';root.setAttribute('data-theme',n);try{localStorage.setItem('joy-theme',n);}catch(e){}
});
// ── 진행 공유 이미지 ──
async function makeShareCanvas(done,total,dark){
  const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d');
  const P = dark
    ? {bg:'#1C1E17', title:'#EAE5D7', sub:'#93A98F', ring:'#3C7A5C', honey:'#D1965C', count:'#EAE5D7', foot:'#93A98F'}
    : {bg:'#F1F3EA', title:'#23291F', sub:'#5A6350', ring:'#4F9A72', honey:'#B87343', count:'#23291F', foot:'#7A8270'};
  g.fillStyle=P.bg;g.fillRect(0,0,W,H);
  try{await document.fonts.load('700 68px "Gowun Batang"');await document.fonts.load('700 96px "Gowun Batang"');await document.fonts.load('500 34px "Noto Sans KR"');await document.fonts.load('700 44px "Noto Sans KR"');await document.fonts.ready;}catch(e){}
  const pct=total?done/total:0;
  g.textAlign='center';
  g.fillStyle=P.title;g.font='700 68px "Gowun Batang",serif';g.fillText('한 권씩, 나이테처럼',W/2,158);
  g.fillStyle=P.sub;g.font='500 34px "Noto Sans KR",sans-serif';
  g.fillText('파닉스 전 첫 영어 그림책 120권,',W/2,222);
  g.fillText('한 권씩 읽으며 나이테를 만들어요.',W/2,270);
  const cx=W/2,cy=660,rs=[70,135,200,265,330],R=330;
  rs.forEach((r,i)=>{g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.strokeStyle=P.ring;g.globalAlpha=(dark?0.9:0.78)-i*0.12;g.lineWidth=15;g.stroke();});
  g.globalAlpha=1;g.lineCap='round';
  g.beginPath();g.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(pct,0.001));g.strokeStyle=P.honey;g.lineWidth=22;g.stroke();
  g.font='94px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif';g.fillText('🌱',cx,cy+36);
  g.fillStyle=P.count;g.font='700 96px "Gowun Batang",serif';g.fillText(done+' / '+total+'권',W/2,1108);
  g.fillStyle=P.honey;g.font='700 44px "Noto Sans KR",sans-serif';g.fillText(Math.round(pct*100)+'% · 나이테 120',W/2,1172);
  g.fillStyle=P.foot;g.font='500 30px "Noto Sans KR",sans-serif';g.fillText('나이테 영어도서관 · 파닉스 전 첫 영어책 코스',W/2,1288);
  return cv;
}
function isDark(){const c=document.documentElement.getAttribute('data-theme');return c?c==='dark':matchMedia('(prefers-color-scheme:dark)').matches;}
function openShare(){makeShareCanvas(seen.size,total,isDark()).then(cv=>{window.__cv=cv;document.getElementById('ovimg').src=cv.toDataURL('image/png');document.getElementById('ov').classList.add('on');});}
function saveShare(){const cv=window.__cv;if(!cv)return;cv.toBlob(b=>{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='naite-120.png';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);},'image/png');}
function shareShare(){const cv=window.__cv;if(!cv)return;cv.toBlob(async b=>{const f=new File([b],'naite-120.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'나이테 120',text:`나이테 120 챌린지 ${seen.size}/${total}권 읽는 중`});return;}catch(e){}}saveShare();},'image/png');}
document.getElementById('prShare').addEventListener('click',openShare);
document.getElementById('ovSave').addEventListener('click',saveShare);
document.getElementById('ovShare').addEventListener('click',shareShare);
document.getElementById('ovClose').addEventListener('click',()=>document.getElementById('ov').classList.remove('on'));
document.getElementById('ov').addEventListener('click',e=>{if(e.target.id==='ov')document.getElementById('ov').classList.remove('on');});
renderBody();updateProgress();
</script>
"""
html_out = TEMPLATE.replace("/*DATA*/", payload)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)
print(f"생성: {OUT} ({len(html_out)//1024} KB), 120권/24주제")
