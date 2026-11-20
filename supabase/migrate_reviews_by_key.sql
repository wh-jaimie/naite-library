-- 💬 엄마들 후기를 책 키로 모아 보기(2026-11-20): 나이테 120 · 국내 인기 책장 · 나이테 Pick 화면의 '💬 후기 N'
-- 스터디 책 후기(책 id)도, 제목 후기도 같은 책 키(_title_key: 대소문자·띄어쓰기·기호 무시, 부제가 다르면 다른 책)로 모음.
-- 공개되는 건 아이 나이대 · 반응 · 한 줄 · 날짜뿐(누가 썼는지는 안 나감). 숨긴 후기는 빠짐.
-- migrate_title_reviews.sql 을 먼저 실행한 뒤 이 파일을 실행. 여러 번 실행해도 안전.

create or replace function public.list_reviews_by_keys(p_keys text[])
returns table(book_key text, age smallint, reactions text[], body text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select x.k, x.age, x.reactions, x.body, x.created_at from (
    select coalesce(r.title_key, public._title_key(b.title)) as k, r.age, r.reactions, r.body, r.created_at
      from public.book_reviews r left join public.books b on b.id = r.book_id
     where not r.hidden
  ) x
   where cardinality(p_keys) <= 600 and x.k = any(p_keys)
   order by x.created_at desc
   limit 3000;
$$;
grant execute on function public.list_reviews_by_keys(text[]) to anon, authenticated;
