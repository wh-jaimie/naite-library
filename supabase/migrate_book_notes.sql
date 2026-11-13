-- 책 한 줄 메모(2026-11-13): 읽기 기록 앱에서 책마다, 읽은 날마다 짧은 메모(아이 반응 등)
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- 메모 주인 = 기기 기록 ID(reader, reading_logs와 같음). 본인 기기에서만 보이고 다른 사람은 못 봄(RPC로만 읽고 씀).
-- book_key: 스터디 책 'b:<books.id>' · 직접 입력한 다른 책 'o:<제목>'(제목 없으면 'o:')
-- 기록 백업 '이어보기'(restore_reader) 때 이 기기 메모도 백업 쪽으로 합쳐짐(같은 책·같은 날은 백업 쪽 유지).

create table if not exists public.book_notes (
  reader     text not null,
  book_key   text not null,
  read_on    date not null,
  note       text not null,
  updated_at timestamptz not null default now(),
  primary key (reader, book_key, read_on)
);
alter table public.book_notes enable row level security;
-- Data API 권한(새 테이블은 자동 부여 안 됨). anon 정책이 없어 직접 읽기는 막히고 아래 RPC로만 씀.
grant select, insert, update, delete on public.book_notes to anon, authenticated, service_role;

-- 저장(빈 메모면 지움). 하루 메모 상한 30개(오작동·장난 방지)
create or replace function public.save_note(p_reader text, p_book_key text, p_read_on date, p_note text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date; v_note text; v_n int;
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

create or replace function public.my_notes(p_reader text)
returns table(book_key text, read_on date, note text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.book_key, n.read_on, n.note, n.updated_at from public.book_notes n
   where n.reader = p_reader order by n.read_on;
$$;

grant execute on function public.save_note(text, text, date, text) to anon, authenticated;
grant execute on function public.my_notes(text)                    to anon, authenticated;

-- 이어보기: migrate_open_app.sql 과 같고, 마지막에 메모 합치기만 더함
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
    update public.book_notes n set reader = v_row.reader
     where n.reader = p_current
       and not exists (select 1 from public.book_notes x where x.reader = v_row.reader and x.book_key = n.book_key and x.read_on = n.read_on);
  end if;
  return jsonb_build_object('ok',true,'reader',v_row.reader,'name',v_row.name);
end $$;
grant execute on function public.restore_reader(text, text, text) to anon, authenticated;
