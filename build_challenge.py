# -*- coding: utf-8 -*-
"""파닉스 전 120권 챌린지 (24주제 × 5유형) + 국내 베스트30 통합 + 표지/인기/대출/수상 -> challenge.json
   5유형: 1 조작북 / 2 라임 / 3 반복 / 4 유머·반전 / 5 스토리"""
import os, json, time, re, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "output", "challenge.json")
UA = "ChoiEnglishLibrary/1.0 (curation; contact jabbaek@gmail.com)"
DELAY = 0.25
TIER_LABELS = {1: "조작북", 2: "라임", 3: "반복", 4: "유머·반전", 5: "스토리"}

# (emoji, en, ko, [(type, title, author, reason)×5])
CURRICULUM = [
("🐻","Animals","동물",[
 (1,"Dear Zoo","Rod Campbell","플랩을 열면 동물원이 보낸 동물이 나오는 국민 플랩북"),
 (2,"Giraffes Can't Dance","Giles Andreae","춤 못 추던 기린의 자신감 라임 이야기"),
 (3,"Brown Bear, Brown Bear, What Do You See?","Bill Martin Jr.","색+동물+\"What do you see?\" 반복의 정석"),
 (4,"Moo, Baa, La La La!","Sandra Boynton","동물 소리를 흉내 내다 반전으로 깔깔"),
 (5,"The Crocodile Who Didn't Like Water","Gemma Merino","물을 싫어하던 아기 악어의 반전 성장 이야기"),
]),
("🚗","Vehicles","탈것",[
 (1,"That's Not My Truck","Fiona Watt","트럭 촉감을 만지는 촉감북"),
 (2,"Truck Full of Ducks","Ross Burach","오리 가득 실은 배달 트럭의 라임 소동"),
 (3,"Little Blue Truck","Alice Schertle","\"Beep!\" 소리와 동물이 반복되는 파랑 트럭"),
 (4,"Don't Let the Pigeon Drive the Bus!","Mo Willems","버스 몰고 싶은 비둘기에게 \"No!\" 외치는 참여형 유머"),
 (5,"Goodnight, Goodnight, Construction Site","Sherri Duskey Rinker","공사장 차들이 하루를 마치고 잠드는 이야기"),
]),
("🍎","Food","음식",[
 (1,"Ketchup on Your Cornflakes?","Nick Sharratt","위아래 플랩을 뒤섞어 엉뚱한 조합을 만드는 플랩북"),
 (2,"Jamberry","Bruce Degen","곰과 소년이 베리를 따는 말놀이 라임"),
 (3,"Today Is Monday","Eric Carle","요일마다 음식이 쌓이는 노래 반복"),
 (4,"The Watermelon Seed","Greg Pizzoli","씨를 삼킨 악어의 호들갑 — 웃긴 반전"),
 (5,"I Will Not Ever Never Eat a Tomato","Lauren Child","편식쟁이 롤라를 구슬리는 남매 이야기 (찰리와 롤라)"),
]),
("🌈","Colors","색깔",[
 (1,"Lemons Are Not Red","Laura Vaccaro Seeger","구멍(다이컷)으로 색이 바뀌는 놀이책"),
 (2,"Mary Wore Her Red Dress","Merle Peek","색깔 옷을 노래하는 반복 라임"),
 (3,"Where Is the Green Sheep?","Mem Fox","온갖 양이 나오다 초록 양 찾기 — 색+반복"),
 (4,"The Day the Crayons Quit","Drew Daywalt","크레용들이 파업하며 보낸 편지 — 색+유머 명작"),
 (5,"Pete the Cat: I Love My White Shoes","Eric Litwin","신발 색이 바뀌어도 쿨한 고양이의 노래 이야기"),
]),
("🔢","Numbers","숫자",[
 (1,"600 Black Spots","David A. Carter","누르고 넘기면 검은 점이 변신하는 팝업북"),
 (2,"Ten Fat Sausages","전래동요 (Traditional)","소시지가 하나씩 터지는 카운팅 노래"),
 (3,"Ten Black Dots","Donald Crews","점 개수로 사물을 만드는 반복 카운팅"),
 (4,"Ten Apples Up on Top!","Dr. Seuss","머리에 사과를 쌓는 좌충우돌 라임"),
 (5,"Five Little Monkeys Jumping on the Bed","Eileen Christelow","침대에서 뛰다 다치는 원숭이 이야기"),
]),
("👨‍👩‍👧","Family","가족",[
 (1,"Where Is Baby's Mommy?","Karen Katz","플랩을 열며 엄마를 찾는 플랩북"),
 (2,"Is Your Mama a Llama?","Deborah Guarino","\"너희 엄마는 라마야?\" 추측하는 라임"),
 (3,"Guess How Much I Love You","Sam McBratney","사랑의 크기를 재보는 토끼의 잠자리 이야기"),
 (4,"My Mum","Anthony Browne","엄마가 얼마나 대단한지 과장해 그린 따뜻한 유머"),
 (5,"Peppa Pig: Peppa Goes Swimming","Peppa Pig","전세계 국민 캐릭터 페파의 일상 이야기"),
]),
("🌙","Bedtime","잠자리",[
 (1,"Tuck Me In!","Dean Hacohen","이불(플랩)을 덮어주며 동물을 재우는 플랩북"),
 (2,"The Going to Bed Book","Sandra Boynton","잘 준비 순서를 노래하는 라임"),
 (3,"Goodnight Moon","Margaret Wise Brown","방 안 사물에 \"굿나잇\"을 반복하는 잠자리 고전"),
 (4,"Llama Llama Red Pajama","Anna Dewdney","라마 아기의 잠자리 투정 — 라임"),
 (5,"A Big Mooncake for Little Star","Grace Lin","달을 조금씩 베어 먹는 아기별 이야기"),
]),
("😊","Feelings","감정",[
 (1,"The Color Monster: A Pop-Up Book of Feelings","Anna Llenas","뒤죽박죽 감정을 색으로 정리하는 팝업북"),
 (2,"The Way I Feel","Janan Cain","다양한 감정을 라임으로 소개"),
 (3,"It's Okay to Be Different","Todd Parr","다름을 긍정하는 토드 파의 반복 메시지"),
 (4,"The Bad Seed","Jory John","삐딱한 씨앗의 변화 — 유머로 배우는 감정"),
 (5,"Knuffle Bunny: A Cautionary Tale","Mo Willems","애착 인형을 잃어버린 아기의 대소동"),
]),
("👣","Body","몸",[
 (1,"Where Is Baby's Belly Button?","Karen Katz","플랩으로 신체 부위를 찾는 플랩북"),
 (2,"Here Are My Hands","Bill Martin Jr.","몸의 각 부분을 소개하는 라임"),
 (3,"From Head to Toe","Eric Carle","\"Can you do it?\" 동작을 따라하는 반복"),
 (4,"Belly Button Book","Sandra Boynton","하마들의 배꼽 노래 유머"),
 (5,"Ten Little Fingers and Ten Little Toes","Mem Fox","세계 아기들의 손발가락 이야기"),
]),
("🐛","Bugs","곤충",[
 (1,"The Very Busy Spider","Eric Carle","볼록한 거미줄을 만지며 보는 촉감북"),
 (2,"Superworm","Julia Donaldson","슈퍼 지렁이의 활약 — 라임 서사"),
 (3,"The Very Hungry Caterpillar","Eric Carle","요일·음식이 반복되는 구멍 뚫린 필독서"),
 (4,"The Grouchy Ladybug","Eric Carle","싸움 걸다 망신당하는 심술 무당벌레"),
 (5,"The Very Quiet Cricket","Eric Carle","소리를 못 내던 귀뚜라미 이야기"),
]),
("🦖","Dinosaurs","공룡",[
 (1,"That's Not My Dinosaur","Fiona Watt","공룡 촉감을 만지는 촉감북"),
 (2,"Dinosaur Roar!","Paul Stickland","크다/작다 반대말을 공룡 라임으로"),
 (3,"Dinosaur Dance!","Sandra Boynton","공룡들이 춤추는 리듬 반복"),
 (4,"Dinosaur vs. Bedtime","Bob Shea","뭐든 이기는 공룡, 잠자리엔 질까?"),
 (5,"Tyrannosaurus Drip","Julia Donaldson","초식 공룡 무리에서 자란 티라노 이야기"),
]),
("🌱","Nature","자연·정원",[
 (1,"Tap the Magic Tree","Christie Matheson","두드리고 흔들면 나무가 변하는 참여형"),
 (2,"Stick Man","Julia Donaldson","막대 아빠의 사계절 모험 — 라임 서사"),
 (3,"The Carrot Seed","Ruth Krauss","\"안 나올 거야\" 반복 속 믿음의 씨앗"),
 (4,"The Leaf Thief","Alice Hemming","누가 내 잎을 훔쳤지? 가을을 알아가는 이야기"),
 (5,"The Snail and the Whale","Julia Donaldson","작은 달팽이의 큰 바다 모험 — 라임 서사"),
]),
("🌦️","Weather & Seasons","날씨·계절",[
 (1,"Maisy's Wonderful Weather Book","Lucy Cousins","플랩·바퀴로 날씨를 배우는 메이지 조작북"),
 (2,"Rain!","Linda Ashman","비 오는 날 할아버지와 아이의 라임"),
 (3,"It Looked Like Spilt Milk","Charles G. Shaw","\"가끔 이렇게 보였어\" 반복하는 구름책"),
 (4,"Snowmen at Night","Caralyn Buehner","밤에 노는 눈사람들의 상상 유머"),
 (5,"The Snowy Day","Ezra Jack Keats","눈 오는 날의 잔잔한 하루"),
]),
("🐶","Pets","반려동물",[
 (1,"Where's Spot?","Eric Hill","플랩으로 강아지 스팟을 찾는 고전 플랩북"),
 (2,"Hairy Maclary from Donaldson's Dairy","Lynley Dodd","동네 개들이 줄줄이 나오는 라임"),
 (3,"Go, Dog. Go!","P.D. Eastman","쉬운 단어가 반복되는 개들의 소동"),
 (4,"Bark, George","Jules Feiffer","엉뚱한 소리를 내는 강아지의 반전 유머"),
 (5,"Hot Dog","Doug Salati","무더위를 피해 바닷가로 간 강아지 — 칼데콧 메달"),
]),
("🚜","Farm","농장",[
 (1,"That's Not My Tractor","Fiona Watt","트랙터 촉감을 만지는 촉감북"),
 (2,"Barnyard Dance","Sandra Boynton","농장 동물들의 흥나는 춤 라임"),
 (3,"Mrs. Wishy-Washy","Joy Cowley","동물을 씻기는 아주머니의 반복 소동"),
 (4,"Click, Clack, Moo: Cows That Type","Doreen Cronin","타자기로 요구하는 소들의 유머"),
 (5,"The Little Red Hen","Paul Galdone","\"누가 도와줄래?\" 부지런한 암탉 이야기"),
]),
("🌊","Ocean","바다",[
 (1,"Shark in the Park","Nick Sharratt","망원경 구멍으로 공원을 보는 참여형 라임"),
 (2,"The Pout-Pout Fish","Deborah Diesen","시무룩 물고기의 반전 — 라임"),
 (3,"Hooray for Fish!","Lucy Cousins","온갖 물고기가 이어지는 반복"),
 (4,"This Is Not My Hat","Jon Klassen","모자를 훔친 물고기의 그림 반전"),
 (5,"Swimmy","Leo Lionni","함께의 힘을 배우는 물고기 — 칼데콧 아너"),
]),
("👻","Monsters","괴물",[
 (1,"Go Away, Big Green Monster!","Ed Emberley","페이지를 넘기며 괴물을 없애는 다이컷 참여북"),
 (2,"The Gruffalo","Julia Donaldson","없는 괴물을 지어내다 진짜 만나는 라임 서사"),
 (3,"If You're a Monster and You Know It","Rebecca Emberley","\"행복하면~\"의 괴물 버전 반복 노래"),
 (4,"The Monster at the End of This Book","Jon Stone","넘기지 말라는 그로버의 참여형 유머"),
 (5,"Where the Wild Things Are","Maurice Sendak","괴물 나라로 떠나는 상상 이야기"),
]),
("🎃","Halloween","할로윈",[
 (1,"Where Is Baby's Pumpkin?","Karen Katz","플랩으로 할로윈 물건을 찾는 플랩북"),
 (2,"Room on the Broom","Julia Donaldson","마녀 빗자루에 동물이 타는 라임 이야기"),
 (3,"The Little Old Lady Who Was Not Afraid of Anything","Linda Williams","쫓아오는 물건들의 누적 반복"),
 (4,"Creepy Carrots!","Aaron Reynolds","당근이 쫓아온다?! 오싹+반전 유머"),
 (5,"Skeleton Hiccups","Margery Cuyler","딸꾹질 멈추려는 해골의 우스운 소동"),
]),
("🎄","Christmas","크리스마스",[
 (1,"Dear Santa","Rod Campbell","플랩으로 산타의 선물을 여는 플랩북"),
 (2,"The Night Before Christmas","Clement C. Moore","크리스마스 전날 밤의 고전 시"),
 (3,"The Twelve Days of Christmas","전래 캐럴 (Traditional)","선물이 하나씩 쌓이는 누적 캐럴"),
 (4,"How the Grinch Stole Christmas!","Dr. Seuss","크리스마스를 훔치려던 그린치"),
 (5,"The Polar Express","Chris Van Allsburg","북극행 기차를 탄 소년 이야기"),
]),
("🎶","Songs & Rhymes","노래·마더구스",[
 (1,"The Wheels on the Bus","Annie Kubler","손유희로 함께 부르는 참여형 노래책"),
 (2,"Walking Through the Jungle","Debbie Harter","정글을 걸으며 동물을 만나는 노래·챈트"),
 (3,"Polar Bear, Polar Bear, What Do You Hear?","Bill Martin Jr.","동물 소리가 이어지는 브라운베어 후속 챈트"),
 (4,"There's a Wocket in My Pocket!","Dr. Seuss","엉터리 라임 단어의 말놀이 유머"),
 (5,"Over in the Meadow","Ezra Jack Keats","자연 속 동물 가족을 세는 노래 이야기"),
]),
("🏫","School & Friends","학교·친구",[
 (1,"Spot Goes to School","Eric Hill","플랩으로 학교 하루를 여는 스팟 플랩북"),
 (2,"Llama Llama Misses Mama","Anna Dewdney","첫 등원의 불안을 달래는 라임"),
 (3,"Do You Want to Be My Friend?","Eric Carle","\"내 친구 될래?\"를 반복하는 우정책"),
 (4,"We Don't Eat Our Classmates","Ryan T. Higgins","친구를 먹으면 안 돼! 공룡의 유머"),
 (5,"Chrysanthemum","Kevin Henkes","이름 때문에 속상한 생쥐 — 자존감 이야기"),
]),
("🛁","Daily Routine","생활습관",[
 (1,"Brush Your Teeth, Please","Leslie McGuire","팝업으로 양치를 배우는 생활습관 조작북"),
 (2,"Pajama Time!","Sandra Boynton","잘 준비를 노래하는 라임"),
 (3,"The Napping House","Audrey Wood","잠든 식구가 쌓이는 누적 반복"),
 (4,"No, David!","David Shannon","말썽꾸러기 데이빗의 \"안 돼!\" 유머"),
 (5,"Bathtime for Biscuit","Alyssa Satin Capucilli","목욕 시간 강아지 비스킷 이야기"),
]),
("🔀","Opposites & Concepts","반대말·개념",[
 (1,"Press Here","Hervé Tullet","점을 누르면 변하는 마법 같은 참여형"),
 (2,"Round Is a Mooncake","Roseanne Thong","일상 속 도형을 찾는 라임"),
 (3,"Opposites","Sandra Boynton","반대말을 반복으로 익히는 보드북"),
 (4,"I Want My Hat Back","Jon Klassen","모자를 찾는 곰의 시치미 유머 — 가이젤 아너"),
 (5,"They All Saw a Cat","Brendan Wenzel","같은 고양이를 저마다 다르게 보는 시선 — 칼데콧 아너"),
]),
("🎨","Imagination","상상·놀이",[
 (1,"Don't Push the Button!","Bill Cotter","누르지 말라는 버튼을 누르면?! 참여형"),
 (2,"If I Built a House","Chris Van Dusen","상상의 집을 짓는 라임"),
 (3,"Not a Box","Antoinette Portis","\"상자 아니야!\" 반복하며 상상하기"),
 (4,"Sam & Dave Dig a Hole","Mac Barnett","구멍 파기와 그림의 기막힌 반전"),
 (5,"Harold and the Purple Crayon","Crockett Johnson","크레용으로 세상을 그리는 상상 이야기"),
]),
]

