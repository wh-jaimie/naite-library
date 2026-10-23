-- 메인 화면 "지금 ○명의 엄마가 함께하고 있어요" — 오픈채팅 참여 인원(관리자가 직접 입력)
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- settings 는 이미 공개 읽기 · 관리자 쓰기 정책이 있어서 컬럼만 추가하면 됨.
alter table public.settings add column if not exists chat_members int default 0;
update public.settings set chat_members = 32 where id = 1 and coalesce(chat_members, 0) = 0;
