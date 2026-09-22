-- 조이네 엄마표영어 스터디 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣어 실행하세요.
-- 실행 전: 아래 ADMIN_EMAIL 을 관리자(본인) 이메일로 바꾸세요.

-- ── 관리자 이메일 판별 함수 (이 이메일로 로그인한 사람만 편집 가능) ──
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'ADMIN_EMAIL'
$$;

-- ── 테이블 ──
create table if not exists public.themes (
  key   text primary key,
  emoji text,
  en    text,
  ko    text,
  sort  int default 0
);

create table if not exists public.books (
  id         bigint generated always as identity primary key,
  theme_key  text references public.themes(key) on delete cascade,
  tier       int,
  tier_label text,
  title      text,
  author     text,
  cover      text,
  reason     text,
  pop_rank   int default 0,   -- 전세계 인기 106 중 순위(0=목록 밖)
  lib_loans  int default 0,   -- 국내 공공도서관 대출 건수
  award      text default '', -- 수상(칼데콧 등)
  kr_popular boolean default false, -- 국내 서점 통합 베스트
  sort       int default 0
);

-- 주제별 '이번 달' 교육 내용(관리자 입력)
create table if not exists public.content (
  theme_key   text primary key references public.themes(key) on delete cascade,
  month_label text default '',
  subject     text default '',
  read_method text default '',
  activities  text default '',
  expressions text default '',
  updated_at  timestamptz default now()
);

-- 공개 설정(어떤 주제를 부모에게 보여줄지)
create table if not exists public.settings (
  id            int primary key default 1,
  current_theme text
);

-- KPI 이벤트(방문/클릭/체류 등)
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now(),
  type       text,            -- 'page_view' | 'book_click' | 'section_view' ...
  theme_key  text,
  book_id    bigint,
  session_id text,            -- 익명 방문자 구분(브라우저 생성)
  path       text,
  meta       jsonb
);
create index if not exists events_created_idx on public.events(created_at);
create index if not exists events_type_idx on public.events(type);

-- ── RLS(행 수준 보안) ──
alter table public.themes   enable row level security;
alter table public.books    enable row level security;
alter table public.content  enable row level security;
alter table public.settings enable row level security;
alter table public.events   enable row level security;

-- 공개 읽기(부모/방문자)
create policy "public read themes"   on public.themes   for select using (true);
create policy "public read books"    on public.books    for select using (true);
create policy "public read content"  on public.content  for select using (true);
create policy "public read settings" on public.settings for select using (true);

-- 관리자만 쓰기
create policy "admin write themes"   on public.themes   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write books"    on public.books    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write content"  on public.content  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- KPI: 누구나 삽입 가능(방문자 로그), 조회는 관리자만
create policy "anyone insert events" on public.events for insert with check (true);
create policy "admin read events"    on public.events for select using (public.is_admin());
