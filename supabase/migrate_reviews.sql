-- 책 후기(우리 아이 반응 + 한 줄) — 1단계: 이번 달 책에만, 익명, 바로 공개, 포인트 없음 (2026-11-17 운영자 결정)
-- 누가 썼는지(기록 ID)는 공개하지 않음. 공개되는 건 아이 나이대(0~3·4~6·7~9세) · 반응 · 한 줄 · 날짜뿐.
-- 관리자는 나이테 관리 › 💬 후기 에서 숨기기/다시 보이기.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create table if not exists public.book_reviews (
  id         bigserial primary key,
  book_id    bigint not null references public.books(id) on delete cascade,
  reader     text   not null,
  age        smallint check (age between 1 and 3),      -- 1: 0~3세, 2: 4~6세, 3: 7~9세 (앱 naite_age)
  reactions  text[] not null default '{}',               -- laugh · again · talk · notyet
  body       text   not null default '',
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, reader)
);
create index if not exists book_reviews_book_idx on public.book_reviews(book_id) where not hidden;
alter table public.book_reviews enable row level security;
grant select, insert, update, delete on public.book_reviews to anon, authenticated, service_role;
-- 직접 읽기·쓰기 정책 없음: 아래 함수로만(기록 ID가 밖으로 안 나가게). 관리자만 표 직접 수정 가능.
drop policy if exists "admin all book_reviews" on public.book_reviews;
create policy "admin all book_reviews" on public.book_reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 1) 후기 저장(같은 책엔 한 사람 1개, 다시 쓰면 고침). 반응도 한 줄도 없으면 지움. 하루 20개 상한(장난 방지)
create or replace function public.save_review(p_reader text, p_book_id bigint, p_age int, p_reactions text[], p_body text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_body text; v_re text[]; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if not exists (select 1 from public.books where id = p_book_id) then return jsonb_build_object('ok',false,'error','book'); end if;
  v_body := left(btrim(regexp_replace(coalesce(p_body,''), '\s+', ' ', 'g')), 100);
  select coalesce(array_agg(distinct r), '{}') into v_re from unnest(coalesce(p_reactions,'{}')) r where r in ('laugh','again','talk','notyet');
  if v_body = '' and cardinality(v_re) = 0 then
    delete from public.book_reviews where reader = p_reader and book_id = p_book_id;
    return jsonb_build_object('ok',true,'deleted',true);
  end if;
  select count(*) into v_n from public.book_reviews where reader = p_reader and updated_at > now() - interval '1 day' and book_id <> p_book_id;
  if v_n >= 20 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.book_reviews(book_id, reader, age, reactions, body)
  values (p_book_id, p_reader, case when p_age between 1 and 3 then p_age end, v_re, v_body)
  on conflict (book_id, reader) do update
    set age = excluded.age, reactions = excluded.reactions, body = excluded.body, updated_at = now();
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.save_review(text, bigint, int, text[], text) to anon, authenticated;

-- 2) 후기 목록(숨긴 것 제외). mine = 내 후기인지(고치기용). 기록 ID는 내보내지 않음
create or replace function public.list_reviews(p_book_ids bigint[], p_reader text default null)
returns table(id bigint, book_id bigint, age smallint, reactions text[], body text, created_at timestamptz, mine boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.book_id, r.age, r.reactions, r.body, r.created_at, (p_reader is not null and r.reader = p_reader) as mine
    from public.book_reviews r
   where r.book_id = any(p_book_ids) and (not r.hidden or (p_reader is not null and r.reader = p_reader))
   order by r.created_at desc
   limit 500;
$$;
grant execute on function public.list_reviews(bigint[], text) to anon, authenticated;

-- 3) 관리자: 전체 후기(책 제목 포함) + 숨기기
create or replace function public.admin_list_reviews()
returns table(id bigint, book_id bigint, title text, theme_key text, age smallint, reactions text[], body text, hidden boolean, created_at timestamptz, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select r.id, r.book_id, b.title, b.theme_key, r.age, r.reactions, r.body, r.hidden, r.created_at, r.updated_at
    from public.book_reviews r join public.books b on b.id = r.book_id order by r.updated_at desc limit 1000;
end $$;
revoke all on function public.admin_list_reviews() from public, anon;
grant execute on function public.admin_list_reviews() to authenticated;

create or replace function public.admin_hide_review(p_id bigint, p_hidden boolean)
returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.book_reviews set hidden = p_hidden where id = p_id;
end $$;
revoke all on function public.admin_hide_review(bigint, boolean) from public, anon;
grant execute on function public.admin_hide_review(bigint, boolean) to authenticated;
