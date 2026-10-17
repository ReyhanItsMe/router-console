import { DEFAULT_CONFIG, RouterConfig, joinUrl } from "./config";

// Baca konfigurasi router: default dari env, bisa dioverride per-request
// lewat header x-router-config (JSON ter-encode) dari panel Setting.
export function readConfig(req: Request) {
  let override: Partial<RouterConfig> = {};
  const h = req.headers.get("x-router-config");
  if (h) {
    try {
      override = JSON.parse(decodeURIComponent(h));
    } catch {}
  }

  let extraHeaders: Record<string, string> = {};
  if (process.env.AI_ROUTER_EXTRA_HEADERS) {
    try {
      extraHeaders = JSON.parse(process.env.AI_ROUTER_EXTRA_HEADERS);
    } catch {}
  }

  const cfg: RouterConfig = {
    ...DEFAULT_CONFIG,
    baseUrl: process.env.AI_ROUTER_BASE_URL || DEFAULT_CONFIG.baseUrl,
    extraHeaders,
    ...clean(override),
  };

  // Key dari browser (panel Setting) menang atas env server.
  const key = cfg.apiKey || process.env.AI_ROUTER_API_KEY || "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
    ...(cfg.extraHeaders || {}),
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  return { ...cfg, key, headers, url: (p: string) => joinUrl(cfg.baseUrl, p) };
}

function clean(o: Partial<RouterConfig>): Partial<RouterConfig> {
  const out: Partial<RouterConfig> = {};
  (Object.keys(o) as (keyof RouterConfig)[]).forEach((k) => {
    const v = o[k];
    if (v !== undefined && v !== null && v !== "") (out as any)[k] = v;
  });
  return out;
}
