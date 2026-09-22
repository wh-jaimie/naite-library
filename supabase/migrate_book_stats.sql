-- books 통계 컬럼 추가 + 값 채우기 (Supabase SQL Editor 에서 Run)
alter table public.books add column if not exists pop_rank int;
alter table public.books add column if not exists lib_loans int;

update public.books set pop_rank=6, lib_loans=0 where theme_key='animals' and title='Dear Zoo';
update public.books set pop_rank=74, lib_loans=0 where theme_key='animals' and title='Giraffes Can''t Dance';
update public.books set pop_rank=3, lib_loans=0 where theme_key='animals' and title='Brown Bear, Brown Bear, What Do You See?';
update public.books set pop_rank=5, lib_loans=0 where theme_key='animals' and title='Moo, Baa, La La La!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='animals' and title='The Mixed-Up Chameleon';

update public.books set pop_rank=0, lib_loans=0 where theme_key='vehicles' and title='That''s Not My Truck';
update public.books set pop_rank=0, lib_loans=0 where theme_key='vehicles' and title='Sheep in a Jeep';
update public.books set pop_rank=11, lib_loans=0 where theme_key='vehicles' and title='Little Blue Truck';
update public.books set pop_rank=12, lib_loans=96 where theme_key='vehicles' and title='Don''t Let the Pigeon Drive the Bus!';
update public.books set pop_rank=48, lib_loans=0 where theme_key='vehicles' and title='Goodnight, Goodnight, Construction Site';

update public.books set pop_rank=1, lib_loans=0 where theme_key='food' and title='The Very Hungry Caterpillar';
update public.books set pop_rank=35, lib_loans=0 where theme_key='food' and title='Jamberry';
update public.books set pop_rank=0, lib_loans=0 where theme_key='food' and title='Today Is Monday';
update public.books set pop_rank=83, lib_loans=0 where theme_key='food' and title='Dragons Love Tacos';
update public.books set pop_rank=67, lib_loans=0 where theme_key='food' and title='Cloudy with a Chance of Meatballs';

update public.books set pop_rank=0, lib_loans=0 where theme_key='colors' and title='Lemons Are Not Red';
update public.books set pop_rank=0, lib_loans=0 where theme_key='colors' and title='Mary Wore Her Red Dress';
update public.books set pop_rank=62, lib_loans=0 where theme_key='colors' and title='I Went Walking';
update public.books set pop_rank=30, lib_loans=61 where theme_key='colors' and title='Blue Hat, Green Hat';
update public.books set pop_rank=0, lib_loans=0 where theme_key='colors' and title='A Color of His Own';

update public.books set pop_rank=0, lib_loans=0 where theme_key='numbers' and title='Ten Little Ladybugs';
update public.books set pop_rank=0, lib_loans=0 where theme_key='numbers' and title='Five Little Ducks';
update public.books set pop_rank=0, lib_loans=0 where theme_key='numbers' and title='Ten Black Dots';
update public.books set pop_rank=0, lib_loans=0 where theme_key='numbers' and title='Ten Apples Up on Top!';
update public.books set pop_rank=94, lib_loans=67 where theme_key='numbers' and title='Five Little Monkeys Jumping on the Bed';

update public.books set pop_rank=0, lib_loans=0 where theme_key='family' and title='Where Is Baby''s Mommy?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='family' and title='Is Your Mama a Llama?';
update public.books set pop_rank=38, lib_loans=0 where theme_key='family' and title='Are You My Mother?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='family' and title='My Mum';
update public.books set pop_rank=7, lib_loans=0 where theme_key='family' and title='Guess How Much I Love You';

update public.books set pop_rank=0, lib_loans=0 where theme_key='bedtime' and title='Tuck Me In!';
update public.books set pop_rank=9, lib_loans=0 where theme_key='bedtime' and title='The Going to Bed Book';
update public.books set pop_rank=2, lib_loans=84 where theme_key='bedtime' and title='Goodnight Moon';
update public.books set pop_rank=0, lib_loans=0 where theme_key='bedtime' and title='How Do Dinosaurs Say Good Night?';
update public.books set pop_rank=23, lib_loans=0 where theme_key='bedtime' and title='Time for Bed';

update public.books set pop_rank=0, lib_loans=0 where theme_key='feelings' and title='Glad Monster, Sad Monster';
update public.books set pop_rank=0, lib_loans=0 where theme_key='feelings' and title='The Way I Feel';
update public.books set pop_rank=0, lib_loans=0 where theme_key='feelings' and title='The Feelings Book';
update public.books set pop_rank=0, lib_loans=0 where theme_key='feelings' and title='The Pigeon Has Feelings, Too!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='feelings' and title='The Color Monster';

