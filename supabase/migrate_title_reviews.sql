-- 스터디 책이 아닌 책도 후기(2026-11-20 운영자 요청): 나이테 120권·다른 엄마들이 읽은 책·직접 적은 책은 '제목'으로 후기를 남김
-- 같은 제목(대소문자·띄어쓰기·기호 무시)이면 같은 책으로 모임. 공개 범위·익명은 기존 후기(migrate_reviews.sql)와 같음.
-- 관리자 › 💬 후기 목록에도 같이 보임(숨기기 그대로). Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

alter table public.book_reviews alter column book_id drop not null;
alter table public.book_reviews add column if not exists title_key text;
alter table public.book_reviews add column if not exists title text;
create unique index if not exists book_reviews_title_reader on public.book_reviews(title_key, reader) where title_key is not null;
create index if not exists book_reviews_title_idx on public.book_reviews(title_key) where title_key is not null and not hidden;

create or replace function public._title_key(p text) returns text
language sql immutable as $$ select regexp_replace(lower(coalesce(p,'')), '[^a-z0-9가-힣]', '', 'g') $$;

-- 1) 제목 후기 저장(같은 제목엔 한 사람 1개, 다시 쓰면 고침). 반응도 한 줄도 없으면 지움. 하루 상한은 기존 후기와 합쳐 20개
create or replace function public.save_title_review(p_reader text, p_title text, p_age int, p_reactions text[], p_body text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_body text; v_re text[]; v_n int; v_title text := left(btrim(coalesce(p_title,'')), 80); v_key text;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  v_key := public._title_key(v_title);
  if length(v_key) < 2 then return jsonb_build_object('ok',false,'error','book'); end if;
  v_body := left(btrim(regexp_replace(coalesce(p_body,''), '\s+', ' ', 'g')), 100);
  select coalesce(array_agg(distinct r), '{}') into v_re from unnest(coalesce(p_reactions,'{}')) r where r in ('laugh','again','talk','notyet');
  if v_body = '' and cardinality(v_re) = 0 then
    delete from public.book_reviews where reader = p_reader and title_key = v_key;
    return jsonb_build_object('ok',true,'deleted',true);
  end if;
  select count(*) into v_n from public.book_reviews where reader = p_reader and updated_at > now() - interval '1 day' and coalesce(title_key,'') <> v_key;
  if v_n >= 20 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.book_reviews(book_id, title_key, title, reader, age, reactions, body)
  values (null, v_key, v_title, p_reader, case when p_age between 1 and 3 then p_age end, v_re, v_body)
  on conflict (title_key, reader) where title_key is not null do update
    set title = excluded.title, age = excluded.age, reactions = excluded.reactions, body = excluded.body, updated_at = now();
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.save_title_review(text, text, int, text[], text) to anon, authenticated;

-- 2) 제목 후기 목록(숨긴 것 제외, 내 것은 보임). 기록 ID는 내보내지 않음
create or replace function public.list_title_reviews(p_titles text[], p_reader text default null)
returns table(id bigint, title_key text, age smallint, reactions text[], body text, created_at timestamptz, mine boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.title_key, r.age, r.reactions, r.body, r.created_at, (p_reader is not null and r.reader = p_reader) as mine
    from public.book_reviews r
   where r.title_key = any(select public._title_key(t) from unnest(coalesce(p_titles,'{}')) t)
     and (not r.hidden or (p_reader is not null and r.reader = p_reader))
   order by r.created_at desc
   limit 500;
$$;
grant execute on function public.list_title_reviews(text[], text) to anon, authenticated;

-- 3) 관리자 후기 목록: 제목 후기도 같이(책 표에 없는 책은 적힌 제목으로)
create or replace function public.admin_list_reviews()
returns table(id bigint, book_id bigint, title text, theme_key text, age smallint, reactions text[], body text, hidden boolean, created_at timestamptz, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select r.id, r.book_id, coalesce(b.title, r.title), b.theme_key, r.age, r.reactions, r.body, r.hidden, r.created_at, r.updated_at
    from public.book_reviews r left join public.books b on b.id = r.book_id order by r.updated_at desc limit 1000;
end $$;
revoke all on function public.admin_list_reviews() from public, anon;
grant execute on function public.admin_list_reviews() to authenticated;
