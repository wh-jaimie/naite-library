# -*- coding: utf-8 -*-
"""gr_master.json -> 파닉스 전 그림책 큐레이션 페이지(index.html)"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "output", "gr_master.json")
OUT = os.path.join(HERE, "output", "index.html")

books = json.load(open(DATA, encoding="utf-8"))["books"]
import re as _re
def _bid(b):  # 체크 저장용 안정 ID (ISBN 우선, 없으면 제목 슬러그)
    if b.get("isbn"):
        return "i" + str(b["isbn"])
    return "t" + _re.sub(r"[^a-z0-9]", "", b["title"].lower())
for b in books:
    b["id"] = _bid(b)
from collections import Counter
band_counts = Counter(b["band"] for b in books)

# 주제별 컬렉션 (rank 기준, 각 5권) — 인스타 캐러셀 1개 = 컬렉션 1개
THEMES = [
    ("🌙", "잠들기 전 5분, 잠자리 그림책", "하루를 포근하게 닫아주는 5권", "", [2,23,29,9,53]),
    ("🎵", "노래처럼 읽는 첫 책", "멜로디에 얹혀 저절로 따라 부르는 챈트·리듬", "", [4,10,94,35,85]),
    ("🐛", "에릭 칼 대표작", "반복과 색으로 만나는 Eric Carle", "", [1,3,22,16,46]),
    ("🐾", "동물이 가득, 반복이 재밌어", "소리와 패턴으로 빠져드는 동물책", "", [6,5,36,62,32]),
    ("👶", "아기 첫 보드북", "까꿍·플랩으로 시작하는 첫 상호작용", "0~2세", [42,51,44,88,98]),
    ("✋", "만지고 참여하는 책", "아이가 직접 개입하는 인터랙티브", "", [80,12,84,69,99]),
    ("❤️", "사랑을 전하는 책", "재우며 안아주며 읽는 애착 그림책", "", [7,24,79,66,100]),
    ("🚗", "붕붕! 탈것 & 움직임", "소리와 동작으로 신나는 5권", "", [11,18,48,104,101]),
    ("🌟", "마음이 자라는 그림책", "감정·자존감을 키우는 이야기", "4~6세", [14,74,105,33,60]),
    ("🏅", "세계가 사랑한 명작", "오래 읽히는 칼데콧·클래식", "4~6세", [19,75,97,102,103]),
]
by_rank = {b["rank"]: b for b in books}
themes_payload = []
for emoji, title, hook, age, ranks in THEMES:
    items = [by_rank[r] for r in ranks if r in by_rank]
    themes_payload.append({"emoji": emoji, "title": title, "hook": hook, "age": age,
                           "ids": [b["id"] for b in items]})

payload = {"books": books, "themes": themes_payload, "bands": [
    ["A", "아기·첫책", "0~2세", band_counts.get("아기·첫책 (0~2세)", 0)],
    ["B", "유아", "2~4세", band_counts.get("유아 (2~4세)", 0)],
    ["C", "미취학", "4~6세", band_counts.get("미취학 (4~6세)", 0)],
]}

TEMPLATE = r"""<title>조이네 영어 그림책 책장</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700;800&display=swap');
:root{
  --ground:#F6F2E9;--surface:#FFFDF8;--surface-2:#EDE6D6;--ink:#2B2A26;--ink-soft:#6C665A;
  --line:#E2DAC9;--teal:#0E7C7B;--teal-deep:#0A5E5D;--coral:#E8623C;--amber:#E9A63B;--plum:#8A5A9B;
  --shadow:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07);
  --shadow-lg:0 10px 34px rgba(43,42,38,.14);
  --bandA:#0E7C7B;--bandB:#E8623C;--bandC:#8A5A9B;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#1B1A17;--surface:#242220;--surface-2:#2E2B27;--ink:#F1ECE1;--ink-soft:#A8A090;
  --line:#3A362F;--teal:#3FB0AE;--teal-deep:#5CC6C4;--coral:#F27E5B;--amber:#F0B857;--plum:#C08FD0;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.4);--shadow-lg:0 12px 38px rgba(0,0,0,.55);
  --bandA:#3FB0AE;--bandB:#F27E5B;--bandC:#C08FD0;}}
