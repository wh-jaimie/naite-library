-- 탈것 책 소개 문구 정정 (실제 책 확인 결과 · 2026-10-19)
--  · Fire Engine: 움직이는 조작 장치가 아니라 소방차 모양 보드북 + 그림 찾기(소방관들의 생일 나들이)
--  · Mr Gumpy's Outing: 아저씨 대답이 늘 "Yes, but…"은 아님(염소엔 "Very well, but…") → 한국어로 풀어 씀
-- Supabase SQL Editor 에서 실행하세요. 다시 실행해도 안전해요.
update public.books set reason = '소방차 모양으로 잘린 큰 보드북 — 소방관들의 생일 나들이 속 그림 찾기 (Pictory)'
where theme_key = 'vehicles' and tier = 1;
update public.books set reason = '동물마다 태워 달라고 하면 "좋아, 대신 ~하지 마" 하는 대답이 반복되는 패턴 — 그리너웨이 메달'
where theme_key = 'vehicles' and tier = 3;
