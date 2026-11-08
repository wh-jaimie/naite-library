// 나이테 스터디 앱 푸시 알림 발송 (Supabase Edge Function) — 2026-11-08
// GET  → { publicKey }  : 앱이 알림 주소를 만들 때 쓰는 VAPID 공개 키(공개돼도 안전)
// POST → 관리자만. { title, body, url, target: 'all' | 'test', endpoints?: string[] }
//        target 'test' 는 endpoints(관리자 폰의 알림 주소)에만 보냄.
// 비밀 값(VAPID_PRIVATE_KEY)은 `supabase secrets set` 으로만 넣고 코드·저장소에는 두지 않음.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 함수에 자동으로 넣어 줌.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const PUB = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SUBJ = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!PUB || !PRIV) return json({ error: "VAPID 키가 아직 등록되지 않았어요(supabase secrets set)." }, 500);
  if (req.method === "GET") return json({ publicKey: PUB });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // 관리자 확인: 보낸 사람의 로그인 토큰으로 is_admin() 호출
  const authz = req.headers.get("Authorization") ?? "";
  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: authz } } });
  const adm = await asUser.rpc("is_admin");
  if (adm.error || adm.data !== true) return json({ error: "관리자만 보낼 수 있어요." }, 403);

  let p: { title?: string; body?: string; url?: string; target?: string; endpoints?: string[] };
  try { p = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const title = String(p.title ?? "").slice(0, 80).trim();
  const body = String(p.body ?? "").slice(0, 300).trim();
  const url = String(p.url ?? "/naite-library/record/app.html").slice(0, 300);
  const target = p.target === "test" ? "test" : "all";
  if (!title) return json({ error: "제목을 넣어 주세요." }, 400);

  const db = createClient(URL_, SERVICE);
  let q = db.from("push_subs").select("id,endpoint,p256dh,auth");
  if (target === "test") {
    const eps = (p.endpoints ?? []).filter((x) => typeof x === "string").slice(0, 5);
    if (!eps.length) return json({ error: "테스트할 알림 주소가 없어요. 이 폰에서 스터디 앱 알림을 먼저 켜 주세요." }, 400);
    q = q.in("endpoint", eps);
  }
  const { data: subs, error } = await q;
  if (error) return json({ error: error.message }, 500);

  webpush.setVapidDetails(SUBJ, PUB, PRIV);
  const payload = JSON.stringify({ title, body, url, tag: "naite-" + Date.now() });
  let sent = 0, failed = 0;
  const dead: number[] = [];
  // 한 번에 너무 많이 보내지 않게 20개씩 나눠서
  const list = subs ?? [];
  for (let i = 0; i < list.length; i += 20) {
    await Promise.all(list.slice(i, i + 20).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id); // 앱을 지웠거나 알림을 끈 주소 → 정리
        else failed++;
      }
    }));
  }
  if (dead.length) await db.from("push_subs").delete().in("id", dead);
  await db.from("push_log").insert({ title, body, url, target, sent, failed, removed: dead.length });
  return json({ ok: true, total: list.length, sent, failed, removed: dead.length });
});
