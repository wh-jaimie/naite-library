-- 워크북·활동지 기능 추가
-- content 테이블에 workbooks 컬럼 추가 (한 줄에 하나: "자료 이름 | https://링크")
alter table public.content add column if not exists workbooks text default '';

-- 이번 달(동물) 공식·무료 활동지 링크 시드
-- ⚠️ 파일을 우리 서버에 재배포하지 않고, 각 원출처에서 직접 다운로드하도록 "링크"만 연결합니다(저작권 안전).
update public.content set workbooks =
'Dear Zoo — 공식 활동지 모음 (Pan Macmillan) | https://www.panmacmillan.com/dear-zoo
Dear Zoo — 활동지 PDF (World Book Day) | https://www.worldbookday.com/wp-content/uploads/2020/12/Dear-Zoo.pdf
Brown Bear — 공식 다운로드 자료 (Eric Carle) | https://eric-carle.com/resources/downloads-and-activities/
Brown Bear — 색칠·활동 템플릿 (DLTK-Teach) | https://www.dltk-teach.com/books/brownbear/
Giraffes Can''t Dance — 활동지 (Hachette Schools) | https://www.hachetteschools.co.uk/resource/giraffes-cant-dance-activity-sheets/
Giraffes Can''t Dance — 워드서치·퍼즐 (RIF.org) | https://www.rif.org/literacy-central/book/giraffe-cant-dance
Moo, Baa, La La La! — 우리 워크북 (색칠·소리잇기·따라쓰기) | worksheets/moo-baa-la-la-la.html
The Crocodile Who Didn''t Like Water — 우리 워크북 (색칠·순서·감정·따라쓰기) | worksheets/the-crocodile-who-didnt-like-water.html'
where theme_key = 'animals';
