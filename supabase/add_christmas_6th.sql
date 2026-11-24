-- 12월(크리스마스)만 6권(2026-11-24 운영자): Little Blue Truck's Christmas 를 6번째 책으로 다시 넣음
--   tier 6(유형 이름은 '반복·패턴') — 1~5 자리를 쓰는 reseed·교체 SQL과 겹치지 않게. 나이테 120 목록에는 안 들어감.
--   이미 있으면 다시 넣지 않음(여러 번 실행해도 안전). 책 행은 지우지 않음.
insert into public.books (theme_key, tier, tier_label, title, author, cover, reason, pop_rank, lib_loans, award, kr_popular, format, ar, word_count, sort)
select 'christmas', 6, '반복·패턴', 'Little Blue Truck''s Christmas', 'Alice Schertle',
       'https://covers.openlibrary.org/b/id/14434529-L.jpg',
       '"Beep!" 반복과 1~5 카운팅, 불빛이 들어오는 크리스마스 배달',
       0, 0, '', false, '', 1.1, 166,
       coalesce((select max(sort) from public.books where theme_key = 'christmas'), 0) + 1
where not exists (select 1 from public.books where theme_key = 'christmas' and tier = 6);
