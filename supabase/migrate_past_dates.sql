-- 달력에서 지난 날짜 기록 허용 — 나이테 스터디 앱(record/) 기록 탭 달력
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. 기존 기록·권한은 그대로.
-- 바뀌는 것: log_read·log_other 의 날짜 범위 '오늘-2일 ~ 오늘+1일' → '오늘-62일 ~ 오늘+1일'

create or replace function public.log_read(p_reader text, p_client_id text, p_book_id bigint, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_theme text; v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int;
begin
  if not coalesce(public.check_member(p_code), false) then return jsonb_build_object('ok',false,'error','member'); end if;
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  -- 달력에서 지난 날짜도 기록(최근 62일까지, 미래는 +1일 보정만)
  if p_read_on is null or p_read_on < v_today - 62 or p_read_on > v_today + 1 then
    return jsonb_build_object('ok',false,'error','date');
  end if;
  select b.theme_key into v_theme
    from public.books b join public.content c on c.theme_key = b.theme_key
   where b.id = p_book_id and coalesce(c.published,false);
  if v_theme is null then return jsonb_build_object('ok',false,'error','book'); end if;
  -- 하루 기록 상한(오작동·장난 방지)
  select count(*) into v_n from public.reading_logs where reader = p_reader and read_on = p_read_on;
  if v_n >= 60 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.reading_logs(reader, client_id, theme_key, book_id, read_on)
  values (p_reader, p_client_id, v_theme, p_book_id, p_read_on)
  on conflict (reader, client_id) do nothing;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.log_other(p_reader text, p_client_id text, p_title text, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int; v_title text;
begin
  if not coalesce(public.check_member(p_code), false) then return jsonb_build_object('ok',false,'error','member'); end if;
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  if p_read_on is null or p_read_on < v_today - 62 or p_read_on > v_today + 1 then
    return jsonb_build_object('ok',false,'error','date');
  end if;
  select count(*) into v_n from public.reading_logs where reader = p_reader and read_on = p_read_on;
  if v_n >= 60 then return jsonb_build_object('ok',false,'error','limit'); end if;
  v_title := left(btrim(coalesce(p_title,'')), 80);
  insert into public.reading_logs(reader, client_id, theme_key, book_id, read_on, other_title)
  values (p_reader, p_client_id, null, null, p_read_on, v_title)
  on conflict (reader, client_id) do nothing;
  return jsonb_build_object('ok',true);
end $$;
