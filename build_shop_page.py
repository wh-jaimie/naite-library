# -*- coding: utf-8 -*-
"""국내 인기 책장 = '책 살 때 참고하는' 구매용 페이지 → docs/domestic.html + docs/shop_data.json

데이터: data_domestic.DOMESTIC_ALL(국내 서점 통합순위 100) + output/shop_prices.json(교보·동방북스 최저가, 구매처조사/shop_prices.py)
      + 표지(기존 domestic.html에서 재사용) + 수상(build_site와 같은 소스) + 나이테 120 포함 여부.
쿠팡 링크는 페이지가 열릴 때 DB에서 읽음: 나이테 120 책 = list_buy_urls(), 그 밖 = shop_links 테이블(관리자 입력).
나이테 철학: AR·레벨 숫자는 화면에 내지 않음(특징 메모의 'AR…'·'쉬움' 표기 제거).
"""
import os, re, json, html
from data_domestic import DOMESTIC_ALL, AWARDS_EXTRA
from data_global import GLOBAL_100

HERE = os.path.dirname(os.path.abspath(__file__)); DOCS = os.path.join(HERE, "docs")
def norm(t):
    t = (t or "").lower(); t = re.split(r"[:(]", t)[0]; t = t.replace("&", "and").replace("'", "")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()

# 표지: 기존 국내 책장 페이지에서 순위별로 가져옴(재조회 안 함)
covers = {}
CV = os.path.join(HERE, "output", "shop_covers.json")
old = "" if os.path.exists(CV) else open(os.path.join(DOCS, "domestic.html"), encoding="utf-8").read()
if not os.path.exists(CV):  # 처음 한 번만: 예전 카드형 페이지에서 표지 추출 → shop_covers.json (이후엔 이 파일만 씀)
    for m in re.finditer(r'<article class="card".*?</article>', old, re.S):
        a = m.group(0); rk = re.search(r'class="rk">#(\d+)<', a); im = re.search(r'<img[^>]+src="([^"]+)"', a)
        if rk and im: covers[int(rk.group(1))] = im.group(1)
    json.dump(covers, open(os.path.join(HERE, "output", "shop_covers.json"), "w"), indent=0)
else:
    covers = {int(k): v for k, v in json.load(open(os.path.join(HERE, "output", "shop_covers.json"))).items()}

# 수상·도서관(build_site와 같은 소스)
gm = json.load(open(os.path.join(HERE, "output", "gr_master.json"), encoding="utf-8"))["books"]
ch = json.load(open(os.path.join(HERE, "output", "challenge.json"), encoding="utf-8"))["themes"]
award, lib = {}, {}
for b in gm:
    if b.get("award"): award[norm(b["title"])] = b["award"]
    if b.get("lib_loans"): lib[norm(b["title"])] = b["lib_loans"]
in120 = {}
for i, t in enumerate(ch):
    for b in t["books"]:
        n = norm(b["title"]); in120[n] = {"title": b["title"], "theme": t["ko"], "emoji": t["emoji"], "month": i + 1, "tier": b["tier_label"]}
        if b.get("award"): award.setdefault(n, b["award"])
        if b.get("lib_loans"): lib.setdefault(n, b["lib_loans"])
for k, v in AWARDS_EXTRA.items(): award[k] = v
world = {norm(t) for _, t, _ in GLOBAL_100}
prices = {}
pp = os.path.join(HERE, "output", "shop_prices.json")
if os.path.exists(pp): prices = json.load(open(pp, encoding="utf-8"))
PRICE_DAY = prices.get("checked", "")

