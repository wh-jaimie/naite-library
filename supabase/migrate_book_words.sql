-- 책별 '한 줄 줄거리'(plot) + '미리 알아 두면 좋은 단어'(words) 칸 — 유료 스터디 미리보기(pro/) R2, 관리자 책 입력 폼
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전. 비어 있어도 되는 선택 항목.
-- 새 테이블이 아니라 books에 칸만 더하는 거라 grant·RLS는 기존 그대로(관리자만 쓰기, 읽기는 RPC로만).
-- 책 데이터는 get_study / get_study_member 가 to_jsonb(b) 로 통째로 내보내므로 함수는 바꿀 필요 없음.
-- words 형식: 한 줄에 하나 "영어 - 뜻" (예: fire engine - 소방차). 화면에서 영어 부분만 🔊 듣기.
-- ⚠ 지금은 미리보기라 무료/유료 잠금이 화면에서만 됨(진짜 잠금은 로그인·이용권 RPC 생긴 뒤).

alter table public.books add column if not exists plot text;
alter table public.books add column if not exists words text;
