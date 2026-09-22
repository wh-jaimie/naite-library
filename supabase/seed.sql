-- 조이네 엄마표영어 스터디 — 시드 데이터 (24주제 × 120권)
-- schema.sql 실행 후 이 파일을 SQL Editor 에 붙여넣어 실행하세요.

insert into public.themes(key,emoji,en,ko,sort) values ('animals','🐻','Animals','동물',0) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('animals') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('animals',1,'조작북','Dear Zoo','Rod Campbell','https://covers.openlibrary.org/b/id/10577107-L.jpg','플랩을 열면 동물원이 보낸 동물이 나오는 국민 플랩북',6,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('animals',2,'라임','Giraffes Can''t Dance','Giles Andreae','https://covers.openlibrary.org/b/id/276948-L.jpg','춤 못 추던 기린의 자신감 라임 이야기',74,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('animals',3,'반복','Brown Bear, Brown Bear, What Do You See?','Bill Martin Jr.','https://covers.openlibrary.org/b/id/12624136-L.jpg','색+동물+"What do you see?" 반복의 정석',3,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('animals',4,'유머·반전','Moo, Baa, La La La!','Sandra Boynton','https://covers.openlibrary.org/b/id/437901-L.jpg','동물 소리를 흉내 내다 반전으로 깔깔',5,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('animals',5,'스토리','The Mixed-Up Chameleon','Eric Carle','https://covers.openlibrary.org/b/id/3153851-L.jpg','이것저것 되고 싶던 카멜레온 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('vehicles','🚗','Vehicles','탈것',1) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('vehicles') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('vehicles',1,'조작북','That''s Not My Truck','Fiona Watt','https://covers.openlibrary.org/b/id/2582595-L.jpg','촉감을 만지며 "내 트럭이 아니야" 반복하는 촉감북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('vehicles',2,'라임','Sheep in a Jeep','Nancy Shaw','https://covers.openlibrary.org/b/id/255747-L.jpg','지프 탄 양떼의 좌충우돌 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('vehicles',3,'반복','Little Blue Truck','Alice Schertle','https://covers.openlibrary.org/b/id/2325432-L.jpg','"Beep!" 소리와 동물이 반복되는 파랑 트럭',11,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('vehicles',4,'유머·반전','Don''t Let the Pigeon Drive the Bus!','Mo Willems','https://covers.openlibrary.org/b/id/544664-L.jpg','버스 몰고 싶은 비둘기에게 "No!" 외치는 참여형 유머',12,96,'🏅 칼데콧 아너 2004',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('vehicles',5,'스토리','Goodnight, Goodnight, Construction Site','Sherri Duskey Rinker','https://covers.openlibrary.org/b/id/7351895-L.jpg','공사장 차들이 하루를 마치고 잠드는 이야기',48,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('food','🍎','Food','음식',2) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('food') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('food',1,'조작북','The Very Hungry Caterpillar','Eric Carle','https://covers.openlibrary.org/b/id/7835968-L.jpg','구멍 뚫린 페이지를 만지며 먹이를 따라가는 책',1,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('food',2,'라임','Jamberry','Bruce Degen','https://covers.openlibrary.org/b/id/445220-L.jpg','곰과 소년이 베리를 따는 말놀이 라임',35,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('food',3,'반복','Today Is Monday','Eric Carle','https://covers.openlibrary.org/b/id/259485-L.jpg','요일마다 음식이 쌓이는 노래 반복',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('food',4,'유머·반전','Dragons Love Tacos','Adam Rubin','https://covers.openlibrary.org/b/id/8085856-L.jpg','타코 좋아하는 용이 매운 살사에 대참사',83,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('food',5,'스토리','Cloudy with a Chance of Meatballs','Judi Barrett','https://covers.openlibrary.org/b/id/6475217-L.jpg','하늘에서 음식이 내리는 마을 이야기',67,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('colors','🌈','Colors','색깔',3) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('colors') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('colors',1,'조작북','Lemons Are Not Red','Laura Vaccaro Seeger','https://covers.openlibrary.org/b/id/9347233-L.jpg','구멍(다이컷)으로 색이 바뀌는 놀이책',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('colors',2,'라임','Mary Wore Her Red Dress','Merle Peek','https://covers.openlibrary.org/b/id/5019277-L.jpg','색깔 옷을 노래하는 반복 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('colors',3,'반복','I Went Walking','Sue Williams','https://covers.openlibrary.org/b/id/112796-L.jpg','"What did you see?"로 색깔 동물이 이어지는 반복',62,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('colors',4,'유머·반전','Blue Hat, Green Hat','Sandra Boynton','https://covers.openlibrary.org/b/id/438047-L.jpg','옷을 엉뚱하게 입는 칠면조의 "Oops!"',30,61,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('colors',5,'스토리','A Color of His Own','Leo Lionni','https://covers.openlibrary.org/b/id/7395995-L.jpg','자기 색을 찾고 싶은 카멜레온 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('numbers','🔢','Numbers','숫자',4) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('numbers') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('numbers',1,'조작북','Ten Little Ladybugs','Melanie Gerth','https://covers.openlibrary.org/b/id/841692-L.jpg','볼록한 무당벌레를 만지며 거꾸로 세는 촉감북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('numbers',2,'라임','Five Little Ducks','Raffi','https://covers.openlibrary.org/b/id/6974006-L.jpg','새끼 오리가 하나씩 사라지는 노래 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('numbers',3,'반복','Ten Black Dots','Donald Crews','https://covers.openlibrary.org/b/id/6637747-L.jpg','점 개수로 사물을 만드는 반복 카운팅',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('numbers',4,'유머·반전','Ten Apples Up on Top!','Dr. Seuss','https://covers.openlibrary.org/b/id/423601-L.jpg','머리에 사과를 쌓는 좌충우돌 라임',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('numbers',5,'스토리','Five Little Monkeys Jumping on the Bed','Eileen Christelow','https://covers.openlibrary.org/b/id/5547929-L.jpg','침대에서 뛰다 다치는 원숭이 이야기',94,67,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('family','👨‍👩‍👧','Family','가족',5) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('family') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('family',1,'조작북','Where Is Baby''s Mommy?','Karen Katz','https://covers.openlibrary.org/b/id/435920-L.jpg','플랩을 열며 엄마를 찾는 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('family',2,'라임','Is Your Mama a Llama?','Deborah Guarino','https://covers.openlibrary.org/b/id/383707-L.jpg','"너희 엄마는 라마야?" 추측하는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('family',3,'반복','Are You My Mother?','P.D. Eastman','https://covers.openlibrary.org/b/id/254626-L.jpg','아기 새가 "우리 엄마야?" 반복하며 찾기',38,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('family',4,'유머·반전','My Mum','Anthony Browne','https://covers.openlibrary.org/b/id/243308-L.jpg','엄마가 얼마나 대단한지 과장해 그린 따뜻한 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('family',5,'스토리','Guess How Much I Love You','Sam McBratney','https://covers.openlibrary.org/b/id/13282906-L.jpg','사랑의 크기를 재보는 토끼 이야기',7,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('bedtime','🌙','Bedtime','잠자리',6) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('bedtime') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bedtime',1,'조작북','Tuck Me In!','Dean Hacohen','https://covers.openlibrary.org/b/id/10817286-L.jpg','이불(플랩)을 덮어주며 동물을 재우는 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bedtime',2,'라임','The Going to Bed Book','Sandra Boynton','https://covers.openlibrary.org/b/id/438326-L.jpg','잘 준비 순서를 노래하는 라임',9,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bedtime',3,'반복','Goodnight Moon','Margaret Wise Brown','https://covers.openlibrary.org/b/id/35556-L.jpg','방 안 사물에 "굿나잇"을 반복하는 잠자리 고전',2,84,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bedtime',4,'유머·반전','How Do Dinosaurs Say Good Night?','Jane Yolen','https://covers.openlibrary.org/b/id/7092593-L.jpg','공룡의 우스운 잠투정',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bedtime',5,'스토리','Time for Bed','Mem Fox','https://covers.openlibrary.org/b/id/114082-L.jpg','동물 엄마가 아기를 재우는 잔잔한 이야기',23,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('feelings','😊','Feelings','감정',7) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('feelings') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('feelings',1,'조작북','Glad Monster, Sad Monster','Ed Emberley','https://covers.openlibrary.org/b/id/189297-L.jpg','감정 가면을 써보는 참여형 책',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('feelings',2,'라임','The Way I Feel','Janan Cain','https://covers.openlibrary.org/b/id/6815337-L.jpg','다양한 감정을 라임으로 소개',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('feelings',3,'반복','The Feelings Book','Todd Parr','https://covers.openlibrary.org/b/id/2379677-L.jpg','"가끔 나는…" 반복으로 감정 어휘',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('feelings',4,'유머·반전','The Pigeon Has Feelings, Too!','Mo Willems','https://covers.openlibrary.org/b/id/544896-L.jpg','비둘기의 널뛰는 감정을 웃기게',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('feelings',5,'스토리','The Color Monster','Anna Llenas','https://covers.openlibrary.org/b/isbn/9780316574525-L.jpg','뒤죽박죽 감정을 색으로 정리하는 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('body','👣','Body','몸',8) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('body') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('body',1,'조작북','Where Is Baby''s Belly Button?','Karen Katz','https://covers.openlibrary.org/b/id/12954864-L.jpg','플랩으로 신체 부위를 찾는 플랩북',42,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('body',2,'라임','Here Are My Hands','Bill Martin Jr.','https://covers.openlibrary.org/b/id/580246-L.jpg','몸의 각 부분을 소개하는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('body',3,'반복','From Head to Toe','Eric Carle','https://covers.openlibrary.org/b/id/10672062-L.jpg','"Can you do it?" 동작을 따라하는 반복',16,135,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('body',4,'유머·반전','Belly Button Book','Sandra Boynton','https://covers.openlibrary.org/b/id/6815719-L.jpg','하마들의 배꼽 노래 유머',31,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('body',5,'스토리','Ten Little Fingers and Ten Little Toes','Mem Fox','https://covers.openlibrary.org/b/id/10978432-L.jpg','세계 아기들의 손발가락 이야기',20,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('bugs','🐛','Bugs','곤충',9) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('bugs') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bugs',1,'조작북','The Very Busy Spider','Eric Carle','https://covers.openlibrary.org/b/id/1199659-L.jpg','볼록한 거미줄을 만지며 보는 촉감북',46,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bugs',2,'라임','Some Bugs','Angela DiTerlizzi','https://covers.openlibrary.org/b/id/11322377-L.jpg','뒷마당 곤충들을 소개하는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bugs',3,'반복','There Was an Old Lady Who Swallowed a Fly','Pam Adams','https://covers.openlibrary.org/b/id/651393-L.jpg','파리를 삼킨 할머니의 누적 반복',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bugs',4,'유머·반전','The Grouchy Ladybug','Eric Carle','https://covers.openlibrary.org/b/id/51010-L.jpg','싸움 걸다 망신당하는 심술 무당벌레',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('bugs',5,'스토리','The Very Quiet Cricket','Eric Carle','https://covers.openlibrary.org/b/id/259476-L.jpg','소리를 못 내던 귀뚜라미 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('dinosaurs','🦖','Dinosaurs','공룡',10) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('dinosaurs') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('dinosaurs',1,'조작북','That''s Not My Dinosaur','Fiona Watt','https://covers.openlibrary.org/b/id/560373-L.jpg','공룡 촉감을 만지는 촉감북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('dinosaurs',2,'라임','Dinosaur Roar!','Paul Stickland','https://covers.openlibrary.org/b/id/360902-L.jpg','크다/작다 반대말을 공룡 라임으로',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('dinosaurs',3,'반복','Dinosaur Dance!','Sandra Boynton','https://covers.openlibrary.org/b/id/7442591-L.jpg','공룡들이 춤추는 리듬 반복',71,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('dinosaurs',4,'유머·반전','Dinosaur vs. Bedtime','Bob Shea','https://covers.openlibrary.org/b/id/5723134-L.jpg','뭐든 이기는 공룡, 잠자리엔 질까?',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('dinosaurs',5,'스토리','Tyrannosaurus Drip','Julia Donaldson','https://covers.openlibrary.org/b/id/13257873-L.jpg','초식 공룡 무리에서 자란 티라노 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('nature','🌱','Nature','자연·정원',11) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('nature') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('nature',1,'조작북','Tap the Magic Tree','Christie Matheson','https://covers.openlibrary.org/b/id/7848721-L.jpg','두드리고 흔들면 나무가 변하는 참여형',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('nature',2,'라임','Flower Garden','Eve Bunting','https://covers.openlibrary.org/b/id/10219853-L.jpg','창가 화분을 가꾸는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('nature',3,'반복','The Carrot Seed','Ruth Krauss','https://covers.openlibrary.org/b/id/10935277-L.jpg','"안 나올 거야" 반복 속 믿음의 씨앗',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('nature',4,'유머·반전','Jasper''s Beanstalk','Nick Butterworth','https://covers.openlibrary.org/b/id/8364400-L.jpg','성급한 고양이의 콩 심기 소동',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('nature',5,'스토리','The Tiny Seed','Eric Carle','https://covers.openlibrary.org/b/id/3267631-L.jpg','작은 씨앗의 사계절 여행',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('weather-seasons','🌦️','Weather & Seasons','날씨·계절',12) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('weather-seasons') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('weather-seasons',1,'조작북','Maisy''s Wonderful Weather Book','Lucy Cousins','https://covers.openlibrary.org/b/id/516665-L.jpg','플랩·바퀴로 날씨를 배우는 메이지 조작북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('weather-seasons',2,'라임','Rain!','Linda Ashman','https://covers.openlibrary.org/b/id/10351371-L.jpg','비 오는 날 할아버지와 아이의 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('weather-seasons',3,'반복','It Looked Like Spilt Milk','Charles G. Shaw','https://covers.openlibrary.org/b/id/50834-L.jpg','"가끔 이렇게 보였어" 반복하는 구름책',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('weather-seasons',4,'유머·반전','Snowmen at Night','Caralyn Buehner','https://covers.openlibrary.org/b/id/575397-L.jpg','밤에 노는 눈사람들의 상상 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('weather-seasons',5,'스토리','The Snowy Day','Ezra Jack Keats','https://covers.openlibrary.org/b/id/10134995-L.jpg','눈 오는 날의 잔잔한 하루',19,0,'🥇 칼데콧 메달 1963',4);

insert into public.themes(key,emoji,en,ko,sort) values ('pets','🐶','Pets','반려동물',13) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('pets') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('pets',1,'조작북','Where''s Spot?','Eric Hill','https://covers.openlibrary.org/b/id/1199330-L.jpg','플랩으로 강아지 스팟을 찾는 고전 플랩북',44,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('pets',2,'라임','Hairy Maclary from Donaldson''s Dairy','Lynley Dodd','https://covers.openlibrary.org/b/id/6815361-L.jpg','동네 개들이 줄줄이 나오는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('pets',3,'반복','Go, Dog. Go!','P.D. Eastman','https://covers.openlibrary.org/b/id/2078976-L.jpg','쉬운 단어가 반복되는 개들의 소동',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('pets',4,'유머·반전','Bark, George','Jules Feiffer','https://covers.openlibrary.org/b/id/48152-L.jpg','엉뚱한 소리를 내는 강아지의 반전 유머',36,80,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('pets',5,'스토리','Harry the Dirty Dog','Gene Zion','https://covers.openlibrary.org/b/id/24282-L.jpg','목욕 싫어 도망친 강아지 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('farm','🚜','Farm','농장',14) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('farm') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('farm',1,'조작북','That''s Not My Tractor','Fiona Watt','https://covers.openlibrary.org/b/id/1389424-L.jpg','트랙터 촉감을 만지는 촉감북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('farm',2,'라임','Barnyard Dance','Sandra Boynton','https://covers.openlibrary.org/b/id/796359-L.jpg','농장 동물들의 흥나는 춤 라임',10,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('farm',3,'반복','Mrs. Wishy-Washy','Joy Cowley','https://covers.openlibrary.org/b/id/259809-L.jpg','동물을 씻기는 아주머니의 반복 소동',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('farm',4,'유머·반전','Click, Clack, Moo: Cows That Type','Doreen Cronin','https://covers.openlibrary.org/b/id/5725264-L.jpg','타자기로 요구하는 소들의 유머',58,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('farm',5,'스토리','The Little Red Hen','Paul Galdone','https://covers.openlibrary.org/b/id/699933-L.jpg','"누가 도와줄래?" 부지런한 암탉 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('ocean','🌊','Ocean','바다',15) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('ocean') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('ocean',1,'조작북','Never Touch a Shark!','Rosie Greening','https://covers.openlibrary.org/b/id/10847067-L.jpg','말랑한 상어를 만지는 촉감 노벨티북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('ocean',2,'라임','Commotion in the Ocean','Giles Andreae','https://covers.openlibrary.org/b/id/857691-L.jpg','바다 동물들을 소개하는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('ocean',3,'반복','Hooray for Fish!','Lucy Cousins','https://covers.openlibrary.org/b/id/516528-L.jpg','온갖 물고기가 이어지는 반복',32,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('ocean',4,'유머·반전','I''m the Biggest Thing in the Ocean!','Kevin Sherry','https://covers.openlibrary.org/b/id/575612-L.jpg','허세 부리는 오징어의 반전 유머',52,64,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('ocean',5,'스토리','The Rainbow Fish','Marcus Pfister','https://covers.openlibrary.org/b/id/12961695-L.jpg','반짝 비늘을 나누는 물고기 이야기',63,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('monsters','👻','Monsters','괴물',16) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('monsters') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('monsters',1,'조작북','Go Away, Big Green Monster!','Ed Emberley','https://covers.openlibrary.org/b/id/188727-L.jpg','페이지를 넘기며 괴물을 없애는 다이컷 참여북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('monsters',2,'라임','The Gruffalo','Julia Donaldson','https://covers.openlibrary.org/b/id/8561698-L.jpg','없는 괴물을 지어내다 진짜 만나는 라임 서사',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('monsters',3,'반복','If You''re a Monster and You Know It','Rebecca Emberley','https://covers.openlibrary.org/b/id/6462700-L.jpg','"행복하면~"의 괴물 버전 반복 노래',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('monsters',4,'유머·반전','The Monster at the End of This Book','Jon Stone','https://covers.openlibrary.org/b/id/8580217-L.jpg','넘기지 말라는 그로버의 참여형 유머',84,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('monsters',5,'스토리','Where the Wild Things Are','Maurice Sendak','https://covers.openlibrary.org/b/id/50842-L.jpg','괴물 나라로 떠나는 상상 이야기',14,0,'🥇 칼데콧 메달 1964',4);

insert into public.themes(key,emoji,en,ko,sort) values ('halloween','🎃','Halloween','할로윈',17) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('halloween') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('halloween',1,'조작북','Where Is Baby''s Pumpkin?','Karen Katz','https://covers.openlibrary.org/b/id/760982-L.jpg','플랩으로 할로윈 물건을 찾는 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('halloween',2,'라임','Five Little Pumpkins','전래동요 (Traditional)','https://covers.openlibrary.org/b/id/799125-L.jpg','호박 다섯 개의 전래 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('halloween',3,'반복','The Little Old Lady Who Was Not Afraid of Anything','Linda Williams','https://covers.openlibrary.org/b/id/445200-L.jpg','쫓아오는 물건들의 누적 반복',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('halloween',4,'유머·반전','Creepy Carrots!','Aaron Reynolds','https://covers.openlibrary.org/b/id/7256095-L.jpg','당근이 쫓아온다?! 오싹+반전 유머',0,0,'🏅 칼데콧 아너 2013',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('halloween',5,'스토리','Room on the Broom','Julia Donaldson','https://covers.openlibrary.org/b/id/10839950-L.jpg','마녀 빗자루에 동물이 타는 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('christmas','🎄','Christmas','크리스마스',18) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('christmas') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('christmas',1,'조작북','Dear Santa','Rod Campbell','https://covers.openlibrary.org/b/id/438889-L.jpg','플랩으로 산타의 선물을 여는 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('christmas',2,'라임','The Night Before Christmas','Clement C. Moore','https://covers.openlibrary.org/b/id/8236410-L.jpg','크리스마스 전날 밤의 고전 시',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('christmas',3,'반복','The Twelve Days of Christmas','전래 캐럴 (Traditional)','https://covers.openlibrary.org/b/id/260220-L.jpg','선물이 하나씩 쌓이는 누적 캐럴',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('christmas',4,'유머·반전','How the Grinch Stole Christmas!','Dr. Seuss','https://covers.openlibrary.org/b/id/12055-L.jpg','크리스마스를 훔치려던 그린치',55,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('christmas',5,'스토리','The Polar Express','Chris Van Allsburg','https://covers.openlibrary.org/b/id/394670-L.jpg','북극행 기차를 탄 소년 이야기',49,0,'🥇 칼데콧 메달 1986',4);

insert into public.themes(key,emoji,en,ko,sort) values ('songs-rhymes','🎶','Songs & Rhymes','노래·마더구스',19) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('songs-rhymes') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('songs-rhymes',1,'조작북','The Wheels on the Bus','Annie Kubler','https://covers.openlibrary.org/b/id/9662881-L.jpg','손유희로 함께 부르는 참여형 노래책',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('songs-rhymes',2,'라임','Down by the Bay','Raffi','https://covers.openlibrary.org/b/id/323280-L.jpg','말장난이 이어지는 라임 노래',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('songs-rhymes',3,'반복','If You''re Happy and You Know It','Jane Cabrera','https://covers.openlibrary.org/b/id/625653-L.jpg','동작을 따라하는 반복 노래',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('songs-rhymes',4,'유머·반전','There''s a Wocket in My Pocket!','Dr. Seuss','https://covers.openlibrary.org/b/id/255219-L.jpg','엉터리 라임 단어의 말놀이 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('songs-rhymes',5,'스토리','Over in the Meadow','Ezra Jack Keats','https://covers.openlibrary.org/b/id/402285-L.jpg','자연 속 동물 가족을 세는 노래 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('school-friends','🏫','School & Friends','학교·친구',20) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('school-friends') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('school-friends',1,'조작북','Spot Goes to School','Eric Hill','https://covers.openlibrary.org/b/id/259959-L.jpg','플랩으로 학교 하루를 여는 스팟 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('school-friends',2,'라임','Llama Llama Misses Mama','Anna Dewdney','https://covers.openlibrary.org/b/id/5547791-L.jpg','첫 등원의 불안을 달래는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('school-friends',3,'반복','Do You Want to Be My Friend?','Eric Carle','https://covers.openlibrary.org/b/id/2243425-L.jpg','"내 친구 될래?"를 반복하는 우정책',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('school-friends',4,'유머·반전','We Don''t Eat Our Classmates','Ryan T. Higgins','https://covers.openlibrary.org/b/id/8610594-L.jpg','친구를 먹으면 안 돼! 공룡의 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('school-friends',5,'스토리','The Kissing Hand','Audrey Penn','https://covers.openlibrary.org/b/id/673400-L.jpg','손바닥 뽀뽀로 등원 불안을 달래는 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('daily-routine','🛁','Daily Routine','생활습관',21) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('daily-routine') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('daily-routine',1,'조작북','P is for Potty!','Naomi Kleinberg','https://covers.openlibrary.org/b/id/8315344-L.jpg','플랩으로 배변을 배우는 세서미 플랩북',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('daily-routine',2,'라임','Pajama Time!','Sandra Boynton','https://covers.openlibrary.org/b/id/507595-L.jpg','잘 준비를 노래하는 라임',53,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('daily-routine',3,'반복','The Napping House','Audrey Wood','https://covers.openlibrary.org/b/id/114437-L.jpg','잠든 식구가 쌓이는 누적 반복',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('daily-routine',4,'유머·반전','No, David!','David Shannon','https://covers.openlibrary.org/b/id/2269809-L.jpg','말썽꾸러기 데이빗의 "안 돼!" 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('daily-routine',5,'스토리','Bathtime for Biscuit','Alyssa Satin Capucilli','https://covers.openlibrary.org/b/id/24574-L.jpg','목욕 시간 강아지 비스킷 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('opposites-concepts','🔀','Opposites & Concepts','반대말·개념',22) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('opposites-concepts') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('opposites-concepts',1,'조작북','Press Here','Hervé Tullet','https://covers.openlibrary.org/b/id/6934884-L.jpg','점을 누르면 변하는 마법 같은 참여형',80,65,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('opposites-concepts',2,'라임','Round Is a Mooncake','Roseanne Thong','https://covers.openlibrary.org/b/id/600331-L.jpg','일상 속 도형을 찾는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('opposites-concepts',3,'반복','Opposites','Sandra Boynton','https://covers.openlibrary.org/b/id/405632-L.jpg','반대말을 반복으로 익히는 보드북',61,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('opposites-concepts',4,'유머·반전','Duck! Rabbit!','Amy Krouse Rosenthal','https://covers.openlibrary.org/b/id/6309990-L.jpg','오리냐 토끼냐 관점 다툼의 유머',0,0,'',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('opposites-concepts',5,'스토리','Mouse Shapes','Ellen Stoll Walsh','https://covers.openlibrary.org/b/id/1120591-L.jpg','도형으로 그림을 만드는 생쥐 이야기',0,0,'',4);

insert into public.themes(key,emoji,en,ko,sort) values ('imagination','🎨','Imagination','상상·놀이',23) on conflict (key) do update set emoji=excluded.emoji,en=excluded.en,ko=excluded.ko,sort=excluded.sort;
insert into public.content(theme_key) values ('imagination') on conflict (theme_key) do nothing;
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('imagination',1,'조작북','Mix It Up!','Hervé Tullet','https://covers.openlibrary.org/b/id/8174029-L.jpg','손으로 색을 섞는 참여형 (Press Here 작가)',0,0,'',0);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('imagination',2,'라임','If I Built a House','Chris Van Dusen','https://covers.openlibrary.org/b/id/10132794-L.jpg','상상의 집을 짓는 라임',0,0,'',1);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('imagination',3,'반복','Not a Box','Antoinette Portis','https://covers.openlibrary.org/b/id/45783-L.jpg','"상자 아니야!" 반복하며 상상하기',0,0,'',2);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('imagination',4,'유머·반전','Sam & Dave Dig a Hole','Mac Barnett','https://covers.openlibrary.org/b/id/7337430-L.jpg','구멍 파기와 그림의 기막힌 반전',102,81,'🏅 칼데콧 아너 2015',3);
insert into public.books(theme_key,tier,tier_label,title,author,cover,reason,pop_rank,lib_loans,award,sort) values ('imagination',5,'스토리','Harold and the Purple Crayon','Crockett Johnson','https://covers.openlibrary.org/b/id/50758-L.jpg','크레용으로 세상을 그리는 상상 이야기',73,0,'',4);

insert into public.settings(id,current_theme) values (1,'animals') on conflict (id) do update set current_theme=excluded.current_theme;