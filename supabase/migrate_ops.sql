-- 운영 대시보드(관리자 › 🌳 운영): 기수별 채팅방 현황 + 공지 작성 기록
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- 두 테이블 모두 관리자만 읽고 씀(회원·방문자 화면에서는 쓰지 않음).
-- 메인의 "지금 ○명의 엄마가 함께" 숫자는 관리자가 기수 인원을 저장할 때 settings.chat_members 에 합계로 함께 저장됨.

-- ── 기수별 오픈채팅방 ──
create table if not exists public.study_rooms (
  id         bigint generated always as identity primary key,
  gen        int not null unique,          -- 기수(1, 2, 3 …)
  capacity   int not null default 60,      -- 정원
  members    int not null default 0,       -- 현재 인원(직접 입력)
  url        text default '',              -- 채팅방 링크(선택)
  status     text not null default '운영 중', -- 모집 중 / 운영 중 / 마감
  updated_at timestamptz default now()
);
alter table public.study_rooms enable row level security;
-- Data API 권한(2026-10-30부터 새 테이블은 자동 부여 안 됨). 실제 접근 제어는 아래 RLS 정책.
grant select, insert, update, delete on public.study_rooms to anon, authenticated, service_role;
drop policy if exists "admin all study_rooms" on public.study_rooms;
create policy "admin all study_rooms" on public.study_rooms
  for all using (public.is_admin()) with check (public.is_admin());

-- 지금 있는 1~3기(인원은 관리자 화면에서 입력)
insert into public.study_rooms(gen, status) values (1,'운영 중'),(2,'운영 중'),(3,'모집 중')
on conflict (gen) do nothing;

-- ── 공지 기록 ──
create table if not exists public.notices (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now(),
  title      text default '',
  body       text not null default '',     -- 카톡용 원문(회원용 — 비밀번호·앱 링크 가능)
  posted     jsonb not null default '{}'::jsonb  -- 어디에 올렸는지 체크 {"r1":true,"daangn":true,"insta":false}
);
alter table public.notices enable row level security;
grant select, insert, update, delete on public.notices to anon, authenticated, service_role;
drop policy if exists "admin all notices" on public.notices;
create policy "admin all notices" on public.notices
  for all using (public.is_admin()) with check (public.is_admin());
