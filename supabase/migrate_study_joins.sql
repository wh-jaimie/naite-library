-- 이번 달 스터디 참여 신청 (2026-11-18 운영자 결정)
-- 채팅방·당근모임엔 들어와도 '내가 스터디를 하고 있는지' 분명하지 않음 → 매달 [참여하기](잠긴 스터디 자료 · 다음 달 미리보기에서 미리 신청).
-- 받는 것: 닉네임(채팅방·당근 이름, 필수) · 아이 나이대(선택) · 어디서 알게 됐는지(선택). 운영자(관리자)만 목록을 봄.
-- 기록 주인 = 기기별 기록 ID(naite_reader). 참여는 '그 달 주제(settings.current_theme)' 단위, 지난 달 수료자는 다음 달에 버튼 한 번으로 이어서 참여.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create table if not exists public.study_joins (
  reader     text not null,
  theme_key  text not null,
  nickname   text not null,
  kid_age    smallint,          -- 1 = 0~3세 · 2 = 4~6세 · 3 = 7~9세 (앱의 naite_age와 같음)
  came_from  text,              -- kakao · daangn · insta · blog · friend · etc
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reader, theme_key)
);
alter table public.study_joins enable row level security;
grant select, insert, update, delete on public.study_joins to anon, authenticated, service_role;
-- 회원은 표를 직접 못 읽고 아래 함수로만. 관리자만 목록 읽기·지우기
drop policy if exists "admin read study_joins" on public.study_joins;
create policy "admin read study_joins" on public.study_joins for select using (public.is_admin());
drop policy if exists "admin delete study_joins" on public.study_joins;
create policy "admin delete study_joins" on public.study_joins for delete using (public.is_admin());

-- ───────── 수료·독려 규칙 (2026-11-18 운영자 결정) ─────────
-- 인증: 카톡·당근 채팅방 공유는 자유(선택). 기준은 앱 '읽기 기록'.
-- 매주(월~일) 기록한 날이 2번 미만이면 주말에 독려. 그 달 기록한 날 8번 이상 = 수료.
-- 수료하면 앱에서 수료증 이미지를 받음. 미수료라고 다음 달 참여를 막지는 않음(2026-11-18 운영자 결정).
-- '기록 1번' = 책을 기록한 날 하루(하루에 여러 권 기록해도 1번). 인증샷만 찍은 날은 안 셈.

-- 주제의 달(content.month_label '2026년 11월 …' → 2026-11-01)
create or replace function public.theme_month(p_theme text)
returns date language sql stable security definer set search_path = public as $$
  select coalesce(
    (select make_date(m[1]::int, m[2]::int, 1)
       from (select regexp_match(c.month_label, '(\d{4})\s*년\s*(\d{1,2})\s*월') m from public.content c where c.theme_key = p_theme) x
      where m is not null limit 1),
    date_trunc('month', (now() at time zone 'Asia/Seoul'))::date);
$$;

-- 기록한 날 수(기간)
create or replace function public.rec_days(p_reader text, p_from date, p_to date)
returns int language sql stable security definer set search_path = public as $$
  select count(distinct read_on)::int from public.reading_logs where reader = p_reader and read_on >= p_from and read_on < p_to;
$$;
revoke execute on function public.rec_days(text, date, date) from public, anon, authenticated;
revoke execute on function public.theme_month(text) from public, anon, authenticated;

-- 다음 달 주제(themes.sort 순서로 이번 달 다음) — 다음 달 미리보기에서 미리 신청
create or replace function public.next_theme(p_theme text)
returns text language sql stable security definer set search_path = public as $$
  select t.key from public.themes t where t.sort > (select sort from public.themes where key = p_theme) order by t.sort limit 1;
$$;

create or replace function public.study_join_state(p_reader text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cur text; v_n int; v_me public.study_joins%rowtype; v_last public.study_joins%rowtype; v_next text; v_jn boolean := false;
begin
  select current_theme into v_cur from public.settings where id = 1;
  select count(*) into v_n from public.study_joins where theme_key = v_cur;
  v_next := public.next_theme(v_cur);
  if coalesce(length(p_reader),0) between 16 and 64 then
    select * into v_me from public.study_joins where reader = p_reader and theme_key = v_cur;
    v_jn := exists(select 1 from public.study_joins where reader = p_reader and theme_key = v_next);
    select * into v_last from public.study_joins where reader = p_reader order by updated_at desc limit 1;
  end if;
  return jsonb_build_object(
    'cur', v_cur, 'count', v_n, 'month', public.theme_month(v_cur),
    'joined', v_me.reader is not null,
    'nickname', v_last.nickname, 'kid_age', v_last.kid_age, 'came_from', v_last.came_from,
    'before', v_last.reader is not null and v_last.theme_key is distinct from v_cur,
    'next', v_next, 'joined_next', v_jn);
end $$;
grant execute on function public.study_join_state(text) to anon, authenticated;

-- p_theme: 비우면 이번 달, 다음 달 주제를 주면 미리 신청(그 밖의 달은 안 됨)
drop function if exists public.join_study(text, text, int, text);
create or replace function public.join_study(p_reader text, p_nickname text, p_kid_age int, p_came_from text, p_theme text default null)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_cur text; v_nick text; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  v_nick := left(btrim(coalesce(p_nickname,'')), 20);
  if v_nick = '' then return jsonb_build_object('ok',false,'error','name'); end if;
  select current_theme into v_cur from public.settings where id = 1;
  if v_cur is null then return jsonb_build_object('ok',false,'error','theme'); end if;
  if p_theme is not null and p_theme <> v_cur then
    if p_theme is distinct from public.next_theme(v_cur) then return jsonb_build_object('ok',false,'error','theme'); end if;
    v_cur := p_theme;
  end if;
  insert into public.study_joins(reader, theme_key, nickname, kid_age, came_from)
  values (p_reader, v_cur, v_nick,
          case when p_kid_age between 1 and 3 then p_kid_age end,
          case when p_came_from in ('kakao','daangn','insta','blog','friend','etc') then p_came_from end)
  on conflict (reader, theme_key) do update set nickname = excluded.nickname, kid_age = excluded.kid_age,
     came_from = excluded.came_from, updated_at = now();
  select count(*) into v_n from public.study_joins where theme_key = v_cur;
  return jsonb_build_object('ok',true,'cur',v_cur,'count',v_n);
end $$;
grant execute on function public.join_study(text, text, int, text, text) to anon, authenticated;

drop function if exists public.admin_study_progress(text);
-- 관리자: 달별 참여자 기록 현황(그 달 기록한 날 · 이번 주 · 지난 주) — 주말 독려·월말 수료 확인용
create or replace function public.admin_study_progress(p_theme text)
returns table(reader text, nickname text, kid_age smallint, came_from text, created_at timestamptz,
              month_days int, week_days int, last_week_days int)
language plpgsql stable security definer set search_path = public as $$
declare v_m date := public.theme_month(p_theme);
        v_today date := (now() at time zone 'Asia/Seoul')::date;
        v_wk date := v_today - (extract(isodow from v_today)::int - 1);
begin
  if not public.is_admin() then return; end if;
  return query
  select j.reader, j.nickname, j.kid_age, j.came_from, j.created_at,
         public.rec_days(j.reader, v_m, (v_m + interval '1 month')::date),
         public.rec_days(j.reader, v_wk, v_wk + 7),
         public.rec_days(j.reader, v_wk - 7, v_wk)
    from public.study_joins j where j.theme_key = p_theme order by j.created_at;
end $$;
grant execute on function public.admin_study_progress(text) to authenticated;
