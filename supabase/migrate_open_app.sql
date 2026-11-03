-- 나이테 스터디 앱 공개(2026-11-03): 비밀번호 없이 누구나 자료·기록·공지를 씀 + 기록 백업(닉네임 + 숫자 4자리)
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- ⚠️ 앱 배포(비밀번호 화면 제거) 전에 먼저 실행. 함수 이름·인자는 그대로라 지금 쓰는 앱도 계속 동작(p_code는 무시).
-- 기록 주인은 원래부터 기기별 익명 ID(reader)라 회원들 기존 기록은 그대로 이어짐. member_config·check_member는 남겨 둠(안 씀).

-- ── 1. 비밀번호 확인 빼기 ──
create or replace function public.get_study_member(p_key text, p_code text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_pub boolean; v_theme jsonb; v_content jsonb; v_books jsonb;
begin
  select to_jsonb(t) into v_theme from public.themes t where t.key = p_key;
  if v_theme is null then return jsonb_build_object('ok', false, 'error', 'notfound'); end if;
  select coalesce(c.published,false) into v_pub from public.content c where c.theme_key = p_key;
  if not coalesce(v_pub, false) then return jsonb_build_object('ok', false, 'error', 'unpublished'); end if;
  select (to_jsonb(c) - 'passcode') into v_content from public.content c where c.theme_key = p_key;
  select coalesce(jsonb_agg(to_jsonb(b) order by b.sort), '[]'::jsonb) into v_books
    from public.books b where b.theme_key = p_key;
  return jsonb_build_object('ok', true, 'theme', v_theme, 'content', v_content, 'books', v_books);
end $$;

create or replace function public.log_read(p_reader text, p_client_id text, p_book_id bigint, p_read_on date, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_theme text; v_today date := (now() at time zone 'Asia/Seoul')::date; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if coalesce(length(p_client_id),0) not between 8 and 64 then return jsonb_build_object('ok',false,'error','client'); end if;
  -- 지난 달 달력에도 기록할 수 있게 약 두 달 전까지 허용(migrate_past_dates.sql과 같음)
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

create or replace function public.list_app_notices(p_code text)
returns table(id bigint, created_at timestamptz, title text, body text, pinned boolean)
language sql stable security definer set search_path = public as $$
  select n.id, n.created_at, n.title, n.body, n.pinned
    from public.notices n
   where n.in_app
   order by n.pinned desc, n.created_at desc
   limit 30;
$$;

-- ── 2. 기록 백업(닉네임 + 숫자 4자리) ──
-- 닉네임은 한 사람만(대소문자·앞뒤 공백 무시). 숫자는 해시로만 저장. 틀리면 1시간에 10번까지만 시도 가능.
create table if not exists public.reader_backups (
  name_key   text primary key,             -- lower(btrim(닉네임))
  name       text not null,                -- 보여줄 닉네임
  reader     text not null unique,         -- 기기 기록 ID(reading_logs.reader)
  pin_hash   text not null,
  fails      int not null default 0,
  fail_at    timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.reader_backups enable row level security;
-- Data API 권한(2026-10-30부터 새 테이블은 자동 부여 안 됨). anon 정책이 없어 직접 읽기는 막히고 아래 RPC로만 씀.
grant select, insert, update, delete on public.reader_backups to anon, authenticated, service_role;
drop policy if exists "admin read reader_backups" on public.reader_backups;
create policy "admin read reader_backups" on public.reader_backups for select using (public.is_admin());

create or replace function public._pin_hash(p_name_key text, p_pin text)
returns text language sql immutable set search_path = public as $$
  select encode(sha256(convert_to('naite:' || p_name_key || ':' || p_pin, 'UTF8')), 'hex');
$$;
revoke execute on function public._pin_hash(text, text) from public, anon, authenticated;

-- 백업 만들기·숫자 바꾸기. 같은 기기(reader)면 닉네임·숫자를 바꿀 수 있음
create or replace function public.backup_reader(p_reader text, p_name text, p_pin text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_key text := lower(btrim(coalesce(p_name,''))); v_row public.reader_backups;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  if char_length(v_key) not between 2 and 12 then return jsonb_build_object('ok',false,'error','name'); end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then return jsonb_build_object('ok',false,'error','pin'); end if;
  select * into v_row from public.reader_backups where name_key = v_key;
  if found and v_row.reader <> p_reader then return jsonb_build_object('ok',false,'error','taken'); end if;
  delete from public.reader_backups where reader = p_reader and name_key <> v_key; -- 닉네임을 바꾼 경우
  insert into public.reader_backups(name_key, name, reader, pin_hash)
  values (v_key, btrim(p_name), p_reader, public._pin_hash(v_key, p_pin))
  on conflict (name_key) do update set name = excluded.name, pin_hash = excluded.pin_hash, fails = 0, fail_at = null, updated_at = now();
  return jsonb_build_object('ok',true,'name',btrim(p_name));
end $$;

-- 이어보기: 닉네임·숫자가 맞으면 그 기록 ID를 돌려주고, 지금 기기에 쌓인 기록(p_current)도 그쪽으로 옮김
create or replace function public.restore_reader(p_name text, p_pin text, p_current text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_key text := lower(btrim(coalesce(p_name,''))); v_row public.reader_backups;
begin
  select * into v_row from public.reader_backups where name_key = v_key for update;
  if not found then return jsonb_build_object('ok',false,'error','nomatch'); end if;
  if v_row.fails >= 10 and v_row.fail_at > now() - interval '1 hour' then
    return jsonb_build_object('ok',false,'error','locked');
  end if;
  if v_row.pin_hash <> public._pin_hash(v_key, coalesce(p_pin,'')) then
    update public.reader_backups
       set fails = case when fail_at > now() - interval '1 hour' then fails + 1 else 1 end, fail_at = now()
     where name_key = v_key;
    return jsonb_build_object('ok',false,'error','nomatch');
  end if;
  update public.reader_backups set fails = 0, fail_at = null where name_key = v_key;
  -- 이 기기 기록 합치기(다른 백업에 묶인 기기 ID는 건드리지 않음)
  if coalesce(length(p_current),0) between 16 and 64 and p_current <> v_row.reader
     and not exists (select 1 from public.reader_backups b where b.reader = p_current) then
    update public.reading_logs r set reader = v_row.reader
     where r.reader = p_current
       and not exists (select 1 from public.reading_logs x where x.reader = v_row.reader and x.client_id = r.client_id);
  end if;
  return jsonb_build_object('ok',true,'reader',v_row.reader,'name',v_row.name);
end $$;

-- 이 기기가 백업돼 있는지(닉네임 표시용)
create or replace function public.my_backup(p_reader text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('ok',true,'name',b.name) from public.reader_backups b where b.reader = p_reader),
                  jsonb_build_object('ok',false));
$$;

grant execute on function public.backup_reader(text, text, text)  to anon, authenticated;
grant execute on function public.restore_reader(text, text, text) to anon, authenticated;
grant execute on function public.my_backup(text)                  to anon, authenticated;