update public.books set pop_rank=42, lib_loans=0 where theme_key='body' and title='Where Is Baby''s Belly Button?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='body' and title='Here Are My Hands';
update public.books set pop_rank=16, lib_loans=135 where theme_key='body' and title='From Head to Toe';
update public.books set pop_rank=31, lib_loans=0 where theme_key='body' and title='Belly Button Book';
update public.books set pop_rank=20, lib_loans=0 where theme_key='body' and title='Ten Little Fingers and Ten Little Toes';

update public.books set pop_rank=46, lib_loans=0 where theme_key='bugs' and title='The Very Busy Spider';
update public.books set pop_rank=0, lib_loans=0 where theme_key='bugs' and title='Some Bugs';
update public.books set pop_rank=0, lib_loans=0 where theme_key='bugs' and title='There Was an Old Lady Who Swallowed a Fly';
update public.books set pop_rank=0, lib_loans=0 where theme_key='bugs' and title='The Grouchy Ladybug';
update public.books set pop_rank=0, lib_loans=0 where theme_key='bugs' and title='The Very Quiet Cricket';

update public.books set pop_rank=0, lib_loans=0 where theme_key='dinosaurs' and title='That''s Not My Dinosaur';
update public.books set pop_rank=0, lib_loans=0 where theme_key='dinosaurs' and title='Dinosaur Roar!';
update public.books set pop_rank=71, lib_loans=0 where theme_key='dinosaurs' and title='Dinosaur Dance!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='dinosaurs' and title='Dinosaur vs. Bedtime';
update public.books set pop_rank=0, lib_loans=0 where theme_key='dinosaurs' and title='Tyrannosaurus Drip';

update public.books set pop_rank=0, lib_loans=0 where theme_key='nature' and title='Tap the Magic Tree';
update public.books set pop_rank=0, lib_loans=0 where theme_key='nature' and title='Flower Garden';
update public.books set pop_rank=0, lib_loans=0 where theme_key='nature' and title='The Carrot Seed';
update public.books set pop_rank=0, lib_loans=0 where theme_key='nature' and title='Jasper''s Beanstalk';
update public.books set pop_rank=0, lib_loans=0 where theme_key='nature' and title='The Tiny Seed';

update public.books set pop_rank=0, lib_loans=0 where theme_key='weather-seasons' and title='Maisy''s Wonderful Weather Book';
update public.books set pop_rank=0, lib_loans=0 where theme_key='weather-seasons' and title='Rain!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='weather-seasons' and title='It Looked Like Spilt Milk';
update public.books set pop_rank=0, lib_loans=0 where theme_key='weather-seasons' and title='Snowmen at Night';
update public.books set pop_rank=19, lib_loans=0 where theme_key='weather-seasons' and title='The Snowy Day';

update public.books set pop_rank=44, lib_loans=0 where theme_key='pets' and title='Where''s Spot?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='pets' and title='Hairy Maclary from Donaldson''s Dairy';
update public.books set pop_rank=0, lib_loans=0 where theme_key='pets' and title='Go, Dog. Go!';
update public.books set pop_rank=36, lib_loans=80 where theme_key='pets' and title='Bark, George';
update public.books set pop_rank=0, lib_loans=0 where theme_key='pets' and title='Harry the Dirty Dog';

update public.books set pop_rank=0, lib_loans=0 where theme_key='farm' and title='That''s Not My Tractor';
update public.books set pop_rank=10, lib_loans=0 where theme_key='farm' and title='Barnyard Dance';
update public.books set pop_rank=0, lib_loans=0 where theme_key='farm' and title='Mrs. Wishy-Washy';
update public.books set pop_rank=58, lib_loans=0 where theme_key='farm' and title='Click, Clack, Moo: Cows That Type';
update public.books set pop_rank=0, lib_loans=0 where theme_key='farm' and title='The Little Red Hen';

update public.books set pop_rank=0, lib_loans=0 where theme_key='ocean' and title='Never Touch a Shark!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='ocean' and title='Commotion in the Ocean';
update public.books set pop_rank=32, lib_loans=0 where theme_key='ocean' and title='Hooray for Fish!';
update public.books set pop_rank=52, lib_loans=64 where theme_key='ocean' and title='I''m the Biggest Thing in the Ocean!';
update public.books set pop_rank=63, lib_loans=0 where theme_key='ocean' and title='The Rainbow Fish';

