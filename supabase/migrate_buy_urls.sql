-- 나이테 120 페이지가 책별 쿠팡 링크를 읽을 수 있는 공개 RPC. SQL Editor 에서 Run.
-- books 테이블 자체는 계속 비공개(이 함수가 title/buy_url 만 노출).
create or replace function public.list_buy_urls()
returns table(title text, buy_url text)
language sql stable security definer set search_path = public as $$
  select title, buy_url from public.books where coalesce(buy_url,'') <> '';
$$;
grant execute on function public.list_buy_urls() to anon, authenticated;
