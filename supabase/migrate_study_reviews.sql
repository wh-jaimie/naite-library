-- 🎓 수료 조건에 '책 후기 3건' 추가 (2026-11-20 운영자 결정)
-- 수료 = 그 달 기록한 날 8번 이상 + 그 달에 쓴 책 후기 3건 이상. 후기는 스터디 책이 아니어도 됨(어떤 책이든).
-- 후기 1건 = 책 1권에 남긴 후기(반응이나 한 줄이 있는 것). 숨긴 후기는 안 셈. 그 달 = 주제의 달(theme_month), 처음 쓴 날 기준.
-- 후기 주인(naite_voice)과 기록 주인(naite_reader)이 다른 기기가 있어서, 참여 정보에 후기 ID(voice)도 같이 저장해 둘 다 셈.
-- migrate_study_joins.sql 다음에 실행. 여러 번 실행해도 안전.

alter table public.study_joins add column if not exists voice text;

-- 그 달 후기 수(기록 ID·후기 ID 둘 다)
create or replace function public.rev_count(p_ids text[], p_from date, p_to date)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.book_reviews r
   where r.reader = any(p_ids) and not r.hidden
     and (coalesce(r.body,'') <> '' or cardinality(r.reactions) > 0)
     and (r.created_at at time zone 'Asia/Seoul')::date >= p_from
     and (r.created_at at time zone 'Asia/Seoul')::date <  p_to;
$$;
revoke execute on function public.rev_count(text[], date, date) from public, anon, authenticated;

-- 앱: 참여 상태 + 이번 달 후기 수(reviews). p_voice 를 주면 참여 정보에 후기 ID를 저장해 둠(관리자 화면에서 같이 셈)
drop function if exists public.study_join_state(text);
create or replace function public.study_join_state(p_reader text, p_voice text default null)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_cur text; v_n int; v_me public.study_joins%rowtype; v_last public.study_joins%rowtype; v_next text; v_jn boolean := false;
        v_m date; v_rv int := 0; v_voice text;
begin
  select current_theme into v_cur from public.settings where id = 1;
  select count(*) into v_n from public.study_joins where theme_key = v_cur;
  v_next := public.next_theme(v_cur);
  v_m := public.theme_month(v_cur);
  v_voice := case when coalesce(length(p_voice),0) between 16 and 64 then p_voice end;
  if coalesce(length(p_reader),0) between 16 and 64 then
    if v_voice is not null then
      update public.study_joins set voice = v_voice where reader = p_reader and voice is distinct from v_voice;
    end if;
    select * into v_me from public.study_joins where reader = p_reader and theme_key = v_cur;
    v_jn := exists(select 1 from public.study_joins where reader = p_reader and theme_key = v_next);
    select * into v_last from public.study_joins where reader = p_reader order by updated_at desc limit 1;
    v_rv := public.rev_count(array_remove(array[p_reader, v_voice], null), v_m, (v_m + interval '1 month')::date);
  end if;
  return jsonb_build_object(
    'cur', v_cur, 'count', v_n, 'month', v_m,
    'joined', v_me.reader is not null,
    'nickname', v_last.nickname, 'kid_age', v_last.kid_age, 'came_from', v_last.came_from,
    'before', v_last.reader is not null and v_last.theme_key is distinct from v_cur,
    'next', v_next, 'joined_next', v_jn,
    'reviews', v_rv);
end $$;
grant execute on function public.study_join_state(text, text) to anon, authenticated;

-- 관리자: 달별 참여자 현황에 그 달 후기 수(month_reviews) 추가
drop function if exists public.admin_study_progress(text);
create or replace function public.admin_study_progress(p_theme text)
returns table(reader text, nickname text, kid_age smallint, came_from text, created_at timestamptz, gb_interest boolean,
              month_days int, week_days int, last_week_days int, month_reviews int)
language plpgsql stable security definer set search_path = public as $$
declare v_m date := public.theme_month(p_theme);
        v_today date := (now() at time zone 'Asia/Seoul')::date;
        v_wk date := v_today - (extract(isodow from v_today)::int - 1);
begin
  if not public.is_admin() then return; end if;
  return query
  select j.reader, j.nickname, j.kid_age, j.came_from, j.created_at, j.gb_interest,
         public.rec_days(j.reader, v_m, (v_m + interval '1 month')::date),
         public.rec_days(j.reader, v_wk, v_wk + 7),
         public.rec_days(j.reader, v_wk - 7, v_wk),
         public.rev_count(array_remove(array[j.reader, j.voice], null), v_m, (v_m + interval '1 month')::date)
    from public.study_joins j where j.theme_key = p_theme order by j.created_at;
end $$;
grant execute on function public.admin_study_progress(text) to authenticated;