# 국내 베스트셀러(통합순위)로 포함된 30권
KR_TITLES = [
"Dear Zoo","Brown Bear, Brown Bear, What Do You See?","The Crocodile Who Didn't Like Water",
"Truck Full of Ducks","Don't Let the Pigeon Drive the Bus!","Ketchup on Your Cornflakes?",
"Today Is Monday","The Watermelon Seed","I Will Not Ever Never Eat a Tomato",
"Pete the Cat: I Love My White Shoes","600 Black Spots","My Mum","Peppa Pig: Peppa Goes Swimming",
"A Big Mooncake for Little Star","The Color Monster: A Pop-Up Book of Feelings","Knuffle Bunny: A Cautionary Tale",
"From Head to Toe","The Grouchy Ladybug","Maisy's Wonderful Weather Book","Shark in the Park",
"This Is Not My Hat","Go Away, Big Green Monster!","Where the Wild Things Are","Creepy Carrots!",
"Skeleton Hiccups","Polar Bear, Polar Bear, What Do You Hear?","No, David!","Press Here",
"Sam & Dave Dig a Hole","Don't Push the Button!","Maisy's Wonderful Weather Book",
]

def norm(t):
    t=t.lower(); t=re.split(r"[:(]",t)[0]; t=t.replace("&","and").replace("'","")
    return re.sub(r"[^a-z0-9]+"," ",t).strip()
