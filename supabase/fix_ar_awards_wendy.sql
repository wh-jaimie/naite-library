-- 웬디북(앤서블미디어) 자료로 북레벨(AR)·수상 정정 — 2026-10-23
-- AR: 르네상스 공식 BL(웬디북 북레벨 자료 2024)로 47권 갱신 → 스터디·기록앱 글밥 표시(🌱🌿🌳)에 반영
-- 수상: I Want My Hat Back 가이젤상→가이젤 아너, Not a Box 가이젤 아너 2007 추가 (ALA 명단 확인)
-- (theme_key, tier) 자리를 update — 책 id 유지. Supabase SQL Editor에서 실행, 재실행 안전.
update public.books set ar = 3.8 where theme_key = 'animals' and tier = 2;  -- Giraffes Can't Dance
update public.books set ar = 2.2 where theme_key = 'animals' and tier = 4;  -- Interrupting Chicken
update public.books set ar = 2.0 where theme_key = 'animals' and tier = 5;  -- The Crocodile Who Didn't Like Water
update public.books set ar = 0.9 where theme_key = 'vehicles' and tier = 4;  -- Don't Let the Pigeon Drive the Bus!
update public.books set ar = 3.8 where theme_key = 'vehicles' and tier = 5;  -- Goodnight, Goodnight, Construction Site
update public.books set ar = 2.6 where theme_key = 'christmas' and tier = 2;  -- Pick a Pine Tree
update public.books set ar = 1.1 where theme_key = 'christmas' and tier = 3;  -- Little Blue Truck's Christmas
update public.books set ar = 2.7 where theme_key = 'christmas' and tier = 5;  -- Bear Stays Up for Christmas
update public.books set ar = 1.0 where theme_key = 'food' and tier = 4;  -- The Watermelon Seed
update public.books set ar = 2.7 where theme_key = 'food' and tier = 5;  -- I Will Not Ever Never Eat a Tomato
update public.books set ar = 2.2 where theme_key = 'colors' and tier = 5;  -- Mouse Paint
update public.books set ar = 1.2 where theme_key = 'numbers' and tier = 4;  -- Ten Apples Up on Top!
update public.books set ar = 1.9 where theme_key = 'numbers' and tier = 5;  -- The Doorbell Rang
update public.books set ar = 1.6 where theme_key = 'family' and tier = 2;  -- Is Your Mama a Llama?
update public.books set ar = 2.8 where theme_key = 'family' and tier = 5;  -- Guess How Much I Love You
update public.books set ar = 1.1 where theme_key = 'bedtime' and tier = 4;  -- Goodnight Already!
update public.books set ar = 2.2 where theme_key = 'bedtime' and tier = 5;  -- A Big Mooncake for Little Star
update public.books set ar = 1.7 where theme_key = 'feelings' and tier = 3;  -- It's Okay to Be Different
update public.books set ar = 2.0 where theme_key = 'feelings' and tier = 4;  -- The Bad Seed
update public.books set ar = 1.6 where theme_key = 'feelings' and tier = 5;  -- Knuffle Bunny: A Cautionary Tale
update public.books set ar = 1.0 where theme_key = 'body' and tier = 3;  -- From Head to Toe
update public.books set ar = 2.6 where theme_key = 'bugs' and tier = 2;  -- Superworm
update public.books set ar = 2.8 where theme_key = 'bugs' and tier = 4;  -- The Grouchy Ladybug
update public.books set ar = 2.8 where theme_key = 'nature' and tier = 2;  -- Stick Man
update public.books set ar = 4.0 where theme_key = 'nature' and tier = 5;  -- The Snail and the Whale
update public.books set ar = 2.5 where theme_key = 'weather-seasons' and tier = 5;  -- The Snowy Day
update public.books set ar = 1.2 where theme_key = 'pets' and tier = 3;  -- Go, Dog. Go!
update public.books set ar = 1.3 where theme_key = 'pets' and tier = 4;  -- Bark, George
update public.books set ar = 2.3 where theme_key = 'farm' and tier = 4;  -- Click, Clack, Moo: Cows That Type
update public.books set ar = 2.9 where theme_key = 'ocean' and tier = 5;  -- Swimmy
update public.books set ar = 2.3 where theme_key = 'monsters' and tier = 2;  -- The Gruffalo
update public.books set ar = 3.7 where theme_key = 'halloween' and tier = 2;  -- Room on the Broom
update public.books set ar = 3.5 where theme_key = 'halloween' and tier = 3;  -- The Little Old Lady Who Was Not Afraid of Anything
update public.books set ar = 2.3 where theme_key = 'halloween' and tier = 4;  -- Creepy Carrots!
update public.books set ar = 1.3 where theme_key = 'halloween' and tier = 5;  -- Skeleton Hiccups
update public.books set ar = 2.1 where theme_key = 'songs-rhymes' and tier = 3;  -- Polar Bear, Polar Bear, What Do You Hear?
update public.books set ar = 2.1 where theme_key = 'songs-rhymes' and tier = 4;  -- There's a Wocket in My Pocket!
update public.books set ar = 1.3 where theme_key = 'songs-rhymes' and tier = 5;  -- We're Going on a Bear Hunt
update public.books set ar = 2.3 where theme_key = 'school-friends' and tier = 4;  -- We Don't Eat Our Classmates
update public.books set ar = 3.3 where theme_key = 'school-friends' and tier = 5;  -- Chrysanthemum
update public.books set ar = 2.8 where theme_key = 'daily-routine' and tier = 3;  -- The Napping House
update public.books set ar = 1.1 where theme_key = 'daily-routine' and tier = 5;  -- Bathtime for Biscuit
update public.books set ar = 2.9 where theme_key = 'opposites-concepts' and tier = 2;  -- Round Is a Mooncake
update public.books set ar = 1.0, award = '🎖️ 가이젤 아너 2012' where theme_key = 'opposites-concepts' and tier = 4;  -- I Want My Hat Back
update public.books set ar = 1.9 where theme_key = 'opposites-concepts' and tier = 5;  -- They All Saw a Cat
update public.books set ar = 2.7 where theme_key = 'imagination' and tier = 2;  -- If I Built a House
update public.books set award = '🎖️ 가이젤 아너 2007' where theme_key = 'imagination' and tier = 3;  -- Not a Box
update public.books set ar = 1.9 where theme_key = 'imagination' and tier = 4;  -- Sam & Dave Dig a Hole
