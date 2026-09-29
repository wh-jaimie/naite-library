# -*- coding: utf-8 -*-
"""홈 화면 추가(PWA)용 앱 아이콘을 인스타 프로필 로고(v1 다크)에서 생성.
소스: docs/naite-ig-logo.png (진초록 배경 나이테 링 + 허니 중심점)
- apple-touch-icon.png (180)  : 아이폰 '홈 화면에 추가'
- icon-192.png / icon-512.png : 안드로이드 매니페스트
- icon-512-maskable.png       : 안드로이드 적응형(배경색 여백 포함)
- favicon-32.png              : 탭 아이콘 폴백
"""
from PIL import Image
import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "docs")
SRC = os.path.join(OUT, "naite-ig-logo.png")

logo = Image.open(SRC).convert("RGB")
bg = logo.getpixel((5, 5))  # 모서리 = 배경색(진초록)
print("logo bg =", "#%02X%02X%02X" % bg)

def sq(px):
    return logo.resize((px, px), Image.LANCZOS)

def save(name, px):
    sq(px).save(os.path.join(OUT, name), "PNG")
    print("saved", name)

save("apple-touch-icon.png", 180)
save("icon-192.png", 192)
save("icon-512.png", 512)
save("favicon-32.png", 32)

# 마스커블(적응형): 배경색 캔버스에 로고를 78%로 축소 배치(안전영역 여백)
S = 512
canvas = Image.new("RGB", (S, S), bg)
inner = int(S * 0.78)
li = logo.resize((inner, inner), Image.LANCZOS)
off = (S - inner) // 2
canvas.paste(li, (off, off))
canvas.save(os.path.join(OUT, "icon-512-maskable.png"), "PNG")
print("saved icon-512-maskable.png")
print("done")
