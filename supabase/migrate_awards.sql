-- books 수상 컬럼 추가 + 값 채우기 (Supabase SQL Editor 에서 Run)
alter table public.books add column if not exists award text default '';

update public.books set award='🏅 칼데콧 아너 2004' where theme_key='vehicles' and title='Don''t Let the Pigeon Drive the Bus!';
update public.books set award='🥇 칼데콧 메달 1963' where theme_key='weather-seasons' and title='The Snowy Day';
update public.books set award='🥇 칼데콧 메달 1964' where theme_key='monsters' and title='Where the Wild Things Are';
update public.books set award='🏅 칼데콧 아너 2013' where theme_key='halloween' and title='Creepy Carrots!';
update public.books set award='🥇 칼데콧 메달 1986' where theme_key='christmas' and title='The Polar Express';
update public.books set award='🏅 칼데콧 아너 2015' where theme_key='imagination' and title='Sam & Dave Dig a Hole';
