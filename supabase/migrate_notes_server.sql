-- 책 한 줄 메모: 모든 사용자 서버 보관 (2026-11-17 운영자 결정)
-- 앱이 메모 내용을 서버에 올리고, 같은 기록 ID를 쓰는 다른 폰(이어보기·아빠와 같이 쓰기)이 받아 감.
-- 관리자 화면에서는 메모 내용을 직접 읽지 않고 '남겼다는 표시'만 admin_note_flags()로 봄.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. (migrate_notes_local_only.sql 은 실행하지 않아도 됨 — 이 파일이 대신함)

-- 1) 저장: 받은 내용 그대로(빈 메모면 지움). 하루 상한 30개(오작동·장난 방지)
create or replace function public.save_note(p_reader text, p_book_key text, p_read_on date, p_note text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int; v_note text;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(p_book_key,'') !~ '^(b:[0-9]{1,18}|o:.{0,80})$' then return jsonb_build_object('ok',false,'error','book'); end if;
  if p_read_on is null or p_read_on < v_today - 400 or p_read_on > v_today + 1 then
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
grant execute on function public.save_note(text, text, date, text) to anon, authenticated;

-- 2) 내 메모 받기(내용이 있는 것만 — 11/16~17 사이 앱이 보낸 '1' 표시는 빼고)
create or replace function public.my_notes(p_reader text)
returns table(book_key text, read_on date, note text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.book_key, n.read_on, n.note, n.updated_at from public.book_notes n
   where n.reader = p_reader and n.note <> '1'
   order by n.read_on;
$$;
grant execute on function public.my_notes(text) to anon, authenticated;

-- 3) 관리자: 메모 내용은 직접 안 읽고 남겼다는 표시만
drop policy if exists "admin read book_notes" on public.book_notes;
create or replace function public.admin_note_flags()
returns table(reader text, book_key text, read_on date, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select n.reader, n.book_key, n.read_on, n.updated_at from public.book_notes n order by n.read_on;
end $$;
revoke all on function public.admin_note_flags() from public, anon;
grant execute on function public.admin_note_flags() to authenticated;
