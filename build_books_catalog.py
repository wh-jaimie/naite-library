# 나이테 책 목록(책 DB) 만들기 → docs/books.json
# 나이테 120권(c120_data.json) · 대박책(road-data.js BEST) · 국내 인기 책장(shop_data.json) · 우리 집 기록 책(my_books.json, 북모리·ORT 뺌)을 한 목록으로 합침.
# 같은 책은 '책 키'(likes.js key()와 같은 규칙: 소문자, &→and, 맨 앞 the 빼고, 영문·숫자·한글만 — 부제도 포함, 부제가 다르면 다른 책)로 한 줄.
# 기록·메모·후기·재밌어요는 이 책 키로 모임(스터디 달과 상관없이). 스터디 책(DB)은 앱에서 같은 키로 합쳐 씀.
# 목록을 바꾸면(120권·대박책·인기 책장) 이 스크립트를 다시 돌리면 됨:  python build_books_catalog.py
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "docs")
SITE = "https://wh-jaimie.github.io/naite-library/"


def key(t):
    t = str(t or "").lower().replace("&", "and")
    t = re.sub(r"^\s*the\s+", "", t)
    return re.sub(r"[^0-9a-z가-힣]", "", t)[:80]


def cover_of(c):
    c = c or ""
    if c.startswith("http"):
        return c
    if c.startswith("id/"):
        return "https://covers.openlibrary.org/b/id/%s-M.jpg" % c[3:]
    if c.startswith("isbn/"):
        return "https://covers.openlibrary.org/b/isbn/%s-M.jpg" % c[5:]
    return SITE + c if c else ""


books, order = {}, []


def add(title, cover, src, author="", sub="", series=False):
    k = key(title)
    if len(k) < 2:
        return
    b = books.get(k)
    if not b:
        b = books[k] = {"k": k, "t": title.strip(), "c": "", "a": "", "s": []}
        order.append(k)
    if not b["c"] and cover:
        b["c"] = cover_of(cover)
    if not b["a"] and author:
        b["a"] = author
    if src not in b["s"]:
        b["s"].append(src)
    if sub and not b.get("g"):
        b["g"] = sub
    if series:
        b["ser"] = 1


# 1) 나이테 120권(주제 이름을 같이)
c120 = json.load(open(os.path.join(DOCS, "c120_data.json"), encoding="utf-8"))
for th in c120["themes"]:
    for b in th["books"]:
        add(b["title"], b.get("cover"), "120", b.get("author", ""), ((th.get("emoji") or "") + " " + th.get("ko", "")).strip())

# 2) 대박책(드니네 책장 ★5~6)
road = open(os.path.join(DOCS, "road-data.js"), encoding="utf-8").read()
m = re.search(r"var BEST=(\[.*?\]);", road, re.S)
for t, c in json.loads(m.group(1)):
    add(t, c, "best")

# 3) 국내 인기 책장(시리즈는 시리즈 이름으로)
shop = json.load(open(os.path.join(DOCS, "shop_data.json"), encoding="utf-8"))
for it in shop["items"]:
    t = (it.get("in120") or {}).get("title") or it.get("en") or it.get("ko")
    add(t, it.get("cover"), "shop", ", ".join(it.get("authors") or []), "", bool(it.get("series")))

# 4) 우리 집 기록 책(2026-11-20 운영자: 북모리 기록, ORT 뺌) — 기록할 때 제목 검색용
mine = json.load(open(os.path.join(HERE, "my_books.json"), encoding="utf-8"))
for b in mine["books"]:
    add(b["t"], b.get("c"), "mine", b.get("a", ""))

out = [books[k] for k in order]
json.dump({"v": 1, "n": len(out), "books": out}, open(os.path.join(DOCS, "books.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("books.json:", len(out), "권 (120:", sum("120" in b["s"] for b in out), "· 대박책:", sum("best" in b["s"] for b in out), "· 인기 책장:", sum("shop" in b["s"] for b in out), "· 기록 책:", sum("mine" in b["s"] for b in out), ")")
