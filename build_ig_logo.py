# -*- coding: utf-8 -*-
"""인스타 프로필용 나이테 로고 PNG 생성 (1080x1080, 원형 크롭 대응). 두 버전 출력."""
from PIL import Image, ImageDraw
import os
HERE = os.path.dirname(os.path.abspath(__file__))
S = 1080; k = 4; W = S * k

def ellipse(d, cx, cy, r, col, wd):
    rr, ww = r*k, wd*k
    d.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], outline=col, width=ww)

# ── 버전 1: 다크 배지 ──
def v1():
    PINE=(31,78,66); HONEY=(209,150,92)
    img=Image.new("RGB",(W,W),PINE); d=ImageDraw.Draw(img); c=W//2
    for r,wd,col in [(452,26,(223,230,216)),(360,26,(200,216,199)),(268,26,(176,205,188)),(176,26,(150,190,168))]:
        ellipse(d,c,c,r,col,wd)
    cr=78*k
    d.ellipse([c-cr-9*k,c-cr-9*k,c+cr+9*k,c+cr+9*k],outline=(223,230,216),width=8*k)
    d.ellipse([c-cr,c-cr,c+cr,c+cr],fill=HONEY)
    img.resize((S,S),Image.LANCZOS).save(os.path.join(HERE,"docs","naite-ig-logo.png"),"PNG")

# ── 버전 2: 밝은 종이 + 자연스러운 나이테(불규칙 간격·살짝 중심 이동) ──
def v2():
    PAPER=(238,233,222); HONEY=(209,150,92)
    img=Image.new("RGB",(W,W),PAPER); d=ImageDraw.Draw(img); c=W//2
    # 파인그린 계열, 바깥 진하고 안쪽 연하게 / 간격 불규칙 / 중심 살짝 이동(나뭇결 느낌)
    rings=[(468,26,(36,86,72),(0,0)),
           (392,22,(47,110,88),(6,-4)),
           (330,20,(60,124,100),(12,-8)),
           (276,18,(79,154,114),(18,-10)),
           (232,17,(110,176,140),(22,-12)),
           (192,16,(150,196,168),(24,-13))]
    for r,wd,col,off in rings:
        ellipse(d,c+off[0]*k,c+off[1]*k,r,col,wd)
    ox,oy=c+26*k,c-14*k
    cr=66*k
    d.ellipse([ox-cr-8*k,oy-cr-8*k,ox+cr+8*k,oy+cr+8*k],outline=(238,233,222),width=7*k)
    d.ellipse([ox-cr,oy-cr,ox+cr,oy+cr],fill=HONEY)
    img.resize((S,S),Image.LANCZOS).save(os.path.join(HERE,"docs","naite-ig-logo2.png"),"PNG")

v1(); v2()
print("saved v1, v2")
