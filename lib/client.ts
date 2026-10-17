"use client";

import { CONFIG_KEY, DEFAULT_CONFIG, RouterConfig, THEME_KEY } from "./config";

export function getConfig(): RouterConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: RouterConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("rc-config", { detail: cfg }));
}

export function cfgHeader(): Record<string, string> {
  return { "x-router-config": encodeURIComponent(JSON.stringify(getConfig())) };
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
}

export function setTheme(t: "light" | "dark") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("dark", t === "dark");
  window.dispatchEvent(new CustomEvent("rc-theme", { detail: t }));
}

export function applyTheme() {
  document.documentElement.classList.toggle("dark", getTheme() === "dark");
}

/* ---------- toast ---------- */
type ToastFn = (msg: string, kind?: "ok" | "err") => void;
let toastImpl: ToastFn = () => {};
export function registerToast(fn: ToastFn) {
  toastImpl = fn;
}
export const toast: ToastFn = (m, k) => toastImpl(m, k);

/* ---------- storage helper ---------- */
export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function saveLS(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/* ---------- fetch helper ---------- */
export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...cfgHeader(),
      ...(opts.headers || {}),
    },
  });
  return res;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function urlToBlob(url: string): Promise<Blob | null> {
  try {
    if (url.startsWith("data:")) {
      const res = await fetch(url);
      return await res.blob();
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
