# -*- coding: utf-8 -*-
"""배포 후 상태 점검: 운영 사이트의 주요 페이지를 실제 브라우저(Playwright)로 열어 JS 오류·빈 화면을 확인.
사용: python check_live.py            (운영 사이트)
      python check_live.py local      (http://localhost:8765, python -m http.server -d docs 8765 필요)
배포(push) 후 GitHub Pages 반영(1~2분)을 기다린 뒤 실행. 오류가 하나라도 있으면 종료코드 1.
"""
import asyncio, sys, time
from playwright.async_api import async_playwright

BASE = "http://localhost:8765" if "local" in sys.argv[1:] else "https://wh-jaimie.github.io/naite-library"
# (경로, 정상일 때 화면에 보여야 하는 글자) — 로그인·입장 화면도 '정상 로드'로 봄
PAGES = [
    ("/", "나이테"), ("/challenge.html", "나이테 120"), ("/domestic.html", "국내 인기 책장"),
    ("/guide.html", "가이드"), ("/types.html", "유형"), ("/join.html", "스터디 참여"),
    # 공개 자료·미션은 비회원이면 참여 안내(join.html?from=study)로 이동(2026-10-31) → 안내 문구가 보이면 정상
    ("/study/", "나이테 스터디 앱"), ("/study/missions.html", "나이테 스터디 앱"),
    ("/study/admin.html", "로그인"), ("/study/kpi.html", "로그인"),
    ("/record/", "회원"), ("/record/app.html", "회원"),
]
IGNORE = ("ServiceWorker",)  # localhost 전용 경고

async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 390, "height": 844})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        for path, must in PAGES:
            errs.clear()
            try:
                r = await pg.goto(BASE + path + ("&" if "?" in path else "?") + "nc=" + str(int(time.time())), timeout=30000)
                await pg.wait_for_timeout(2500)
                body = (await pg.inner_text("body"))[:400]
                real = [e for e in errs if not any(i in e for i in IGNORE)]
                ok = r and r.status < 400 and not real and must in body and "불러오는 중" not in body[:60]
            except Exception as e:
                ok, real, body = False, [str(e)], ""
            bad += 0 if ok else 1
            print(("✅" if ok else "❌"), path, "" if ok else f"| status={getattr(r,'status',None)} errors={real[:2]} body={body[:60]!r}")
        await b.close()
    print("점검 완료:", "문제 없음" if not bad else f"{bad}개 페이지 문제")
    sys.exit(1 if bad else 0)

asyncio.run(main())
