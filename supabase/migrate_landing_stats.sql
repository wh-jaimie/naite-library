-- 메인(랜딩) 화면용 공개 집계 — "이번 달 5권"과 "지금 우리 방" 숫자
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- 새 테이블은 만들지 않음(함수만). 회원 개인 정보·기기 ID는 돌려주지 않고 합계만 반환.
--   reads   : 이번 달 주제 책에 남긴 읽기 기록 수(기록앱 표지 탭 합계)
--   readers : 이번 달 기록을 남긴 기기 수
--   books   : 이번 달 5권(제목·작가·표지·유형) — 나이테 120에 이미 공개된 정보만
--   next    : 다음 주제와 5권(다음 달 책 미리보기용, 화면에서 15일 이후에만 표시)

create or replace function public.landing_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_key text; v_sort int; v_next text; v_out jsonb;
begin
  select s.current_theme into v_key from public.settings s where s.id = 1;
  if v_key is null then return jsonb_build_object('ok', false); end if;
  select t.sort into v_sort from public.themes t where t.key = v_key;

  select jsonb_build_object(
    'ok', true,
    'key', t.key, 'emoji', t.emoji, 'ko', t.ko, 'en', t.en,
    'month_label', coalesce(c.month_label, ''),
    'reads',   (select count(*) from public.reading_logs r where r.theme_key = v_key),
    'readers', (select count(distinct r.reader) from public.reading_logs r where r.theme_key = v_key),
    'books', (select coalesce(jsonb_agg(jsonb_build_object(
                'title', b.title, 'author', b.author, 'cover', b.cover, 'tier_label', b.tier_label)
                order by b.sort), '[]'::jsonb)
              from public.books b where b.theme_key = v_key)
  ) into v_out
  from public.themes t left join public.content c on c.theme_key = t.key
  where t.key = v_key;

  select t.key into v_next from public.themes t
   where t.sort > coalesce(v_sort, 0) order by t.sort limit 1;
  if v_next is not null then
    v_out := v_out || jsonb_build_object('next', (
      select jsonb_build_object('key', t.key, 'emoji', t.emoji, 'ko', t.ko,
        'books', (select coalesce(jsonb_agg(jsonb_build_object(
                    'title', b.title, 'author', b.author, 'cover', b.cover, 'tier_label', b.tier_label)
                    order by b.sort), '[]'::jsonb)
                  from public.books b where b.theme_key = t.key))
      from public.themes t where t.key = v_next));
  end if;
  return v_out;
end $$;

grant execute on function public.landing_stats() to anon, authenticated;