:root[data-theme="dark"]{
  --ground:#1B1A17;--surface:#242220;--surface-2:#2E2B27;--ink:#F1ECE1;--ink-soft:#A8A090;
  --line:#3A362F;--teal:#3FB0AE;--teal-deep:#5CC6C4;--coral:#F27E5B;--amber:#F0B857;--plum:#C08FD0;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.4);--shadow-lg:0 12px 38px rgba(0,0,0,.55);
  --bandA:#3FB0AE;--bandB:#F27E5B;--bandC:#C08FD0;}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);
  font-family:'Nunito Sans',system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:20px}
h1,h2,h3{font-family:'Fraunces',Georgia,serif;font-weight:600;line-height:1.14;text-wrap:balance;margin:0}
.tnum{font-variant-numeric:tabular-nums}
header.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;
  background:color-mix(in srgb,var(--ground) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:14px;padding-block:12px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Fraunces',serif;font-weight:700;font-size:1.05rem;white-space:nowrap}
.brand .mark{width:30px;height:30px;border-radius:9px;flex:0 0 auto;background:linear-gradient(135deg,var(--teal),var(--teal-deep));
  display:grid;place-items:center;color:#fff;font-size:1rem;box-shadow:var(--shadow)}
.top .search{margin-left:auto;position:relative;flex:1;max-width:320px}
.top .search input{width:100%;padding:9px 12px 9px 34px;border-radius:999px;border:1px solid var(--line);
  background:var(--surface);color:var(--ink);font:inherit;font-size:.9rem}
.top .search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--ink-soft)}
.themebtn{border:1px solid var(--line);background:var(--surface);color:var(--ink);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;flex:0 0 auto}
.hero{padding-block:44px 26px}
.eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--teal-deep)}
.hero h1{font-size:clamp(2rem,5.4vw,3.25rem);margin:.35em 0 .3em;font-weight:700}
.hero p.lead{font-size:1.06rem;color:var(--ink-soft);max-width:62ch}
.note{font-size:.82rem;color:var(--ink-soft);margin-top:14px;max-width:70ch}
.cta{display:flex;align-items:center;gap:16px;margin-top:22px;background:linear-gradient(135deg,var(--coral),var(--amber));
  color:#fff;border-radius:18px;padding:18px 20px;box-shadow:var(--shadow-lg);text-decoration:none;flex-wrap:wrap}
.cta .big{font-family:'Fraunces',serif;font-weight:700;font-size:1.35rem;line-height:1.15}
.cta .sm{font-size:.86rem;opacity:.95;margin-top:3px}
.cta .go{margin-left:auto;background:#fff;color:var(--coral);font-weight:800;font-size:.9rem;
  padding:10px 18px;border-radius:999px;white-space:nowrap}
/* 연령대 고르기 */
.pick{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:26px}
.pick button{text-align:left;border:1px solid var(--line);background:var(--surface);color:var(--ink);
  border-radius:16px;padding:16px 16px;cursor:pointer;box-shadow:var(--shadow);transition:transform .15s,box-shadow .15s,border-color .15s}
.pick button:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}
.pick button.active{border-color:var(--pc);box-shadow:0 0 0 2px var(--pc) inset,var(--shadow)}
.pick .bk{font-family:'Fraunces',serif;font-weight:700;font-size:1.15rem}
.pick .age{font-size:.82rem;color:var(--ink-soft);margin-top:2px}
.pick .cnt{font-size:.78rem;font-weight:800;color:var(--pc);margin-top:8px}
.pick .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--pc);margin-right:6px;vertical-align:1px}
/* 읽기 진행률 패널 */
.progress{margin-top:22px;background:var(--surface);border:1px solid var(--line);border-radius:16px;
  padding:16px 18px;box-shadow:var(--shadow)}
.progress .row1{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.progress .big{font-family:'Fraunces',serif;font-weight:700;font-size:1.6rem;color:var(--teal-deep)}
.progress .sub{font-size:.86rem;color:var(--ink-soft)}
.progress .reset{margin-left:auto;border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);
  font:inherit;font-size:.76rem;font-weight:700;padding:5px 11px;border-radius:999px;cursor:pointer}
.bar{height:12px;border-radius:999px;background:var(--surface-2);overflow:hidden;margin-top:12px}
.bar > i{display:block;height:100%;width:0;border-radius:999px;
  background:linear-gradient(90deg,var(--teal),var(--amber));transition:width .35s ease}