update public.books set pop_rank=0, lib_loans=0 where theme_key='monsters' and title='Go Away, Big Green Monster!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='monsters' and title='The Gruffalo';
update public.books set pop_rank=0, lib_loans=0 where theme_key='monsters' and title='If You''re a Monster and You Know It';
update public.books set pop_rank=84, lib_loans=0 where theme_key='monsters' and title='The Monster at the End of This Book';
update public.books set pop_rank=14, lib_loans=0 where theme_key='monsters' and title='Where the Wild Things Are';

update public.books set pop_rank=0, lib_loans=0 where theme_key='halloween' and title='Where Is Baby''s Pumpkin?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='halloween' and title='Five Little Pumpkins';
update public.books set pop_rank=0, lib_loans=0 where theme_key='halloween' and title='The Little Old Lady Who Was Not Afraid of Anything';
update public.books set pop_rank=0, lib_loans=0 where theme_key='halloween' and title='Creepy Carrots!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='halloween' and title='Room on the Broom';

update public.books set pop_rank=0, lib_loans=0 where theme_key='christmas' and title='Dear Santa';
update public.books set pop_rank=0, lib_loans=0 where theme_key='christmas' and title='The Night Before Christmas';
update public.books set pop_rank=0, lib_loans=0 where theme_key='christmas' and title='The Twelve Days of Christmas';
update public.books set pop_rank=55, lib_loans=0 where theme_key='christmas' and title='How the Grinch Stole Christmas!';
update public.books set pop_rank=49, lib_loans=0 where theme_key='christmas' and title='The Polar Express';

update public.books set pop_rank=0, lib_loans=0 where theme_key='songs-rhymes' and title='The Wheels on the Bus';
update public.books set pop_rank=0, lib_loans=0 where theme_key='songs-rhymes' and title='Down by the Bay';
update public.books set pop_rank=0, lib_loans=0 where theme_key='songs-rhymes' and title='If You''re Happy and You Know It';
update public.books set pop_rank=0, lib_loans=0 where theme_key='songs-rhymes' and title='There''s a Wocket in My Pocket!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='songs-rhymes' and title='Over in the Meadow';

update public.books set pop_rank=0, lib_loans=0 where theme_key='school-friends' and title='Spot Goes to School';
update public.books set pop_rank=0, lib_loans=0 where theme_key='school-friends' and title='Llama Llama Misses Mama';
update public.books set pop_rank=0, lib_loans=0 where theme_key='school-friends' and title='Do You Want to Be My Friend?';
update public.books set pop_rank=0, lib_loans=0 where theme_key='school-friends' and title='We Don''t Eat Our Classmates';
update public.books set pop_rank=0, lib_loans=0 where theme_key='school-friends' and title='The Kissing Hand';

update public.books set pop_rank=0, lib_loans=0 where theme_key='daily-routine' and title='P is for Potty!';
update public.books set pop_rank=53, lib_loans=0 where theme_key='daily-routine' and title='Pajama Time!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='daily-routine' and title='The Napping House';
update public.books set pop_rank=0, lib_loans=0 where theme_key='daily-routine' and title='No, David!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='daily-routine' and title='Bathtime for Biscuit';

update public.books set pop_rank=80, lib_loans=65 where theme_key='opposites-concepts' and title='Press Here';
update public.books set pop_rank=0, lib_loans=0 where theme_key='opposites-concepts' and title='Round Is a Mooncake';
update public.books set pop_rank=61, lib_loans=0 where theme_key='opposites-concepts' and title='Opposites';
update public.books set pop_rank=0, lib_loans=0 where theme_key='opposites-concepts' and title='Duck! Rabbit!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='opposites-concepts' and title='Mouse Shapes';

update public.books set pop_rank=0, lib_loans=0 where theme_key='imagination' and title='Mix It Up!';
update public.books set pop_rank=0, lib_loans=0 where theme_key='imagination' and title='If I Built a House';
update public.books set pop_rank=0, lib_loans=0 where theme_key='imagination' and title='Not a Box';
update public.books set pop_rank=102, lib_loans=81 where theme_key='imagination' and title='Sam & Dave Dig a Hole';
update public.books set pop_rank=73, lib_loans=0 where theme_key='imagination' and title='Harold and the Purple Crayon';
