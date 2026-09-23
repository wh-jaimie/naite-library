-- 책별 유튜브 낭독(read aloud) 링크 컬럼 추가
-- 링크는 관리자 페이지에서 책마다 직접 입력(없으면 카드에 버튼 안 보임).
alter table public.books add column if not exists read_aloud text default '';
