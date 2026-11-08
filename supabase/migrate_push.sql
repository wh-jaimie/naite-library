-- 나이테 스터디 앱 푸시 알림 (2026-11-08)
-- 앱에서 '알림 받기'를 허용한 폰의 알림 주소(push subscription)를 저장하고, 관리자가 보낸 알림 기록을 남김.
-- 실제 발송은 Edge Function `send-push`(supabase/functions/send-push)가 함. 여러 번 실행해도 안전(idempotent).

create table if not exists public.push_subs (
  id         bigserial primary key,
  endpoint   text not null unique,      -- 브라우저가 준 알림 주소
  p256dh     text not null,
  auth       text not null,
  reader     text,                      -- 앱 기록 주인(기기별 익명 ID, localStorage naite_reader)
  ua         text,                      -- 기기 종류 참고용(안드로이드/아이폰 구분)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "admin read push_subs" on public.push_subs;
create policy "admin read push_subs" on public.push_subs for select using (public.is_admin());
grant select, insert, update, delete on public.push_subs to anon, authenticated, service_role;

create table if not exists public.push_log (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  title      text,
  body       text,
  url        text,
  target     text,                      -- 'all' | 'test'
  sent       int not null default 0,
  failed     int not null default 0,
  removed    int not null default 0     -- 만료돼서 지운 주소 수
);
alter table public.push_log enable row level security;
drop policy if exists "admin read push_log" on public.push_log;
create policy "admin read push_log" on public.push_log for select using (public.is_admin());
grant select, insert, update, delete on public.push_log to anon, authenticated, service_role;

-- 앱이 부르는 함수: 알림 주소 저장(같은 주소면 갱신) / 알림 끄기
create or replace function public.save_push_sub(p_endpoint text, p_p256dh text, p_auth text, p_reader text, p_ua text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or length(p_endpoint) < 20 or length(p_endpoint) > 1000 then return false; end if;
  insert into public.push_subs(endpoint, p256dh, auth, reader, ua)
  values (p_endpoint, p_p256dh, p_auth, left(p_reader, 80), left(p_ua, 200))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth,
    reader = excluded.reader, ua = excluded.ua, updated_at = now();
  return true;
end $$;
grant execute on function public.save_push_sub(text, text, text, text, text) to anon, authenticated;

create or replace function public.remove_push_sub(p_endpoint text)
returns boolean language sql security definer set search_path = public as $$
  delete from public.push_subs where endpoint = p_endpoint returning true;
$$;
grant execute on function public.remove_push_sub(text) to anon, authenticated;
