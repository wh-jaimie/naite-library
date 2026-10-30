-- 책별 '이 책 읽어주기 팁' 칸 — 나이테 스터디 앱(record/) 책 카드의 접힘 팁, 관리자 책 입력 폼
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. 비어 있어도 되는 선택 항목.
-- 책 데이터는 get_study / get_study_member 가 to_jsonb(b) 로 통째로 내보내므로 함수는 바꿀 필요 없음.

alter table public.books add column if not exists tip text;
