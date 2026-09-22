# -*- coding: utf-8 -*-
"""조이네영어도서관 사이트: 랜딩 + 세계100 + 국내100 + 주제별 + badges.js"""
import os, json, re, time, html, urllib.request, urllib.parse
from data_domestic import DOMESTIC_ALL, AWARDS_EXTRA
from data_global import GLOBAL_100
HERE=os.path.dirname(os.path.abspath(__file__)); DOCS=os.path.join(HERE,"docs")
UA="ChoiEnglishLibrary/1.0"; DELAY=0.25
def esc(s): return html.escape(str(s) if s is not None else "")
def norm(t):
    t=(t or "").lower(); t=re.split(r"[:(]",t)[0]; t=t.replace("&","and").replace("'","")
    return re.sub(r"[^a-z0-9]+"," ",t).strip()

gm=json.load(open(os.path.join(HERE,"output","gr_master.json"),encoding="utf-8"))["books"]
ch=json.load(open(os.path.join(HERE,"output","challenge.json"),encoding="utf-8"))["themes"]
cover_map={}; award_map={}; lib_map={}
for b in gm:
    cover_map.setdefault(norm(b["title"]),b.get("cover"))
    if b.get("award"): award_map[norm(b["title"])]=b["award"]
    if b.get("lib_loans"): lib_map[norm(b["title"])]=b["lib_loans"]
for t in ch:
    for b in t["books"]:
        cover_map.setdefault(norm(b["title"]),b.get("cover"))
        if b.get("award"): award_map.setdefault(norm(b["title"]),b["award"])
        if b.get("lib_loans"): lib_map.setdefault(norm(b["title"]),b["lib_loans"])
# 국내 비고 수상정보 병합(우선)
for k,v in AWARDS_EXTRA.items(): award_map[k]=v
def award_of(t): return award_map.get(norm(t),"")
def lib_of(t): return lib_map.get(norm(t),0)

DOM_SET={norm(d[2]) for d in DOMESTIC_ALL}
WORLD_SET={norm(t) for _,t,_ in GLOBAL_100}
WORLD_RANK={norm(t):r for r,t,_ in GLOBAL_100}

def ol(title):
    try:
        d=json.loads(urllib.request.urlopen(urllib.request.Request(
            "https://openlibrary.org/search.json?"+urllib.parse.urlencode({"title":title,"limit":1,"fields":"isbn,cover_i"}),
            headers={"User-Agent":UA}),timeout=15).read().decode())
        doc=(d.get("docs") or [{}])[0]
        if doc.get("cover_i"): return f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
        if doc.get("isbn"): return f"https://covers.openlibrary.org/b/isbn/{doc['isbn'][0]}-L.jpg"
    except Exception: pass
    return None

domestic=[]
for rank,ko,en,age,note in DOMESTIC_ALL:
    cov=cover_map.get(norm(en))
    if not cov: cov=ol(en); time.sleep(DELAY)
    domestic.append({"rank":rank,"ko":ko,"en":en,"age":age,"note":note,"cover":cov,
                     "award":award_of(en),"lib":lib_of(en)})
print("국내100 표지:",sum(1 for d in domestic if d['cover']),"/",len(domestic))

