/**
 * E2E: Supabase email/password session → Cloudinary upload → optimized delivery.
 *
 *   dotenv -e .env.live -- tsx scripts/smoke-cloudinary-upload-api.ts
 *
 * Expects Next.js on BASE_URL (default http://localhost:3000).
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = (process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local").trim().toLowerCase();
const PASSWORD = process.env.CONSOLE_E2E_PASSWORD || "BrieflyE2E!2026";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY required");
  }

  console.log("1) Sign in with Supabase Auth");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Sign-in failed: ${error?.message || "no session"}`);
  }
  console.log("   session ok for", EMAIL);

  console.log("2) Exchange access token for console cookies");
  const bridge = await fetch(`${BASE_URL}/api/console/session/bridge`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }),
  });
  const bridgeBody = await bridge.json().catch(() => ({}));
  if (!bridge.ok) {
    throw new Error(`Bridge failed HTTP ${bridge.status}: ${JSON.stringify(bridgeBody)}`);
  }
  const rawCookies = typeof bridge.headers.getSetCookie === "function"
    ? bridge.headers.getSetCookie()
    : [];
  const cookie = rawCookies.map((line) => line.split(";")[0]).join("; ")
    || (bridge.headers.get("set-cookie") || "").split(",")
      .map((part) => part.split(";")[0].trim())
      .filter((part) => part.includes("="))
      .join("; ");
  if (!cookie) throw new Error("No cookies returned from session bridge");

  const form = new FormData();
  form.append("file", new Blob([PNG_1X1], { type: "image/png" }), "e2e.png");
  form.append("folder", "briefly-newsstream/uploads");

  console.log("3) POST /api/console/uploads");
  const upload = await fetch(`${BASE_URL}/api/console/uploads`, {
    method: "POST",
    headers: { Origin: BASE_URL, Cookie: cookie },
    body: form,
  });
  const uploadBody = await upload.json().catch(() => ({})) as {
    ok?: boolean;
    item?: { optimizedUrl?: string; publicId?: string };
  };
  if (!upload.ok || !uploadBody.ok || !uploadBody.item?.optimizedUrl) {
    throw new Error(`Upload failed HTTP ${upload.status}: ${JSON.stringify(uploadBody)}`);
  }
  console.log("   publicId:", uploadBody.item.publicId);

  const delivered = await fetch(uploadBody.item.optimizedUrl);
  if (!delivered.ok) throw new Error(`Delivery HTTP ${delivered.status}`);
  console.log(`4) Delivery OK ${delivered.status}`);

  const denied = await fetch(`${BASE_URL}/api/console/uploads`, {
    method: "POST",
    headers: { Origin: BASE_URL },
    body: form,
  });
  if (denied.status !== 401) {
    throw new Error(`Expected 401 without cookie, got ${denied.status}`);
  }
  console.log("5) Unauthorized 401 as expected");
  console.log("\nCloudinary upload API smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
