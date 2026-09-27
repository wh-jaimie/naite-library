-- 유형 이름: 라임 → 라임·운율, 반복 → 반복·패턴 (유머·반전과 동일하게 가운데점)
-- tier 번호로 갱신하므로 이전에 어떤 라벨이었든(라임/라임/운율 등) 안전하게 덮어씁니다.
update public.books set tier_label='라임·운율' where tier=2;
update public.books set tier_label='반복·패턴' where tier=3;
