# 나이테 KPI 이벤트 사전

사용자가 어떤 메뉴를 누르고 무엇을 하는지 남기는 이벤트(`events` 테이블)의 이름표예요. 2026-11-16에 처음 정리했어요.
**기능을 만들거나 메뉴 이름·구조를 바꿀 때마다 이 문서와 KPI(`docs/study/kpi.html`의 `TABN`·`STABN`·`EMBN`·`EVN`)를 같이 고쳐요.** 운영 분석 스크립트(`분석/스크립트/분석.py`, 로컬)도 이 이름표를 따라요.

## 1. 공통 규칙
- **저장:**
  - 스터디 앱: `docs/record/app.html`의 `logEvent(type, meta)`를 써요. `reading-log.js`에서는 `S.onEvent(type, meta)`가 이 함수로 이어져요.
  - 사이트 페이지: `docs/track.js`가 `page_view`와 `ui_click`을 자동으로 남겨요.
- **관리자·제외 기기:** 관리자로 로그인한 기기와 `?notrack=1` 기기는 기록하지 않아요.
- **사람 수:** `session_id`(폰별 익명 ID, localStorage `joy_sid`)로 세요. 읽기 기록은 `reading_logs.reader`(다른 ID)로 세요.
- **이벤트 이름:** 바꾸지 않아요. 화면 메뉴 이름이 바뀌어도 이벤트 `type`과 메뉴 **ID**(`meta.tab`)는 그대로 두고, KPI 이름표만 고쳐요. 그래야 기간을 이어서 볼 수 있어요.
- **meta에 넣는 것:**
  - 메뉴 ID처럼 바뀌지 않는 값을 넣어요. 화면 글자는 `label`로 따로 넣어요.
  - 개인정보는 넣지 않아요. 메모 내용, 닉네임, 숫자 4자리, 사진이 여기에 해당해요.
- **앱 탭 안에서 연 페이지:** 나이테 120, 인기 책장, 나이테 Pick은 iframe(`?embed=record`)으로 열려요. 이 페이지들의 이벤트는 `meta.src='record'`로 남고, KPI에서 앱 사용으로 세요. 사이트 방문에서는 빠져요.

## 2. 스터디 앱 메뉴
### 아래 탭: `tab_view` `{tab, init?}`
앱을 열 때 처음 보이는 탭도 `init:1`로 남겨요(11/16부터).

| tab ID | 화면 이름 | 비고 |
|---|---|---|
| study | 📘 이번 달 책 | |
| shelf | 📖 읽기 기록 | 옛 `stats`(읽기 통계)도 여기로 합침(11/7) |
| c120 | 🌳 독서 로드맵 | 안은 `challenge.html` iframe |
| shop | 🛒 인기 책장 | 안은 `domestic.html` iframe |
| pick | 💛 나이테 Pick | 안은 `road.html` iframe |

### 이번 달 책 안 메뉴: `study_tab` `{tab, label, via?}`
11/16부터 tab에 ID를 넣어요. 그전 기록은 tab에 화면 글자가 들어 있어요. `via:'swipe'`는 옆으로 밀어서 넘긴 경우예요.

| tab ID | 화면 이름 |
|---|---|
| s-books | 이번 달 5권 |
| s-words | 단어·줄거리 |
| s-how | 읽어주기 방법 |
| s-vid | 읽어주기 영상 |
| s-play | 놀이 활동 |
| s-exp | 영어표현 |
| s-next | 다음 달 |
| s-extra | (옛) 부가자료 탭 — 11/12 없앰, '이번 달 5권' 탭 안으로 옮김 |

## 3. 스터디 앱 이벤트

