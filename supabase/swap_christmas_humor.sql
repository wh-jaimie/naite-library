-- 크리스마스 '유머·반전' 교체: Santa Bruce → Olivia Helps with Christmas (Ian Falconer, 2007)
--   산타를 기다리다 못해 크리스마스 준비를 "돕겠다고" 나서는 돼지 올리비아 (AR 2.4)
-- 기존 행을 제자리 update (책 id 유지 → 회원 읽기 기록 보존). 이전 책 쿠팡·영상·워크지 링크는 비움.
-- Supabase SQL Editor 에서 실행하세요. 다시 실행해도 안전해요.
update public.books set
  title      = 'Olivia Helps with Christmas',
  author     = 'Ian Falconer',
  cover      = 'https://covers.openlibrary.org/b/id/760875-L.jpg',
  reason     = '산타를 기다리다 못해 크리스마스 준비를 "돕겠다고" 나서는 돼지 올리비아',
  pop_rank   = 0,
  lib_loans  = 0,
  award      = '',
  kr_popular = false,
  format     = '',
  ar         = 2.4,
  buy_url    = case when title = 'Olivia Helps with Christmas' then buy_url else '' end,
  workbook   = case when title = 'Olivia Helps with Christmas' then workbook else '' end,
  read_aloud = case when title = 'Olivia Helps with Christmas' then read_aloud else '' end
where theme_key = 'christmas' and tier = 4;
