-- 엄마표영어 가이드(블로그 링크 목록) 테이블. SQL Editor 에서 Run.
create table if not exists public.guides (
  id bigint generated always as identity primary key,
  title text not null, url text not null, sort int default 0,
  created_at timestamptz default now());
alter table public.guides enable row level security;
grant select, insert, update, delete on public.guides to anon, authenticated, service_role;  -- 2026-10-30부터 새 테이블 자동 권한 없음
create policy "public read guides" on public.guides for select using (true);
create policy "admin write guides" on public.guides for all using (public.is_admin()) with check (public.is_admin());
