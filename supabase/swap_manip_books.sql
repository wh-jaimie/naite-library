-- 조작북 교체(국내 구매 쉬운 책으로)
-- 색깔: Lemons Are Not Red → Mix It Up! (에르베 튈레, 국내 인기 배지)
update public.books set
  title='Mix It Up!', author='Hervé Tullet',
  cover='https://covers.openlibrary.org/b/id/8174029-L.jpg',
  reason='손가락으로 색을 섞는 에르베 튈레의 참여형 색깔책',
  pop_rank=0, lib_loans=0, award='', kr_popular=true
where theme_key='colors' and tier=1;

-- 숫자: 600 Black Spots → There Were Ten in the Bed (구멍 다이컷 카운팅 싱어롱 조작북)
update public.books set
  title='There Were Ten in the Bed', author='Annie Kubler',
  cover='https://covers.openlibrary.org/b/id/1606374-L.jpg',
  reason='구멍(다이컷)으로 하나씩 떨어지는 카운팅 싱어롱 조작북',
  pop_rank=0, lib_loans=0, award='', kr_popular=false
where theme_key='numbers' and tier=1;
