-- 유형 이름 변경: 라임 → 라임/운율, 반복 → 반복/패턴
update public.books set tier_label='라임/운율' where tier=2 and tier_label='라임';
update public.books set tier_label='반복/패턴' where tier=3 and tier_label='반복';