# 국내인기 판정 = 국내 서점 통합순위 100 전체 기준
try:
    from data_domestic import DOMESTIC_ALL
    KR_SET = {norm(d[2]) for d in DOMESTIC_ALL} | {norm(t) for t in KR_TITLES}
except Exception:
    KR_SET = {norm(t) for t in KR_TITLES}

# 수상
MEDAL={'where the wild things are':1964,'make way for ducklings':1942,'the snowy day':1963,
'kittens first full moon':2005,'the polar express':1986,'a sick day for amos mcgee':2011,
'the adventures of beekle':2015,'flotsam':2007,'this is not my hat':2013}
HONOR={'madeline':1940,'blueberries for sal':1949,'swimmy':1964,'strega nona':1976,
'freight train':1979,'olivia':2001,'dont let the pigeon drive the bus':2004,'knuffle bunny':2005,
'creepy carrots':2013,'extra yarn':2013,'journey':2014,'sam and dave dig a hole':2015,
'last stop on market street':2016,'click clack moo':2001,'no david':1999,
'when sophie gets angry really really angry':2000,'a big mooncake for little star':2019,
'they all saw a cat':2017}
MEDAL['hot dog']=2023
NEWBERY={'last stop on market street':2016}
GEISEL={'the watermelon seed':2014,'i want my hat back':2012}
def award(title):
    n=norm(title); parts=[]
    if n in NEWBERY: parts.append('🎖️ 뉴베리 메달 '+str(NEWBERY[n]))
    if n in GEISEL: parts.append('🎖️ 가이젤상 '+str(GEISEL[n]))
    if n in MEDAL: parts.append('🥇 칼데콧 메달 '+str(MEDAL[n]))
    if n in HONOR: parts.append('🏅 칼데콧 아너 '+str(HONOR[n]))
    return ' · '.join(parts)

