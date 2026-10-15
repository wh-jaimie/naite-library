-- 2개월차 스터디 콘텐츠: 탈것(vehicles)
-- 현재 5권: Fire Engine(조작북) · Mr Gumpy's Outing(반복) · Nee Naw the Little Fire Engine(라임) ·
--           Don't Let the Pigeon Drive the Bus!(유머) · Goodnight, Goodnight, Construction Site(스토리)
-- (책·유형·표지는 seed/reseed_books.sql 이 관리 — 여기선 콘텐츠 텍스트와 워크지 링크만)
-- 실행 후 관리자에서 🔒 비밀번호 설정 → 발행 → '현재 공개 주제'로 지정하면 회원에게 열립니다.

update public.content set
  month_label = '2026년 11월 · 2개월차',
  subject = '두 번째 달 주제는 탈것이에요. 자동차·트럭·버스·소방차처럼 움직이는 것에 아이들은 본능적으로 끌려요. Beep!, Vroom!, Nee naw! 같은 소리와 반복·라임이 많아 영어 소리에 익숙해지기 딱 좋은 주제예요. 조작북부터 잠자리 이야기까지, 소리 내며 신나게 읽어주세요.',
  read_method = '• Fire Engine — 소방차 모양 보드북이에요. "Nee naw! Nee naw!" 사이렌 소리를 함께 내고, 사다리·호스 같은 부분을 손으로 짚으며 이름을 말해보세요.
• Mr Gumpy''s Outing — 검피 아저씨 배에 아이들과 동물들이 하나씩 "Can I come?" 하고 올라타는 누적 반복 이야기예요. 동물마다 목소리를 바꿔 묻고, 아저씨의 "Yes, if you don''t…" 대답은 차분하게 읽어주세요. 두세 번째부터는 아이가 "Can I come?"을 먼저 외치게 해보세요.
• Nee Naw the Little Fire Engine — 라임이 통통 튀는 꼬마 소방차 이야기예요. "Nee naw, nee naw!"를 신나게, 각 줄 끝의 라임을 살려 노래하듯 읽어주세요.
• Don''t Let the Pigeon Drive the Bus! — 비둘기가 조를 때마다 아이가 "No!"를 외치게 하는 참여형 유머예요. 비둘기를 능청스럽게 연기하면 깔깔 웃어요.
• Goodnight, Goodnight, Construction Site — 잠자리 책이에요. 공사장 차들이 하나씩 잠드는 장면을 낮고 나긋한 목소리로, 마지막엔 속삭이듯 마무리하세요.',
  activities = '집에 있는 장난감 자동차로 "Ready, set, go!" 출발 놀이 하기
색종이·상자로 나만의 소방차·트럭 만들고 색깔·부품을 영어로 말해보기
"Nee naw!"·"Beep beep!" 소리를 흉내 내며 방에서 소방차·버스 놀이
바깥에서 본 탈것(car, bus, truck, fire engine) 세어 보고 숫자로 말하기
사이렌·경적 소리 흉내 내며 몸으로 표현하기
상자 배에 인형을 하나씩 태우며 "Can I come?"·"Yes!" 검피 아저씨 놀이 하기',
  expressions = 'Nee naw! Nee naw! - 삐뽀 삐뽀!
Beep! Beep! - 빵빵!
Vroom vroom! - 부릉부릉!
Ready, set, go! - 준비, 시작!
Go! Stop! - 가! 멈춰!
Can I come? - 나도 가도 돼?
No! No! No! - 안 돼, 안 돼!
Time to sleep. - 이제 잘 시간이야.',
  updated_at = now()
where theme_key = 'vehicles';

-- 워크지 링크(공식·무료). 나머지 책은 마땅한 무료 자료가 없어 비워둠.
update public.books set workbook='https://www.rif.org/literacy-central/book/dont-let-pigeon-drive-bus'
  where theme_key='vehicles' and title='Don''t Let the Pigeon Drive the Bus!';
update public.books set workbook='https://www.freehomeschooldeals.com/free-goodnight-goodnight-construction-site-prek-k-printables/'
  where theme_key='vehicles' and title='Goodnight, Goodnight, Construction Site';
