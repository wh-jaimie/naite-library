-- 공룡 '반복' 교체: Dinosaur Dance! → How Do Dinosaurs Say Goodnight?
--   ("How does a dinosaur…?" 질문이 반복되는 패턴북 — 아이가 문장을 외워 말하기 좋음)
update public.books set
  title    = 'How Do Dinosaurs Say Goodnight?',
  author   = 'Jane Yolen',
  cover    = 'https://covers.openlibrary.org/b/id/7092593-L.jpg',
  reason   = '"How does a dinosaur…?" 질문이 반복되는 패턴북',
  pop_rank = 0,
  award    = '',
  kr_popular = false
where theme_key = 'dinosaurs' and title = 'Dinosaur Dance!';
