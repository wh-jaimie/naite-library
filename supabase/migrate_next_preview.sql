-- '다음 달 미리보기'를 관리자가 켤 때만 보이게 — 나이테 스터디 앱(record/) 이번 달 자료의 다음 달 미리보기
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.
-- settings 는 이미 공개 읽기 · 관리자 쓰기 정책이 있어서 컬럼만 추가하면 됨. 처음엔 꺼짐(false).
alter table public.settings add column if not exists show_next boolean not null default false;
