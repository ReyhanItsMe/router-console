import { requireAuth } from "@/lib/auth";
import { readConfig } from "@/lib/server";
import { mockChatJson, mockStream } from "@/lib/mock";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const cfg = readConfig(req);

  if (!cfg.key) {
    if (body.stream) {
      const enc = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of mockStream()) controller.enqueue(enc.encode(chunk));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }
    return Response.json(mockChatJson());
  }

  const payload = {
    model: body.model,
    messages: body.messages,
    stream: !!body.stream,
    ...(body.temperature != null ? { temperature: Number(body.temperature) } : {}),
    ...(body.max_tokens != null ? { max_tokens: Number(body.max_tokens) } : {}),
    ...(body.extra && typeof body.extra === "object" ? body.extra : {}),
  };

  try {
    const up = await fetch(cfg.baseUrl.replace(/\/+$/, "") + cfg.chatPath, {
      method: "POST",
      headers: { ...cfg.headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!up.ok) {
      const t = await safeText(up);
      return Response.json({ error: `Router balas ${up.status}: ${t}` }, { status: up.status });
    }

    const ct = up.headers.get("content-type") || "";
    if (ct.includes("text/event-stream") || (payload.stream && up.body)) {
      return new Response(up.body, {
        headers: {
          "Content-Type": ct.includes("text/event-stream") ? ct : "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
    return Response.json(await up.json());
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
