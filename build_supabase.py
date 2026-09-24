# -*- coding: utf-8 -*-
"""challenge.json -> Supabase schema.sql + seed.sql 생성"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ch = json.load(open(os.path.join(HERE, "output", "challenge.json"), encoding="utf-8"))
SQLDIR = os.path.join(HERE, "supabase")
os.makedirs(SQLDIR, exist_ok=True)

def q(s):
    return "'" + (s or "").replace("'", "''") + "'"

SCHEMA = r"""-- 조이네 엄마표영어 스터디 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣어 실행하세요.
-- 관리자 이메일은 아래 is_admin() 안의 주소로 판별됩니다. 바꾸려면 그 주소만 수정.

-- ── 관리자 이메일 판별 함수 (이 이메일로 로그인한 사람만 편집 가능) ──
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jabbaek@gmail.com'
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
  read_aloud text default '',  -- 책별 유튜브 낭독 링크
  workbook   text default '',  -- 책별 워크북 링크(공식 무료 활동지)
  buy_url    text default '',  -- 책별 구매 링크(쿠팡 파트너스)
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
  workbooks   text default '',
  passcode    text default '',      -- 페이지별 비밀번호(회원 열람용)
  published   boolean default false,-- 발행 여부(회원 열람/보관함 표시)
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

-- 공개 읽기: themes/settings 만 공개(목록·현재 달 표시용). content/books 는 비공개 → RPC로만.
create policy "public read themes"   on public.themes   for select using (true);
create policy "public read settings" on public.settings for select using (true);

-- 관리자만 쓰기(및 관리자 읽기 포함)
create policy "admin write themes"   on public.themes   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write books"    on public.books    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write content"  on public.content  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- KPI: 누구나 삽입 가능(방문자 로그), 조회는 관리자만
create policy "anyone insert events" on public.events for insert with check (true);
create policy "admin read events"    on public.events for select using (public.is_admin());

-- ── 스터디 페이지 접근: 비밀번호 검증 후에만 콘텐츠 반환(서버측) ──
create or replace function public.list_published()
returns table(key text, emoji text, ko text, en text, month_label text, sort int)
language sql stable security definer set search_path = public as $$
  select t.key, t.emoji, t.ko, t.en, coalesce(c.month_label,''), t.sort
  from public.themes t
  join public.content c on c.theme_key = t.key
  where coalesce(c.published,false) = true
  order by t.sort;
$$;

create or replace function public.get_study(p_key text, p_pass text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_pass text; v_pub boolean; v_theme jsonb; v_content jsonb; v_books jsonb;
begin
  select to_jsonb(t) into v_theme from public.themes t where t.key = p_key;
  if v_theme is null then return jsonb_build_object('ok', false, 'error', 'notfound'); end if;
  select coalesce(c.passcode,''), coalesce(c.published,false) into v_pass, v_pub
    from public.content c where c.theme_key = p_key;
  if not coalesce(v_pub, false) then return jsonb_build_object('ok', false, 'error', 'unpublished'); end if;
  if v_pass <> '' and coalesce(p_pass,'') <> v_pass then
    return jsonb_build_object('ok', false, 'error', 'badpass');
  end if;
  select (to_jsonb(c) - 'passcode') into v_content from public.content c where c.theme_key = p_key;
  select coalesce(jsonb_agg(to_jsonb(b) order by b.sort), '[]'::jsonb) into v_books
    from public.books b where b.theme_key = p_key;
  return jsonb_build_object('ok', true, 'theme', v_theme, 'content', v_content, 'books', v_books);
end $$;

grant execute on function public.list_published()      to anon, authenticated;
grant execute on function public.get_study(text, text) to anon, authenticated;
"""

# ── seed.sql ──
lines = ["-- 조이네 엄마표영어 스터디 — 시드 데이터 (24주제 × 120권)",
         "-- schema.sql 실행 후 이 파일을 SQL Editor 에 붙여넣어 실행하세요.\n"]
book_lines = []  # reseed용(책만)
order = [t["key"] for t in ch["themes"]]
for i, t in enumerate(ch["themes"]):
    lines.append(f"insert into public.themes(key,emoji,en,ko,sort) values "
                 f"({q(t['key'])},{q(t['emoji'])},{q(t['en'])},{q(t['ko'])},{i}) "
                 f"on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;")
    lines.append(f"insert into public.content(theme_key) values ({q(t['key'])}) on conflict (theme_key) do nothing;")
    for j, b in enumerate(t["books"]):
        kr = 'true' if b.get('kr_popular') else 'false'
        ins=("insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,kr_popular,sort) values "
             f"({q(t['key'])},{b['tier']},{q(b['tier_label'])},{q(b['title'])},{q(b['author'])},{q(b['cover'])},{q(b['reason'])},{b.get('pop_rank',0)},{b.get('lib_loans',0)},{q(b.get('award',''))},{kr},{j});")
        lines.append(ins); book_lines.append(ins)
    lines.append("")
lines.append(f"insert into public.settings(id,current_theme) values (1,{q(order[0])}) "
             "on conflict (id) do update set current_theme=excluded.current_theme;")

open(os.path.join(SQLDIR, "schema.sql"), "w", encoding="utf-8").write(SCHEMA)
open(os.path.join(SQLDIR, "seed.sql"), "w", encoding="utf-8").write("\n".join(lines))

# ── reseed_books.sql: 기존 DB의 책만 새 120권으로 교체(테마·콘텐츠·설정 보존) ──
reseed = ["-- 책 목록 갱신: 국내 베스트30 통합 + 인기/대출/수상/국내인기 컬럼 (재실행 안전)",
          "-- 테마·콘텐츠·설정은 건드리지 않음. 수동 입력한 워크북/구매 링크는 (theme_key,title)로 보존. SQL Editor 에서 Run.",
          "alter table public.books add column if not exists pop_rank int default 0;",
          "alter table public.books add column if not exists lib_loans int default 0;",
          "alter table public.books add column if not exists award text default '';",
          "alter table public.books add column if not exists kr_popular boolean default false;",
          "alter table public.books add column if not exists read_aloud text default '';",
          "alter table public.books add column if not exists workbook text default '';",
          "alter table public.books add column if not exists buy_url text default '';",
          "-- 낭독/워크북/구매 링크 임시 보관 후 재삽입",
          "drop table if exists _book_links;",
          "create temporary table _book_links as select theme_key, title, read_aloud, workbook, buy_url from public.books;",
          "delete from public.books;", ""]
reseed += book_lines
reseed += ["",
           "-- 보존해 둔 낭독/워크북/구매 링크 복원",
           "update public.books b set read_aloud=l.read_aloud, workbook=l.workbook, buy_url=l.buy_url",
           "  from _book_links l",
           "  where l.theme_key=b.theme_key and l.title=b.title",
           "    and (coalesce(l.read_aloud,'')<>'' or coalesce(l.workbook,'')<>'' or coalesce(l.buy_url,'')<>'');",
           "drop table _book_links;"]
open(os.path.join(SQLDIR, "reseed_books.sql"), "w", encoding="utf-8").write("\n".join(reseed)+"\n")
print("생성: supabase/schema.sql, supabase/seed.sql, supabase/reseed_books.sql")
print(f"주제 {len(order)}개, 책 {sum(len(t['books']) for t in ch['themes'])}권 시드")
