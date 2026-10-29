-- 나이테 스터디 앱 '📢 소식' — 관리자 › 🌳 운영 › 공지 작성기에서 저장한 공지를 회원 앱에 보여줌
-- 먼저 migrate_ops.sql(notices 테이블)을 실행한 뒤 이 파일을 실행. 여러 번 실행해도 안전(idempotent).
-- notices 테이블은 계속 관리자 전용(RLS). 회원은 아래 RPC로만, 회원 비밀번호가 맞을 때만 읽음.

alter table public.notices add column if not exists in_app boolean not null default true;  -- 앱 소식에 보이기
alter table public.notices add column if not exists pinned boolean not null default false; -- 맨 위 고정

create or replace function public.list_app_notices(p_code text)
returns table(id bigint, created_at timestamptz, title text, body text, pinned boolean)
language sql stable security definer set search_path = public as $$
  select n.id, n.created_at, n.title, n.body, n.pinned
    from public.notices n
   where coalesce(public.check_member(p_code), false) and n.in_app
   order by n.pinned desc, n.created_at desc
   limit 30;
$$;
grant execute on function public.list_app_notices(text) to anon, authenticated;
