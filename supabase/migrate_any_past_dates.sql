-- 읽기 인증 달력: 지난 날짜 제한 없애기(2026-11-20 운영자 요청)
-- 달력을 스터디 달과 상관없이 앞뒤로 넘기고, 지난 날짜면 언제든 기록·메모를 남길 수 있게.
-- 바뀐 것: log_read·log_other(원래 62일 전까지) · save_note(원래 400일 전까지) → 날짜 아래 한도 없음(2000-01-01 이후).
-- 앞으로 올 날은 그대로 '내일'까지만(앱은 오늘까지만 누를 수 있음). 나머지 내용은 migrate_open_app.sql · migrate_notes_server.sql 과 같음.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create or replace function public.log_read(p_reader text, p_client_id text, p_book_id bigint, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_theme text; v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  if p_read_on is null or p_read_on < date '2000-01-01' or p_read_on > v_today + 1 then
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
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  if p_read_on is null or p_read_on < date '2000-01-01' or p_read_on > v_today + 1 then
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

create or replace function public.save_note(p_reader text, p_book_key text, p_read_on date, p_note text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int; v_note text;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(p_book_key,'') !~ '^(b:[0-9]{1,18}|o:.{0,80})$' then return jsonb_build_object('ok',false,'error','book'); end if;
  if p_read_on is null or p_read_on < date '2000-01-01' or p_read_on > v_today + 1 then
    return jsonb_build_object('ok',false,'error','date');
  end if;
  v_note := left(btrim(coalesce(p_note,'')), 100);
  if v_note = '' then
    delete from public.book_notes where reader = p_reader and book_key = p_book_key and read_on = p_read_on;
    return jsonb_build_object('ok',true);
  end if;
  select count(*) into v_n from public.book_notes where reader = p_reader and read_on = p_read_on and book_key <> p_book_key;
  if v_n >= 30 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.book_notes(reader, book_key, read_on, note, updated_at)
  values (p_reader, p_book_key, p_read_on, v_note, now())
  on conflict (reader, book_key, read_on) do update set note = excluded.note, updated_at = now();
  return jsonb_build_object('ok',true);
end $$;
