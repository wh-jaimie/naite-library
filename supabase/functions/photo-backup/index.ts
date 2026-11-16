// 나이테 스터디 앱: 인증 사진·워크북 사진 보관 (Supabase Edge Function) — 2026-11-17
// 운영자 결정: 메모·사진은 모든 사용자 서버에 보관. 같은 기록 ID를 쓰는 폰(이어보기·아빠와 같이 쓰기)끼리 맞춤.
// 비공개 저장소(bucket 'backup-photos')에 <기록 ID>/<사진 키>.jpg 로 저장. 보기는 1시간짜리 서명 주소로만.
// POST { a: 'put' | 'del' | 'list', reader, key?, data?(JPEG base64) }
// 장난 업로드를 막으려고, 읽기 기록(reading_logs)이나 기록 백업이 하나라도 있는 기록 ID만 받음(없으면 'noreader' → 앱은 줄에 두고 다음에).
// 기록 ID는 그 폰과 이어보기 한 폰만 아는 값.
// Verify JWT 는 끔(앱은 로그인 없이 씀). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 함수에 자동으로 넣어 줌.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BUCKET = "backup-photos";
const MAX_BYTES = 800 * 1024;   // 앱은 긴 변 1080px JPEG(100~200KB)로 줄여서 보냄
const MAX_FILES = 1500;         // 한 사람(기록 ID)당 보관 장수 상한
const KEY_RE = /^(wb:[A-Za-z0-9_-]{1,40}:)?\d{4}-\d{2}-\d{2}(#\d{1,15})?$/;
let bucketReady = false;

const enc = (k: string) => btoa(k).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s: string) => { try { return atob(s.replace(/-/g, "+").replace(/_/g, "/")); } catch { return ""; } };

async function ensureBucket() {
  if (bucketReady) return;
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_BYTES, allowedMimeTypes: ["image/jpeg"] });
  bucketReady = true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let p: { a?: string; reader?: string; key?: string; data?: string };
  try { p = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const reader = String(p.reader ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(reader)) return json({ error: "reader" }, 400);
  const lg = await db.from("reading_logs").select("id").eq("reader", reader).limit(1);
  if (lg.error) return json({ error: lg.error.message }, 500);
  if (!(lg.data ?? []).length) {
    const bk = await db.from("reader_backups").select("reader").eq("reader", reader).maybeSingle();
    if (bk.error) return json({ error: bk.error.message }, 500);
    if (!bk.data) return json({ error: "noreader" }, 403);
  }
  await ensureBucket();
  const st = db.storage.from(BUCKET);

  if (p.a === "list") {
    const { data, error } = await st.list(reader, { limit: MAX_FILES, sortBy: { column: "name", order: "asc" } });
    if (error) return json({ error: error.message }, 500);
    const names = (data ?? []).filter((f) => f.name.endsWith(".jpg")).map((f) => f.name);
    if (!names.length) return json({ files: [] });
    const signed = await st.createSignedUrls(names.map((n) => reader + "/" + n), 3600);
    if (signed.error) return json({ error: signed.error.message }, 500);
    const files = (signed.data ?? []).map((s, i) => ({ key: dec(names[i].slice(0, -4)), url: s.signedUrl })).filter((f) => KEY_RE.test(f.key) && f.url);
    return json({ files });
  }

  const key = String(p.key ?? "");
  if (!KEY_RE.test(key)) return json({ error: "key" }, 400);
  const path = reader + "/" + enc(key) + ".jpg";

  if (p.a === "del") {
    const { error } = await st.remove([path]);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (p.a === "put") {
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(String(p.data ?? "")), (c) => c.charCodeAt(0)); } catch { return json({ error: "data" }, 400); }
    if (bytes.length < 100 || bytes.length > MAX_BYTES || bytes[0] !== 0xff || bytes[1] !== 0xd8) return json({ error: "data" }, 400);
    const cur = await st.list(reader, { limit: MAX_FILES + 1 });
    if ((cur.data ?? []).length >= MAX_FILES) return json({ error: "full" }, 413);
    const { error } = await st.upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }
  return json({ error: "action" }, 400);
});
