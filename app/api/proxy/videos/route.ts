import { isMock, requireAuth } from "@/lib/auth";
import { readConfig } from "@/lib/server";
import { mockVideoCreate } from "@/lib/mock";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST = buat job video baru. GET ?id=... = cek status job.
export async function POST(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));

  if (isMock()) return Response.json(mockVideoCreate());

  const cfg = readConfig(req);
  const payload = {
    model: body.model,
    prompt: body.prompt,
    ...(body.seconds ? { seconds: Number(body.seconds) } : {}),
    ...(body.size ? { size: body.size } : {}),
    ...(body.extra && typeof body.extra === "object" ? body.extra : {}),
  };

  try {
    const up = await fetch(cfg.baseUrl.replace(/\/+$/, "") + cfg.videosPath, {
      method: "POST",
      headers: { ...cfg.headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!up.ok) {
      const t = await safeText(up);
      return Response.json({ error: `Router balas ${up.status}: ${t}` }, { status: up.status });
    }
    return Response.json(await up.json());
  } catch (e: any) {
    return Response.json({ error: `Gagal menghubungi router: ${e?.message || e}` }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "Param id wajib." }, { status: 400 });

  if (isMock()) {
    const { mockVideoStatus } = await import("@/lib/mock");
    return Response.json(mockVideoStatus(id));
  }

  const cfg = readConfig(req);
  const path = cfg.videoStatusPath.replace("{id}", encodeURIComponent(id));
  try {
    const up = await fetch(cfg.baseUrl.replace(/\/+$/, "") + path, {
      headers: cfg.headers,
      cache: "no-store",
    });
    if (!up.ok) {
      const t = await safeText(up);
      return Response.json({ error: `Router balas ${up.status}: ${t}` }, { status: up.status });
    }
    const j = await up.json();
    return Response.json(normalize(j));
  } catch (e: any) {
    return Response.json({ error: `Gagal menghubungi router: ${e?.message || e}` }, { status: 502 });
  }
}

function normalize(j: any) {
  const status =
    j?.status || j?.state || j?.data?.status || j?.output?.status || "unknown";
  const url =
    j?.video_url ||
    j?.url ||
    j?.video?.url ||
    j?.data?.url ||
    j?.data?.video_url ||
    j?.output?.url ||
    j?.output?.video_url ||
    undefined;
  return {
    id: j?.id,
    status: String(status).toLowerCase(),
    progress: j?.progress,
    video_url: url,
    raw: j,
  };
}

async function safeText(r: Response) {
  try {
    return (await r.text()).slice(0, 400);
  } catch {
    return "";
  }
}
