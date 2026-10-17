import { isMock, readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!readSession(req)) {
    return Response.json({ ok: false, mock: isMock() }, { status: 401 });
  }
  return Response.json({
    ok: true,
    username: process.env.APP_USERNAME || "admin",
    mock: isMock(),
  });
}
