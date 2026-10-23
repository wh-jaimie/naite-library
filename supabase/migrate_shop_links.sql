-- 국내 인기 책장(구매 참고 페이지) 쿠팡 링크 — 나이테 120에 없는 책용. SQL Editor 에서 Run. (재실행 안전)
-- 나이테 120에 있는 책은 기존 books.buy_url(list_buy_urls)을 그대로 같이 씀.
-- key = 국내 순위 데이터의 영문 검색 제목(data_domestic.py 3번째 칸).
create table if not exists public.shop_links (
  en         text primary key,
  buy_url    text not null default '',
  updated_at timestamptz default now()
);
alter table public.shop_links enable row level security;
drop policy if exists "public read shop_links" on public.shop_links;
create policy "public read shop_links" on public.shop_links for select using (true);
drop policy if exists "admin write shop_links" on public.shop_links;
create policy "admin write shop_links" on public.shop_links for all using (public.is_admin()) with check (public.is_admin());
-- Data API 권한(2026-10-30부터 새 테이블은 자동 부여 안 됨). 실제 접근은 위 RLS가 결정.
grant select, insert, update, delete on public.shop_links to anon, authenticated, service_role;