CSS="""*{box-sizing:border-box}html,body{margin:0}
body{background:#F6F2E9;color:#2B2A26;font-family:'Nunito Sans',system-ui,-apple-system,'Segoe UI','Malgun Gothic',sans-serif;line-height:1.55}
:root{--surface:#FFFDF8;--line:#E2DAC9;--soft:#6C665A;--teal:#0E7C7B;--tealD:#0A5E5D;--coral:#E8623C;--amber:#E9A63B;--sh:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07);--shL:0 10px 30px rgba(43,42,38,.14)}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px}
h1,h2,h3{font-family:Georgia,'Nanum Myeongjo',serif;margin:0;line-height:1.15;text-wrap:balance}
a{color:var(--tealD);text-decoration:none}
.top{position:sticky;top:0;z-index:20;background:rgba(246,242,233,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:12px;padding:11px 18px}
.brand{font-family:Georgia,serif;font-weight:700}
.top .search{margin-left:auto;flex:1;max-width:300px}
.top .search input{width:100%;padding:8px 13px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:inherit;font-size:.9rem}
.hero{padding:40px 0 8px}
.eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--coral)}
.hero h1{font-size:clamp(1.9rem,5vw,2.7rem);margin:.3em 0}
.hero p{color:var(--soft);max-width:64ch}
section{padding:18px 0 40px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:13px;overflow:hidden;box-shadow:var(--sh);display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-3px);box-shadow:var(--shL)}
.cv{position:relative;aspect-ratio:3/4;background:#EDE6D6}.cv img{width:100%;height:100%;object-fit:cover;display:block}
.cv .ph{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:12px;text-align:center;color:#fff;background:linear-gradient(150deg,var(--teal),var(--tealD))}
.cv.noimg .ph{display:flex}.cv .ph .pt{font-family:Georgia,serif;font-weight:700;font-size:.85rem}
.rk{position:absolute;top:7px;left:7px;background:var(--coral);color:#fff;font-weight:800;font-size:.72rem;padding:2px 8px;border-radius:8px;box-shadow:var(--sh)}
.bb{padding:10px 11px 12px;display:flex;flex-direction:column;gap:2px;flex:1}
.bt{font-family:Georgia,serif;font-weight:700;font-size:.95rem;line-height:1.2}
.ba{font-size:.76rem;color:var(--soft)}
.badges{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.bg{font-size:.63rem;font-weight:800;padding:2px 6px;border-radius:6px}
.bg.k{background:#fbe0de;color:#a2231d}.bg.g{background:#e7f1f0;color:#0A5E5D}.bg.l{background:#fbeee0;color:#8a5a1a}.bg.a{background:#f3e9c9;color:#7a5a00}.bg.n{background:#efe7d6;color:#6C665A}
.foot{border-top:1px solid var(--line);margin-top:20px;padding:22px 0 44px;color:var(--soft);font-size:.82rem;text-align:center}
.count{font-size:.85rem;color:var(--soft);margin:0 0 14px}
@media (max-width:560px){.grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}}"""
FONT='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap">'
def page(title, body, search=True):
    si='<div class="search"><input type="search" id="q" placeholder="제목·작가 검색"></div>' if search else ''
    sj="""<script>var q=document.getElementById('q');if(q)q.addEventListener('input',function(e){var v=e.target.value.toLowerCase().trim();document.querySelectorAll('[data-text]').forEach(function(c){c.style.display=(!v||c.getAttribute('data-text').indexOf(v)>=0)?'':'none';});});
document.querySelectorAll('.cv img').forEach(function(im){im.addEventListener('error',function(){im.parentElement.classList.add('noimg');im.remove();});});</script>"""
    return f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>{esc(title)}</title>{FONT}<style>{CSS}</style></head><body>
