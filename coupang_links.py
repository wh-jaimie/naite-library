# -*- coding: utf-8 -*-
"""나이테 120 책별 쿠팡 파트너스 단축링크 (제목 -> URL).
   채우는 법: 각 책 제목 오른쪽 "" 안에 파트너스 단축링크(https://link.coupang.com/a/...)를 붙여넣으세요.
   비워두면 그 책은 제목 클릭이 비활성(링크 없음)입니다.
   수정 후: python build_challenge_page.py  ->  cp output/challenge.html docs/challenge.html
"""
LINKS = {
  # 🐻 동물
  "Dear Zoo": "",
  "Giraffes Can't Dance": "",
  "Brown Bear, Brown Bear, What Do You See?": "",
  "Interrupting Chicken": "",
  "The Crocodile Who Didn't Like Water": "",
  # 🚗 탈것
  "Fire Engine": "",
  "Truck Full of Ducks": "",
  "Nee Naw the Little Fire Engine": "",
  "Don't Let the Pigeon Drive the Bus!": "",
  "Goodnight, Goodnight, Construction Site": "",
  # 🍎 음식
  "Ketchup on Your Cornflakes?": "",
  "Jamberry": "",
  "Today Is Monday": "",
  "The Watermelon Seed": "",
  "I Will Not Ever Never Eat a Tomato": "",
  # 🌈 색깔
  "Mix It Up!": "",
  "Pete the Cat: I Love My White Shoes": "",
  "Where Is the Green Sheep?": "",
  "The Day the Crayons Quit": "",
  "Mouse Paint": "",
  # 🔢 숫자
  "There Were Ten in the Bed": "",
  "Ten Fat Sausages": "",
  "Ten Black Dots": "",
  "Ten Apples Up on Top!": "",
  "The Doorbell Rang": "",
  # 👨‍👩‍👧 가족
  "Where Is Baby's Mommy?": "",
  "Is Your Mama a Llama?": "",
  "Are You My Mother?": "",
  "My Mum": "",
  "Guess How Much I Love You": "",
  # 🌙 잠자리
  "Tuck Me In!": "",
  "The Going to Bed Book": "",
  "Goodnight Moon": "",
  "Goodnight Already!": "",
  "A Big Mooncake for Little Star": "",
  # 😊 감정
  "The Color Monster: A Pop-Up Book of Feelings": "",
  "The Way I Feel": "",
  "It's Okay to Be Different": "",
  "The Bad Seed": "",
  "Knuffle Bunny: A Cautionary Tale": "",
  # 👣 몸
  "Where Is Baby's Belly Button?": "",
  "Here Are My Hands": "",
  "From Head to Toe": "",
  "Belly Button Book": "",
  "Ten Little Fingers and Ten Little Toes": "",
  # 🐛 곤충
  "The Very Busy Spider": "",
  "Superworm": "",
  "The Very Hungry Caterpillar": "",
  "The Grouchy Ladybug": "",
  "The Very Quiet Cricket": "",
  # 🦖 공룡
  "That's Not My Dinosaur": "",
  "Dinosaur Roar!": "",
  "How Do Dinosaurs Say Goodnight?": "",
  "Dinosaur vs. Bedtime": "",
  "Tyrannosaurus Drip": "",
  # 🌱 자연·정원
  "Tap the Magic Tree": "",
  "Stick Man": "",
  "The Carrot Seed": "",
  "The Leaf Thief": "",
  "The Snail and the Whale": "",
  # 🌦️ 날씨·계절
  "Maisy's Wonderful Weather Book": "",
  "Rain!": "",
  "It Looked Like Spilt Milk": "",
  "Snowmen at Night": "",
  "The Snowy Day": "",
  # 🐶 반려동물
  "Where's Spot?": "",
  "Hairy Maclary from Donaldson's Dairy": "",
  "Go, Dog. Go!": "",
  "Bark, George": "",
  "Hot Dog": "",
  # 🚜 농장
  "Charlie Chick": "",
  "Barnyard Dance": "",
  "Mrs. Wishy-Washy": "",
  "Click, Clack, Moo: Cows That Type": "",
  "The Little Red Hen": "",
  # 🌊 바다
  "One Lonely Fish": "",
  "The Pout-Pout Fish": "",
  "Hooray for Fish!": "",
  "This Is Not My Hat": "",
  "Swimmy": "",
  # 👻 괴물
  "Go Away, Big Green Monster!": "",
  "The Gruffalo": "",
  "If You're a Monster and You Know It": "",
  "The Monster at the End of This Book": "",
  "Where the Wild Things Are": "",
  # 🎃 할로윈
  "Where Is Baby's Pumpkin?": "",
  "Room on the Broom": "",
  "The Little Old Lady Who Was Not Afraid of Anything": "",
  "Creepy Carrots!": "",
  "Skeleton Hiccups": "",
  # 🎄 크리스마스
  "Dear Santa": "",
  "Pick a Pine Tree": "",
  "Little Blue Truck's Christmas": "",
  "Santa Bruce": "",
  "Bear Stays Up for Christmas": "",
  # 🎶 노래·마더구스
  "The Wheels on the Bus": "",
  "Walking Through the Jungle": "",
  "Polar Bear, Polar Bear, What Do You Hear?": "",
  "There's a Wocket in My Pocket!": "",
  "We're Going on a Bear Hunt": "",
  # 🏫 학교·친구
  "Spot Goes to School": "",
  "Llama Llama Misses Mama": "",
  "Do You Want to Be My Friend?": "",
  "We Don't Eat Our Classmates": "",
  "Chrysanthemum": "",
  # 🛁 생활습관
  "Brush Your Teeth, Please": "",
  "Pajama Time!": "",
  "The Napping House": "",
  "No, David!": "",
  "Bathtime for Biscuit": "",
  # 🔀 반대말·개념
  "Press Here": "",
  "Round Is a Mooncake": "",
  "Opposites": "",
  "I Want My Hat Back": "",
  "They All Saw a Cat": "",
  # 🎨 상상·놀이
  "Don't Push the Button!": "",
  "If I Built a House": "",
  "Not a Box": "",
  "Sam & Dave Dig a Hole": "",
  "Harold and the Purple Crayon": "",
}
