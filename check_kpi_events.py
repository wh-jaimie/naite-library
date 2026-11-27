# -*- coding: utf-8 -*-
"""KPI가 세는 이벤트를 앱·사이트가 아직 남기는지 점검 (네트워크 없음, 빠름).

2026-11-27: '읽은 책 카드' 버튼이 앱에서 빠졌는데(10/30) KPI '📸 인증 카드'는 그 이벤트(share_card_*)를
계속 세고 있어서 한 달 가까이 늘 0이었음 → 같은 일이 없게 배포 때마다 이걸 돌린다(check_live.py가 먼저 실행).

1) KPI(docs/study/kpi.html)가 아는 이벤트(EVN 이름표 + 카드에서 세는 type)가 코드 어디에서도 안 남으면 ❌
   - 일부러 그만둔 이벤트는 KPI_EVENTS.md 그 줄에 '더 이상 안 남음'이라고 적으면 통과(예전 기간용으로만 셈).
2) 버튼 없는 클릭 처리(앱의 closest('[data-x]') 는 있는데 data-x 를 그리는 곳이 없음)를 ⚠️로 알림
   - 버튼을 뺐는데 그 버튼의 이벤트를 KPI가 세고 있으면 늘 0이 됨 → 해당 KPI 카드도 같이 고칠 것.
사용: python check_kpi_events.py   (문제 있으면 종료코드 1)
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
DOCS = ROOT / "docs"
KPI = DOCS / "study" / "kpi.html"
# 버튼 없는 클릭 처리 중 확인 끝난 것(이벤트는 다른 버튼에서 남거나, KPI는 이미 고침) — 새로 생기면 확인 후 여기에 이유와 함께
ORPHAN_OK = {
    "rstamp",  # 인증샷 카메라: stamp_camera_open은 '오늘 기록'·날짜 창 버튼에서 남음
    "rtoday",  # 오늘 책 기록: 기록 창은 다른 버튼에서 열림
    "rday", "rother", "rshelf",  # 옛 기록 화면 버튼(2026-11-27 확인): 남기는 이벤트 없음 / shelf_month는 KPI 이름표만 있고 카드에서 안 셈
    "rshare",  # '읽은 책 카드'(share_card_*) 10/30 버튼 제거 — KPI 📸 인증은 2026-11-27에 stamp_photo_open 기준으로 고침
}
EV_RE = r"[a-z][a-z0-9]*(?:_[a-z0-9]+)+"

def read(p):
    return p.read_text(encoding="utf-8", errors="ignore")

def kpi_types():
    """(KPI가 아는 이벤트 전체, 그중 카드에서 실제로 세는 것)"""
    s = read(KPI)
    t, lab = set(), set()
    m = re.search(r"var EVN=\{(.*?)\};", s, re.S)
    if m:
        lab = set(re.findall(r"(?:^|[,{])\s*(" + EV_RE + r")\s*:", m.group(1)))
    t |= set(re.findall(r"type\s*===?\s*'(" + EV_RE + r")'", s))
    for args in re.findall(r"\bof\(([^()]*)\)", s):
        t |= set(re.findall(r"'(" + EV_RE + r")'", args))
    for args in re.findall(r"\[((?:\s*'" + EV_RE + r"'\s*,?)+)\]\.indexOf\(e\.type\)", s):
        t |= set(re.findall(r"'(" + EV_RE + r")'", args))
    return t | lab, t

def code_files():
    for p in DOCS.rglob("*"):
        if p.suffix in (".js", ".html") and p != KPI and "proto-" not in p.name:
            yield p

def emitted():
    lits, sufs = set(), set()
    for p in code_files():
        s = read(p)
        lits |= set(re.findall(r"['\"](" + EV_RE + r"|[a-z][a-z0-9]+)['\"]", s))
        sufs |= set(re.findall(r"\+\s*['\"](_[a-z0-9_]+)['\"]", s))
    return lits, sufs

def retired():
    md = read(ROOT / "KPI_EVENTS.md")
    out = set()
    for line in md.splitlines():
        if "더 이상 안 남음" in line:
            first = line.split("|")[1] if line.startswith("|") else line
            names = re.findall(EV_RE, first)
            base = names[0].rsplit("_", 1)[0] if names else ""
            out |= set(names)
            for suf in re.findall(r"/\s*(_[a-z0-9]+)", first):
                out.add(base + suf)
    return out

def orphan_handlers(card_used):
    """버튼 없는 클릭 처리 → (❌ KPI 카드가 세는 이벤트를 남기던 것, ⚠️ 나머지)"""
    err, warn = [], []
    for p in (DOCS / "record").glob("*.*"):
        if p.suffix not in (".js", ".html"):
            continue
        s = read(p)
        allsrc = "".join(read(q) for q in (DOCS / "record").glob("*.*") if q.suffix in (".js", ".html"))
        for name in sorted(set(re.findall(r"closest\('\[data-([a-z0-9-]+)\]'\)", s))):
            # 처리 쪽에서만 쓰는 [data-x] 선택자·getAttribute('data-x')는 '그리는 곳'이 아님
            src2 = re.sub(r"(?:get|has|remove)Attribute\(['\"]data-" + re.escape(name) + r"['\"]\)", "", allsrc.replace("[data-" + name, ""))
            made = re.search(r"data-" + re.escape(name) + r"(?:=|[\s>'\"]|\\['\"])", src2)
            if not made and name not in ORPHAN_OK:
                line = next((l for l in s.splitlines() if "[data-" + name + "]" in l), "")
                # 그 줄 + 그 줄이 부르는 함수 본문(한 단계)에서 이벤트 이름 모으기
                # (shareSheet(...,'share_card',...)처럼 kind+'_open' 식으로 만드는 것도 포함)
                body = line
                for fn in set(re.findall(r"\b([a-zA-Z_]\w*)\(", line)):
                    m = re.search(r"function " + re.escape(fn) + r"\([^)]*\)\{(.*?)\n  (?:function |\}|/\*|//)", allsrc, re.S)
                    if m:
                        body += m.group(1)
                lit = set(re.findall(r"'(" + EV_RE + r")'", body))
                evs = {t for t in card_used if t in lit or any(t == b + sf for b in lit for sf in ("_open", "_save", "_share", "_photo"))}
                msg = f"{p.name}: [data-{name}] 클릭 처리는 있는데 그 버튼을 그리는 곳이 없어요"
                if evs:
                    err.append(msg + f" — KPI 카드가 세는 {', '.join(sorted(evs))} 가 늘 0이 돼요. 카드를 고치고 ORPHAN_OK에 이유 적기")
                else:
                    warn.append(msg)
    return err, warn

def main():
    used, card_used = kpi_types()
    lits, sufs = emitted()
    ret = retired()
    def is_emitted(t):
        return t in lits or any(t.endswith(sf) and t[: -len(sf)] in lits for sf in sufs)
    missing = sorted(t for t in used if not is_emitted(t) and t not in ret)
    for t in missing:
        print(f"❌ KPI가 세는 이벤트 '{t}'를 지금 코드에서 안 남겨요 → KPI 카드를 고치거나, 그만둔 거면 KPI_EVENTS.md에 '더 이상 안 남음' 적기")
    errs, warns = orphan_handlers(card_used)
    for w in errs:
        print("❌", w)
    for w in warns:
        print("⚠️", w)
    print(f"KPI 이벤트 점검: KPI가 아는 이벤트 {len(used)}개 · 안 남는 것 {len(missing)}개 · 버튼 없는 클릭 처리 {len(errs) + len(warns)}개")
    return 1 if (missing or errs) else 0

if __name__ == "__main__":
    sys.exit(main())
