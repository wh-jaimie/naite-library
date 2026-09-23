-- 동물 테마 '유머·반전'(tier 4) 책 교체
--   Moo, Baa, La La La!(너무 유아틱) → Interrupting Chicken(칼데콧 아너 2011, 위트 있는 유머·반전)
update public.books set
  title      = 'Interrupting Chicken',
  author     = 'David Ezra Stein',
  reason     = '이야기마다 불쑥 끼어드는 꼬마 닭의 엉뚱한 유머·반전',
  cover      = 'https://covers.openlibrary.org/b/id/6666387-L.jpg',
  pop_rank   = 0,                       -- 세계 인기 100 밖(→ 🌍 배지 없음)
  award      = '🏅 칼데콧 아너 2011',    -- 대신 수상 배지 추가
  kr_popular = false,
  workbook   = '',                      -- 새 책이므로 이전 링크 초기화
  buy_url    = ''
where theme_key = 'animals' and tier = 4;