| type | 뜻 | meta |
|---|---|---|
| page_view | 스터디 앱 열기 | theme, pwa(홈 화면 앱이면 1) |
| app_installed | 설치 완료(안드로이드만 잡힘) | |
| dwell | 머문 시간 | seconds |
| book_click | 책 표지 눌러 보기 | book_id, title |
| read_aloud_click | 읽어주기 영상 | title |
| workbook_click | 워크지 | title |
| extra_click | 부가자료 열기 | title |
| buy_click | 쿠팡 클릭 | title, from? |
| title_copy | 책 제목 복사(다른 데서 사려는 행동) | title |
| book_info_go / guide_click / blog_click / insta_click | 책 정보·가이드·블로그·인스타 | from 등 |
| groupbuy_interest | 공동구매 관심 | theme_key, page |
| age_pick / age_book_go | 아이 나이 고르기 / 나이별 추천 책 보기 | age, title |
| use120_pick | '집에 영어책이 얼마나 있나요?' 답 | |
| news_open / welcome_open | 공지 / 처음 오셨나요 열기 | |
| push_on / push_off / push_denied | 알림 켜기 / 끄기 / 거절 | |
| record_sheet_open | 읽은 책 기록 창 열기 | |
| other_read | 다른 책 기록 | titled |
| today_fab / today_cam / today_book / today_share | ✏️ 오늘 기록 버튼과 그다음 행동 | |
| cal_day_open / cal_from_card / month_nav / shelf_month | 달력 날짜 열기 / 카드에서 달력 / 달 넘기기 / 기록 달 바꾸기 | |
| stamp_camera_open / stamp_photo_save / stamp_photo_share / stamp_photo_open / stamp_album / camera_fail / photo_reload | 인증샷 | |
| share_card_open / _save / _share / _photo | 오늘 카드 이미지 | day |
| month_card_open / _save / _share | 달력 이미지 | month |
| day_card_open / _save / _share | 하루 사진 모음 카드(사진 여러 장) | day |
| day_photo_open / _save / _share | 하루 인증 사진 한 장 내보내기 | day |
| chal_card_open / _save / _share | 1주 미니 챌린지 완주샷 | id |
| tip_open | (옛) '이 책 읽어주기 팁' 펼치기 — 팁이 항상 보이게 바뀌어 지금은 안 남음 | title |
| book_note / note_book_open | 한 줄 메모 쓰기(내용은 안 남김) / 책 메모 모아보기 | other, del, len |
| c120_study_open | 로드맵에서 스터디 자료 열기 | |
| chal_wb_open / chal_wb_save / chal_name / challenge_apply_click / challenge_apply_done | 1주 미니 챌린지 | id |
| backup_made / backup_restored | 기록 백업 / 이어보기(아빠와 같이 쓰기 포함) | |
| family_open / family_share | 아빠와 같이 쓰기 열기 / 아빠에게 링크 보내기 | |
| file_backup / file_restore | 메모·사진 파일 저장 / 불러오기 | n, p(개수만) |
| backup_first_nudge / backup_nudge | 첫 기록 뒤 / 달 바뀔 때 백업 안내가 뜸 | |
| install_offer / install_click / install_bar_close | 설치 안내 뜸 / 설치 버튼 / 안내 닫기 | |

## 4. 사이트 이벤트
- `page_view` `{page, src}`: src는 유입 출처예요(`?from=`, referrer, `record`는 앱 안).
- `ui_click` `{page, label, href, src}`: 버튼 이름은 `data-ev` → 글자(40자) → aria-label 순서로 정해요.
- `cta_click` `{cta}`: 메인 주요 버튼이에요. 이름표는 KPI `MAINCTA`에 있어요.
- `groupbuy_interest`, `join_click` `{from}`
- 나이테 120(독서 로드맵) 탭(2026-11-16): `ui_click` label로 남아요 — `로드맵 탭: 120권 목록` / `로드맵 탭: 나이테 120 소개`, 소개 탭 안 `소개: 0~3세`·`소개: 4~6세`·`소개: 7~9세`·`소개: 책 없음`·`소개: 전집 한 질`·`소개: 이미 많아요`·`소개: 목록 보러 가기`, 목록 탭 `로드맵: 지금 스터디 달로`. 처음 연 기기는 소개 탭부터(`naite_c120_about_seen`), `?tab=about|list`로 지정. 고른 답은 `naite_age120`·`naite_use120`(앱 '처음 오셨나요?'와 공유).
- `share_click` `{page, how}`: how = `link`(목록 탭 링크) · `link_about`(소개 탭 링크, `?tab=about`) · `image` · `image_save`. 이름표는 KPI `HOW`.

## 5. 새 기능을 만들 때 체크리스트
1. 사용자가 누르는 주요 버튼과 화면 열기마다 이벤트를 남겨요. 사이트 페이지는 `track.js`가 자동으로 남기니, 이름이 애매하면 `data-ev`를 붙여요.
2. 새 `type`이면 이 문서 3절과 KPI `EVN`에 이름을 추가해요. 이름표가 없으면 KPI 스터디 앱 카드에 '이름표 없는 이벤트' 경고가 떠요.
3. 메뉴·탭을 추가하거나 이름을 바꾸면 2절 표와 KPI `TABN`·`STABN`·`EMBN`을 고쳐요. ID는 되도록 그대로 둬요.
4. 로컬에서 Playwright로 `/rest/v1/events` POST를 가로채 이벤트가 실제로 나가는지 확인해요(예: 첫 화면 `tab_view init:1`).
5. KPI 화면에서 새 이벤트가 이름표대로 보이는지 확인해요(가짜 이벤트로 `kpi.html` 렌더링).
