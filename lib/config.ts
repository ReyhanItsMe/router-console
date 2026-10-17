// Konfigurasi router AI — dipakai client & server.
export type RouterConfig = {
  baseUrl: string;
  modelsPath: string;
  chatPath: string;
  imagesPath: string;
  videosPath: string;
  videoStatusPath: string; // pakai {id} sebagai placeholder
  extraHeaders: Record<string, string>;
  stream: boolean;
  // Opsional: key yang disimpan di browser ini saja (override env server).
  apiKey?: string;
};

export type Status = { ok: boolean; username: string; mock: boolean };

export const DEFAULT_CONFIG: RouterConfig = {
  baseUrl: "https://api.openai.com/v1",
  modelsPath: "/models",
  chatPath: "/chat/completions",
  imagesPath: "/images/generations",
  videosPath: "/videos/generations",
  videoStatusPath: "/videos/{id}",
  extraHeaders: {},
  stream: true,
};

export const CONFIG_KEY = "aix.config.v1";
export const THEME_KEY = "aix.theme.v1";

export function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : "/" + path;
  return b + p;
}
