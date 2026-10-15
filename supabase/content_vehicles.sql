-- 2개월차 스터디 콘텐츠: 탈것(vehicles)
-- 현재 5권: Fire Engine(조작북) · Mr Gumpy's Outing(반복) · Nee Naw the Little Fire Engine(라임) ·
--           Don't Let the Pigeon Drive the Bus!(유머) · Goodnight, Goodnight, Construction Site(스토리)
-- (책·유형·표지는 seed/reseed_books.sql 이 관리 — 여기선 콘텐츠 텍스트와 워크지 링크만)
-- 실행 후 관리자에서 🔒 비밀번호 설정 → 발행 → '현재 공개 주제'로 지정하면 회원에게 열립니다.

update public.content set
  month_label = '2026년 11월 · 2개월차',
  subject = '두 번째 달 주제는 탈것이에요. 자동차·트럭·버스·소방차처럼 움직이는 것에 아이들은 본능적으로 끌려요. Beep!, Vroom!, Nee naw! 같은 소리와 반복·라임이 많아 영어 소리에 익숙해지기 딱 좋은 주제예요. 조작북부터 잠자리 이야기까지, 소리 내며 신나게 읽어주세요.',
  read_method = '• Fire Engine — 소방차 모양 보드북이에요. "Nee naw! Nee naw!" 사이렌 소리를 함께 내고, 사다리·호스 같은 부분을 손으로 짚으며 이름을 말해보세요.
• Mr Gumpy''s Outing — 아이들과 동물들이 차례로 배에 태워 달라고 부탁하고, 검피 아저씨가 "Yes, but don''t…" 하고 조건을 거는 패턴이 반복돼요. 부탁하는 말이 동물마다 조금씩 달라서(May I come, please? / Can you make room for me? …) 공손하게 묻는 여러 표현을 자연스럽게 들려줄 수 있어요. 동물마다 목소리를 바꾸고, 배가 뒤집히는 장면은 쌓아 올리듯 점점 빠르게 읽어주세요.
• Nee Naw the Little Fire Engine — 라임이 통통 튀는 꼬마 소방차 이야기예요. "Nee naw, nee naw!"를 신나게, 각 줄 끝의 라임을 살려 노래하듯 읽어주세요.
• Don''t Let the Pigeon Drive the Bus! — 비둘기가 조를 때마다 아이가 "No!"를 외치게 하는 참여형 유머예요. 비둘기를 능청스럽게 연기하면 깔깔 웃어요.
• Goodnight, Goodnight, Construction Site — 잠자리 책이에요. 공사장 차들이 하나씩 잠드는 장면을 낮고 나긋한 목소리로, 마지막엔 속삭이듯 마무리하세요.',
  activities = '집에 있는 장난감 자동차로 "Ready, set, go!" 출발 놀이 하기
색종이·상자로 나만의 소방차·트럭 만들고 색깔·부품을 영어로 말해보기
"Nee naw!"·"Beep beep!" 소리를 흉내 내며 방에서 소방차·버스 놀이
바깥에서 본 탈것(car, bus, truck, fire engine) 세어 보고 숫자로 말하기
사이렌·경적 소리 흉내 내며 몸으로 표현하기
상자 배에 인형을 하나씩 태우며 "May I come, please?"·"Yes, but don''t kick!" 검피 아저씨 놀이 하기',
  expressions = 'May I come, please? - 저도 가도 될까요? · [검피] 외출 준비할 때 아이가 먼저 묻게 해보세요
Yes, but don''t kick. - 그래, 대신 발로 차면 안 돼. · [검피] kick 자리에 run, shout, jump를 넣어 조건 걸 때
Can you make room for me? - 나 앉을 자리 좀 만들어 줄래? · [검피] 소파·차에서 옆자리 비켜 달라고 할 때
It''s time for tea. - 이제 간식 먹을 시간이야. · [검피] 간식·저녁 시간을 알릴 때
Come for a ride another day. - 다음에 또 타러 와. · [검피] 놀이 끝낼 때 Come and play another day.로 바꿔서
Can you watch things for me until I get back? - 나 올 때까지 좀 봐줄래? · [비둘기] 엄마가 잠깐 자리 비울 때
I tell you what: I''ll just steer. - 그럼 이렇게 하자, 운전대만 잡을게. · [비둘기] I tell you what은 아이와 협상할 때
I never get to do anything! - 나만 맨날 아무것도 못 해! · [비둘기] 아이가 떼쓸 때 엄마가 비둘기 흉내로 웃으며 받아주기
Shh… goodnight, ___… goodnight. - 쉿… 잘 자, ___… 잘 자. · [공사장] 인형·아이 이름을 넣어 재울 때',
  updated_at = now()
where theme_key = 'vehicles';

-- 워크지 링크(공식·무료). 나머지 책은 마땅한 무료 자료가 없어 비워둠.
update public.books set workbook='https://www.rif.org/literacy-central/book/dont-let-pigeon-drive-bus'
  where theme_key='vehicles' and title='Don''t Let the Pigeon Drive the Bus!';
update public.books set workbook='https://www.freehomeschooldeals.com/free-goodnight-goodnight-construction-site-prek-k-printables/'
  where theme_key='vehicles' and title='Goodnight, Goodnight, Construction Site';