# 세계인기(새 통합순위) + 도서관 대출(gr_master)
try:
    from data_global import GLOBAL_100
    WORLD_SET_C={norm(t) for _,t,_ in GLOBAL_100}
except Exception:
    WORLD_SET_C=set()
try:
    _gm=json.load(open(os.path.join(HERE,"output","gr_master.json"),encoding="utf-8"))["books"]
    LIB={norm(b["title"]):b.get("lib_loans",0) for b in _gm}
except Exception:
    LIB={}

def _search(params):
    q=urllib.parse.urlencode(params)
    req=urllib.request.Request(f"https://openlibrary.org/search.json?{q}",headers={"User-Agent":UA})
    with urllib.request.urlopen(req,timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))
def ol(title, author):
    main=title.split(":")[0].strip()
    tries=[{"title":title,"author":author.split("(")[0].split(",")[0],"limit":1,"fields":"isbn,cover_i,first_publish_year"},
           {"title":title,"limit":1,"fields":"isbn,cover_i,first_publish_year"}]
    if main!=title:
        tries.append({"title":main,"author":author.split("(")[0].split(",")[0],"limit":1,"fields":"isbn,cover_i,first_publish_year"})
        tries.append({"title":main,"limit":1,"fields":"isbn,cover_i,first_publish_year"})
    for params in tries:
        try: doc=(_search(params).get("docs") or [{}])[0]
        except Exception: doc={}
        if doc.get("cover_i"): return f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg",(doc.get('isbn') or [''])[0],doc.get("first_publish_year","")
        if doc.get("isbn"): return f"https://covers.openlibrary.org/b/isbn/{doc['isbn'][0]}-L.jpg",doc['isbn'][0],doc.get("first_publish_year","")
        time.sleep(DELAY)
    return None,"",""

