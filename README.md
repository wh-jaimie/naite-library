# 나이테 영어 그림책 책장 (joy-curation)

파닉스 전 유아를 위해, **전세계 독자가 가장 많이 읽은 영어 그림책**을 연령대별로 고를 수 있게
정리한 큐레이션. 데이터로 뽑고 표지·추천 이유를 붙여 웹페이지로 발행한다.

🔗 **발행 페이지**: https://wh-jaimie.github.io/joy-curation/

## 왜 이렇게 만들었나

처음엔 국립중앙도서관 **도서관 정보나루**의 인기대출 데이터로 시작했지만,
파닉스 전(0~7세) 그림책은 도서관 대출이 적고 순위가 리더스·챕터북에 밀려
이 목적에는 맞지 않았다. 그래서 **Goodreads의 전세계 인기 셸프**
(board-books · toddler · picture-books)를 인기순으로 합산하는 방식으로 전환했다.

## 파이프라인

| 단계 | 스크립트 | 설명 |
|---|---|---|
| 수집·합산 | `build_goodreads.py` | Goodreads 3개 셸프(인기순)를 가중 합산 → 연령대 분류 → OpenLibrary 표지·ISBN 결합 → 국내 도서관 대출 교차 → `output/gr_master.json` |
| 추천 이유 | `add_reasons.py` | 106종 각각에 추천 이유 한 줄 부여 |
| 페이지 생성 | `build_page_gr.py` | `gr_master.json` → `output/index.html` (연령대 필터·검색·정렬, 다크모드) |

### 참고용 (초기 도서관대출 접근 — 폐기)
`curate_english_books.py`, `process_csv.py`, `enrich.py`, `build_page.py` 는
도서관 정보나루 API/엑셀 기반 초기 실험 코드다. 도서관 정보나루 API를 쓰려면
인증키가 필요하다: 환경변수 `D4L_KEY` 로 설정 (코드에 하드코딩하지 말 것).

## 실행

```bash
pip install requests openpyxl
python build_goodreads.py     # 데이터 수집 (인터넷 필요)
python add_reasons.py         # 추천 이유 부여
python build_page_gr.py       # 페이지 생성 -> output/index.html
```

발행 페이지는 `docs/index.html` (GitHub Pages, main 브랜치 /docs)에서 서빙된다.
페이지를 갱신하려면 `output/index.html` 을 `docs/index.html` 로 복사 후 커밋.

## 데이터 출처

- 인기순: **Goodreads** 인기 셸프 (board-books · toddler · picture-books)
- 표지: **Open Library** Covers
- 국내 대출(보조): **도서관 정보나루** (국립중앙도서관)
