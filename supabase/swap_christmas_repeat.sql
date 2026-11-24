-- 크리스마스 '반복·패턴' 교체(2026-11-24 운영자, 구하기 힘들어서): Little Blue Truck's Christmas → Suzy Goose and the Christmas Star (Petr Horáček, 2009)
--   트리 꼭대기에 달 별을 찾아 하늘의 별을 향해 길을 떠나는 거위 수지 (AR 1.7 · 267단어 → 글밥 보통)
-- 기존 행을 제자리 update (책 id 유지 → 회원 읽기 기록 보존). 이전 책 쿠팡·영상·워크지 링크는 비움.
-- Supabase SQL Editor 에서 실행하세요. 다시 실행해도 안전해요.
update public.books set
  title      = 'Suzy Goose and the Christmas Star',
  author     = 'Petr Horáček',
  cover      = 'https://covers.openlibrary.org/b/id/10514195-L.jpg',
  reason     = '트리 꼭대기에 달 별을 찾아 하늘의 별을 향해 길을 떠나는 거위 수지',
  pop_rank   = 0,
  lib_loans  = 0,
  award      = '',
  kr_popular = false,
  format     = '',
  ar         = 1.7,
  word_count = 267,
  buy_url    = case when title = 'Suzy Goose and the Christmas Star' then buy_url else '' end,
  workbook   = case when title = 'Suzy Goose and the Christmas Star' then workbook else '' end,
  read_aloud = case when title = 'Suzy Goose and the Christmas Star' then read_aloud else '' end
where theme_key = 'christmas' and tier = 3;
