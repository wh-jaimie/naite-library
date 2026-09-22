# -*- coding: utf-8 -*-
"""조이네영어도서관 사이트 재구성: 랜딩 + 글로벌100 + 국내50 + 주제별컬렉션 (정적 페이지)"""
import os, json, re, time, html, urllib.request, urllib.parse
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
    cover_map.setdefault(norm(b["title"]),b.get("cover")); award_map[norm(b["title"])]=b.get("award","")
    if b.get("lib_loans"): lib_map[norm(b["title"])]=b["lib_loans"]
for t in ch:
    for b in t["books"]:
        cover_map.setdefault(norm(b["title"]),b.get("cover"))
        if b.get("award"): award_map.setdefault(norm(b["title"]),b["award"])
        if b.get("lib_loans"): lib_map.setdefault(norm(b["title"]),b["lib_loans"])

# ── 국내 통합순위 50 ──
DOMESTIC=[
(1,"Peppa Pig 시리즈","Peppa Pig","2~6","3채널 1위급 스테디"),
(2,"The Color Monster (감정 팝업)","The Color Monster","3~6","감정교육 대표"),
(3,"Don't Push the Button!","Don't Push the Button","2~5","인터랙티브"),
(4,"Ketchup on Your Cornflakes?","Ketchup on Your Cornflakes","2~6","플랩북"),
(5,"The Watermelon Seed","The Watermelon Seed","3~6","가이젤상"),
(6,"Maisy 시리즈","Maisy","2~5","조작북 다수"),
(7,"No, David! / David 시리즈","No David","3~6","쉬움(AR0.9)"),
(8,"Piggybook","Piggybook","4~8","앤서니 브라운"),
(9,"The Dot","The Dot","5~9","피터 레이놀즈"),
(10,"Skeleton Hiccups","Skeleton Hiccups","3~7","핼러윈"),
(11,"Where's Wally? 세트","Where's Wally","5~9","찾기놀이"),
(12,"Mo Willems: Pigeon 시리즈","Don't Let the Pigeon Drive the Bus","3~7","유머 대표"),
(13,"Elephant & Piggie 시리즈","There Is a Bird on Your Head","4~7","리더스 겸용(AR1.1)"),
(14,"Pete the Cat: I Love My White Shoes","Pete the Cat I Love My White Shoes","3~6","노래책"),
(15,"Dear Zoo","Dear Zoo","1~4","저연령 필수 플랩"),
(16,"Library Lion","Library Lion","4~8","AR2.8"),
(17,"Truck Full of Ducks","Truck Full of Ducks","3~6","AR1.4"),
(18,"Knuffle Bunny 세트","Knuffle Bunny","2~6","칼데콧 아너"),
(19,"노부영 Baby 세트 (Choo Choo 등)","Choo Choo","0~3","노래·조작"),
(20,"Froggy 시리즈","Froggy Gets Dressed","4~8","AR1.8~2.6"),
(21,"600 Black Spots","600 Black Spots","2~6","인터랙티브 팝업"),
(22,"I Will Not Ever Never Eat a Tomato","I Will Not Ever Never Eat a Tomato","3~7","찰리와 롤라·편식"),
(23,"Meg and Mog","Meg and Mog","4~8","AR2.5"),
(24,"Indestructibles 츄잉북","Indestructibles","0~2","찢김X·세탁O"),
(25,"The Giving Tree","The Giving Tree","5~9","쉘 실버스타인"),
(26,"Last Stop on Market Street","Last Stop on Market Street","5~9","뉴베리 대상"),
(27,"The Grouchy Ladybug","The Grouchy Ladybug","3~7","에릭 칼"),
(28,"My Lucky Day","My Lucky Day","4~8","AR2.3"),
(29,"Shark in the Park","Shark in the Park","3~6","AR1.3"),
(30,"Interrupting Chicken","Interrupting Chicken","4~8","칼데콧 아너"),
(31,"A Big Mooncake for Little Star","A Big Mooncake for Little Star","3~7","칼데콧 아너"),
(32,"The Gardener","The Gardener","5~9","AR3.9"),
(33,"The Crocodile Who Didn't Like Water","The Crocodile Who Didn't Like Water","3~7","AR2.0"),
(34,"Thank You, Mr. Falker","Thank You Mr Falker","6~9","난독증 성장"),
(35,"Brown Bear, Brown Bear, What Do You See?","Brown Bear Brown Bear What Do You See","1~4","에릭 칼·노부영"),
(36,"From Head to Toe","From Head to Toe","2~5","에릭 칼·신체"),
(37,"Today Is Monday","Today Is Monday","2~5","에릭 칼·요일"),
(38,"Polar Bear, Polar Bear, What Do You Hear?","Polar Bear Polar Bear What Do You Hear","1~4","에릭 칼"),
(39,"Press Here","Press Here","3~6","인터랙티브 명작"),
(40,"Go Away, Big Green Monster!","Go Away Big Green Monster","2~5","감정·공포 극복"),
(41,"Where the Wild Things Are","Where the Wild Things Are","4~8","1964 칼데콧"),
(42,"This Is Not My Hat","This Is Not My Hat","4~8","2013 칼데콧"),
(43,"Sam and Dave Dig a Hole","Sam and Dave Dig a Hole","4~8","2015 칼데콧 아너"),
(44,"Creepy Carrots!","Creepy Carrots","4~8","2013 칼데콧 아너"),
(45,"My Dad / My Mum","My Mum","3~7","앤서니 브라운"),
(46,"The True Story of the 3 Little Pigs","The True Story of the 3 Little Pigs","5~9","패러디 명작"),
(47,"Doctor De Soto","Doctor De Soto","5~9","1983 뉴베리 아너"),
(48,"That Is Not a Good Idea!","That Is Not a Good Idea","4~7","모 윌렘스"),
(49,"Frog and Toad 시리즈","Frog and Toad Are Friends","5~8","뉴베리 아너·리더스"),
(50,"Hi! Fly Guy","Hi Fly Guy","4~7","가이젤 아너·리더스"),
]
DOM_SET={norm(d[2]) for d in DOMESTIC}

