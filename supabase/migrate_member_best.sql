-- 나이테 Pick 대박책 자동 추가(2026-11-20 운영자): 엄마들이 직접 입력한 책(기록의 '다른 책' 제목 + 대박책 추천) 중
--   · 서로 다른 5명 이상이 기록한 책, 또는
--   · 좋은 반응(😆 웃음 laugh · 🔁 또 읽자 again · 💬 말이 늘었음 talk) 후기를 남긴 사람이 5명 이상인 책
-- 을 대박책에 같이 보여 줌. 제목·인원 수만 내보내고 누가 적었는지는 안 보냄.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. 테이블은 새로 만들지 않음(읽기 전용 함수 1개).

create or replace function public.member_best_titles()
returns table(title text, readers int, fans int)
language sql stable security definer set search_path = public as $$
  with entered as (            -- 엄마들이 직접 입력한 제목
    select btrim(other_title) as title, reader from public.reading_logs
     where book_id is null and coalesce(btrim(other_title), '') <> ''
    union all
    select btrim(title), reader from public.pick_posts
     where kind = 'book' and not hidden and btrim(title) <> ''
  ), e as (
    select title, reader, public._title_key(title) as k from entered
  ), rd as (                   -- 기록한 사람 수('다른 책' 기록만)
    select public._title_key(other_title) as k, count(distinct reader) as n
      from public.reading_logs
     where book_id is null and coalesce(btrim(other_title), '') <> ''
     group by 1
  ), fn as (                   -- 좋은 반응 후기 남긴 사람 수
    select coalesce(r.title_key, public._title_key(b.title)) as k, count(distinct r.reader) as n
      from public.book_reviews r left join public.books b on b.id = r.book_id
     where not r.hidden and r.reactions && array['laugh','again','talk']
     group by 1
  ), ks as (
    select distinct k from e where length(k) >= 2
  )
  select (select e2.title from e e2 where e2.k = ks.k group by e2.title order by count(*) desc, e2.title limit 1),
         coalesce(rd.n, 0)::int, coalesce(fn.n, 0)::int
    from ks left join rd on rd.k = ks.k left join fn on fn.k = ks.k
   where coalesce(rd.n, 0) >= 5 or coalesce(fn.n, 0) >= 5
   order by greatest(coalesce(rd.n, 0), coalesce(fn.n, 0)) desc, 1
   limit 200;
$$;
grant execute on function public.member_best_titles() to anon, authenticated;
