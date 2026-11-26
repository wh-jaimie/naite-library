-- 🎓 나이테 수료증(2026-11-26 운영자 결정): 수료증에 나이테 120 링 그림을 넣고, 지금까지 수료한 주제는 컬러·아직 안 한 주제는 흑백.
-- 이 함수는 '이 기록 주인이 수료한 주제' 목록을 돌려줌. 수료 = 그 달 신청(study_joins) + 그 달 기록한 날 8번 이상
--   + (12월 스터디부터) 그 달 책 후기 3건 이상. 앱의 수료 규칙(app.html GRAD_DAYS·GRAD_RV·RV_FROM)과 같음.
-- migrate_study_joins.sql, migrate_study_reviews.sql 다음에 실행. 여러 번 실행해도 안전.

create or replace function public.my_grad_themes(p_reader text, p_voice text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_voice text; v_out jsonb := '[]'::jsonb; r record; v_m date;
begin
  if coalesce(length(p_reader),0) not between 16 and 64 then return v_out; end if;
  v_voice := case when coalesce(length(p_voice),0) between 16 and 64 then p_voice end;
  for r in select j.theme_key, j.voice from public.study_joins j where j.reader = p_reader loop
    v_m := public.theme_month(r.theme_key);
    if public.rec_days(p_reader, v_m, (v_m + interval '1 month')::date) >= 8
       and (v_m < date '2026-12-01'
            or public.rev_count(array_remove(array[p_reader, v_voice, r.voice], null), v_m, (v_m + interval '1 month')::date) >= 3) then
      v_out := v_out || jsonb_build_object('key', r.theme_key, 'month', v_m);
    end if;
  end loop;
  return v_out;
end $$;
grant execute on function public.my_grad_themes(text, text) to anon, authenticated;
