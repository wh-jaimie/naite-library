-- 다른 책(스터디 책이 아닌 책) 읽기 기록 — 나이테 스터디 앱(record/) '📚 다른 책도 읽었어요 +1'
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. 기존 기록은 그대로 유지.
-- 다른 책 기록: book_id·theme_key 는 비우고(null) other_title 에 제목(선택, 빈 문자열 가능)을 저장.
-- → 주제(theme_key)로 묶는 책별·주제별 반응 통계에는 섞이지 않음.

alter table public.reading_logs add column if not exists other_title text;
create index if not exists reading_logs_other_idx on public.reading_logs(reader) where book_id is null;

-- 다른 책 기록 1회 추가(회원 비밀번호 확인)
create or replace function public.log_other(p_reader text, p_client_id text, p_title text, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int; v_title text;
begin
  if not coalesce(public.check_member(p_code), false) then return jsonb_build_object('ok',false,'error','member'); end if;
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  if p_read_on is null or p_read_on < v_today - 2 or p_read_on > v_today + 1 then
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

-- 내 다른 책 기록
create or replace function public.my_other_reads(p_reader text)
returns table(client_id text, other_title text, read_on date, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.client_id, coalesce(r.other_title,''), r.read_on, r.created_at
    from public.reading_logs r
   where r.reader = p_reader and r.book_id is null
   order by r.created_at;
$$;

grant execute on function public.log_other(text, text, text, date, text) to anon, authenticated;
grant execute on function public.my_other_reads(text)                     to anon, authenticated;
