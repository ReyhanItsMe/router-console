import { isMock, requireAuth } from "@/lib/auth";
import { readConfig } from "@/lib/server";
import { mockImages } from "@/lib/mock";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));

  if (isMock()) {
    await new Promise((r) => setTimeout(r, 900));
    return Response.json(mockImages(body.prompt || "", body.n || 1));
  }

  const cfg = readConfig(req);
  const payload = {
    model: body.model,
    prompt: body.prompt,
    n: Number(body.n || 1),
    ...(body.size ? { size: body.size } : {}),
    ...(body.extra && typeof body.extra === "object" ? body.extra : {}),
  };

  try {
    const up = await fetch(cfg.baseUrl.replace(/\/+$/, "") + cfg.imagesPath, {
      method: "POST",
      headers: { ...cfg.headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!up.ok) {
      const t = await safeText(up);
      return Response.json({ error: `Router balas ${up.status}: ${t}` }, { status: up.status });
    }
    const json = await up.json();
    return Response.json(normalize(json));
  } catch (e: any) {
    return Response.json({ error: `Gagal menghubungi router: ${e?.message || e}` }, { status: 502 });
  }
}

// Terima berbagai bentuk respon router biar fleksibel
function normalize(j: any) {
  const arr: any[] = j?.data || j?.images || j?.output || (Array.isArray(j) ? j : []);
  const data = arr.map((d) => ({
    url: d?.url || d?.image_url || d?.image || undefined,
    b64: d?.b64_json || d?.b64 || undefined,
    revised_prompt: d?.revised_prompt,
  }));
  return { created: j?.created, data, raw: j };
}

async function safeText(r: Response) {
  try {
    return (await r.text()).slice(0, 400);
  } catch {
    return "";
  }
}
