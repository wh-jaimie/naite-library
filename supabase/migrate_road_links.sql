-- 나이테가 걸어온 길(road.html) 쿠팡 파트너스 링크. SQL Editor 에서 Run. (재실행 안전)
-- key = road-data.js 의 roadKey(제목). 관리 › 🌱 걸어온 길 에서 입력.
create table if not exists public.road_links (
  key        text primary key,
  title      text not null default '',
  buy_url    text not null default '',
  updated_at timestamptz default now()
);
alter table public.road_links enable row level security;
drop policy if exists "public read road_links" on public.road_links;
create policy "public read road_links" on public.road_links for select using (true);
drop policy if exists "admin write road_links" on public.road_links;
create policy "admin write road_links" on public.road_links for all using (public.is_admin()) with check (public.is_admin());
-- Data API 권한(2026-10-30부터 새 테이블은 자동 부여 안 됨). 실제 접근은 위 RLS가 결정.
grant select, insert, update, delete on public.road_links to anon, authenticated, service_role;