def ol(title):
    for params in ({"title":title,"limit":1,"fields":"isbn,cover_i"},):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(
                "https://openlibrary.org/search.json?"+urllib.parse.urlencode(params),
                headers={"User-Agent":UA}),timeout=15).read().decode())
            doc=(d.get("docs") or [{}])[0]
            if doc.get("cover_i"): return f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
            if doc.get("isbn"): return f"https://covers.openlibrary.org/b/isbn/{doc['isbn'][0]}-L.jpg"
        except Exception: pass
    return None

# domestic covers
domestic=[]
for rank,ko,en,age,note in DOMESTIC:
    cov=cover_map.get(norm(en))
    if not cov:
        cov=ol(en); time.sleep(DELAY)
    domestic.append({"rank":rank,"ko":ko,"en":en,"age":age,"note":note,"cover":cov,
                     "award":award_map.get(norm(en),""),"lib":lib_map.get(norm(en),0)})
print("국내50 표지:",sum(1 for d in domestic if d['cover']),"/50")

# ── 공통 CSS/셸 ──
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

# ── 글로벌 100 ──
gm_sorted=sorted([b for b in gm if b.get("rank")],key=lambda b:b["rank"])[:100]
cards=[]
for b in gm_sorted:
    badges=[]
    if norm(b["title"]) in DOM_SET: badges.append(("k","🇰🇷 국내 인기"))
    if b.get("award"): badges.append(("a",b["award"]))
    if b.get("lib_loans"): badges.append(("l",f"📚 도서관 {b['lib_loans']}회"))
    cards.append(card(b.get("cover"),b["title"],b.get("author",""),rank=b["rank"],badges=badges))
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">Goodreads · 전세계 독자 인기순</div><h1>🌍 세계 인기 그림책 100</h1><p>전세계 독자들이 가장 많이 담고 읽은 파닉스 전 그림책 100권. 순위는 전세계 인기순이에요.</p></div><section><p class="count">100권</p><div class="grid">{"".join(cards)}</div></section></main>'
open(os.path.join(DOCS,"global.html"),"w",encoding="utf-8").write(page("세계 인기 그림책 100",body))