section{padding-block:22px}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:6px;flex-wrap:wrap}
.sec-head h2{font-size:clamp(1.5rem,3.6vw,2.05rem)}
.sec-head .sub{color:var(--ink-soft);font-size:.9rem}
/* 주제별 컬렉션 */
.theme{margin-top:22px;background:var(--surface);border:1px solid var(--line);border-radius:18px;
  padding:16px 16px 18px;box-shadow:var(--shadow)}
.theme .th{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 2px 12px}
.theme .th .emo{font-size:1.35rem;line-height:1}
.theme .th h3{font-size:1.18rem}
.theme .th .agechip{font-size:.68rem;font-weight:800;color:#fff;background:var(--plum);padding:2px 8px;border-radius:7px;align-self:center}
.theme .th .hook{font-size:.86rem;color:var(--ink-soft);flex-basis:100%}
.strip{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.mini{display:flex;flex-direction:column;gap:6px}
.mini .mc{position:relative;aspect-ratio:3/4;border-radius:9px;overflow:hidden;background:var(--surface-2);box-shadow:var(--shadow)}
.mini .mc img{width:100%;height:100%;object-fit:cover;display:block}
.mini .mc .mph{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:8px;text-align:center;color:#fff}
.mini .mc .mph .pt{font-family:'Fraunces',serif;font-weight:600;font-size:.72rem;line-height:1.15}
.mini .mc.noimg .mph{display:flex}
.mini .mc .sc{position:absolute;bottom:5px;left:5px;background:var(--teal-deep);color:#fff;font-size:.6rem;font-weight:800;padding:2px 6px;border-radius:6px;display:none}
.mini.seen .mc{opacity:.5}
.mini.seen .mc .sc{display:block}
.mini .mt{font-size:.76rem;font-weight:700;line-height:1.2}
.mini .mr{font-size:.7rem;color:var(--ink-soft);line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media (max-width:640px){.strip{grid-template-columns:repeat(3,1fr)}}
@media (max-width:400px){.strip{grid-template-columns:repeat(2,1fr)}}
.toolbar{display:flex;align-items:center;gap:10px;margin:6px 0 20px;flex-wrap:wrap}
.togglelbl{display:inline-flex;align-items:center;gap:7px;font-size:.85rem;color:var(--ink);cursor:pointer;
  border:1px solid var(--line);background:var(--surface);padding:7px 12px;border-radius:999px;font-weight:700}
.togglelbl input{accent-color:var(--teal-deep);width:15px;height:15px}
/* 봤어요 버튼/상태 */
.seenbtn{border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);font:inherit;
  font-size:.8rem;font-weight:800;padding:7px 10px;border-radius:9px;cursor:pointer;margin-top:9px;
  display:flex;align-items:center;justify-content:center;gap:6px;transition:all .14s}
.seenbtn:hover{border-color:var(--teal-deep);color:var(--teal-deep)}
.card.seen{opacity:.62}
.card.seen:hover{opacity:1}
.card.seen .seenbtn{background:var(--teal-deep);border-color:var(--teal-deep);color:#fff}
.seencheck{position:absolute;bottom:8px;left:8px;background:var(--teal-deep);color:#fff;font-weight:800;
  font-size:.72rem;padding:3px 9px;border-radius:8px;display:none;box-shadow:var(--shadow)}
.card.seen .seencheck{display:block}
.toolbar select{padding:7px 11px;border-radius:9px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:.85rem}
.count{font-size:.85rem;color:var(--ink-soft);margin-left:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:18px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;
  box-shadow:var(--shadow);display:flex;flex-direction:column;transition:transform .16s,box-shadow .16s}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}
.cover{position:relative;aspect-ratio:3/4;background:var(--surface-2);overflow:hidden}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
.cover .ph{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:14px;text-align:center;color:#fff}
.cover .ph .pt{font-family:'Fraunces',serif;font-weight:600;font-size:.95rem;line-height:1.2}
.cover.noimg .ph{display:flex}
.grank{position:absolute;top:8px;left:8px;background:color-mix(in srgb,var(--ink) 82%,transparent);color:#fff;
  font-weight:800;font-size:.72rem;padding:3px 8px;border-radius:8px}
.bandtag{position:absolute;top:8px;right:8px;color:#fff;font-weight:800;font-size:.68rem;padding:3px 8px;border-radius:8px}
.card .body{padding:11px 12px 13px;display:flex;flex-direction:column;gap:3px;flex:1}
.card .t{font-family:'Fraunces',serif;font-weight:600;font-size:1rem;line-height:1.2}
.card .a{font-size:.78rem;color:var(--ink-soft)}
.card .why{font-size:.82rem;color:var(--ink);margin-top:7px;line-height:1.45}
.card .tags{margin-top:auto;padding-top:9px;display:flex;flex-wrap:wrap;gap:4px}
.chip2{font-size:.66rem;font-weight:700;padding:2px 7px;border-radius:6px;background:var(--surface-2);color:var(--ink-soft)}
.chip2.lib{background:color-mix(in srgb,var(--amber) 25%,transparent);color:var(--ink)}
.chip2.award{background:color-mix(in srgb,#E9A63B 32%,transparent);color:var(--ink)}
.more{display:block;margin:24px auto 0;padding:11px 22px;border-radius:999px;border:1px solid var(--line);
  background:var(--surface);color:var(--ink);font:inherit;font-weight:700;cursor:pointer;box-shadow:var(--shadow)}
footer{border-top:1px solid var(--line);margin-top:34px;padding-block:26px 42px}
footer p{color:var(--ink-soft);font-size:.82rem;margin:.3em 0}
@media (max-width:560px){.top .brand span.full{display:none}
  .grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}}
</style>

<header class="top"><div class="wrap">
  <div class="brand"><span class="mark">책</span><span class="full">조이네 영어 그림책 책장</span></div>
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>
    <input id="q" type="search" placeholder="제목·작가 검색" autocomplete="off">
  </div>
  <button class="themebtn" id="theme" title="테마 전환">◐</button>
</div></header>

<main class="wrap">
  <section class="hero">
    <div class="eyebrow">Goodreads · 전세계 독자 인기순</div>
    <h1>파닉스 전, 세계 아이들이 사랑한 영어 그림책</h1>
    <p class="lead">파닉스를 시작하기 전, 엄마가 부담 없이 골라 읽어주기 좋은 그림책을
      <strong>전세계 독자들이 가장 많이 담고 읽은 순서</strong>로 정리했어요.
      연령대만 고르면 바로 후보가 나옵니다.</p>
    <div class="pick" id="pick"></div>
    <div class="progress" id="progress">
      <div class="row1">
        <span class="big" id="prBig">0%</span>
        <span class="sub" id="prSub">아직 체크한 책이 없어요 · 카드의 <strong>봤어요</strong>를 눌러 기록하세요</span>
        <button class="reset" id="prReset">기록 초기화</button>
      </div>
      <div class="bar"><i id="prBar"></i></div>
    </div>
    <p class="note">※ Goodreads의 board-books·toddler·picture-books 인기 셸프를 합산한 순위입니다.
      국내에서 사기 쉬운 명작 위주라, 노부영·웬디북 등에서 대부분 구하거나 도서관에서 빌릴 수 있어요.
      일부 책에는 국내 공공도서관 대출 데이터도 함께 표시했습니다.</p>
    <a class="cta" href="https://wh-jaimie.github.io/joy-curation/challenge.html">
      <div><div class="big">📚 파닉스 전 120권 챌린지</div>
        <div class="sm">매번 안 고르고 싶다면 — 24개 주제 × 5권, 난이도 계단으로 그냥 따라오세요</div></div>
      <span class="go">코스 보기 →</span>
    </a>
  </section>

  <section>
    <div class="sec-head">
      <h2>주제별 컬렉션</h2>
      <span class="sub">인스타에 올리기 좋은 5권 묶음 · 표지를 캡처해 카드로 쓰세요</span>
    </div>
    <div id="themes"></div>
  </section>

  <section>
    <div class="sec-head"><h2>전체 목록</h2><span class="sub">106권을 연령대·검색으로 찾아보세요</span></div>
    <div class="toolbar">
      <label>정렬 <select id="sort">
        <option value="rank">전세계 인기순</option>
        <option value="title">제목순</option>
        <option value="lib">국내 도서관 대출순</option>
      </select></label>
      <label class="togglelbl"><input type="checkbox" id="unseen"> 안 본 책만</label>
      <span class="count" id="count"></span>
    </div>
    <div class="grid" id="grid"></div>
    <button class="more" id="more" hidden>더 보기</button>
  </section>
</main>

<footer><div class="wrap">
  <p><strong>조이네 영어 그림책 책장</strong> — 파닉스 전 큐레이션</p>
  <p>인기순 출처: Goodreads 인기 셸프(board-books·toddler·picture-books) · 표지: Open Library · 국내 대출: 도서관 정보나루</p>
</div></footer>

<script>
const P=/*DATA*/;const {books,bands,themes}=P;
const byId=Object.fromEntries(books.map(b=>[b.id,b]));
const esc=s=>(s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bandColor={A:'var(--bandA)',B:'var(--bandB)',C:'var(--bandC)'};
const bandName={A:'아기·첫책',B:'유아',C:'미취학'};
let curBand='ALL',curSort='rank',curQ='',shown=48,unseenOnly=false;

// ── 봤어요 기록 (기기에 저장) ──
const SEEN_KEY='joy-seen';
let seen=new Set();
try{const raw=localStorage.getItem(SEEN_KEY);if(raw)seen=new Set(JSON.parse(raw));}catch(e){}
function saveSeen(){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...seen]));}catch(e){}}
function updateProgress(){
  const total=books.length,done=books.filter(b=>seen.has(b.id)).length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('prBig').textContent=pct+'%';
  document.getElementById('prBar').style.width=pct+'%';
  document.getElementById('prSub').innerHTML= done===0
    ? '아직 체크한 책이 없어요 · 카드의 <strong>봤어요</strong>를 눌러 기록하세요'
    : `전체 ${total}권 중 <strong>${done}권</strong>을 봤어요`;
}
function toggleSeen(id){
  if(seen.has(id))seen.delete(id);else seen.add(id);
  saveSeen();updateProgress();
  if(unseenOnly)render();else{
    document.querySelectorAll(`.seenbtn[data-id="${CSS.escape(id)}"]`).forEach(btn=>{
      const on=seen.has(id);btn.textContent=on?'✓ 봤어요':'☐ 봤어요';
      btn.closest('.card').classList.toggle('seen',on);
    });
  }
}

// 연령대 고르기 버튼
document.getElementById('pick').innerHTML =
  `<button data-b="ALL" style="--pc:var(--teal-deep)"><div class="bk">전체 보기</div><div class="age">모든 연령</div><div class="cnt">${books.length}권</div></button>`+
  bands.map(([k,nm,age,cnt])=>`<button data-b="${k}" style="--pc:${bandColor[k]}">
    <div class="bk"><span class="dot"></span>${nm}</div><div class="age">${age}</div><div class="cnt">${cnt}권</div></button>`).join('');
document.querySelectorAll('#pick button').forEach(btn=>btn.addEventListener('click',()=>{
  curBand=btn.dataset.b;shown=48;
  document.querySelectorAll('#pick button').forEach(b=>b.classList.toggle('active',b===btn));render();
}));
document.getElementById('sort').addEventListener('change',e=>{curSort=e.target.value;render();});
document.getElementById('q').addEventListener('input',e=>{curQ=e.target.value.toLowerCase().trim();shown=48;render();});
document.getElementById('more').addEventListener('click',()=>{shown+=48;render();});
document.getElementById('unseen').addEventListener('change',e=>{unseenOnly=e.target.checked;shown=48;render();});
document.getElementById('grid').addEventListener('click',e=>{
  const btn=e.target.closest('.seenbtn');if(btn)toggleSeen(btn.dataset.id);
});
document.getElementById('prReset').addEventListener('click',()=>{
  if(seen.size===0)return;
  if(confirm('봤어요 기록을 모두 지울까요?')){seen.clear();saveSeen();updateProgress();render();}
});
window._imgErr=el=>{el.parentElement.classList.add('noimg');el.remove();};

function filtered(){
  let r=books.filter(b=>{
    if(curBand!=='ALL'&&b.band_key!==curBand)return false;
    if(unseenOnly&&seen.has(b.id))return false;
    if(curQ&&!(b.title+' '+b.author).toLowerCase().includes(curQ))return false;
    return true;
  });
  if(curSort==='title')r.sort((a,b)=>a.title.localeCompare(b.title));
  else if(curSort==='lib')r.sort((a,b)=>b.lib_loans-a.lib_loans||a.rank-b.rank);
  else r.sort((a,b)=>a.rank-b.rank);
  return r;
}
function card(b){
  const c=bandColor[b.band_key];
  return `<article class="card${seen.has(b.id)?' seen':''}">
    <div class="cover">
      ${b.cover?`<img loading="lazy" src="${esc(b.cover)}" alt="${esc(b.title)}" onerror="_imgErr(this)">`:''}
      <div class="ph" style="background:linear-gradient(150deg,${c},color-mix(in srgb,${c} 60%,#000))"><div class="pt">${esc(b.title)}</div></div>
      <span class="grank tnum">인기 #${b.rank}</span>
      <span class="bandtag" style="background:${c}">${bandName[b.band_key]}</span>
      <span class="seencheck">✓ 봤어요</span>
    </div>
    <div class="body">
      <div class="t">${esc(b.title)}</div>
      <div class="a">${esc(b.author)}${b.year?' · '+b.year:''}</div>
      ${b.reason?`<div class="why">${esc(b.reason)}</div>`:''}
      <div class="tags">
        ${b.award?`<span class="chip2 award">${esc(b.award)}</span>`:''}
        ${b.shelves.map(s=>`<span class="chip2">${esc(s)}</span>`).join('')}
        ${b.lib_loans?`<span class="chip2 lib tnum">📚 국내도서관 ${b.lib_loans}회</span>`:''}
      </div>
      <button class="seenbtn" data-id="${esc(b.id)}">${seen.has(b.id)?'✓ 봤어요':'☐ 봤어요'}</button>
    </div>
  </article>`;
}
function render(){
  const r=filtered();
  document.getElementById('count').textContent=`${r.length}권`;
  document.getElementById('grid').innerHTML=r.slice(0,shown).map(card).join('');
  document.getElementById('more').hidden=r.length<=shown;
}
const root=document.documentElement;
try{const t=localStorage.getItem('joy-theme');if(t)root.setAttribute('data-theme',t);}catch(e){}
document.getElementById('theme').addEventListener('click',()=>{
  const cur=root.getAttribute('data-theme');
  const dark=cur?cur==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
  const next=dark?'light':'dark';root.setAttribute('data-theme',next);
  try{localStorage.setItem('joy-theme',next);}catch(e){}
});
// 주제별 컬렉션 렌더
function renderThemes(){
  document.getElementById('themes').innerHTML = themes.map(t=>`
    <div class="theme">
      <div class="th">
        <span class="emo">${t.emoji}</span><h3>${esc(t.title)}</h3>
        ${t.age?`<span class="agechip">${esc(t.age)}</span>`:''}
        <span class="hook">${esc(t.hook)}</span>
      </div>
      <div class="strip">
        ${t.ids.map(id=>byId[id]).filter(Boolean).map(b=>`
          <div class="mini${seen.has(b.id)?' seen':''}" data-id="${esc(b.id)}">
            <div class="mc">
              ${b.cover?`<img loading="lazy" src="${esc(b.cover)}" alt="${esc(b.title)}" onerror="_imgErr(this)">`:''}
              <div class="mph" style="background:linear-gradient(150deg,${bandColor[b.band_key]},#0006)"><div class="pt">${esc(b.title)}</div></div>
              <span class="sc">✓</span>
            </div>
            <div class="mt">${esc(b.title)}</div>
            <div class="mr">${esc(b.reason||'')}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}
// 봤어요 토글 시 주제 섹션의 표시도 갱신
const _origToggle=toggleSeen;
toggleSeen=function(id){_origToggle(id);
  document.querySelectorAll(`.mini[data-id="${CSS.escape(id)}"]`).forEach(m=>m.classList.toggle('seen',seen.has(id)));
};
renderThemes();
updateProgress();
render();
</script>
"""

html_out = TEMPLATE.replace("/*DATA*/", json.dumps(payload, ensure_ascii=False))
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)
print(f"생성: {OUT} ({len(html_out)//1024} KB), {len(books)}종")
