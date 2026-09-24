-- 페이지별 비밀번호 + 발행 상태 + 서버측 검증(RPC)
-- 목적: 스터디 페이지를 비밀번호로 보호. 내용은 브라우저에서 직접 못 읽고, 비번이 맞을 때만 RPC로 받음.

-- 1) 컬럼 추가
alter table public.content add column if not exists passcode  text    default '';
alter table public.content add column if not exists published boolean default false;

-- 2) 현재 공개 중인 달은 '발행' 표시(페이지가 계속 뜨도록)
update public.content set published = true
 where theme_key = (select current_theme from public.settings where id = 1);

-- 3) 내용 보호: content/books 직접 읽기(anon) 차단 → 오직 RPC로만 접근
--    (themes/settings 는 목록/현재 달 표시용으로 공개 유지)
drop policy if exists "public read content" on public.content;
drop policy if exists "public read books"   on public.books;

-- 4) 발행된 달 목록(제목만) — '지난 달 보관함'용
create or replace function public.list_published()
returns table(key text, emoji text, ko text, en text, month_label text, sort int)
language sql stable security definer set search_path = public as $$
  select t.key, t.emoji, t.ko, t.en, coalesce(c.month_label,''), t.sort
  from public.themes t
  join public.content c on c.theme_key = t.key
  where coalesce(c.published,false) = true
  order by t.sort;
$$;

-- 5) 한 달 콘텐츠 — 발행됐고 비밀번호가 맞을 때만 반환(비밀번호 자체는 응답에서 제외)
create or replace function public.get_study(p_key text, p_pass text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_pass text; v_pub boolean; v_theme jsonb; v_content jsonb; v_books jsonb;
begin
  select to_jsonb(t) into v_theme from public.themes t where t.key = p_key;
  if v_theme is null then return jsonb_build_object('ok', false, 'error', 'notfound'); end if;

  select coalesce(c.passcode,''), coalesce(c.published,false)
    into v_pass, v_pub
    from public.content c where c.theme_key = p_key;

  if not coalesce(v_pub, false) then
    return jsonb_build_object('ok', false, 'error', 'unpublished');
  end if;
  if v_pass <> '' and coalesce(p_pass,'') <> v_pass then
    return jsonb_build_object('ok', false, 'error', 'badpass');
  end if;

  select (to_jsonb(c) - 'passcode') into v_content
    from public.content c where c.theme_key = p_key;
  select coalesce(jsonb_agg(to_jsonb(b) order by b.sort), '[]'::jsonb) into v_books
    from public.books b where b.theme_key = p_key;

  return jsonb_build_object('ok', true, 'theme', v_theme, 'content', v_content, 'books', v_books);
end $$;

grant execute on function public.list_published()      to anon, authenticated;
grant execute on function public.get_study(text, text) to anon, authenticated;
