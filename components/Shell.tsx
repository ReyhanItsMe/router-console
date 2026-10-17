"use client";

import React, { useEffect, useState } from "react";
import { Icon, Logo, Seg } from "./ui";
import { applyTheme, getConfig, getTheme, registerToast, setTheme } from "@/lib/client";
import ChatPanel from "./panels/ChatPanel";
import ModelsPanel from "./panels/ModelsPanel";
import ImagesPanel from "./panels/ImagesPanel";
import VideosPanel from "./panels/VideosPanel";
import SettingsPanel from "./panels/SettingsPanel";

export type Tab = "chat" | "models" | "images" | "videos" | "settings";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Chat", icon: Icon.chat },
  { id: "models", label: "Model", icon: Icon.cpu },
  { id: "images", label: "Foto", icon: Icon.image },
  { id: "videos", label: "Video", icon: Icon.video },
  { id: "settings", label: "Setting", icon: Icon.settings },
];

export default function Shell({ username, mock, onLogout }: { username: string; mock: boolean; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("chat");
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const [localKey, setLocalKey] = useState("");

  useEffect(() => {
    applyTheme();
    setThemeState(getTheme());
    setLocalKey(getConfig().apiKey || "");
    const onCfg = (e: any) => setLocalKey(e.detail?.apiKey || "");
    window.addEventListener("rc-config", onCfg);
    registerToast((msg, kind = "ok") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg, kind }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    });
    return () => window.removeEventListener("rc-config", onCfg);
  }, []);

  const switchTheme = (t: "light" | "dark") => {
    setTheme(t);
    setThemeState(t);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[68px] flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-line bg-panel p-1.5">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  tab === n.id ? "bg-ink text-bg shadow-soft" : "text-muted hover:text-ink"
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchTheme(theme === "light" ? "dark" : "light")}
              title="Ganti tema"
              className="grid place-items-center w-10 h-10 rounded-full border border-line bg-panel text-muted hover:text-ink transition"
            >
              {theme === "light" ? Icon.moon : Icon.sun}
            </button>
            <button
              onClick={() => setMenu(true)}
              className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-line bg-panel text-ink transition"
              aria-label="Buka menu"
            >
              {Icon.menu}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Overlay menu mobile (gelap, item besar — sesuai tema) ===== */}
      {menu ? (
        <div className="fixed inset-0 z-50 bg-charcoal text-cream animate-fadeIn flex flex-col">
          <div className="px-6 h-[68px] flex items-center justify-between">
            <Logo />
            <button onClick={() => setMenu(false)} aria-label="Tutup menu" className="opacity-80 hover:opacity-100">
              {Icon.close}
            </button>
          </div>
          <nav className="flex-1 px-6 pt-10 flex flex-col gap-2">
            {NAV.map((n, i) => (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setMenu(false);
                }}
                style={{ animationDelay: `${i * 60}ms` }}
                className="text-left text-5xl sm:text-6xl font-extrabold tracking-tight py-2 animate-fadeUp hover:opacity-60 transition"
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="px-6 pb-10 space-y-6">
            <Seg
              value={theme}
              onChange={(v) => switchTheme(v)}
              options={[
                { value: "light", label: "Terang", icon: Icon.sun },
                { value: "dark", label: "Gelap", icon: Icon.moon },
              ]}
              className="bg-charcoal border-cream/15 w-full justify-between"
            />
            <button onClick={logout} className="flex items-center gap-2 text-cream/60 hover:text-cream font-semibold transition">
              {Icon.logout} Keluar ({username})
            </button>
          </div>
        </div>
      ) : null}

      {/* ===== Konten ===== */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        {mock && !localKey ? (
          <div className="mb-8 rounded-2xl border border-line bg-panel px-5 py-4 text-sm text-muted animate-fadeUp flex flex-wrap items-center justify-between gap-3">
            <span>
              <b className="text-ink">Mode demo aktif.</b> Belum ada API key — tempel key router kamu sekali di Setting
              (disimpan di browser ini saja), atau set <code className="font-mono text-xs">AI_ROUTER_API_KEY</code> di env Vercel.
            </span>
            <button
              onClick={() => setTab("settings")}
              className="rounded-full bg-ink text-bg px-4 py-2 text-xs font-bold uppercase tracking-widest hover:-translate-y-0.5 transition shadow-soft"
            >
              Hubungkan router
            </button>
          </div>
        ) : null}
        <div key={tab} className="animate-fadeUp">
          {tab === "chat" ? <ChatPanel /> : null}
          {tab === "models" ? <ModelsPanel /> : null}
          {tab === "images" ? <ImagesPanel /> : null}
          {tab === "videos" ? <VideosPanel /> : null}
          {tab === "settings" ? <SettingsPanel username={username} /> : null}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted flex items-center justify-between">
        <span>router console — panel pribadi</span>
        <span className="font-mono">v1.0.0</span>
      </footer>

      {/* ===== Toasts ===== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-full px-5 py-3 text-sm font-bold shadow-pop animate-fadeUp ${
              t.kind === "err" ? "bg-charcoal text-red-300" : "bg-charcoal text-cream"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
