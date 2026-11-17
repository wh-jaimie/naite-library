-- 😆 재밌어요 투표(2026-11-17): 나이테 120 · 국내 인기 책장 · 나이테 Pick 대박책에서 '아는 책'에 재밌어요 체크
-- 칭찬만 있음(별점·싫어요 없음). 로그인 없이 기기 ID(naite_reader)로 한 책에 1표. 다시 누르면 취소.
-- 같은 책은 페이지가 달라도 한 칸(book_key = 제목을 정리한 값, likes.js 의 key()와 같은 규칙)으로 모임.
-- 누가 눌렀는지(기록 ID)는 밖으로 안 나감. 공개되는 건 책별 숫자뿐.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create table if not exists public.book_likes (
  book_key   text not null,
  reader     text not null,
  title      text not null default '',
  page       text not null default '',
  created_at timestamptz not null default now(),
  primary key (book_key, reader)
);
create index if not exists book_likes_reader_idx on public.book_likes(reader, created_at);
alter table public.book_likes enable row level security;
grant select, insert, update, delete on public.book_likes to anon, authenticated, service_role;
-- 직접 읽기·쓰기 정책 없음: 아래 함수로만. 관리자만 표 직접 보기·수정.
drop policy if exists "admin all book_likes" on public.book_likes;
create policy "admin all book_likes" on public.book_likes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 1) 재밌어요 켜기/끄기(p_on). 하루 300표 상한(장난 방지). 돌려주는 n = 그 책의 지금 표 수
create or replace function public.set_like(p_reader text, p_key text, p_title text, p_page text, p_on boolean)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_key),0) not between 1 and 80 then return jsonb_build_object('ok',false,'error','key'); end if;
  if p_on then
    select count(*) into v_n from public.book_likes where reader = p_reader and created_at > now() - interval '1 day';
    if v_n >= 300 then return jsonb_build_object('ok',false,'error','limit'); end if;
    insert into public.book_likes(book_key, reader, title, page)
    values (p_key, p_reader, left(coalesce(p_title,''),120), left(coalesce(p_page,''),30))
    on conflict (book_key, reader) do nothing;
  else
    delete from public.book_likes where book_key = p_key and reader = p_reader;
  end if;
  select count(*) into v_n from public.book_likes where book_key = p_key;
  return jsonb_build_object('ok',true,'on',p_on,'n',v_n);
end $$;
grant execute on function public.set_like(text, text, text, text, boolean) to anon, authenticated;

-- 2) 책별 표 수 + 내가 눌렀는지(한 번에 최대 600권)
create or replace function public.list_likes(p_keys text[], p_reader text default null)
returns table(book_key text, n int, mine boolean)
language sql stable security definer set search_path = public as $$
  select l.book_key, count(*)::int as n, bool_or(p_reader is not null and l.reader = p_reader) as mine
    from public.book_likes l
   where cardinality(p_keys) <= 600 and l.book_key = any(p_keys)
   group by l.book_key;
$$;
grant execute on function public.list_likes(text[], text) to anon, authenticated;

-- 3) 관리자: 재밌어요 많은 책 순위
create or replace function public.admin_like_ranking()
returns table(book_key text, title text, n int, pages text, last_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select l.book_key, max(l.title), count(*)::int, string_agg(distinct l.page, ' · '), max(l.created_at)
    from public.book_likes l group by l.book_key order by count(*) desc, max(l.created_at) desc limit 300;
end $$;
revoke all on function public.admin_like_ranking() from public, anon;
grant execute on function public.admin_like_ranking() to authenticated;
