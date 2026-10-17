import { isMock, requireAuth } from "@/lib/auth";
import { readConfig } from "@/lib/server";
import { mockModels } from "@/lib/mock";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;

  if (isMock()) return Response.json(mockModels());

  const cfg = readConfig(req);
  const started = Date.now();
  try {
    const up = await fetch(cfg.baseUrl.replace(/\/+$/, "") + cfg.modelsPath, {
      headers: cfg.headers,
      cache: "no-store",
    });
    const ms = Date.now() - started;
    if (!up.ok) {
      return Response.json({ error: `Router balas ${up.status}: ${await safeText(up)}` }, { status: up.status });
    }
    const json = await up.json();
    return Response.json({ ...json, _ms: ms });
  } catch (e: any) {
    return Response.json({ error: `Gagal menghubungi router: ${e?.message || e}` }, { status: 502 });
  }
}

async function safeText(r: Response) {
  try {
    return (await r.text()).slice(0, 400);
  } catch {
    return "";
  }
}