# ── 국내 50 ──
cards=[]
for d in domestic:
    badges=[]
    if norm(d["en"]) in {norm(x["title"]) for x in gm if x.get("rank")}: badges.append(("g","🌍 세계 인기"))
    if d["award"]: badges.append(("a",d["award"]))
    if d["lib"]: badges.append(("l",f"📚 도서관 {d['lib']}회"))
    if d["note"]: badges.append(("n",d["note"]))
    extra=f'<div class="ba">권장 {esc(d["age"])}세</div>'
    cards.append(card(d["cover"],d["ko"],"",rank=d["rank"],badges=badges,extra=extra))
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">국내 서점 통합 순위</div><h1>🇰🇷 국내 인기 그림책 50</h1><p>교보·예스24·알라딘 등 국내 서점에서 많이 팔린 영어 그림책 50권. 순위·권장연령·특징을 함께 담았어요.</p></div><section><p class="count">50권</p><div class="grid">{"".join(cards)}</div></section></main>'
open(os.path.join(DOCS,"domestic.html"),"w",encoding="utf-8").write(page("국내 인기 그림책 50",body))

# ── 주제별 컬렉션 10 ──
THEMES=[("🌙","잠들기 전, 잠자리 그림책",[2,23,29,9,53]),("🎵","노래처럼 읽는 첫 책",[4,10,94,35,85]),
("🐛","에릭 칼 대표작",[1,3,22,16,46]),("🐾","동물이 가득",[6,5,36,62,32]),
("👶","아기 첫 보드북",[42,51,44,88,98]),("✋","만지고 참여하는 책",[80,12,84,69,99]),
("❤️","사랑을 전하는 책",[7,24,79,66,100]),("🚗","붕붕! 탈것 & 움직임",[11,18,48,104,101]),
("🌟","마음이 자라는 그림책",[14,74,105,33,60]),("🏅","세계가 사랑한 명작",[19,75,97,102,103])]
by_rank={b["rank"]:b for b in gm if b.get("rank")}
blocks=[]
for emo,name,ranks in THEMES:
    items=[by_rank[r] for r in ranks if r in by_rank]
    cs=[]
    for b in items:
        badges=[]
        if norm(b["title"]) in DOM_SET: badges.append(("k","🇰🇷 국내 인기"))
        if b.get("award"): badges.append(("a",b["award"]))
        cs.append(card(b.get("cover"),b["title"],b.get("author",""),badges=badges,
                       extra=(f'<div class="ba" style="margin-top:4px">{esc(b.get("reason",""))}</div>' if b.get("reason") else "")))
    blocks.append(f'<section><h2 style="font-size:1.4rem;margin-bottom:2px">{emo} {esc(name)}</h2><div class="grid" style="margin-top:12px">{"".join(cs)}</div></section>')
body=f'<main class="wrap"><div class="hero"><div class="eyebrow">주제별 5권 묶음</div><h1>🗂️ 주제별 컬렉션</h1><p>인스타·스터디에 쓰기 좋은 5권 묶음. 표지를 캡처해 카드로 쓰세요.</p></div>{"".join(blocks)}</main>'
open(os.path.join(DOCS,"collections.html"),"w",encoding="utf-8").write(page("주제별 컬렉션",body,search=False))

print("생성: docs/global.html, domestic.html, collections.html")
PY_DONE=True