themes,misses,gid=[],[],0
for emoji,en,ko,books in CURRICULUM:
    tb=[]
    for tier,title,author,reason in books:
        gid+=1
        cover,isbn,year=ol(title,author)
        if not cover: misses.append(f"{ko}/{title}")
        n=norm(title)
        tb.append({"gid":gid,"tier":tier,"tier_label":TIER_LABELS[tier],"title":title,"author":author,
                   "reason":reason,"cover":cover,"isbn":isbn,"year":year,"id":"c"+str(gid),
                   "pop_rank":(1 if n in WORLD_SET_C else 0),"lib_loans":LIB.get(n,0),"award":award(title),
                   "kr_popular":(n in KR_SET)})
        time.sleep(DELAY)
    themes.append({"emoji":emoji,"en":en,"ko":ko,"key":re.sub(r"[^a-z0-9]+","-",en.lower()).strip("-"),"books":tb})
    print(f"  {emoji} {ko} — 표지 {sum(1 for b in tb if b['cover'])}/5 · 국내인기 {sum(1 for b in tb if b['kr_popular'])}")

json.dump({"themes":themes,"tier_labels":TIER_LABELS,"total":gid},open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
kr=sum(1 for t in themes for b in t['books'] if b['kr_popular'])
print(f"\n총 {gid}권 · 국내인기 {kr}권 · 표지미확보 {len(misses)}권")
for m in misses: print("  -",m)
