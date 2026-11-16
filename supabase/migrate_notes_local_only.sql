-- 책 한 줄 메모: 내용은 서버에 남기지 않음 (2026-11-16 운영자 결정 — 개인정보, 인증 사진과 같게)
-- ⚠️ 순서: 관리 KPI › 👤 사람별 › '메모 내려받기(CSV)'로 지금까지 메모를 한 번 받은 "뒤에" 실행하세요.
--    실행하면 서버에 있던 메모 내용이 지워지고 되돌릴 수 없어요. (회원 폰에 저장된 메모는 그대로)
-- 이후 서버에는 '그 책·그 날에 메모를 남겼다'는 표시('1')만 남음. 여러 번 실행해도 안전.

-- 1) 지금까지 저장된 내용 지우기(남겼다는 표시만 유지)
update public.book_notes set note = '1' where note <> '1';

-- 2) 저장 함수: 내용이 와도 '1'만 저장(예전 버전 앱이 내용을 보내도 서버엔 안 남음)
create or replace function public.save_note(p_reader text, p_book_key text, p_read_on date, p_note text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(p_book_key,'') !~ '^(b:[0-9]{1,18}|o:.{0,80})$' then return jsonb_build_object('ok',false,'error','book'); end if;
  if p_read_on is null or p_read_on < v_today - 400 or p_read_on > v_today + 1 then
    return jsonb_build_object('ok',false,'error','date');
  end if;
  if btrim(coalesce(p_note,'')) = '' then
    delete from public.book_notes where reader = p_reader and book_key = p_book_key and read_on = p_read_on;
    return jsonb_build_object('ok',true);
  end if;
  select count(*) into v_n from public.book_notes where reader = p_reader and read_on = p_read_on and book_key <> p_book_key;
  if v_n >= 30 then return jsonb_build_object('ok',false,'error','limit'); end if;
  insert into public.book_notes(reader, book_key, read_on, note, updated_at)
  values (p_reader, p_book_key, p_read_on, '1', now())
  on conflict (reader, book_key, read_on) do update set note = '1', updated_at = now();
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.save_note(text, text, date, text) to anon, authenticated;

-- 3) 서버에서 메모를 다시 받아오는 함수 없앰(앱은 이 기기 메모만 씀. 예전 버전 앱은 호출 실패 → 폰 메모 그대로 유지)
drop function if exists public.my_notes(text);
