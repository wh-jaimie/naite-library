-- 미니 챌린지 신청 링크(회차별) — 스터디 앱 챌린지 카드의 '📝 신청하고 워크지 받기' 버튼
-- 관리자 › 🌳 운영 › 🏁 미니 챌린지에서 회차마다 입력. 비어 있으면 앱에서 버튼이 안 보임.
-- 먼저 migrate_challenges.sql 이 실행돼 있어야 함. 여러 번 실행해도 안전.

alter table public.challenges add column if not exists apply_url text;
