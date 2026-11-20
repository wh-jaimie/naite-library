-- 크리스마스 '스토리' 교체(2026-11-20 운영자): Bear Stays Up for Christmas → Pip and Posy: The Christmas Tree (Axel Scheffler, Nosy Crow, 2018)
--   트리에 단 과자 장식을 몰래 먹다 배탈 난 핍, 정직과 용서를 담은 크리스마스 이야기 (AR 2.3, 운영자 확인)
-- 기존 행을 제자리 update (책 id 유지 → 회원 읽기 기록 보존). 이전 책 쿠팡·영상·워크지 링크는 비움.
-- Supabase SQL Editor 에서 실행하세요. 다시 실행해도 안전해요.
update public.books set
  title      = 'Pip and Posy: The Christmas Tree',
  author     = 'Axel Scheffler',
  cover      = 'https://covers.openlibrary.org/b/id/10857882-L.jpg',
  reason     = '트리에 단 과자 장식을 몰래 먹다 배탈 난 핍, 정직과 용서를 담은 크리스마스 이야기',
  pop_rank   = 0,
  lib_loans  = 0,
  award      = '',
  kr_popular = false,
  format     = '',
  ar         = 2.3,
  buy_url    = case when title = 'Pip and Posy: The Christmas Tree' then buy_url else '' end,
  workbook   = case when title = 'Pip and Posy: The Christmas Tree' then workbook else '' end,
  read_aloud = case when title = 'Pip and Posy: The Christmas Tree' then read_aloud else '' end
where theme_key = 'christmas' and tier = 5;
