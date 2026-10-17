"use client";

import React, { useState } from "react";
import { BigTitle, Btn, Card, Eyebrow, Field, Icon, Input, Seg, Textarea } from "../ui";
import { getConfig, getTheme, saveConfig, setTheme, toast } from "@/lib/client";
import { DEFAULT_CONFIG, RouterConfig } from "@/lib/config";
import { exportAllZip } from "@/lib/zip";

export default function SettingsPanel({ username }: { username: string }) {
  const [cfg, setCfg] = useState<RouterConfig>(() => getConfig());
  const [headersJson, setHeadersJson] = useState(() => JSON.stringify(getConfig().extraHeaders || {}, null, 2));
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());

  const save = () => {
    let extra: Record<string, string> = {};
    try {
      extra = JSON.parse(headersJson || "{}");
    } catch {
      toast("Header JSON tidak valid", "err");
      return;
    }
    const next = { ...cfg, extraHeaders: extra };
    saveConfig(next);
    setCfg(next);
    toast("Setting tersimpan", "ok");
  };

  const reset = () => {
    saveConfig(DEFAULT_CONFIG);
    setCfg(DEFAULT_CONFIG);
    setHeadersJson("{}");
    toast("Setting di-reset ke default", "ok");
  };

  const exportEverything = async () => {
    await exportAllZip({
      username,
      config: cfg,
      chats: safeLS("aix.chat.msgs.v1"),
      images: safeLS("aix.images.v1"),
      videos: safeLS("aix.videos.v1"),
    });
    toast("Export lengkap selesai", "ok");
  };

  const clearAll = () => {
    ["aix.chat.msgs.v1", "aix.images.v1", "aix.videos.v1", "aix.chat.meta.v1", "aix.images.form.v1", "aix.videos.form.v1"].forEach((k) =>
      localStorage.removeItem(k)
    );
    toast("Riwayat lokal dibersihkan", "ok");
    setTimeout(() => location.reload(), 700);
  };

  return (
    <section>
      <Eyebrow>Setting</Eyebrow>
      <div className="mt-3">
        <BigTitle a="Atur semua." b="Full custom, tanpa ribet." />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-extrabold tracking-tight text-lg">Koneksi router</h2>
          <p className="mt-1 text-sm text-muted">
            Default dibaca dari env server. Override di sini tersimpan lokal di browser kamu saja — API key tetap di server.
          </p>
          <div className="mt-5 space-y-4">
            <Field label="Base URL">
              <Input value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} className="font-mono text-xs" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Path models">
                <Input value={cfg.modelsPath} onChange={(e) => setCfg({ ...cfg, modelsPath: e.target.value })} className="font-mono text-xs" />
              </Field>
              <Field label="Path chat">
                <Input value={cfg.chatPath} onChange={(e) => setCfg({ ...cfg, chatPath: e.target.value })} className="font-mono text-xs" />
              </Field>
              <Field label="Path images">
                <Input value={cfg.imagesPath} onChange={(e) => setCfg({ ...cfg, imagesPath: e.target.value })} className="font-mono text-xs" />
              </Field>
              <Field label="Path videos">
                <Input value={cfg.videosPath} onChange={(e) => setCfg({ ...cfg, videosPath: e.target.value })} className="font-mono text-xs" />
              </Field>
            </div>
            <Field label="Path status video" hint="Placeholder {id} diganti id job">
              <Input value={cfg.videoStatusPath} onChange={(e) => setCfg({ ...cfg, videoStatusPath: e.target.value })} className="font-mono text-xs" />
            </Field>
            <Field label="Header tambahan (JSON)">
              <Textarea rows={3} value={headersJson} onChange={(e) => setHeadersJson(e.target.value)} className="font-mono text-xs" />
            </Field>
            <Seg
              value={cfg.stream ? "on" : "off"}
              onChange={(v) => setCfg({ ...cfg, stream: v === "on" })}
              options={[
                { value: "on", label: "Streaming chat" },
                { value: "off", label: "Tanpa streaming" },
              ]}
            />
            <div className="flex gap-2 pt-1">
              <Btn onClick={save}>Simpan setting</Btn>
              <Btn variant="outline" onClick={reset}>Reset default</Btn>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="font-extrabold tracking-tight text-lg">Tampilan</h2>
            <div className="mt-4">
              <Seg
                value={theme}
                onChange={(v) => {
                  setTheme(v);
                  setThemeState(v);
                }}
                options={[
                  { value: "light", label: "Terang", icon: Icon.sun },
                  { value: "dark", label: "Gelap", icon: Icon.moon },
                ]}
              />
            </div>
            <p className="mt-4 text-sm text-muted">Tema krem/charcoal dengan pill toggle, mengikuti gaya referensi kamu.</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-extrabold tracking-tight text-lg">Akun & data</h2>
            <p className="mt-2 text-sm text-muted">
              Login sebagai <b className="text-ink font-bold">{username}</b> (dari env <code className="font-mono text-xs">APP_USERNAME</code>).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="light" onClick={exportEverything}>
                {Icon.zip} Export semua (ZIP)
              </Btn>
              <Btn variant="outline" onClick={clearAll}>
                {Icon.trash} Hapus riwayat lokal
              </Btn>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-extrabold tracking-tight text-lg">Catatan env</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
              <li><code className="font-mono text-xs">APP_USERNAME</code> / <code className="font-mono text-xs">APP_PASSWORD</code> — akun login.</li>
              <li><code className="font-mono text-xs">AI_ROUTER_API_KEY</code> — key router, dikirim server-side sebagai Bearer.</li>
              <li><code className="font-mono text-xs">AI_ROUTER_BASE_URL</code> — base URL default router.</li>
              <li><code className="font-mono text-xs">AUTH_SECRET</code> — rahasia tanda tangan sesi.</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

function safeLS(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
