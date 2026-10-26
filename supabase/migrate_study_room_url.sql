-- 관리자가 공개 페이지에 표시할 카카오톡 스터디 방 링크를 바꿀 수 있게 합니다.
-- settings는 공개 읽기·관리자 쓰기 정책과 Data API GRANT가 이미 설정돼 있습니다.
alter table public.settings
  add column if not exists study_room_url text default 'https://open.kakao.com/o/p8qXEfUi';

insert into public.settings (id, current_theme, study_room_url)
values (1, 'animals', 'https://open.kakao.com/o/p8qXEfUi')
on conflict (id) do nothing;

update public.settings
set study_room_url = 'https://open.kakao.com/o/p8qXEfUi'
where id = 1 and nullif(btrim(study_room_url), '') is null;
