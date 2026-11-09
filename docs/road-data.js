// 나이테가 걸어온 길 데이터: road.html과 관리 화면(쿠팡 링크 입력)이 같이 씀. 카드·대박책 추가는 여기서.
/* 대박책: 드니네 책장 ★5~6 (제목, 표지) */
var BEST=[["Lemons Are Not Red","road/lemons.jpg"],["Nighty Night, Little Green Monster","id/7851767"],["Go Away, Big Green Monster!","id/188727"],["Me! Me! ABC","id/870777"],["Monster, Monster","id/2581425"],["The Great Big Enormous Turnip","road/turnip.jpg"],["Dear Zoo","id/10577107"],["Who Stole the Cookies from the Cookie Jar?","id/444696"],["A Hole in the Bottom of the Sea","id/9412524"],["Up, Up, Up!","id/9412589"],["What Am I?","road/what-am-i.jpg"],["Inside Outside Upside Down","id/423177"],["The Spooky Old Tree","id/1316393"],["Today Is Monday","id/259485"],["No, David!","id/2269809"],["Oh, the Thinks You Can Think!","id/8314464"],["Pancakes, Pancakes!","id/435008"],["Color Zoo","id/258175"],["Noisy Peekaboo! Choo! Choo!","road/choo-choo.jpg"],["Goodnight Moon","id/35556"],["Go Away Mr Wolf!","id/2989360"],["Dry Bones","id/7142489"],["Piggies","id/113498"],["The Little Bear Book","id/10781893"],["Maisy Tidies Up","id/482306"],["In My World","id/114090"],["Underwear!","road/underwear.jpg"],["My Presents","road/my-presents.jpg"],["The Watermelon Seed","id/8468842"],["Hey, Poopie Holders!","road/poopie-holders.jpg"],["Knuffle Bunny","id/544611"],["I Ain't Gonna Paint No More!","id/8441992"],["There Was an Old Lady Who Swallowed a Fly","id/401730"]];
/* 항목 추가·수정은 여기만. story = 블로그 글 주소(있을 때만 표시), picks = 전집 안 대박책 [제목, 한 줄] */
var ROAD=[
 ['2021',[
  {n:'에릭 칼 보드북',c:'isbn/9780241003008',k:'보드북',w:'2021년 6월',d:'처음 읽어 준 영어책이에요. 유튜브 읽어주기 영상으로 발음을 연습해서 직접 읽어 줬어요.'},
  {n:'슈퍼심플송',photo:'road/supersimple.jpg',k:'노래',w:'2021년 6월',d:'쉬운 노래 20곡을 골라 반복해서 들려줬어요.'},
  {n:'노부영 베이비',photo:'road/nobu-baby.jpg',k:'세트',w:'2021년 7월',d:'세이펜 버전. 웰컴베이비를 재울 때마다 틀어 주고, 노래를 필사하며 외웠어요.',picks:[
    ['Goodnight Moon','id/35556','5개월부터 꾸준히 사랑받은 책. 그림마다 위치가 바뀌는 생쥐를 찾으며 읽어요.'],
    ['Lemons Are Not Red','road/lemons.jpg','색깔에 관심 있을 때 자기 전 필수 책이 됐어요.']]},
  {n:'까이유 보드북',c:'id/3158432',k:'보드북',w:'2021년 12월',d:'영어책 100권 읽어주기를 시작하면서 들였어요.'}
 ]],
 ['2022',[
  {n:'스팟 보드북',c:'id/1199330',k:'보드북',w:'2022년 2월',d:'강아지가 나오는 책이에요. 재밌게 읽어 주면 좋아했어요.'},
  {n:'까이유 · 코코멜론 · 블리피',photo:'road/cocomelon.jpg',k:'영상',w:'2022년 4월',d:'까이유를 좋아하다가, 코코멜론, 블리피 순으로 좋아했어요. (영상은 좀 더 늦게 노출하세요...)'},
  {n:'노부영 베스트',photo:'road/nobu-best.jpg',k:'세트',w:'2022년 9월',d:'2024년에는 자기 전에 한 권씩 읽었어요.',picks:[
    ['Me Me ABC','id/870777','그림이 큼직하고 쨍해요. 노래도 틀어 달라고 했어요.'],
    ['The Great Big Enormous Turnip','road/turnip.jpg','영차영차 하면 이 책을 가져왔어요.'],
    ['Go Away Mr Wolf!','id/2989360','좋아했던 책이에요.']]},
  {n:'푸름이 마더구스',photo:'road/purumi-mothergoose.jpg',k:'노래책',w:'2022년 10월',d:'이 무렵부터 잘 보기 시작했어요.'}
 ]],
 ['2023',[
  {n:'로보카 폴리 영어',photo:'road/robocar-poli.jpg',k:'영상',w:'2023년 1월',d:'좋아하는 만화라 영어로도 잘 봤어요. 유튜브에 영상이 많아요.'},
  {n:'Clifford',photo:'road/clifford.jpg',k:'영상',w:'2023년 1월',d:'강아지가 나오는 만화라 좋아했어요.'},
  {n:'노부영 닥터수스',c:'id/145',k:'세트',w:'2023년 6월',d:'라임 천재 닥터수스 책으로 영어의 찐맛을 봤어요. ㅋㅋ'},
  {n:'북메카 영어책 단권 세트',photo:'road/bookmeca-2023-10.jpg',k:'구매',w:'2023년 10월',d:'북메카에서 단권 세트를 잔뜩 샀어요. 북메카는 전국을 돌면서 팝업을 열어요! 저렴하게 구매 가능!'},
  {n:'Knuffle Bunny',photo:'road/knuffle-2023-10.jpg',k:'시리즈',w:'2023년 10월',d:'한글판 꼬므토끼를 좋아했어서 너플버니도 좋아했어요.'},
  {n:'Maisy Story Book',c:'id/482306',k:'시리즈',w:'2023년 11월',d:'메이지 이야기책 시리즈 10권이에요.',buy:'https://www.coupang.com/vp/products/7672212923'},
  {n:'Maisy First Experiences',photo:'road/maisy-2023-11.jpg',k:'시리즈',w:'2023년 11월',d:'스티커북이 같이 있어서 스티커 붙이면서 많이 봤어요. First Experiences는 글밥이 꽤 길어서 엄마가 연습했어요.'}
 ]],
 ['2024',[
  {n:'Peppa Pig Me Reader',photo:'road/peppa-2024-02.jpg',k:'세트',w:'2024년 2월',d:'전자 리더기가 있어서 리더기를 가지고 잘 들었어요.'},
  {n:'넘버블럭스',photo:'road/numberblocks.jpg',k:'영상',w:'2024년 7월',d:'숫자를 영어로 익혔어요. 수개념을 목표로 한다면 한국어로 보는 걸 추천해요.'},
  {n:'National Geographic Pre 단계',photo:'road/natgeo-pre.jpg',k:'리더스',w:'2024년 8월',d:'자연관찰을 좋아해서 샀더니 좋아했어요. 단어도 곧잘 익혔어요.'},
  {n:'와이즈 픽처북 65권',photo:'road/wise-picturebook.jpg',k:'세트',w:'2024년 10월',d:'수준이 좀 높아서 엄마가 보고 있어요.'},
  {n:'노부영 스테디',photo:'road/nobu-steady.jpg',k:'세트',w:'2024년 11월',d:'워크북 만들기를 하면서 한 권씩 봤어요.',picks:[
    ['A Hole in the Bottom of the Sea','id/9412524','좋아했던 책이에요.'],
    ['Up, Up, Up!','id/9412589','좋아했던 책이에요.'],
    ['Dear Zoo','id/10577107','좋아했던 책이에요.'],
    ['What Am I?','road/what-am-i.jpg','좋아했던 책이에요.']]}
 ]],
 ['2025',[
  {n:"Gabby's Dollhouse",photo:'road/gabby.jpg',k:'영상',w:'2025년 3월',d:'만들기를 좋아하는 아이라 개비를 좋아했어요.'},
  {n:'페파피그',c:'id/7845779',k:'영상',w:'2025년 4월',d:'매일 보는 루틴으로 만들었어요.'},
  {n:'Pip and Posy',c:'id/8523173',k:'시리즈',w:'2025년 7월',d:'재밌어했어요. 10권짜리라 여러 번 반복해서 보여 줬어요.'},
  {n:'옥스포드 리딩트리(ORT)',photo:'road/ort.jpg',k:'리더스',w:'2025년 8월',d:'초초대박책! 너무 재밌어서 1년 만에 9단계까지 거의 다 봤어요. 간단하고 재밌는, 딱 찾던 책이에요. 펜으로 찍어 들을 수 있어요.'},
  {n:'스콜라스틱 픽쳐북 컬렉션',photo:'road/scholastic.jpg',k:'세트',w:'2025년 8월',d:'글밥이 꽤 많은 책들도 섞여 있어서 지금도 한 권씩 보는 중이에요.'},
  {n:'옥토넛',photo:'road/octonauts-video.jpg',k:'영상',w:'2025년 11월',d:'짧은 대사의 뜻을 물어보면 거의 정확하게 말해 줬어요.'}
 ]],
 ['2026',[
  {n:'Octonauts 책',photo:'road/octonauts-2026-01.jpg',k:'시리즈',w:'2026년 1월',d:'옥토넛은 역시나 영상이 최고! 하지만 세이펜이 되는 책이라 찍으면 대사가 나와서 재밌어했어요.'},
  {n:'I Spy',c:'id/384270',k:'시리즈',w:'2026년 2월',d:'단어를 말하면 그림에서 찾으며 봐요.'},
  {n:'북메카 단행본',photo:'road/bookmeca-2025-03.jpg',k:'구매',w:'2026년 3월',d:'아이가 직접 고르는 연례행사예요.'},
  {n:'The Rainbow Fish',photo:'road/rainbowfish-2026-06.jpg',k:'시리즈',w:'2026년 6월',d:'한글판을 좋아해서 원서로도 사 주었더니 역시나 좋아하네요.'}
 ]]
];
// 쿠팡 링크 저장 키: 제목에서 영어·숫자·한글만(대소문자·기호 무시). 대박책과 세트 안 대박책이 같은 책이면 링크 하나로 공유
function roadKey(t){return String(t||'').toLowerCase().replace(/[^0-9a-z가-힣]/g,'');}
// 쿠팡 링크를 넣는 대상(영상·노래·구매처 카드는 제외)
function roadLinkItems(){
  var seen={},out=[];
  function add(group,title){var k=roadKey(title);if(seen[k])return;seen[k]=1;out.push({group:group,title:title,key:k});}
  ROAD.forEach(function(y){y[1].forEach(function(i){if(!/영상|노래|구매/.test(i.k))add('세트·시리즈',i.n);});});
  ROAD.forEach(function(y){y[1].forEach(function(i){(i.picks||[]).forEach(function(x){add('대박책',x[0]);});});});
  BEST.forEach(function(b){add('대박책',b[0]);});
  return out;
}
