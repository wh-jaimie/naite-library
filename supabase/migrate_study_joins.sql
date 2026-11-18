-- 이번 달 스터디 참여 신청 (2026-11-18 운영자 결정)
-- 채팅방·당근모임엔 들어와도 '내가 스터디를 하고 있는지' 분명하지 않음 → 스터디 앱 '이번 달 책' 맨 위에서 매달 [참여하기].
-- 받는 것: 닉네임(채팅방·당근 이름, 필수) · 아이 나이대(선택) · 어디서 알게 됐는지(선택). 운영자(관리자)만 목록을 봄.
-- 기록 주인 = 기기별 기록 ID(naite_reader). 참여는 '그 달 주제(settings.current_theme)' 단위, 지난 달 참여자는 다음 달에 버튼 한 번으로 이어서 참여.
-- Supabase → SQL Editor 에 붙여넣어 실행. 여러 번 실행해도 안전.

create table if not exists public.study_joins (
  reader     text not null,
  theme_key  text not null,
  nickname   text not null,
  kid_age    smallint,          -- 1 = 0~3세 · 2 = 4~6세 · 3 = 7~9세 (앱의 naite_age와 같음)
  came_from  text,              -- kakao · daangn · insta · blog · friend · etc
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reader, theme_key)
);
alter table public.study_joins enable row level security;
grant select, insert, update, delete on public.study_joins to anon, authenticated, service_role;
-- 회원은 표를 직접 못 읽고 아래 함수로만. 관리자만 목록 읽기·지우기
drop policy if exists "admin read study_joins" on public.study_joins;
create policy "admin read study_joins" on public.study_joins for select using (public.is_admin());
drop policy if exists "admin delete study_joins" on public.study_joins;
create policy "admin delete study_joins" on public.study_joins for delete using (public.is_admin());

-- 1) 지금 상태: 이번 달 주제·내가 참여했는지·참여 인원·지난번에 넣은 이름/나이/경로(다음 달 한 번에 이어서 참여용)
create or replace function public.study_join_state(p_reader text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cur text; v_n int; v_me public.study_joins%rowtype; v_last public.study_joins%rowtype;
begin
  select current_theme into v_cur from public.settings where id = 1;
  select count(*) into v_n from public.study_joins where theme_key = v_cur;
  if coalesce(length(p_reader),0) between 16 and 64 then
    select * into v_me from public.study_joins where reader = p_reader and theme_key = v_cur;
    select * into v_last from public.study_joins where reader = p_reader order by updated_at desc limit 1;
  end if;
  return jsonb_build_object(
    'cur', v_cur, 'count', v_n,
    'joined', v_me.reader is not null,
    'nickname', v_last.nickname, 'kid_age', v_last.kid_age, 'came_from', v_last.came_from,
    'before', v_last.reader is not null and v_last.theme_key is distinct from v_cur);
end $$;
grant execute on function public.study_join_state(text) to anon, authenticated;

-- 2) 이번 달 참여하기(또는 이름·나이 고치기). 주제는 서버가 정함(이번 달만)
create or replace function public.join_study(p_reader text, p_nickname text, p_kid_age int, p_came_from text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_cur text; v_nick text; v_n int;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return jsonb_build_object('ok',false,'error','reader'); end if;
  v_nick := left(btrim(coalesce(p_nickname,'')), 20);
  if v_nick = '' then return jsonb_build_object('ok',false,'error','name'); end if;
  select current_theme into v_cur from public.settings where id = 1;
  if v_cur is null then return jsonb_build_object('ok',false,'error','theme'); end if;
  insert into public.study_joins(reader, theme_key, nickname, kid_age, came_from)
  values (p_reader, v_cur, v_nick,
          case when p_kid_age between 1 and 3 then p_kid_age end,
          case when p_came_from in ('kakao','daangn','insta','blog','friend','etc') then p_came_from end)
  on conflict (reader, theme_key) do update set nickname = excluded.nickname, kid_age = excluded.kid_age,
     came_from = excluded.came_from, updated_at = now();
  select count(*) into v_n from public.study_joins where theme_key = v_cur;
  return jsonb_build_object('ok',true,'cur',v_cur,'count',v_n);
end $$;
grant execute on function public.join_study(text, text, int, text) to anon, authenticated;
