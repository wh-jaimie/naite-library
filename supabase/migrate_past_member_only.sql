-- 지난 달 스터디 자료는 회원 전용(나이테 기록 앱)에서만 — 공개 페이지(study/)는 이번 달만
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전(idempotent).
-- get_study(공개 페이지용): 이번 달(settings.current_theme)이 아닌 달은 회원 비밀번호가 맞을 때만 반환, 아니면 error='member'.
-- 회원 기록 앱은 get_study_member(회원 비밀번호)를 쓰므로 영향 없음. 이번 달 공개 방식(페이지별 passcode)도 그대로.

create or replace function public.get_study(p_key text, p_pass text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_pass text; v_pub boolean; v_theme jsonb; v_content jsonb; v_books jsonb; v_cur text;
begin
  select to_jsonb(t) into v_theme from public.themes t where t.key = p_key;
  if v_theme is null then return jsonb_build_object('ok', false, 'error', 'notfound'); end if;

  select coalesce(c.passcode,''), coalesce(c.published,false)
    into v_pass, v_pub
    from public.content c where c.theme_key = p_key;

  if not coalesce(v_pub, false) then
    return jsonb_build_object('ok', false, 'error', 'unpublished');
  end if;

  -- 지난 달(이번 달이 아닌 달)은 회원 전용
  select s.current_theme into v_cur from public.settings s where s.id = 1;
  if p_key is distinct from v_cur and not coalesce(public.check_member(p_pass), false) then
    return jsonb_build_object('ok', false, 'error', 'member');
  end if;

  if p_key = v_cur and v_pass <> '' and coalesce(p_pass,'') <> v_pass then
    return jsonb_build_object('ok', false, 'error', 'badpass');
  end if;

  select (to_jsonb(c) - 'passcode') into v_content
    from public.content c where c.theme_key = p_key;
  select coalesce(jsonb_agg(to_jsonb(b) order by b.sort), '[]'::jsonb) into v_books
    from public.books b where b.theme_key = p_key;

  return jsonb_build_object('ok', true, 'theme', v_theme, 'content', v_content, 'books', v_books);
end $$;

grant execute on function public.get_study(text, text) to anon, authenticated;
