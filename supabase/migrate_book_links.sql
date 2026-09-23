-- 책별 워크북 링크 + 구매 링크(쿠팡 파트너스)
-- 워크북/구매는 이제 '테마'가 아니라 '책마다 1개'로 붙습니다. (스터디 페이지의 각 책 카드 버튼)
alter table public.books add column if not exists workbook text default '';
alter table public.books add column if not exists buy_url  text default '';

-- 동물 테마: 책별 대표 워크북 링크 1개 (출판사·작가 공식 무료 활동지)
update public.books set workbook='https://www.panmacmillan.com/dear-zoo'
  where theme_key='animals' and title='Dear Zoo';
update public.books set workbook='https://www.hachetteschools.co.uk/resource/giraffes-cant-dance-activity-sheets/'
  where theme_key='animals' and title='Giraffes Can''t Dance';
update public.books set workbook='https://eric-carle.com/resources/downloads-and-activities/'
  where theme_key='animals' and title='Brown Bear, Brown Bear, What Do You See?';
update public.books set workbook='https://www.rif.org/literacy-central/material/interrupting-chicken-activity-kit'
  where theme_key='animals' and title='Interrupting Chicken';
-- Moo, Baa, La La La! / The Crocodile Who Didn't Like Water
--   → 공식 무료 워크북이 마땅치 않아 비워둠(카드에 워크북 버튼 안 보임).

-- 구매 링크(buy_url)는 쿠팡 파트너스에서 상품별로 생성한 뒤,
-- 관리자 페이지(스터디 관리자 → 콘텐츠 관리 → 각 책)에서 책마다 붙여넣으세요.