AUTHORS = {  # en(검색 제목) → [작가(한글 표기)]
 "Ketchup on Your Cornflakes": ["닉 샤랫"], "Shark in the Park": ["닉 샤랫"],
 "Piggybook": ["앤서니 브라운"], "My Mum": ["앤서니 브라운"],
 "Mo Willems: Pigeon 시리즈": ["모 윌렘스"], "Don't Let the Pigeon Drive the Bus": ["모 윌렘스"], "Elephant & Piggie 시리즈": ["모 윌렘스"],
 "Knuffle Bunny 세트": ["모 윌렘스"], "That Is Not a Good Idea": ["모 윌렘스"], "Time to Pee": ["모 윌렘스"],
 "The Grouchy Ladybug": ["에릭 칼"], "From Head to Toe": ["에릭 칼"], "Today Is Monday": ["에릭 칼"], "The Very Hungry Caterpillar": ["에릭 칼"],
 "Brown Bear Brown Bear What Do You See": ["빌 마틴 주니어", "에릭 칼"], "Polar Bear Polar Bear What Do You Hear": ["빌 마틴 주니어", "에릭 칼"],
 "The Gruffalo": ["줄리아 도널드슨"], "Stick Man": ["줄리아 도널드슨"],
 "This Is Not My Hat": ["존 클라센"], "I Want My Hat Back": ["존 클라센"], "Sam and Dave Dig a Hole": ["맥 바넷", "존 클라센"],
 "Frog and Toad Are Friends": ["아널드 로벨"], "Mouse Soup": ["아널드 로벨"],
 "Press Here": ["에르베 튈레"], "Mix It Up": ["에르베 튈레"],
 "Go Away Big Green Monster": ["에드 엠벌리"], "Glad Monster Sad Monster": ["에드 엠벌리"],
 "Henry and Mudge": ["신시아 라일런트"], "Mr. Putter and Tabby": ["신시아 라일런트"],
 "600 Black Spots": ["데이비드 A. 카터"], "The Happy Little Yellow Box": ["데이비드 A. 카터"],
 "Hi Fly Guy": ["테드 아널드"], "Vincent Paints His House": ["테드 아널드"],
 "Goodnight I Love You": ["캐럴라인 제인 처치"], "Ten Tiny Toes": ["캐럴라인 제인 처치"],
 "Maisy": ["루시 커즌스"], "Miffy": ["딕 브루너"], "Where's Spot": ["에릭 힐"], "Dear Zoo": ["로드 캠벨"],
 "No David": ["데이비드 섀넌"], "How the Grinch Stole Christmas": ["닥터 수스"], "Where the Wild Things Are": ["모리스 샌닥"],
 "Swimmy": ["레오 리오니"], "The Tale of Peter Rabbit": ["베아트릭스 포터"], "The Giving Tree": ["쉘 실버스타인"],
 "The Dot": ["피터 레이놀즈"], "Kitten's First Full Moon": ["케빈 헹크스"], "Where Is the Green Sheep": ["멤 폭스"],
 "It's Okay to Be Different": ["토드 파"], "I Will Not Ever Never Eat a Tomato": ["로렌 차일드"],
 "Where's Wally? 세트": ["마틴 핸드포드"], "Fireworks": ["매슈 버제스", "카티아 치엔"], "Pete the Cat: I Love My White Shoes": ["에릭 리트윈", "제임스 딘"],
}

def clean_note(note):
    n = re.sub(r"\(?\s*AR\s*[\d.~\-]+\s*\)?", "", note or "")
    n = re.sub(r"쉬움", "", n)
    n = re.sub(r"\s*·\s*·\s*", "·", n).strip(" ·/")
    return n

def tags(ko, note, n, inn):
    s = ko + " " + (note or "")
    t = []
    if re.search(r"플랩|팝업|조작|인터랙티브|Photicular|움직이는|Press Here|Pop", s, re.I) or (inn and inn["tier"] == "조작북"): t.append("touch")
    if re.search(r"노래|노부영|Sausages|Walking Through", s, re.I) or (inn and inn["tier"] == "라임·운율" and "노래" in s): t.append("song")
    if re.search(r"리더스|얼리리더|I Can Read|파닉스|Readers", s, re.I): t.append("reader")
    if re.search(r"논픽션|Science|Solar|Who Would Win|Magic School", s, re.I): t.append("nonfic")
    if re.search(r"보드북|Baby|츄잉|Peekaboo|Making Faces|Ten Tiny Toes|First 100", s, re.I): t.append("board")
    return t

items = []
for rank, ko, en, age, note in DOMESTIC_ALL:
    n = norm(en); inn = in120.get(n) or in120.get(norm(ko))
    a = re.match(r"(\d+)\s*~\s*(\d+)", age or "")
    aw = award.get(n, "") or award.get(norm(ko), "")
    if not aw and re.search(r"칼데콧|뉴베리|가이젤", note or ""): aw = clean_note(note)
    series = bool(re.search(r"시리즈|세트|\s/\s|12종", ko))
    pr = (prices.get("items") or {}).get(en) or {}
    items.append({"rank": rank, "ko": ko, "en": en, "key": n, "age": [int(a.group(1)), int(a.group(2))] if a else None,
                  "note": clean_note(note), "cover": covers.get(rank, ""), "award": aw, "world": n in world,
                  "lib": lib.get(n, 0), "series": series, "tags": tags(ko, note, n, inn),
                  "in120": inn, "price": pr.get("best"), "price_n": len(pr.get("all") or []),
                  "authors": AUTHORS.get(en) or AUTHORS.get(ko) or []})

