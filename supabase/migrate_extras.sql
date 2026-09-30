-- 부가자료(추가 유튜브 영상 등) 컬럼 추가. SQL Editor 에서 Run.
alter table public.content add column if not exists extras text default '';
