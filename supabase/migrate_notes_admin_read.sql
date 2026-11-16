-- 관리자가 책 한 줄 메모를 읽을 수 있게 (2026-11-16)
-- KPI › 👤 사람별 › '메모 내려받기(CSV)'에서 씀. 회원끼리는 여전히 서로 못 봄(anon 정책 없음, 앱은 RPC로 내 메모만).
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.
drop policy if exists "admin read book_notes" on public.book_notes;
create policy "admin read book_notes" on public.book_notes for select using (public.is_admin());