# 특징 메모에서 작가 줄과 겹치는 이름은 뺌(예: "에릭 칼·노부영" → "노부영")
for it in items:
    if it["authors"] and it["note"]:
        it["note"] = "·".join(t for t in re.split(r"\s*·\s*", it["note"]) if t.strip() and t.strip() not in it["authors"])
json.dump({"checked": PRICE_DAY, "items": items}, open(os.path.join(DOCS, "shop_data.json"), "w", encoding="utf-8"), ensure_ascii=False)

PAGE = r"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>국내 인기 책장 — 책 살 때 참고하세요 · 나이테</title>
<meta name="description" content="국내 서점에서 많이 팔린 영어 그림책 100권. 나이·가격·쿠팡 링크와 시리즈·유형 필터로 처음 살 책을 골라 보세요.">
<link rel="icon" href="/naite-library/favicon.svg" type="image/svg+xml"><link rel="icon" href="/naite-library/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/naite-library/apple-touch-icon.png"><link rel="manifest" href="/naite-library/manifest.webmanifest">
<meta name="theme-color" content="#245648">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<style>
*{box-sizing:border-box}html,body{margin:0}
body{background:#E4E7DD;color:#23291F;font-family:'Noto Sans KR',system-ui,-apple-system,'Segoe UI','Malgun Gothic',sans-serif;line-height:1.55}
:root{--surface:#FCFCF8;--line:#E2E5DA;--soft:#565E4E;--teal:#2F6E58;--tealD:#245648;--coral:#B87343;--chip:#F1F3EB;--sh:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07)}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px}
h1,h2,h3{font-family:'Gowun Batang',Georgia,serif;margin:0;line-height:1.2}
a{color:var(--tealD)}
.top{display:flex;align-items:center;gap:10px;padding:14px 0 4px}
.top a.back{font-weight:800;text-decoration:none;font-size:.9rem}
.hero{padding:10px 0 6px}
.hero .eyebrow{color:var(--coral);font-weight:800;font-size:.85rem}
.hero h1{font-size:clamp(1.5rem,5vw,2rem);margin-top:2px}
.hero p{color:var(--soft);margin:6px 0 0;font-size:.92rem;max-width:62ch}
.bar{position:sticky;top:0;z-index:20;background:rgba(228,231,221,.95);backdrop-filter:blur(8px);padding:10px 0;border-bottom:1px solid var(--line);margin-bottom:6px}
.search{display:flex;gap:8px}
.search input{flex:1;min-width:0;border:1px solid var(--line);background:#fff;font:inherit;font-size:.95rem;padding:10px 12px;border-radius:11px;color:#23291F}
.search select{flex:none;max-width:104px;border:1px solid var(--line);background:#fff;font:inherit;font-size:.85rem;padding:8px;border-radius:11px;color:#23291F}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.quick{margin-top:8px;gap:5px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
.quick::-webkit-scrollbar{display:none}
.quick .chip{padding:6px 9px}
.fbtn{flex:none;border:1px solid var(--tealD);background:var(--surface);color:var(--tealD);font:inherit;font-size:.85rem;font-weight:800;padding:8px 12px;border-radius:11px;cursor:pointer}
.fbtn b{display:inline-block;min-width:18px;margin-left:4px;background:var(--coral);color:#fff;border-radius:999px;font-size:.72rem;padding:0 5px}
.fbtn b[hidden],.morea[hidden],.chip[hidden]{display:none}
.layout{display:block}
.fp .grp{padding:12px 0;border-bottom:1px solid var(--line)}
.fp .grp:last-of-type{border-bottom:0}
.fp h3{font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:800;color:var(--soft);margin:0 0 8px}
.fp .morea{border:0;background:none;color:var(--coral);font:inherit;font-size:.78rem;font-weight:800;cursor:pointer;padding:6px 4px}
.fp .sh{display:none}
.fp .done{display:none}
/* 모바일: 필터는 아래에서 올라오는 시트 */
@media (max-width:899px){
  .fp{position:fixed;left:0;right:0;bottom:0;z-index:50;max-height:82vh;overflow:auto;background:var(--surface);border-radius:18px 18px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.18);padding:6px 18px 18px;transform:translateY(105%);transition:transform .22s;visibility:hidden}
  .fp.open{transform:none;visibility:visible}
  .fp .sh{display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);padding:10px 0 6px;z-index:1}
  .fp .sh b{font-size:1rem}
  .fp .sh button{border:0;background:none;font:inherit;color:var(--soft);font-size:1.3rem;cursor:pointer}
  .fp .done{display:block;width:100%;margin-top:12px;border:0;background:var(--tealD);color:#fff;font:inherit;font-weight:800;padding:12px;border-radius:12px;cursor:pointer}
  .fp .g-age{display:none}
  .dim{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:49}
}
/* PC: 왼쪽 사이드바 + 오른쪽 책 목록 */
@media (min-width:900px){
  .layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:26px;align-items:start}
  .fp{position:sticky;top:76px;max-height:calc(100vh - 90px);overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh);padding:4px 16px 10px}
  .fbtn,.quick,.dim{display:none!important}
}
.chip{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--soft);font:inherit;font-size:.8rem;font-weight:700;padding:6px 11px;border-radius:999px;cursor:pointer;white-space:nowrap}
.chip.on{background:var(--tealD);border-color:var(--tealD);color:#fff}
.chips .lb{flex:none;font-size:.75rem;color:var(--soft);font-weight:800;align-self:center;padding:0 2px 0 4px}
.count{font-size:.85rem;color:var(--soft);margin:8px 2px}
.count button{border:0;background:none;color:var(--coral);font:inherit;font-weight:800;cursor:pointer;padding:0 0 0 6px}
.grid{display:grid;grid-auto-flow:row dense;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;padding-bottom:40px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--sh);display:flex;flex-direction:column;min-width:0}
.cv{position:relative;aspect-ratio:3/4;background:#EBEDE3}
.cv img{position:relative;z-index:1;width:100%;height:100%;object-fit:cover;display:block}
.cv .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:10px;text-align:center;color:#fff;font-family:'Gowun Batang',serif;font-weight:700;background:linear-gradient(150deg,var(--teal),var(--tealD))}
.cv .rk{z-index:2;position:absolute;top:6px;left:6px;background:rgba(35,41,31,.82);color:#fff;font-size:.72rem;font-weight:800;border-radius:7px;padding:2px 7px}
.cv .ser{z-index:2;position:absolute;top:6px;right:6px;background:var(--coral);color:#fff;font-size:.68rem;font-weight:800;border-radius:7px;padding:2px 6px}
.bb{padding:10px 11px 12px;display:flex;flex-direction:column;gap:5px;flex:1;overflow-wrap:anywhere}
.bt{font-weight:800;font-size:.9rem;line-height:1.3}
.age{font-size:.78rem;color:var(--tealD);font-weight:800}
.note{font-size:.76rem;color:var(--soft)}
.bd{display:flex;flex-wrap:wrap;gap:4px}
.bd span{font-size:.68rem;font-weight:800;border-radius:6px;padding:1px 6px;background:var(--chip);color:var(--tealD)}
.bd .aw{background:#FBF1DC;color:#8A5A12}.bd .n120{background:#E1EEE7;color:#245648}.bd .w{background:#ECEBF5;color:#4B4380}
.price{margin-top:auto;font-size:.82rem}
.price b{font-size:.98rem;color:#23291F}
.price small{display:block;color:var(--soft);font-size:.7rem}
.buy{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:.82rem;border-radius:9px;padding:8px 6px;margin-top:6px}
.buy.cp{background:var(--coral);color:#fff}
.buy.find{border:1px solid var(--line);color:var(--soft);background:#fff}
.copy{display:block;width:100%;margin-top:5px;border:0;background:none;color:var(--tealD);font:inherit;font-weight:800;font-size:.78rem;padding:4px;cursor:pointer}
.copy.ok{color:var(--coral)}
.joinbox{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh);padding:22px 18px;text-align:center;margin:0 0 28px}
.joinbox h2{font-family:'Gowun Batang',serif;font-size:1.2rem;margin:0;line-height:1.35;word-break:keep-all}
.joinbox p{color:var(--soft);font-size:.88rem;margin:8px 0 0;word-break:keep-all}
.joinbox a{display:inline-block;margin-top:14px;text-decoration:none;font-family:'Gowun Batang',serif;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--coral),#D1965C);padding:13px 22px;border-radius:12px}
.joinbox small{display:block;color:var(--soft);font-size:.76rem;margin-top:7px}
.grid .joinbox{grid-column:1/-1;margin:4px 0;background:#F3EEE4;border-color:#E7DCCB}
.empty{padding:40px 0;text-align:center;color:var(--soft)}
.foot{font-size:.76rem;color:var(--soft);padding:0 0 40px}
@media (max-width:520px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bt{font-size:.86rem}}
</style></head><body>
<div class="wrap">
  <div class="top"><a class="back" href="./">← 나이테</a></div><script>if(/[?&]embed=/.test(location.search))document.write('<style>.top{display:none}</style>')</script>
  <div class="hero"><div class="eyebrow">책 살 때 참고하세요</div><h1>국내 인기 책장</h1>
    <p>교보·예스24·알라딘 등 국내 서점에서 많이 팔린 영어 그림책 100권이에요. 다들 많이 사는 "기본템"을 나이·가격·종류로 골라 보고, 쿠팡에서 바로 확인할 수 있어요. 웬디북·동방북스 같은 다른 서점에서 살 땐 <b>📋 제목 복사</b>로 바로 검색하세요. (🎯 표시는 나이테 스터디에서 매달 같이 읽는 책이에요.)</p></div>
</div>
<div class="bar"><div class="wrap">
  <div class="search"><input id="q" type="search" placeholder="책 제목·작가로 찾기 (영어·한글)" autocomplete="off"><select id="sort" aria-label="정렬"><option value="rank">인기순</option><option value="price">가격 낮은순</option><option value="age">어린 나이순</option></select><button type="button" class="fbtn" id="fopen">필터<b id="fcnt" hidden></b></button></div>
  <div class="chips quick" data-g="age"></div>
</div></div>
<div class="wrap"><div class="layout">
<aside class="fp" id="fp" aria-label="필터">
  <div class="sh"><b>필터</b><button type="button" id="fclose" aria-label="닫기">✕</button></div>
  <div class="grp g-age"><h3>나이</h3><div class="chips" data-g="age"></div></div>
  <div class="grp"><h3>종류</h3><div class="chips" data-g="kind"></div></div>
  <div class="grp"><h3>가격</h3><div class="chips" data-g="price"></div></div>
  <div class="grp"><h3>골라 보기</h3><div class="chips" data-g="more"></div></div>
  <div class="grp"><h3>작가</h3><div class="chips" data-g="author"></div><button type="button" class="morea" id="amore"></button></div>
  <button type="button" class="done" id="fdone">책 보기</button>
</aside>
<div class="dim" id="dim" hidden></div>
<main><div class="count" id="count"></div><div class="grid" id="grid"></div>
<div class="joinbox"><h2>📚 책은 샀는데, 어떻게 읽어줄지 막막하다면</h2><p>매달 5권과 읽어주기 가이드, 같이 읽는 엄마들과 함께해요.</p><a class="joinlink" href="https://open.kakao.com/o/p7PGdcPi" target="_blank" rel="noopener">🌿 무료 스터디 채팅방 참여하기</a><small>카카오톡 오픈채팅으로 연결돼요 · 무료 · 1권만 있어도 시작</small></div>
<p class="foot" id="foot"></p></main></div></div>
<script>
var DATA=__DATA__;
var URL_="https://vvfqrewseibjdwcuscaz.supabase.co",ANON="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi";
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function norm(t){t=(t||'').toLowerCase().split(/[:(]/)[0].replace(/&/g,'and').replace(/'/g,'');return t.replace(/[^a-z0-9]+/g,' ').trim();}
var AGES=[['all','전체'],['0-2','0~2세'],['3-4','3~4세'],['5-7','5~7세'],['8-','8세+']];
var KINDS=[['all','전체'],['single','단권'],['series','시리즈·세트'],['touch','만지고 노는 책'],['song','노래책'],['board','보드북'],['reader','리더스·얼리리더'],['nonfic','논픽션']];
var PRICES=[['all','전체'],['p1','1만원 이하'],['p2','1~1.5만원'],['p3','1.5만원 이상']];
var MORE=[['n120','🎯 나이테 120에 있는 책'],['award','🏅 수상작'],['world','🌍 세계에서도 인기']];
var S={age:'all',kind:'all',price:'all',author:'all',more:{},q:'',sort:'rank'},LINKS={};
// 같은 묶음(data-g)이 여러 곳에 있어도(모바일 빠른 나이 줄 + 필터) 상태는 하나
function chip(g,arr,multi){document.querySelectorAll('[data-g="'+g+'"]').forEach(function(el){arr.forEach(function(a){var b=document.createElement('button');b.type='button';b.className='chip';b.textContent=a[1];b.dataset.v=a[0];
  b.onclick=function(){if(multi)S.more[a[0]]=!S.more[a[0]];else S[g]=a[0];paint();};el.appendChild(b);});});}
// 작가: 100권 안에 2권 이상인 작가(많은 순)
var AC={};DATA.items.forEach(function(it){it.authors.forEach(function(a){AC[a]=(AC[a]||0)+1;});});
var AUTH=[['all','전체']].concat(Object.keys(AC).filter(function(a){return AC[a]>=2;}).sort(function(a,b){return AC[b]-AC[a]||a.localeCompare(b);}).map(function(a){return [a,a+' '+AC[a]];}));
// 나이 칩에 권수(작가 칩처럼 전체 100권 기준, 나이 범위가 겹치는 책)
AGES=AGES.map(function(a){if(a[0]==='all')return a;var p=a[0].split('-'),lo=+p[0],hi=p[1]?+p[1]:99;
  var n=DATA.items.filter(function(it){return it.age&&!(it.age[1]<lo||it.age[0]>hi);}).length;return [a[0],a[1]+' '+n];});
chip('age',AGES);chip('kind',KINDS);chip('price',PRICES);chip('more',MORE,true);chip('author',AUTH);
// 작가는 처음엔 6명(전체 포함 7칸)만, 나머지는 더보기
var AUTH_N=7,authOpen=false;
function paintAuthors(){var bs=document.querySelectorAll('[data-g="author"] .chip');bs.forEach(function(b,i){b.hidden=!authOpen&&i>=AUTH_N&&b.dataset.v!==S.author;});
  var m=document.getElementById('amore');m.hidden=AUTH.length<=AUTH_N;m.textContent=authOpen?'접기':'작가 '+(AUTH.length-AUTH_N)+'명 더보기';}
document.getElementById('amore').onclick=function(){authOpen=!authOpen;paintAuthors();};
// 모바일 필터 시트 열고 닫기
function sheet(open){document.getElementById('fp').classList.toggle('open',open);document.getElementById('dim').hidden=!open;document.body.style.overflow=open?'hidden':'';}
document.getElementById('fopen').onclick=function(){sheet(true);};
['fclose','fdone','dim'].forEach(function(id){document.getElementById(id).onclick=function(){sheet(false);};});
function link(it){return LINKS[it.key]||(it.in120&&LINKS[norm(it.in120.title)])||'';}
function ok(it){
  if(S.q){var q=S.q.toLowerCase();if((it.ko+' '+it.en+' '+it.authors.join(' ')).toLowerCase().indexOf(q)<0&&norm(it.ko+' '+it.en).indexOf(norm(q))<0)return false;}
  if(S.age!=='all'&&it.age){var p=S.age.split('-'),lo=+p[0],hi=p[1]?+p[1]:99;if(it.age[1]<lo||it.age[0]>hi)return false;}
  if(S.age!=='all'&&!it.age)return false;
  if(S.author!=='all'&&it.authors.indexOf(S.author)<0)return false;
  if(S.kind==='single'&&it.series)return false;if(S.kind==='series'&&!it.series)return false;
  if(['touch','song','board','reader','nonfic'].indexOf(S.kind)>=0&&it.tags.indexOf(S.kind)<0)return false;
  var m=S.more,pr=it.price&&!it.series&&it.price.price;
  if(m.n120&&!it.in120)return false;if(m.award&&!it.award)return false;if(m.world&&!it.world)return false;
  if(S.price==='p1'&&!(pr&&pr<=10000))return false;if(S.price==='p2'&&!(pr&&pr>10000&&pr<=15000))return false;if(S.price==='p3'&&!(pr&&pr>15000))return false;
  return true;}
function won(n){return n.toLocaleString('ko-KR')+'원';}
function md(d){var p=(d||'').split('-');return p.length===3?(+p[1])+'/'+(+p[2]):'';}
function card(it){
  var L=link(it),pr=it.price,cq=encodeURIComponent(it.en);
  var bd='';if(it.in120)bd+='<span class="n120">🎯 나이테 120 · '+esc(it.in120.month+'개월차 '+it.in120.theme)+'</span>';
  if(it.award)bd+='<span class="aw">'+esc(it.award)+'</span>';if(it.world)bd+='<span class="w">🌍 세계 인기</span>';
  var price=it.series?'<div class="price"><small>시리즈·세트라 권마다 가격이 달라요</small></div>':
    (pr?'<div class="price">최저 <b>'+won(pr.price)+'</b><small>'+esc(pr.store)+(pr.fmt?' · '+esc(pr.fmt):'')+' · '+md(DATA.checked)+' 기준'+(it.tags.indexOf('touch')>=0&&pr.fmt==='페이퍼백'?'<br>⚠️ 페이퍼백이라 플랩·팝업이 없을 수 있어요':'')+'</small></div>':'<div class="price"><small>교보·동방북스 국내 재고 없음 (쿠팡에서 확인)</small></div>');
  return '<article class="card"><div class="cv">'+(it.cover?'<img loading="lazy" src="'+esc(it.cover)+'" alt="'+esc(it.ko)+'" onerror="this.remove()">':'')+'<div class="ph">'+esc(it.ko)+'</div>'+
    '<span class="rk">#'+it.rank+'</span>'+(it.series?'<span class="ser">시리즈</span>':'')+'</div>'+
    '<div class="bb"><div class="bt">'+esc(it.ko)+'</div>'+(it.authors.length?'<div class="note" style="color:#23291F">'+esc(it.authors.join(' · '))+'</div>':'')+(it.age?'<div class="age">권장 '+it.age[0]+'~'+it.age[1]+'세</div>':'')+(it.note?'<div class="note">'+esc(it.note)+'</div>':'')+
    (bd?'<div class="bd">'+bd+'</div>':'')+price+
    (L?'<a class="buy cp" href="'+esc(L)+'" target="_blank" rel="noopener sponsored nofollow" data-t="'+esc(it.en)+'">🛒 쿠팡에서 보기</a>':
       '<a class="buy find" href="https://www.coupang.com/np/search?q='+cq+'" target="_blank" rel="noopener" data-t="'+esc(it.en)+'">🔎 쿠팡에서 찾아보기</a>')+
    '<button type="button" class="copy" data-copy="'+esc(it.en)+'">📋 제목 복사</button></div></article>';}
function paint(){
  ['age','kind','price','author'].forEach(function(g){document.querySelectorAll('[data-g="'+g+'"] .chip').forEach(function(b){b.classList.toggle('on',b.dataset.v===S[g]);});});
  document.querySelectorAll('[data-g="more"] .chip').forEach(function(b){b.classList.toggle('on',!!S.more[b.dataset.v]);});
  paintAuthors();
  // 필터 버튼의 숫자: 나이 빼고 고른 필터 수(나이는 바깥 줄에 보임)
  var n=(S.kind!=='all')+(S.price!=='all')+(S.author!=='all')+Object.keys(S.more).filter(function(k){return S.more[k];}).length;
  var fc=document.getElementById('fcnt');fc.hidden=!n;fc.textContent=n;
  var list=DATA.items.filter(ok);
  if(S.sort==='price')list.sort(function(a,b){var x=a.price&&!a.series?a.price.price:1e9,y=b.price&&!b.series?b.price.price:1e9;return x-y||a.rank-b.rank;});
  else if(S.sort==='age')list.sort(function(a,b){return ((a.age||[99])[0]-(b.age||[99])[0])||a.rank-b.rank;});
  else list.sort(function(a,b){return a.rank-b.rank;});
  var filtered=S.q||S.age!=='all'||S.kind!=='all'||S.price!=='all'||S.author!=='all'||Object.keys(S.more).some(function(k){return S.more[k];});
  document.getElementById('fdone').textContent=list.length+'권 보기';
  document.getElementById('count').innerHTML=list.length+'권'+(filtered?' <button id="reset">필터 지우기</button>':'');
  var r=document.getElementById('reset');if(r)r.onclick=function(){S={age:'all',kind:'all',price:'all',author:'all',more:{},q:'',sort:S.sort};document.getElementById('q').value='';paint();};
  var cards=list.map(card);
  // 스터디 참여 카드: 6권 뒤(목록이 짧으면 맨 끝) — 맨 아래까지 안 내려가도 보이게
  if(cards.length)cards.splice(Math.min(6,cards.length),0,JOIN_CARD);
  document.getElementById('grid').innerHTML=list.length?cards.join(''):'<div class="empty">조건에 맞는 책이 없어요. 필터를 줄여 보세요.</div>';}
var JOIN_CARD='<div class="joinbox"><h2>📚 고르는 것보다 어려운 건, 꾸준히 읽어주기</h2><p>매달 5권과 읽어주기 가이드, 같이 읽는 엄마들과 함께해요.</p>'+
  '<a class="joinlink" data-at="list" href="https://open.kakao.com/o/p7PGdcPi" target="_blank" rel="noopener">🌿 무료 스터디 채팅방 참여하기</a><small>카카오톡 오픈채팅으로 연결돼요 · 무료 · 1권만 있어도 시작</small></div>';
document.getElementById('q').addEventListener('input',function(){S.q=this.value.trim();paint();});
document.getElementById('sort').addEventListener('change',function(){S.sort=this.value;paint();});
document.getElementById('foot').innerHTML='가격은 교보문고·동방북스에서 국내 재고가 있는 판본 중 가장 싼 값이에요('+md(DATA.checked)+' 기준, 판본·형태에 따라 달라요). 쿠팡·웬디북 가격은 포함하지 않았어요. 🛒 쿠팡 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있어요.';
paint();
// 쿠팡 링크: 나이테 120 책(list_buy_urls) + 그 밖(shop_links)
(async function(){var h={apikey:ANON,Authorization:'Bearer '+ANON,'Content-Type':'application/json'};
  try{var a=await fetch(URL_+'/rest/v1/rpc/list_buy_urls',{method:'POST',headers:h,body:'{}'});if(a.ok)(await a.json()).forEach(function(r){if(r.buy_url)LINKS[norm(r.title)]=r.buy_url;});}catch(e){}
  try{var b=await fetch(URL_+'/rest/v1/shop_links?select=en,buy_url',{headers:h});if(b.ok)(await b.json()).forEach(function(r){if(r.buy_url)LINKS[norm(r.en)]=r.buy_url;});}catch(e){}
  paint();})();
// 쿠팡 클릭 집계(관리자·notrack 기기 제외)
document.addEventListener('click',function(e){var a=e.target.closest('a.buy');if(!a)return;try{if(localStorage.getItem('naite_notrack')==='1')return;var sid=localStorage.getItem('joy_sid')||'anon';
  fetch(URL_+'/rest/v1/events',{method:'POST',headers:{apikey:ANON,Authorization:'Bearer '+ANON,'Content-Type':'application/json',Prefer:'return=minimal'},
    body:JSON.stringify({type:a.classList.contains('cp')?'buy_click':'shop_search_click',session_id:sid,path:location.pathname,meta:{title:a.dataset.t,page:'국내 인기 책장',src:window.NAITE_SRC||'direct'}}),keepalive:true}).catch(function(){});}catch(x){}});
</script>
<script>
// 📋 제목 복사(영어 원제) — 웬디북·동방북스 등 다른 서점 검색용
function copyText(t){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);
  return new Promise(function(ok,no){try{var x=document.createElement('textarea');x.value=t;x.setAttribute('readonly','');x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.select();var r=document.execCommand('copy');x.remove();r?ok():no();}catch(e){no(e);}});}
function ev(type,meta){try{if(localStorage.getItem('naite_notrack')==='1')return;var sid=localStorage.getItem('joy_sid')||'anon';
  fetch(URL_+'/rest/v1/events',{method:'POST',headers:{apikey:ANON,Authorization:'Bearer '+ANON,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({type:type,session_id:sid,path:location.pathname,meta:meta}),keepalive:true}).catch(function(){});}catch(x){}}
document.addEventListener('click',function(e){var b=e.target.closest('button.copy');if(!b)return;var t=b.dataset.copy;
  copyText(t).then(function(){b.textContent='복사됨 ✓ 서점에서 붙여넣기 하세요';b.classList.add('ok');setTimeout(function(){b.textContent='📋 제목 복사';b.classList.remove('ok');},1800);},
    function(){b.textContent=t;});
  ev('title_copy',{title:t,page:'국내 인기 책장',src:window.NAITE_SRC||'direct'});});
// 스터디 참여 클릭(join_click) — 메인·나이테 120과 같은 방식
document.addEventListener('click',function(e){var a=e.target.closest('a.joinlink');if(!a)return;ev('join_click',{page:'국내 인기 책장',from:window.NAITE_SRC||'direct',at:a.dataset.at||'bottom'});});
</script>
<script src="track.js" data-page="국내 인기 책장"></script>
</body></html>"""

open(os.path.join(DOCS, "domestic.html"), "w", encoding="utf-8").write(PAGE.replace("__DATA__", json.dumps({"checked": PRICE_DAY, "items": items}, ensure_ascii=False)))
print("생성: docs/domestic.html, docs/shop_data.json ·", len(items), "권 · 가격", sum(1 for i in items if i["price"]), "· 표지", sum(1 for i in items if i["cover"]),
      "· 시리즈", sum(1 for i in items if i["series"]), "· 120포함", sum(1 for i in items if i["in120"]))
