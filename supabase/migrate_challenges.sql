-- 미니 챌린지(관리자 › 🌳 운영 › 🏁 미니 챌린지에서 정함) — 스터디 앱 읽기 기록 맨 위 챌린지 카드·완주 보고 이미지
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- 읽기: 누구나(공개 일정 정보라 비밀 없음) · 쓰기: 관리자만(RLS)
-- 인증 기록(사진·워크북)은 각자 폰에만 저장되고 서버에 올라가지 않음.

create table if not exists public.challenges (
  id         text primary key,                      -- 예: mini1 (바꾸지 않기 · 폰에 저장된 워크북 사진이 이 id로 묶임)
  title      text not null default '1주 미니 챌린지',
  start_date date not null,                         -- 시작일(월요일 권장) · 7일짜리
  end_date   date not null,                         -- 마지막 날
  read_days  int  not null default 3,               -- 완주 조건: 읽어주기 인증한 날 수
  wb_count   int  not null default 1,               -- 완주 조건: 워크북 인증 횟수
  active     boolean not null default true,         -- 끄면 앱에서 안 보임
  updated_at timestamptz default now()
);
alter table public.challenges enable row level security;
-- Data API 권한(2026-10-30부터 새 테이블은 자동 부여 안 됨). 실제 접근 제어는 아래 RLS 정책.
grant select, insert, update, delete on public.challenges to anon, authenticated, service_role;
drop policy if exists "public read challenges" on public.challenges;
create policy "public read challenges" on public.challenges for select using (true);
drop policy if exists "admin write challenges" on public.challenges;
create policy "admin write challenges" on public.challenges
  for all using (public.is_admin()) with check (public.is_admin());

-- 첫 챌린지(11/16~11/22) — 이미 있으면 그대로
insert into public.challenges(id, title, start_date, end_date, read_days, wb_count)
values ('mini1', '1주 미니 챌린지', '2026-11-16', '2026-11-22', 3, 1)
on conflict (id) do nothing;
