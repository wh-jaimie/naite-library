-- 탈것 '반복' 교체: Truck Full of Ducks → Mr Gumpy's Outing
--   (배에 동물이 하나씩 타며 "Can I come?"이 쌓이는 누적 반복 — 1970 케이트 그리너웨이 메달)
-- + 수상 배지에 '그리너웨이 메달' 추가 (This Is Not My Hat 2014 포함)
-- Supabase SQL Editor 에서 한 번 실행하세요.
update public.books set
  title      = 'Mr Gumpy''s Outing',
  author     = 'John Burningham',
  cover      = 'https://covers.openlibrary.org/b/id/580676-L.jpg',
  reason     = '배에 동물이 하나씩 타며 "Can I come?"이 쌓이는 누적 반복 — 그리너웨이 메달',
  pop_rank   = 0,
  lib_loans  = 0,
  award      = '🥇 그리너웨이 메달 1970',
  kr_popular = false,
  format     = '',
  ar         = 1.7,
  buy_url    = '',   -- 이전 책 쿠팡 링크 제거 → 관리자 🛒 탭에서 새로 입력
  workbook   = '',
  read_aloud = ''
where theme_key = 'vehicles' and title = 'Truck Full of Ducks';

update public.books set award = '🥇 칼데콧 메달 2013 · 🥇 그리너웨이 메달 2014'
where title = 'This Is Not My Hat';
