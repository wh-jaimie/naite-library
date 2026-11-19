-- I Will Not Ever Never Eat a Tomato (Lauren Child): 2000년 케이트 그리너웨이 메달 수상작 → 수상 배지 (2026-11-19 확인)
-- 스터디 앱(그 달 자료)에 보이는 수상 표시용. 책 행은 지우지 않고 award 칸만 고침. 여러 번 실행해도 안전.
update public.books
   set award = '🥇 그리너웨이 메달 2000'
 where title = 'I Will Not Ever Never Eat a Tomato'
   and coalesce(award, '') = '';
