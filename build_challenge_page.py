# -*- coding: utf-8 -*-
"""challenge.json -> 나이테 120 (파닉스 전 첫 영어 그림책 로드맵) 페이지 (challenge.html)"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "output", "challenge.json")
OUT = os.path.join(HERE, "output", "challenge.html")
data = json.load(open(DATA, encoding="utf-8"))

# 책별 쿠팡 파트너스 단축링크 주입 (coupang_links.py 에서 제목으로 매칭). 링크 없으면 buy_url="".
def _bnorm(s): return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()
try:
    import coupang_links
    BUY = {_bnorm(k): (v or "").strip() for k, v in coupang_links.LINKS.items()}
except Exception:
    BUY = {}
_buycnt = 0
for _t in data["themes"]:
    for _b in _t["books"]:
        _b["buy_url"] = BUY.get(_bnorm(_b["title"]), "")
        if _b["buy_url"]:
            _buycnt += 1
payload = json.dumps(data, ensure_ascii=False)

TEMPLATE = r"""<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="/naite-library/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/naite-library/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/naite-library/apple-touch-icon.png">
<link rel="manifest" href="/naite-library/manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="나이테">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#245648">
<title>나이테 120 — 파닉스 전, 첫 영어 그림책 로드맵</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
:root{
  --ground:#E4E7DD;--surface:#FCFCF8;--surface-2:#EBEDE3;--ink:#23291F;--ink-soft:#565E4E;
  --line:#E2E5DA;--teal:#2F6E58;--teal-deep:#245648;--coral:#B87343;--amber:#D1965C;--plum:#4F9A72;
  --shadow:0 1px 2px rgba(43,42,38,.06),0 6px 18px rgba(43,42,38,.07);--shadow-lg:0 10px 34px rgba(43,42,38,.14);
  --t1:#245648;--t2:#2F6E58;--t3:#4F9A72;--t4:#B87343;--t5:#7A4520;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:'Noto Sans KR',system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:20px}
h1,h2,h3{font-family:'Gowun Batang',Georgia,serif;font-weight:600;line-height:1.14;text-wrap:balance;margin:0}
.tnum{font-variant-numeric:tabular-nums}
a{color:var(--teal-deep)}
header.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;background:color-mix(in srgb,var(--ground) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:14px;padding-block:12px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Gowun Batang',serif;font-weight:700;font-size:1.05rem;white-space:nowrap}
.brand .mark{width:30px;height:30px;border-radius:9px;flex:0 0 auto;background:linear-gradient(135deg,var(--coral),var(--amber));display:grid;place-items:center;color:#fff;font-size:1rem;box-shadow:var(--shadow)}
.top .back{margin-left:auto;font-size:.85rem;font-weight:700;text-decoration:none;border:1px solid var(--line);background:var(--surface);padding:8px 13px;border-radius:999px}
.sharebtn{border:0;background:linear-gradient(135deg,var(--coral),var(--amber));color:#fff;font:inherit;font-weight:800;font-size:.85rem;padding:9px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;box-shadow:var(--shadow);flex:0 0 auto}
.more{margin-top:8px}.more summary{cursor:pointer;color:var(--teal-deep,#245648);font-weight:800;font-size:.85rem;list-style:none;display:inline-flex;align-items:center;gap:4px}.more summary::-webkit-details-marker{display:none}.more[open] summary{margin-bottom:6px}.more .mbody{font-size:.9rem;color:var(--ink-soft);line-height:1.7}
@media (max-width:420px){.top .back{padding:7px 10px}.sharebtn{padding:8px 11px}.top .wrap{gap:8px}.brand span:not(.mark){display:none}}
.top .back{white-space:nowrap}
.themebtn{border:1px solid var(--line);background:var(--surface);color:var(--ink);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;flex:0 0 auto}
.hero{padding-block:42px 8px}
.eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--coral)}
.hero h1{font-size:clamp(2rem,5.6vw,3.35rem);margin:.35em 0 .3em;font-weight:700}
.hero p.lead{font-size:1.06rem;color:var(--ink-soft);max-width:none}
/* 진행률 + 코스 */
.panel{margin-top:24px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow)}
.panel .r1{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.panel .big{font-family:'Gowun Batang',serif;font-weight:700;font-size:1.9rem;color:var(--coral)}
.panel .sub{font-size:.9rem;color:var(--ink-soft)}
.panel .reset{margin-left:auto;border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);font:inherit;font-size:.76rem;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer}
.bar{height:14px;border-radius:999px;background:var(--surface-2);overflow:hidden;margin-top:12px}
.bar>i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--t1),var(--amber),var(--coral));transition:width .4s}
.join{display:block;width:100%;margin-top:14px;text-align:center;text-decoration:none;font-family:'Gowun Batang',serif;font-weight:700;font-size:1.12rem;color:#fff;background:linear-gradient(135deg,var(--coral),#D1965C);border:none;border-radius:14px;padding:16px;box-shadow:var(--shadow);cursor:pointer}
.join:hover{filter:brightness(.97)}
.join .sub{display:block;font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:600;opacity:.95;margin-top:4px}
.guide120{margin-top:22px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px}
.guide120 h3{font-size:1.1rem;margin:0 0 6px}
.guide120 .g-sub{font-size:.92rem;line-height:1.6;color:var(--ink-soft);margin:0}
.guide120 .g-types{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 8px}
.guide120 .g-types span{background:color-mix(in srgb,var(--teal) 10%,var(--surface));border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:.84rem;font-weight:700}
.guide120 .g-tlink{display:inline-block;font-size:.88rem;font-weight:700;color:var(--teal-deep)}
.guide120 ul{margin:12px 0 0;padding:0;list-style:none;font-size:.9rem;line-height:1.55}
.guide120 li{position:relative;padding-left:20px;margin:5px 0}
.guide120 li::before{content:"✓";position:absolute;left:0;color:var(--teal-deep);font-weight:800}
.guide120 .small-disc{font-size:.74rem;color:var(--ink-soft);margin:14px 0 0}
/* 이렇게 골랐어요(2026-11-14): 믿고 따라올 근거 */
.picked{margin-top:10px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.picked h3{font-size:1rem;margin:0 0 8px}
.picked .p-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 8px}
.picked .p-stats span{background:color-mix(in srgb,var(--coral) 8%,var(--surface));border:1px solid var(--line);border-radius:10px;padding:6px 2px;text-align:center;font-size:.72rem;line-height:1.3;color:var(--ink-soft);font-weight:700}
.picked .p-stats b{display:block;font-size:1.15rem;color:var(--ink);font-weight:800}
.picked ul{margin:0;padding:0;list-style:none;font-size:.86rem;line-height:1.5}
.picked li{position:relative;padding-left:18px;margin:4px 0}
.picked li::before{content:"✓";position:absolute;left:0;color:var(--teal-deep);font-weight:800}
.picked .p-start{margin:8px 0 0;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--teal) 9%,var(--surface));font-size:.88rem;line-height:1.5}
.use h3 small{font-size:.74rem;font-weight:700;color:var(--ink-soft);margin-left:4px}
.use .u-q{margin:0 0 6px;font-size:.84rem;color:var(--ink-soft);font-weight:700}
.use .u-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.use .u-tabs button{font:inherit;font-size:.8rem;font-weight:700;padding:8px 2px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);cursor:pointer}
.use .u-tabs button[aria-selected=true]{background:var(--teal-deep);border-color:var(--teal-deep);color:#fff}
.use .u-pane{margin-top:8px;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--teal) 9%,var(--surface));font-size:.86rem;line-height:1.55}
.use .u-pane b{display:block;font-size:.92rem;margin-bottom:3px;color:var(--ink)}
.use .u-now{display:inline-block;margin-top:8px;padding:5px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:.82rem;font-weight:800;color:var(--teal-deep);text-decoration:none}
.use .u-me{display:block;margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);font-size:.82rem;color:var(--ink-soft)}
.picked .p-link{display:inline-block;margin-top:8px;font-size:.8rem;font-weight:700;color:var(--teal-deep)}
/* 진행 카드 작게(2026-11-07) */
.panel{margin-top:14px;padding:14px 16px}
.panel .big{font-size:1.5rem}
.panel .bar{height:10px;margin-top:10px}
.panel .prthumb{display:none}
.panel .share{margin-top:12px;padding:9px;font-size:.88rem}
.guide120{margin-top:16px}
/* 더 작게(2026-11-07): 안내 칸·유형 배지·진행 카드 */
.guide120{padding:12px 14px;border-radius:14px;margin-top:12px}
.guide120 h3{font-size:1rem;margin:0 0 2px}
.guide120 .g-sub{font-size:.86rem;line-height:1.45}
.guide120 .g-types{gap:4px;margin:8px 0 6px}
.guide120 .g-types span{padding:2px 7px;font-size:.74rem;font-weight:700;border-radius:7px}
.guide120 .g-tlink{font-size:.8rem}
.panel{margin-top:10px;padding:10px 14px;border-radius:14px}
.panel .r1{gap:8px;align-items:center}
.panel .big{font-size:1.2rem}
.panel .sub{font-size:.8rem}
.panel .bar{height:8px;margin-top:8px}
.panel .share{margin-top:8px;padding:7px;font-size:.8rem;border-radius:10px}
.bottom-disc{font-size:.72rem;color:var(--ink-soft);margin:22px 0 0;text-align:center}
/* 기록 표시 칸 한 줄로(2026-11-07): 숫자 · 막대 · 작은 저장 버튼, 문구 숨김 */
.panel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px}
.panel .r1{display:contents}
.panel .sub{display:none}
.panel .big{font-size:1.05rem;order:1;white-space:nowrap}
.panel .bar{flex:1 1 30px;margin:0;order:2}
.panel .share{order:3;width:auto;margin:0;padding:6px 10px;font-size:.76rem;border-radius:999px;white-space:nowrap}
.panel .reset{order:4;margin-left:0;padding:5px 9px;font-size:.72rem}
a.cover{display:block;text-decoration:none;color:inherit}
.panel .appnote{order:5;flex-basis:100%;font-size:.78rem;font-weight:700;color:var(--teal-deep);text-decoration:none}
.joinmini{text-align:center;margin:28px auto 8px}
.joinmini a{font-weight:800;color:var(--teal-deep);text-decoration:underline;text-underline-offset:3px}
.joinmini span{display:block;font-size:.8rem;color:var(--ink-soft);margin-top:4px}
.note{font-size:.8rem;color:var(--ink-soft);margin-top:14px;max-width:none}
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
.ladder{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.step{display:flex;flex-direction:column;gap:6px;position:relative;min-width:0;overflow-wrap:anywhere}
.step .tier{font-size:.66rem;font-weight:800;color:#fff;padding:2px 7px;border-radius:6px;align-self:flex-start}
.step .cover{position:relative;aspect-ratio:3/4;border-radius:9px;overflow:hidden;background:var(--surface-2);box-shadow:var(--shadow);cursor:pointer}
a.cover{display:block;box-shadow:0 1px 3px rgba(35,41,31,.24),0 6px 14px rgba(35,41,31,.28) !important;transition:transform .1s,box-shadow .1s}
a.cover:active{transform:translateY(2px);box-shadow:0 1px 3px rgba(35,41,31,.26) !important}
.step .cover img{width:100%;height:100%;object-fit:cover;display:block}
.step .cover .ph{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:8px;text-align:center;color:#fff;background:linear-gradient(150deg,var(--teal),var(--teal-deep))}
.step .cover .ph .pt{font-family:'Gowun Batang',serif;font-weight:600;font-size:.72rem;line-height:1.15}
.step .cover.noimg .ph{display:flex}
.step .cover .chk{position:absolute;inset:0;background:rgba(36,86,72,.55);display:none;align-items:center;justify-content:center;font-size:1.6rem;color:#fff}
.step.seen .cover .chk{display:flex}
/* 표지 배지: 좁은 화면에서 겹치지 않게 왼쪽 위에 세로로 쌓음 */
.step .cbg{position:absolute;top:5px;left:5px;right:5px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;pointer-events:none}
.step .pop{background:color-mix(in srgb,var(--ink) 80%,transparent);color:#fff;
  font-size:.62rem;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:var(--shadow);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.step .krb{background:#c0392b;color:#fff;
  font-size:.6rem;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:var(--shadow);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.step .tt{font-size:.76rem;font-weight:700;line-height:1.2}
.step .au{font-size:.68rem;color:var(--ink-soft)}
.step a.buy{text-decoration:none;color:inherit;display:block;border-radius:6px}
.step a.buy:hover .tt{text-decoration:underline;color:var(--teal-deep)}
.step a.buy .cart{font-size:.66rem;opacity:.8}
.step .aw{font-size:.64rem;font-weight:800;color:#7a5a00;background:#f3e9c9;border-radius:6px;padding:2px 6px;align-self:flex-start;margin-top:2px}
.step .lib{font-size:.64rem;font-weight:800;color:#8a5a1a;background:#fbeee0;border-radius:6px;padding:2px 6px;align-self:flex-start;margin-top:2px}
.step .rs{font-size:.68rem;color:var(--ink-soft);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.step .cp{align-self:flex-start;margin-top:2px;border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);font:inherit;font-size:.64rem;font-weight:800;padding:3px 8px;border-radius:6px;cursor:pointer;transition:border-color .12s,color .12s}
.step .cp:hover{border-color:var(--teal);color:var(--teal-deep)}
.step .cp.done{border-color:var(--teal);color:var(--teal-deep);background:color-mix(in srgb,var(--teal) 12%,var(--surface))}
.step .fmt{font-size:.62rem;font-weight:800;color:#6a4a8a;background:#efe7f5;border-radius:6px;padding:2px 7px;align-self:flex-start;margin-top:2px}
.step .ser{font-size:.62rem;font-weight:800;color:#8a5a1a;background:#fbefd9;border-radius:6px;padding:2px 7px;align-self:flex-start;margin-top:2px}
.step .lvb{font-size:.62rem;font-weight:800;border-radius:6px;padding:2px 7px;align-self:flex-start;margin-top:2px}
.step .lvb.l1{background:#e3f1df;color:#2f6e58}
.step .lvb.l2{background:#d8ecee;color:#1f6f72}
.step .lvb.l3{background:#fbe3d6;color:#b05a2a}
#statline{margin-top:12px}
#statline b{color:var(--ink)}
@media (max-width:760px){.ladder{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
  .step .rs{display:none}.step .au{display:none}}
@media (max-width:520px){.ladder{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.step .rs{display:-webkit-box}.step .au{display:block}}
footer{border-top:1px solid var(--line);margin-top:34px;padding-block:26px 42px}
footer p{color:var(--ink-soft);font-size:.82rem;margin:.3em 0}
.prthumb{display:block;margin:16px auto 0;padding:0;border:0;background:none;cursor:pointer;width:min(100%,260px)}
.prthumb img{display:block;width:100%;aspect-ratio:1080/1350;border-radius:14px;border:1px solid var(--line);box-shadow:var(--shadow);background:#F1F3EA}
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
.print{margin-top:8px;width:100%;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-weight:800;font-size:.95rem;padding:12px;border-radius:12px;cursor:pointer}
.print:hover{border-color:var(--teal)}
#printable{display:none}
@media print{
  header.top,main.wrap,footer,.ov{display:none!important}
  #printable{display:block!important;color:#000;font-family:'Noto Sans KR',sans-serif}
  .pr-head h1{font-size:18pt;margin:0 0 2pt}
  .pr-head p{font-size:9pt;color:#444;margin:0 0 12pt}
  .pr-theme{break-inside:avoid;margin:0 0 9pt}
  .pr-h2{font-size:11pt;margin:0 0 3pt;border-bottom:1pt solid #000;padding-bottom:2pt}
  .pr-h2 span{font-size:8pt;color:#666;font-weight:400}
  .pr-t{width:100%;border-collapse:collapse;font-size:9pt}
  .pr-t td{border-bottom:.5pt solid #ccc;padding:2.5pt 4pt;vertical-align:top}
  .pr-t .c1{width:14pt;text-align:center}
  .pr-t .c2{width:64pt;color:#333}
  .pr-t .c4{width:110pt;color:#555}
  .pr-t .c5{width:52pt;color:#333;text-align:right;white-space:nowrap}
  body{background:#fff}
  @page{margin:14mm}
}
</style>

<header class="top"><div class="wrap">
  <div class="brand"><span class="mark">120</span><span>나이테 120</span></div>
  <a class="back" href="./">← 나이테</a><script>if(/[?&]embed=/.test(location.search))document.write('<style>.back{display:none}</style>')</script>
  <button class="sharebtn" id="prLink" title="이 페이지 공유하기">📤 공유</button>
</div></header>

<main class="wrap">
  <section class="hero">
    <div class="eyebrow">파닉스 전, 첫 영어 그림책 로드맵</div>
    <h1>나이테 120</h1>

    <div id="cn2" class="guide120">
      <h3>매달 다른 주제 24가지, 다른 유형 5권.</h3>
      <div class="g-types"><span>🧸 조작북</span><span>🔁 반복·패턴</span><span>🎵 라임·운율</span><span>😆 유머·반전</span><span>📖 스토리</span></div>
      <a class="g-tlink" href="types.html">🧩 왜 이 5가지일까요? 유형별 재미 알아보기 →</a>
    </div>
__PICKED__
    <div class="panel">
      <div class="r1">
        <span class="big" id="prBig">0 / 120</span>
        <span class="sub" id="prSub">읽어준 책을 체크하면 진행률이 쌓여요</span>
      </div>
      <div class="bar"><i id="prBar"></i></div>
      <button class="prthumb" id="prThumb" aria-label="진행 이미지 크게 보기·공유"><img id="prImg" alt="나이테 120 진행 이미지"></button>
      <button class="share" id="prShare">🖼️ 이미지 저장</button>
      <a class="appnote" href="record/app.html?tab=log">📲 진행률은 스터디 앱에서 읽은 책을 기록하면 쌓여요 ›</a>
      <button class="print" id="prPrint" hidden>🖨️ 120권 목록 인쇄 · PDF 저장</button>
    </div>
  </section>

  <section><div id="course-body"></div></section>
  <p class="small-disc bottom-disc">※ 🛒 쿠팡 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
</main>
<script>/* 스터디 앱 안(독서 로드맵, ?embed=): 위 여백 줄이고, 맨 아래 스터디방 참여하기는 숨김(2026-11-07) */
if(/[?&]embed=/.test(location.search))document.querySelectorAll('a[href="types.html"],a[href="road.html"]').forEach(function(x){x.href=x.getAttribute('href')+'?embed=record';}); // 유형 글에서 돌아올 때도 앱 모드 유지
if(/[?&]embed=/.test(location.search))document.write('<style>.hero{padding-block:8px 0}.joinmini{display:none}.wrap{padding-inline:16px}.hero .eyebrow{font-size:.85rem}.hero h1{font-size:24px;margin:2px 0 4px}.top .sharebtn{margin-left:auto}.panel .appnote{display:none}</style>');
</script>

<div class="ov" id="ov"><div class="ovb">
  <img id="ovimg" alt="나이테 120 진행 이미지">
  <div class="btns"><button class="save" id="ovShare">📤 공유</button><button class="save" id="ovSave">💾 저장</button><button class="close" id="ovClose">닫기</button></div>
  <p class="hint2">이미지를 저장하거나 공유해 보세요. (모바일에서는 공유 시 인스타·카톡 등으로 바로 보낼 수 있어요.)</p>
</div></div>

<div id="printable"></div>

<div class="wrap joinmini"><a id="joinBtn" data-study-room-link href="https://open.kakao.com/o/p8qXEfUi" target="_blank" rel="noopener">💬 함께 읽고 싶다면 · 스터디방 참여하기 ›</a><span>매달 5권, 엄마표영어 오픈채팅에서 인증하고 고민을 나눠요 (선택)</span></div>

<footer><div class="wrap">
  <p><strong>나이테 120</strong> · 파닉스 전, 첫 영어 그림책 로드맵 — 나이테 영어책육아 메이트</p>
  <p>큐레이션: 전세계 인기(Goodreads) + 주제·난이도 설계 · 표지: Open Library</p>
</div></footer>

<script>
const P=/*DATA*/;const {themes,tier_labels,total}=P;
const esc=s=>(s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tvar=t=>`var(--t${t})`;
// 표시 순서: 조작북(1) → 반복(3) → 라임(2) → 유머(4) → 스토리(5). 번호·색은 표시 위치 기준.
const DORD=[1,3,2,4,5];const POS={};DORD.forEach((t,i)=>POS[t]=i+1);
// 글밥 단계: 🌱 조작북·AR<2.0 / 🌿 AR 2~3 / 🌳 AR 3 이상 (AR는 계산용, 화면엔 표시 안 함)
const LV_EASY_MAX=2.0, LV_MID_MAX=3.0;
const LV_LABEL={1:'🌱 글밥 적음',2:'🌿 글밥 보통',3:'🌳 글밥 많음'};
function level(b){if(b.tier===1)return 1;if(b.ar==null||b.ar==='')return 0;const a=Number(b.ar);return a<LV_EASY_MAX?1:(a<LV_MID_MAX?2:3);}
// 완주율 = 스터디 앱 '읽기 기록'에 남긴 책(2026-11-08). 표지 체크 기능은 없앰 — 앱 안·사이트 모두 같은 기준
// 기록(naite_reads_v2)의 책 번호 → 책 정보(naite_bookmeta: 제목·주제·유형) → 120권 중 같은 제목(없으면 같은 주제·유형)
function logSeen(){
  const s=new Set(),norm=t=>String(t||'').toLowerCase().replace(/[^a-z0-9]/g,''),byT={},byKT={};
  themes.forEach(t=>t.books.forEach(b=>{byT[norm(b.title)]=b.id;byKT[t.key+'|'+b.tier]=b.id;}));
  try{
    const st=JSON.parse(localStorage.getItem('naite_reads_v2')||'null'),meta=JSON.parse(localStorage.getItem('naite_bookmeta')||'{}');
    ((st&&st.rows)||[]).forEach(r=>{
      if(r.k==='_other'){const id=byT[norm(r.o)];if(id)s.add(id);return;} // '다른 책'으로 적은 제목이 120권에 있으면 포함
      const m=meta[r.b];if(!m)return;const id=byT[norm(m.title)]||byKT[(m.k||r.k)+'|'+m.tier];if(id)s.add(id);
    });
  }catch(e){}
  return s;
}
let seen=logSeen();
try{localStorage.removeItem('joy-challenge-seen');}catch(e){} // 예전 표지 체크 기록은 지움
window._imgErr=el=>{el.parentElement.classList.add('noimg');el.remove();};

// 범례
if(document.getElementById('legend'))document.getElementById('legend').innerHTML='<span class="lg" style="color:var(--ink)">5가지 유형:</span>'+
  DORD.map(t=>`<span class="lg"><span class="sw" style="background:var(--t${POS[t]})"></span>${POS[t]}. ${esc(tier_labels[t])}</span>`).join('');
(function(){var fmt={'팝업':0,'플랩':0,'놀이북':0},lvc={1:0,2:0,3:0};
 themes.forEach(t=>t.books.forEach(b=>{if(b.format)fmt[b.format]=(fmt[b.format]||0)+1;var L=level(b);if(L)lvc[L]++;}));
 var el=document.getElementById('statline');
 if(el)el.innerHTML='<b>글밥</b> 🌱 '+lvc[1]+' · 🌿 '+lvc[2]+' · 🌳 '+lvc[3]+' &nbsp;|&nbsp; <b>조작북 형태</b> 팝업 '+fmt['팝업']+' · 플랩 '+fmt['플랩']+' · 놀이북 '+fmt['놀이북'];
})();

function stepHTML(b){
  return `<div class="step" data-id="${b.id}">
    <span class="tier" style="background:var(--t${POS[b.tier]})">${POS[b.tier]}. ${esc(b.tier_label)}</span>
    ${b.buy_url?`<a class="cover${b.cover?'':' noimg'}" href="${esc(b.buy_url)}" target="_blank" rel="noopener sponsored nofollow" title="쿠팡에서 보기">`:`<div class="cover${b.cover?'':' noimg'}">`}
      ${b.cover?`<img loading="lazy" src="${esc(b.cover)}" alt="${esc(b.title)}" onerror="_imgErr(this)">`:''}
      <div class="ph"><div class="pt">${esc(b.title)}</div></div>
      ${(b.pop_rank||b.kr_popular)?`<div class="cbg">${b.pop_rank?`<span class="pop">🌍 세계 인기</span>`:''}${b.kr_popular?`<span class="krb">🇰🇷 국내 인기</span>`:''}</div>`:''}
    ${b.buy_url?'</a>':'</div>'}
    ${b.buy_url?`<a class="buy" href="${esc(b.buy_url)}" target="_blank" rel="noopener sponsored nofollow" title="쿠팡에서 보기"><div class="tt">${esc(b.title)} <span class="cart">🛒</span></div><div class="au">${esc(b.author)}</div></a>`:`<div class="tt">${esc(b.title)}</div><div class="au">${esc(b.author)}</div>`}
    ${(function(){const l=level(b);return l?`<span class="lvb l${l}">${LV_LABEL[l]}</span>`:'';})()}${b.format?`<span class="fmt">${esc(b.format)}</span>`:''}${(b.series||[]).map(x=>`<span class="ser" title="노래 CD·세이펜이 있는 ${x} 시리즈">🎵 ${x}</span>`).join('')}
    <button class="cp" type="button" data-copy="${esc(b.title)}" title="제목 복사">📋 제목 복사</button>
    ${b.award?`<div class="aw">${esc(b.award)}</div>`:''}
    ${b.lib_loans?`<div class="lib">📚 도서관 ${b.lib_loans}회</div>`:''}
    <div class="rs">${esc(b.reason)}</div>
  </div>`;
}
function themeHTML(t){
  return `<div class="theme" data-key="${esc(t.key)}">
    <div class="th"><span class="emo">${t.emoji}</span><h3>${esc(t.ko)}</h3>
      <span class="en">${esc(t.en)}</span></div>
    <div class="ladder">${[...t.books].sort((a,b)=>POS[a.tier]-POS[b.tier]).map(stepHTML).join('')}</div>
  </div>`;
}
function renderBody(){
  const per = 1; // 한 달에 한 주제(24개월)
  const months = Math.ceil(themes.length/per);
  let html='';
  for(let m=0;m<months;m++){
    const slice=themes.slice(m*per,m*per+per);
    html+=`<div class="month"><div class="mh">${m+1}개월차</div>${slice.map(themeHTML).join('')}</div>`;
  }
  document.getElementById('course-body').innerHTML=html;
}
let thumbT=null;
function paintThumb(){clearTimeout(thumbT);thumbT=setTimeout(()=>{makeShareCanvas(seen.size,total,isDark()).then(cv=>{const im=document.getElementById('prImg');if(im)im.src=cv.toDataURL('image/jpeg',.85);});},250);}
function updateProgress(){
  paintThumb();
  const done=seen.size, pct=Math.round(done/total*100);
  document.getElementById('prBig').textContent=`${done} / ${total}`;
  document.getElementById('prBar').style.width=pct+'%';
  document.getElementById('prSub').textContent = done===0
    ? '스터디 앱 읽기 기록에 남긴 책이 여기에 쌓여요'
    : `${total}권 중 ${done}권 읽어줬어요 · ${pct}%` + (done>=total?' 🎉 120권 완주!':'');
}
async function copyTitle(btn){
  const t=btn.dataset.copy||'';
  try{await navigator.clipboard.writeText(t);}
  catch(e){try{const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');ta.remove();}catch(_){}}
  const o=btn.dataset.label||btn.textContent;btn.dataset.label=o;btn.textContent='복사됨 ✓';btn.classList.add('done');
  clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent=o;btn.classList.remove('done');},1200);
}
document.getElementById('course-body').addEventListener('click',e=>{
  const cp=e.target.closest('.cp');if(cp){copyTitle(cp);return;}
});
// 앱에서 기록이 바뀌면(같은 저장소) 완주율만 다시
window.addEventListener('storage',e=>{if(e.key==='naite_reads_v2'||e.key==='naite_bookmeta'){seen=logSeen();updateProgress();}});
const root=document.documentElement;
try{localStorage.removeItem('joy-theme');}catch(e){}
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
  g.fillStyle=P.foot;g.font='500 30px "Noto Sans KR",sans-serif';g.fillText('나이테 영어책육아 메이트 · 파닉스 전 첫 영어 그림책 로드맵',W/2,1282);
  g.fillStyle=P.honey;g.font='700 32px "Noto Sans KR",sans-serif';g.fillText('📷 Instagram  @naite_library',W/2,1328);
  return cv;
}
function isDark(){return false;}
function openShare(){makeShareCanvas(seen.size,total,isDark()).then(cv=>{window.__cv=cv;document.getElementById('ovimg').src=cv.toDataURL('image/png');document.getElementById('ov').classList.add('on');});}
function saveShare(){const cv=window.__cv;if(!cv)return;shareEv('image_save');cv.toBlob(b=>{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='naite-120.png';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);},'image/png');}
function shareShare(){const cv=window.__cv;if(!cv)return;shareEv('image');cv.toBlob(async b=>{const f=new File([b],'naite-120.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'나이테 120',text:`나이테 120 · ${seen.size}/${total}권 읽어주는 중`});return;}catch(e){}}saveShare();},'image/png');}
// ── 120권 목록 인쇄/PDF ──
function buildPrintable(){
  const now=new Date().toLocaleDateString('ko-KR');
  let h=`<div class="pr-head"><h1>나이테 120 — 파닉스 전, 첫 영어 그림책 로드맵</h1><p>전체 ${total}권 · 24주제 × 5권 · 읽음 ${seen.size}/${total} · 나이테 영어책육아 메이트 · ${now}</p></div>`;
  themes.forEach((t,i)=>{
    const bks=[...t.books].sort((a,b)=>POS[a.tier]-POS[b.tier]);
    h+=`<div class="pr-theme"><div class="pr-h2">${i+1}. ${t.emoji} ${esc(t.ko)} <span>${esc(t.en)}</span></div><table class="pr-t"><tbody>`;
    bks.forEach(b=>{const L=level(b);const lvl=(b.tier===1)?((L?'🌱 ':'')+(b.format||'')):(L?LV_LABEL[L]:'');h+=`<tr><td class="c1">${seen.has(b.id)?'✓':'☐'}</td><td class="c2">${POS[b.tier]}. ${esc(b.tier_label)}</td><td>${esc(b.title)}</td><td class="c4">${esc(b.author)}</td><td class="c5">${esc(lvl)}</td></tr>`;});
    h+=`</tbody></table></div>`;
  });
  document.getElementById('printable').innerHTML=h;
}
function printList(){buildPrintable();window.print();}
document.getElementById('prPrint').addEventListener('click',printList);
// 공유 집계(share_click): how = link(페이지 링크) / image(진행 이미지 공유) / image_save(이미지 저장)
function shareEv(how){try{if(localStorage.getItem('naite_notrack')==='1'||/[?&]embed=/.test(location.search))return;var A="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi",sid=localStorage.getItem('joy_sid')||'anon';
  fetch("https://vvfqrewseibjdwcuscaz.supabase.co/rest/v1/events",{method:"POST",headers:{"apikey":A,"Authorization":"Bearer "+A,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({type:"share_click",session_id:sid,path:location.pathname,meta:{page:"나이테 120",how:how}}),keepalive:true}).catch(function(){});
}catch(e){}}
// 🔗 페이지(링크) 공유 — 모바일은 네이티브 공유시트, 아니면 링크 복사
function sharePage(){
  shareEv('link');
  var url=location.origin+location.pathname;
  var btn=document.getElementById('prLink');
  if(navigator.share){navigator.share({title:'나이테 120 — 파닉스 전, 첫 영어책',text:'파닉스 전, 아이 첫 영어 그림책 120권 큐레이션 · 나이테 120',url:url}).catch(function(){});return;}
  function done(){btn.textContent='✓ 링크 복사됨';clearTimeout(btn._t);btn._t=setTimeout(function(){btn.textContent='📤 공유';},1600);}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(done);}
  else{try{var ta=document.createElement('textarea');ta.value=url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');ta.remove();}catch(_){}done();}
}
document.getElementById('prLink').addEventListener('click',sharePage);
// 🖨️ PDF 버튼은 관리자 전용: URL에 ?admin=1 이 있을 때만 노출(저장 안 함). 일반 링크에선 항상 숨김.
try{var _ap=new URLSearchParams(location.search);if(_ap.get('admin')==='1'){var _pb=document.getElementById('prPrint');if(_pb)_pb.hidden=false;}}catch(e){}
// 스터디 참여하기 클릭 집계(인스타 유입→참여 전환 측정)
(function(){var jb=document.getElementById('joinBtn');if(!jb)return;jb.addEventListener('click',function(){
  try{if(localStorage.getItem('naite_notrack')==='1')return;var A="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi",sid=localStorage.getItem('joy_sid')||'anon';
    fetch("https://vvfqrewseibjdwcuscaz.supabase.co/rest/v1/events",{method:"POST",headers:{"apikey":A,"Authorization":"Bearer "+A,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({type:"join_click",session_id:sid,path:location.pathname,meta:{page:"나이테 120",from:(window.NAITE_SRC||"direct")}}),keepalive:true}).catch(function(){});
  }catch(e){}
});})();
document.getElementById('prShare').addEventListener('click',openShare);
document.getElementById('prThumb').addEventListener('click',openShare);
document.getElementById('ovSave').addEventListener('click',saveShare);
document.getElementById('ovShare').addEventListener('click',shareShare);
document.getElementById('ovClose').addEventListener('click',()=>document.getElementById('ov').classList.remove('on'));
document.getElementById('ov').addEventListener('click',e=>{if(e.target.id==='ov')document.getElementById('ov').classList.remove('on');});
renderBody();updateProgress();
// 쿠팡 링크(관리자 입력)를 불러와 제목에 연결 — 비공개 books 대신 공개 RPC 사용
(function(){
  var U="https://vvfqrewseibjdwcuscaz.supabase.co",A="sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi";
  function bn(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  fetch(U+"/rest/v1/rpc/list_buy_urls",{method:"POST",headers:{"apikey":A,"Authorization":"Bearer "+A,"Content-Type":"application/json"},body:"{}"})
    .then(function(r){return r.ok?r.json():[];})
    .then(function(rows){if(!rows||!rows.length)return;var m={};rows.forEach(function(x){if(x&&x.buy_url)m[bn(x.title)]=x.buy_url;});
      var hit=0;themes.forEach(function(t){t.books.forEach(function(b){var u=m[bn(b.title)];if(u){b.buy_url=u;hit++;}});});
      if(hit)renderBody();
    }).catch(function(){});
})();
</script>
<script src="track.js" data-page="나이테 120"></script>
<script src="study-room.js" defer></script>
<script src="c120-study.js" defer></script>
"""
_disc = ('    <p class="note" style="margin-top:6px">※ 책 제목을 누르면 열리는 <b>🛒 쿠팡 링크</b>는 '
         '쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>') if _buycnt else ''
# 이렇게 골랐어요(2026-11-14): 숫자는 challenge.json 뱃지에서 계산(책을 바꾸면 자동으로 맞춰짐)
_all = [b for t in data["themes"] for b in t["books"]]
_n = lambda k: sum(1 for b in _all if b.get(k))
_picked = f'''    <div class="picked">
      <h3>나이테 120은 이렇게 골랐어요</h3>
      <div class="p-stats"><span><b>{_n("award")}</b>🏅 수상작</span><span><b>{_n("kr_popular")}</b>🇰🇷 국내 인기</span><span><b>{_n("pop_rank")}</b>🌍 세계 인기</span><span><b>{_n("lib_loans")}</b>📚 대출 인기</span></div>
      <ul>
        <li>칼데콧 등 그림책 상 수상, 국내 서점 순위, 전 세계 인기, 도서관 대출 기록을 보고 골랐어요</li>
      </ul>
      <a class="p-link" href="road.html">🌳 고른 사람 이야기 · 나이테(드니맘)가 걸어온 길 →</a>
    </div>
    <div class="picked use" id="use120">
      <h3>이렇게 활용해요 <small>0개월~9세 누구나</small></h3>
      <p class="u-q">집에 영어책이…</p>
      <div class="u-tabs" role="tablist"><button type="button" role="tab" data-u="0" aria-selected="true">🌱 아직 없어요</button><button type="button" role="tab" data-u="1" aria-selected="false">📦 전집 한 질</button><button type="button" role="tab" data-u="2" aria-selected="false">📚 이미 많아요</button></div>
      <div class="u-pane" data-u="0"><b>알아보지 말고, 지금 스터디 중인 달부터 그대로 따라오세요.</b>매달 스터디 책 5권만 구해서 따라오다 보면 웬만한 유명 원서를 골고루 만나요.<a class="u-now" id="uNow" href="#" hidden></a></div>
      <div class="u-pane" data-u="1" hidden><b>전집은 하던 대로, 원서 그림책은 나이테 120으로.</b>잉글리시에그·월드패밀리 같은 영어 전집과 원서 그림책은 따로 가져가요. 전집은 그대로 하고, 나이테 120을 한 달에 5권씩 더해 주세요.</div>
      <div class="u-pane" data-u="2" hidden><b>읽던 책은 그대로, 이번 달 5권은 전면책장에.</b>매달 5권을 전면책장에 올려 두고 한 번씩만 읽어 줘도 새로운 책을 골고루 만나요.<span class="u-me">🌳 나이테네는요 — 기존 ORT는 자기 전 매일 읽고, 전면책장 5권은 매달 바꾸면서 ‘이번 달 이 5권은 꼭’ 하는 마음으로 한 번씩 읽어 줘요.</span></div>
    </div>
''' + r'''    <script>(function(){var r=document.getElementById('use120');if(!r)return;var bs=r.querySelectorAll('.u-tabs button'),ps=r.querySelectorAll('.u-pane');
      function pick(i,save){bs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.u==i?'true':'false');});ps.forEach(function(p){p.hidden=p.dataset.u!=i;});if(save)try{localStorage.setItem('naite_use120',i);}catch(e){}}
      bs.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.u,true);});});
      try{var s=localStorage.getItem('naite_use120');if(s!==null&&/^[012]$/.test(s))pick(s,false);}catch(e){}
      // 지금 스터디 중인 달(settings.current_theme) → "지금은 N개월차 🚗 탈것 · 바로 보기", 누르면 그 달로 스크롤
      var A='sb_publishable_3fPCK8UtW4E8iyxfiCit6w_YJlqBxRi';
      fetch('https://vvfqrewseibjdwcuscaz.supabase.co/rest/v1/settings?select=current_theme&id=eq.1',{headers:{apikey:A,Authorization:'Bearer '+A},cache:'no-store'})
        .then(function(x){return x.ok?x.json():[];}).then(function(rows){var k=rows&&rows[0]&&rows[0].current_theme;if(!k)return;
          var el=document.querySelector('.theme[data-key="'+k+'"]');if(!el)return;var m=el.closest('.month'),mh=m&&m.querySelector('.mh');
          var t=(typeof themes!=='undefined')?themes.filter(function(x){return x.key===k;})[0]:null;
          var a=document.getElementById('uNow');a.textContent='👉 지금 스터디는 '+(mh?mh.textContent+' ':'')+(t?t.emoji+' '+t.ko:'')+' · 바로 보기 ↓';a.hidden=false;
          a.onclick=function(e){e.preventDefault();var cur=document.querySelector('.theme[data-key="'+k+'"]')||el;var y=cur.getBoundingClientRect().top+window.scrollY-70;window.scrollTo({top:y,behavior:'smooth'});};
        }).catch(function(){});
    })();</script>'''
html_out = TEMPLATE.replace("/*DATA*/", payload).replace("__BUY_DISCLOSURE__", _disc).replace("__PICKED__", _picked)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)
print(f"쿠팡 링크 연결된 책: {_buycnt}/120")
# 나이테 스터디 앱의 '다음 달 미리보기'가 읽는 공개 데이터(아직 비공개인 달의 책도 120 페이지엔 공개돼 있음)
_mini = {"themes": [{"key": t["key"], "emoji": t["emoji"], "ko": t["ko"], "en": t["en"],
          "books": [{"title": b["title"], "author": b["author"], "cover": b.get("cover") or "", "tier": b["tier"],
                     "tier_label": b["tier_label"], "ar": b.get("ar"), "format": b.get("format") or "", "reason": b.get("reason") or ""} for b in sorted(t["books"], key=lambda x: x["tier"])]}
         for t in data["themes"]]}
json.dump(_mini, open(os.path.join(os.path.dirname(OUT), "..", "docs", "c120_data.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(f"생성: {OUT} ({len(html_out)//1024} KB), 120권/24주제 + docs/c120_data.json")
