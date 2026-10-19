-- 탈것 '라임·운율' 교체: Nee Naw the Little Fire Engine → Nee Naw and the Cowtastrophe (같은 시리즈 2권, Scholastic NZ 2018)
--   할머니네 소 Ploppy가 나무 위에 올라가 버린 소동을 꼬마 소방차 Nee Naw가 해결하는 따라 부르는 노래 그림책
-- 기존 행을 제자리 update (책 id 유지 → 회원 읽기 기록 보존). 이전 책 쿠팡·영상·워크지 링크는 비움.
-- Supabase SQL Editor 에서 한 번 실행하세요. 다시 실행해도 안전해요.
update public.books set
  title      = 'Nee Naw and the Cowtastrophe',
  author     = 'Deano Yipadee',
  cover      = 'https://wh-jaimie.github.io/naite-library/covers/nee-naw-cowtastrophe.jpg',
  reason     = '할머니네 소가 나무 위에 올라가 버린 소동 — 따라 부르는 노래 그림책(쉬운 후렴)',
  pop_rank   = 0,
  lib_loans  = 0,
  award      = '',
  kr_popular = false,
  format     = '',
  ar         = 2.8,
  buy_url    = case when title = 'Nee Naw and the Cowtastrophe' then buy_url else '' end,
  workbook   = case when title = 'Nee Naw and the Cowtastrophe' then workbook else '' end,
  read_aloud = case when title = 'Nee Naw and the Cowtastrophe' then read_aloud else '' end
where theme_key = 'vehicles' and tier = 2;
