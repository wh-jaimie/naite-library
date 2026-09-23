-- ⚠️ 관리자 저장 오류(RLS) 해결
-- 원인: schema.sql 실행 시 'ADMIN_EMAIL' 자리표시자를 실제 이메일로 바꾸지 않아
--       is_admin() 이 항상 false → 모든 쓰기가 막힘.
-- 아래를 Supabase SQL Editor 에서 실행하면 관리자 이메일이 올바르게 설정됩니다.
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jabbaek@gmail.com'
$$;

-- 확인: 관리자 계정으로 로그인한 상태에서 실행하면 true 가 나와야 정상
-- select public.is_admin();