<div class="top"><div class="wrap"><a class="brand" href="index.html">📚 조이네영어도서관</a>{si}</div></div>
{body}
<div class="foot"><div class="wrap">조이네영어도서관 · 큐레이션: 전세계 인기(Goodreads)·국내 서점 통합순위 · 표지: Open Library</div></div>
{sj}</body></html>"""
def card(cover,title,author,rank=None,badges=None,extra=""):
    bg="".join(f'<span class="bg {c}">{esc(t)}</span>' for c,t in (badges or []))
    dtext=esc((title+" "+(author or "")).lower())
    return (f'<article class="card" data-text="{dtext}"><div class="cv">'
            + (f'<img loading="lazy" src="{esc(cover)}" alt="{esc(title)}">' if cover else '')
            + f'<div class="ph"><div class="pt">{esc(title)}</div></div>'
            + (f'<span class="rk">#{rank}</span>' if rank else '')
            + f'</div><div class="bb"><div class="bt">{esc(title)}</div>'
            + (f'<div class="ba">{esc(author)}</div>' if author else '')
            + extra
            + (f'<div class="badges">{bg}</div>' if bg else '')
            + '</div></article>')

# 세계 100 (여러 서점 통합순위)
cards=[]
for rank,title,author in GLOBAL_100:
    n=norm(title)
    cov=cover_map.get(n)
    if not cov: cov=ol(title); cover_map[n]=cov; time.sleep(DELAY)
    badges=[]
    if n in DOM_SET: badges.append(("k","🇰🇷 국내 인기"))
    if award_of(title): badges.append(("a",award_of(title)))
    if lib_of(title): badges.append(("l",f"📚 도서관 {lib_of(title)}회"))
    cards.append(card(cov,title,author,rank=rank,badges=badges))
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">여러 서점 통합순위</div><h1>🌍 세계 인기 그림책 100</h1><p>여러 온·오프라인 서점(미국·영국·글로벌)의 베스트셀러를 통합한 세계적으로 유명한 그림책 100권.</p></div><section><p class="count">100권</p><div class="grid">{"".join(cards)}</div></section></main>'
open(os.path.join(DOCS,"global.html"),"w",encoding="utf-8").write(page("세계 인기 그림책 100",body))

# 국내 100
cards=[]
for d in domestic:
    badges=[]
    if norm(d["en"]) in WORLD_SET: badges.append(("g","🌍 세계 인기"))
    if d["award"]: badges.append(("a",d["award"]))
    if d["lib"]: badges.append(("l",f"📚 도서관 {d['lib']}회"))
    if d["note"]: badges.append(("n",d["note"]))
    extra=f'<div class="ba">권장 {esc(d["age"])}세</div>'
    cards.append(card(d["cover"],d["ko"],"",rank=d["rank"],badges=badges,extra=extra))
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">국내 서점 통합 순위</div><h1>🇰🇷 국내 인기 그림책 100</h1><p>교보·예스24·알라딘 등 국내 서점에서 많이 팔린 영어 그림책 100권. 순위·권장연령·특징·수상을 함께 담았어요.</p></div><section><p class="count">100권</p><div class="grid">{"".join(cards)}</div></section></main>'
open(os.path.join(DOCS,"domestic.html"),"w",encoding="utf-8").write(page("국내 인기 그림책 100",body))

# 주제별 컬렉션
THEMES=[("🌙","잠들기 전, 잠자리 그림책",[2,23,29,9,53]),("🎵","노래처럼 읽는 첫 책",[4,10,94,35,85]),
("🐛","에릭 칼 대표작",[1,3,22,16,46]),("🐾","동물이 가득",[6,5,36,62,32]),
("👶","아기 첫 보드북",[42,51,44,88,98]),("✋","만지고 참여하는 책",[80,12,84,69,99]),
("❤️","사랑을 전하는 책",[7,24,79,66,100]),("🚗","붕붕! 탈것 & 움직임",[11,18,48,104,101]),
("🌟","마음이 자라는 그림책",[14,74,105,33,60]),("🏅","세계가 사랑한 명작",[19,75,97,102,103])]
by_rank={b["rank"]:b for b in gm if b.get("rank")}
blocks=[]
for emo,name,ranks in THEMES:
    items=[by_rank[r] for r in ranks if r in by_rank]; cs=[]
    for b in items:
        badges=[]
        if norm(b["title"]) in WORLD_SET: badges.append(("g","🌍 세계 인기"))
        if norm(b["title"]) in DOM_SET: badges.append(("k","🇰🇷 국내 인기"))
        if award_of(b["title"]): badges.append(("a",award_of(b["title"])))
        if b.get("lib_loans"): badges.append(("l",f"📚 도서관 {b['lib_loans']}회"))
        cs.append(card(b.get("cover"),b["title"],b.get("author",""),badges=badges,
                       extra=(f'<div class="ba" style="margin-top:4px">{esc(b.get("reason",""))}</div>' if b.get("reason") else "")))
    blocks.append(f'<section><h2 style="font-size:1.4rem;margin-bottom:2px">{emo} {esc(name)}</h2><div class="grid" style="margin-top:12px">{"".join(cs)}</div></section>')
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">주제별 5권 묶음</div><h1>🗂️ 주제별 컬렉션</h1><p>인스타·스터디에 쓰기 좋은 5권 묶음. 표지를 캡처해 카드로 쓰세요.</p></div>{"".join(blocks)}</main>'
open(os.path.join(DOCS,"collections.html"),"w",encoding="utf-8").write(page("주제별 컬렉션",body,search=False))

# badges.js (세계=새 통합순위, 국내=국내100, 수상/도서관)
badge_map={}
for n,r in WORLD_RANK.items():
    e={"w":r}
    if award_of(n): e["a"]=award_of(n)
    if lib_map.get(n): e["l"]=lib_map[n]
    if n in DOM_SET: e["k"]=1
    badge_map[n]=e
for d in domestic:
    n=norm(d["en"]); e=badge_map.get(n,{}); e["k"]=1
    if d["award"]: e["a"]=d["award"]
    if d["lib"]: e.setdefault("l",d["lib"])
    badge_map[n]=e
# 도서관/수상 정보가 있는 나머지도 포함(세계·국내 아니어도)
for n,v in lib_map.items():
    e=badge_map.setdefault(n,{}); e.setdefault("l",v)
    if award_of(n): e.setdefault("a",award_of(n))
open(os.path.join(DOCS,"badges.js"),"w",encoding="utf-8").write("window.BADGES="+json.dumps(badge_map,ensure_ascii=False)+";")
print("생성: global.html, domestic.html(100), collections.html, badges.js  (배지 항목", len(badge_map),")")
