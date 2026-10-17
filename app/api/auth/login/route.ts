import { NextResponse } from "next/server";
import { COOKIE, credentials, isMock, makeToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = credentials();
  if (body.username === username && body.password === password) {
    const res = NextResponse.json({ ok: true, username });
    res.headers.set(
      "Set-Cookie",
      `${COOKIE}=${encodeURIComponent(makeToken(12))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}`
    );
    return res;
  }
  return Response.json({ error: "Username atau password salah." }, { status: 401 });
}

export async function GET() {
  return Response.json({ ok: false, mock: isMock() }, { status: 401 });
}
