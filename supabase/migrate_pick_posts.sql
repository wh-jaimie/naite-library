-- 나이테 Pick: 엄마들 추천(2026-11-17)
--  · 대박책 탭: 회원이 '우리 집 대박책'을 추천(책 제목 + 아이 나이 + 한 줄 이유) → 재밌어요(book_likes) 많은 순으로 같이 보임
--  · 걸어온 길 탭: 회원이 '이맘때 했던 추천 활동'(아이 개월 수 + 활동 + 함께 쓴 책·영상)을 올리고, 다른 엄마들이 👍 추천(book_likes, 키 'pickact<id>')
-- 로그인 없이 기기 기록 ID(naite_reader)로 올림. 이름 없이 바로 공개. 관리자는 hidden=true 로 숨김.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create table if not exists public.pick_posts (
  id         bigserial primary key,
  kind       text not null check (kind in ('book','act')),
  reader     text not null,
  age_m      int,
  title      text not null default '',
  body       text not null default '',
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists pick_posts_kind_idx on public.pick_posts(kind, created_at desc);
alter table public.pick_posts enable row level security;
grant select, insert, update, delete on public.pick_posts to anon, authenticated, service_role;
drop policy if exists "admin all pick_posts" on public.pick_posts;
create policy "admin all pick_posts" on public.pick_posts for all using (public.is_admin()) with check (public.is_admin());

-- 올리기(하루 10개까지)
create or replace function public.add_pick_post(p_reader text, p_kind text, p_age_m int, p_title text, p_body text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_t text := left(btrim(regexp_replace(coalesce(p_title,''),'\s+',' ','g')),80);
        v_b text := left(btrim(regexp_replace(coalesce(p_body,''),'\s+',' ','g')),100);
        v_n int; v_id bigint; v_book bigint;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if p_kind not in ('book','act') then return jsonb_build_object('ok',false,'error','kind'); end if;
  if p_age_m is not null and (p_age_m < 0 or p_age_m > 144) then return jsonb_build_object('ok',false,'error','age'); end if;
  if p_kind = 'book' and v_t = '' then return jsonb_build_object('ok',false,'error','title'); end if;
  if p_kind = 'act' and (length(v_b) < 2 or p_age_m is null) then return jsonb_build_object('ok',false,'error','body'); end if;
  select count(*) into v_n from public.pick_posts where reader = p_reader and created_at > now() - interval '1 day';
  if v_n >= 10 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.pick_posts(kind, reader, age_m, title, body) values (p_kind, p_reader, p_age_m, v_t, v_b) returning id into v_id;
  -- 대박책 추천 이유 = 그 책 후기 한 줄(나이테 책장에 있는 책이고, 같은 사람의 그 책 후기가 아직 없을 때만 — 운영자 결정 2026-11-17)
  if p_kind = 'book' and v_b <> '' and to_regclass('public.book_reviews') is not null then
    select b.id into v_book from public.books b
     where lower(regexp_replace(b.title,'[^0-9A-Za-z가-힣]','','g')) = lower(regexp_replace(v_t,'[^0-9A-Za-z가-힣]','','g'))
     order by b.id limit 1;
    if v_book is not null then
      insert into public.book_reviews(book_id, reader, age, reactions, body)
      values (v_book, p_reader, case when p_age_m is null then null when p_age_m <= 24 then 1 when p_age_m <= 48 then 2 else 3 end, '{}', v_b)
      on conflict (book_id, reader) do nothing; -- 같은 사람이 이미 그 책 후기를 남겼으면 그 후기가 우선(건드리지 않음)
    end if;
  end if;
  return jsonb_build_object('ok',true,'id',v_id,'review',v_book is not null);
end $$;
grant execute on function public.add_pick_post(text, text, int, text, text) to anon, authenticated;

-- 목록(숨긴 것 빼고, 내 것은 보임). 기록 ID는 내보내지 않음
create or replace function public.list_pick_posts(p_reader text default null)
returns table(id bigint, kind text, age_m int, title text, body text, created_at timestamptz, mine boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.kind, p.age_m, p.title, p.body, p.created_at, (p_reader is not null and p.reader = p_reader)
    from public.pick_posts p
   where not p.hidden or (p_reader is not null and p.reader = p_reader)
   order by p.created_at desc
   limit 500;
$$;
grant execute on function public.list_pick_posts(text) to anon, authenticated;

-- 내 글 지우기
create or replace function public.delete_pick_post(p_reader text, p_id bigint)
returns jsonb
language sql volatile security definer set search_path = public as $$
  with d as (delete from public.pick_posts where id = p_id and reader = p_reader returning 1)
  select jsonb_build_object('ok', exists(select 1 from d));
$$;
grant execute on function public.delete_pick_post(text, bigint) to anon, authenticated;
