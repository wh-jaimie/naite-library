-- 쿠팡 링크별 가격(관리자가 직접 입력, 2026-11-20 운영자 결정)
-- 국내 인기 책장·나이테 120·걸어온 길·인스타 상품 페이지가 같은 표를 씀. key = 쿠팡 파트너스 링크 주소.
-- 관리 › 🛒 쿠팡 링크 / 🌱 걸어온 길 에서 링크 옆 가격 칸에 입력. SQL Editor 에서 Run. (재실행 안전)
create table if not exists public.link_prices (
  url        text primary key,
  price      integer,
  updated_at timestamptz default now()
);
alter table public.link_prices enable row level security;
drop policy if exists "public read link_prices" on public.link_prices;
create policy "public read link_prices" on public.link_prices for select using (true);
drop policy if exists "admin write link_prices" on public.link_prices;
create policy "admin write link_prices" on public.link_prices for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.link_prices to anon, authenticated, service_role;
