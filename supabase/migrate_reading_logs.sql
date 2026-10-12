-- 회원 읽기 기록 — 표지 한 번 탭 = 한 행 (study/v2.html 에서 사용)
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- 운영 중인 study/index.html·admin.html 은 이 테이블/함수를 쓰지 않으므로, 먼저 실행해도 영향 없음.

-- ── 회원 비밀번호(1개) — 관리자만 읽고 씀. 바꿔도 기록은 기기 ID에 묶여 있어 그대로 이어짐 ──
create table if not exists public.member_config (
  id          int primary key default 1 check (id = 1),
  member_code text not null default '',
  updated_at  timestamptz default now()
);
insert into public.member_config(id) values (1) on conflict (id) do nothing;
alter table public.member_config enable row level security;
drop policy if exists "admin all member_config" on public.member_config;
create policy "admin all member_config" on public.member_config
  for all using (public.is_admin()) with check (public.is_admin());

-- 회원 비밀번호 확인(비어 있으면 아무도 회원 아님)
create or replace function public.check_member(p_code text)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(m.member_code,'') <> '' and coalesce(p_code,'') = m.member_code
    from public.member_config m where m.id = 1;
$$;

-- ── 읽기 기록 ──
create table if not exists public.reading_logs (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now(),
  reader     text not null,              -- 기기별 익명 ID(localStorage 'naite_reader')
  client_id  text not null,              -- 탭마다 브라우저가 만든 ID → 재시도해도 중복 저장 안 됨
  theme_key  text references public.themes(key) on delete cascade,
  book_id    bigint references public.books(id) on delete cascade,
  read_on    date not null,              -- 새벽 4시 전 탭은 전날(브라우저에서 계산)
  how        text,                       -- (다음 단계) 'parent' | 'video' | 'self'
  reaction   text,                       -- (다음 단계) 'love' | 'ok' | 'meh' | 'sleepy'
  unique (reader, client_id)
);
create index if not exists reading_logs_reader_idx on public.reading_logs(reader, theme_key);
create index if not exists reading_logs_theme_idx  on public.reading_logs(theme_key, read_on);

-- 직접 접근 금지(anon 정책 없음) → 아래 RPC로만 읽고 씀. 관리자는 KPI용으로 조회 가능.
alter table public.reading_logs enable row level security;
drop policy if exists "admin read reading_logs" on public.reading_logs;
create policy "admin read reading_logs" on public.reading_logs for select using (public.is_admin());

-- 기록 1회 추가(회원 비밀번호 확인). 예전 시안의 4인자 버전이 있으면 제거.
drop function if exists public.log_read(text, text, bigint, date);
create or replace function public.log_read(p_reader text, p_client_id text, p_book_id bigint, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_theme text; v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int;
begin
  if not coalesce(public.check_member(p_code), false) then return jsonb_build_object('ok',false,'error','member'); end if;
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  -- 오늘·어제(+새벽 4시 보정) 범위만 허용
  if p_read_on is null or p_read_on < v_today - 2 or p_read_on > v_today + 1 then
    return jsonb_build_object('ok',false,'error','date');
  end if;
  select b.theme_key into v_theme
    from public.books b join public.content c on c.theme_key = b.theme_key
   where b.id = p_book_id and coalesce(c.published,false);
  if v_theme is null then return jsonb_build_object('ok',false,'error','book'); end if;
  -- 하루 기록 상한(오작동·장난 방지)
  select count(*) into v_n from public.reading_logs where reader = p_reader and read_on = p_read_on;
  if v_n >= 60 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.reading_logs(reader, client_id, theme_key, book_id, read_on)
  values (p_reader, p_client_id, v_theme, p_book_id, p_read_on)
  on conflict (reader, client_id) do nothing;
  return jsonb_build_object('ok',true);
end $$;

-- 기록 1회 취소(본인 기기 기록만)
create or replace function public.undo_read(p_reader text, p_client_id text)
returns jsonb
language sql volatile security definer set search_path = public as $$
  with d as (delete from public.reading_logs where reader = p_reader and client_id = p_client_id returning 1)
  select jsonb_build_object('ok', true, 'deleted', (select count(*) from d));
$$;

-- 내 기록(주제별)
create or replace function public.my_reads(p_reader text, p_theme text)
returns table(client_id text, book_id bigint, read_on date, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.client_id, r.book_id, r.read_on, r.created_at
    from public.reading_logs r
   where r.reader = p_reader and r.theme_key = p_theme
   order by r.created_at;
$$;

grant execute on function public.check_member(text)                      to anon, authenticated;
grant execute on function public.log_read(text, text, bigint, date, text) to anon, authenticated;
grant execute on function public.undo_read(text, text)                    to anon, authenticated;
grant execute on function public.my_reads(text, text)                     to anon, authenticated;
