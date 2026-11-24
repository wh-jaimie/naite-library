-- Suzy Goose 표지를 파란 표지(Walker Books 판)로 (2026-11-24 운영자)
update public.books set cover = 'https://covers.openlibrary.org/b/id/10514195-L.jpg'
 where theme_key = 'christmas' and tier = 3 and title = 'Suzy Goose and the Christmas Star';
