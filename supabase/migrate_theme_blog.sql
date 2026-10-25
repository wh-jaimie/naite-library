-- 주제별 블로그 글 주소 칸 추가 — 나이테 스터디 앱 '다음 달 미리보기'에서 '블로그에서 자세히 보기'로 연결. SQL Editor 에서 Run(재실행 안전).
-- themes 는 이미 공개 읽기 + 관리자 쓰기 정책·grant가 있어 칸만 추가하면 됨. 입력: 관리 › 📝 스터디 내용 › 주제 고른 뒤 '블로그 글 주소'.
alter table public.themes add column if not exists blog_url text default '';
