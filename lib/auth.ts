import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE = "rc_session";

function secret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.AI_ROUTER_API_KEY ||
    process.env.APP_PASSWORD ||
    "router-console-dev-secret"
  );
}

export function makeToken(ttlHours = 12) {
  const exp = Date.now() + ttlHours * 3600_000;
  const sig = createHmac("sha256", secret()).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyToken(token: string) {
  try {
    const [exp, sig] = token.split(".");
    if (!exp || !sig) return false;
    if (Date.now() > Number(exp)) return false;
    const expect = createHmac("sha256", secret()).update(exp).digest("hex");
    const a = Buffer.from(expect);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function readSession(req: Request): boolean {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  return verifyToken(decodeURIComponent(m[1]));
}

export function requireAuth(req: Request): Response | null {
  if (readSession(req)) return null;
  return Response.json({ error: "Belum login. Masuk dulu ya." }, { status: 401 });
}

export function credentials() {
  return {
    username: process.env.APP_USERNAME || "admin",
    password: process.env.APP_PASSWORD || "admin",
  };
}

export function isMock() {
  return !process.env.AI_ROUTER_API_KEY;
}
