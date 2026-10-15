# -*- coding: utf-8 -*-
"""challenge.json -> Supabase schema.sql + seed.sql 생성"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ch = json.load(open(os.path.join(HERE, "output", "challenge.json"), encoding="utf-8"))
SQLDIR = os.path.join(HERE, "supabase")
os.makedirs(SQLDIR, exist_ok=True)

def q(s):
    return "'" + (s or "").replace("'", "''") + "'"

# 기본 미션 3가지(모든 달 공통 초기값 · 관리자에서 달마다 수정 가능). 한 줄에 하나 "제목 | 설명".
DEFAULT_MISSIONS = (
    "책 준비하고 인증하기 📸 | 구매·대여 상관없어요! 5권 전부 아니어도 됩니다. 준비되는 대로 사진이나 말로 인증해 주세요.\n"
    "매일 책 읽어주고 인증하기 📖 | 매일 읽어준 책을 사진이나 말로 인증해 주세요. 이번 달 주제 책이 아니어도 괜찮아요!\n"
    "아이와 도서관 가서 책 빌리기 (선택) 📚 | 한 달에 한 번은 아이와 함께 도서관에 가서 영어책을 직접 골라보는 경험을 시켜주세요. 힘들면 필수는 아니에요!"
)

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
  format     text default '',  -- 조작북 형태(팝업/플랩/놀이북), 조작북 아니면 빈값
  ar         real,             -- AR(추정) 지수, 조작북은 null
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
  missions    text default __MISSIONS_DEFAULT__, -- 이번 달 미션(한 줄에 하나 "제목 | 설명")
  extras      text default '',      -- 부가자료(한 줄에 하나 "제목 | URL", 주로 유튜브)
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

-- 엄마표영어 가이드(공개 읽을거리 · 블로그 링크). 관리자가 추가/수정.
create table if not exists public.guides (
  id         bigint generated always as identity primary key,
  title      text not null,
  url        text not null,
  sort       int default 0,
  created_at timestamptz default now()
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
alter table public.guides   enable row level security;
alter table public.events   enable row level security;

-- 공개 읽기: themes/settings/guides 공개. content/books 는 비공개 → RPC로만.
create policy "public read themes"   on public.themes   for select using (true);
create policy "public read settings" on public.settings for select using (true);
create policy "public read guides"   on public.guides   for select using (true);

-- 관리자만 쓰기(및 관리자 읽기 포함)
create policy "admin write themes"   on public.themes   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write books"    on public.books    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write content"  on public.content  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write guides"   on public.guides   for all using (public.is_admin()) with check (public.is_admin());

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

-- ── 나이테 120 공개용: 책별 쿠팡 링크만 노출(books 테이블 자체는 비공개 유지) ──
create or replace function public.list_buy_urls()
returns table(title text, buy_url text)
language sql stable security definer set search_path = public as $$
  select title, buy_url from public.books where coalesce(buy_url,'') <> '';
$$;

grant execute on function public.list_published()      to anon, authenticated;
grant execute on function public.get_study(text, text) to anon, authenticated;
grant execute on function public.list_buy_urls()       to anon, authenticated;
"""
SCHEMA = SCHEMA.replace("__MISSIONS_DEFAULT__", q(DEFAULT_MISSIONS))

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
        fmt = q(b.get('format') or '')
        arv = ('null' if b.get('ar') is None else str(b.get('ar')))
        ins=("insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,kr_popular,format,ar,sort) values "
             f"({q(t['key'])},{b['tier']},{q(b['tier_label'])},{q(b['title'])},{q(b['author'])},{q(b['cover'])},{q(b['reason'])},{b.get('pop_rank',0)},{b.get('lib_loans',0)},{q(b.get('award',''))},{kr},{fmt},{arv},{j});")
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
          "alter table public.books add column if not exists format text default '';",
          "alter table public.books add column if not exists ar real;",
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

# ── migrate_missions.sql: 기존 DB에 미션 컬럼 추가(모든 달에 기본 미션 채워짐) ──
mig = ["-- 이번 달 미션 컬럼 추가(관리자에서 달마다 수정 가능). SQL Editor 에서 Run.",
       "-- default 를 지정하므로 기존 24개 달 행에도 기본 미션 3가지가 자동으로 채워집니다.",
       f"alter table public.content add column if not exists missions text default {q(DEFAULT_MISSIONS)};",
       "-- 이미 비어 있는(빈 문자열) 행이 있다면 기본 미션으로 채우기",
       f"update public.content set missions = {q(DEFAULT_MISSIONS)} where coalesce(missions,'') = '';"]
open(os.path.join(SQLDIR, "migrate_missions.sql"), "w", encoding="utf-8").write("\n".join(mig)+"\n")

# ── migrate_extras.sql: 부가자료 컬럼 추가 ──
mig2 = ["-- 부가자료(추가 유튜브 영상 등) 컬럼 추가. SQL Editor 에서 Run.",
        "alter table public.content add column if not exists extras text default '';"]
open(os.path.join(SQLDIR, "migrate_extras.sql"), "w", encoding="utf-8").write("\n".join(mig2)+"\n")

# ── migrate_buy_urls.sql: 나이테 120 공개용 쿠팡 링크 RPC ──
mig3 = ["-- 나이테 120 페이지가 책별 쿠팡 링크를 읽을 수 있는 공개 RPC. SQL Editor 에서 Run.",
        "-- books 테이블 자체는 계속 비공개(이 함수가 title/buy_url 만 노출).",
        "create or replace function public.list_buy_urls()",
        "returns table(title text, buy_url text)",
        "language sql stable security definer set search_path = public as $$",
        "  select title, buy_url from public.books where coalesce(buy_url,'') <> '';",
        "$$;",
        "grant execute on function public.list_buy_urls() to anon, authenticated;"]
open(os.path.join(SQLDIR, "migrate_buy_urls.sql"), "w", encoding="utf-8").write("\n".join(mig3)+"\n")

# ── migrate_guides.sql: 엄마표영어 가이드(공개 읽을거리) 테이블 ──
mig4 = ["-- 엄마표영어 가이드(블로그 링크 목록) 테이블. SQL Editor 에서 Run.",
        "create table if not exists public.guides (",
        "  id bigint generated always as identity primary key,",
        "  title text not null, url text not null, sort int default 0,",
        "  created_at timestamptz default now());",
        "alter table public.guides enable row level security;",
        'create policy "public read guides" on public.guides for select using (true);',
        'create policy "admin write guides" on public.guides for all using (public.is_admin()) with check (public.is_admin());']
open(os.path.join(SQLDIR, "migrate_guides.sql"), "w", encoding="utf-8").write("\n".join(mig4)+"\n")

print("생성: supabase/schema.sql, supabase/seed.sql, supabase/reseed_books.sql, supabase/migrate_missions.sql, supabase/migrate_extras.sql, supabase/migrate_buy_urls.sql")
print(f"주제 {len(order)}개, 책 {sum(len(t['books']) for t in ch['themes'])}권 시드")
