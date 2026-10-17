"use client";

import React, { useState } from "react";
import { BigTitle, Btn, Card, Eyebrow, Icon, Input, Spinner } from "../ui";
import { api, downloadBlob, stamp, toast } from "@/lib/client";
import { useModels } from "@/lib/useModels";

type TestResult = { ok: boolean; ms: number; note?: string };

export default function ModelsPanel() {
  const { models, ms, loading, error, reload } = useModels();
  const [q, setQ] = useState("");
  const [tests, setTests] = useState<Record<string, TestResult | "loading">>({});

  const filtered = models.filter((m) => m.id.toLowerCase().includes(q.toLowerCase()));

  const test = async (id: string) => {
    setTests((t) => ({ ...t, [id]: "loading" }));
    const started = Date.now();
    try {
      const res = await api("/api/proxy/chat", {
        method: "POST",
        body: JSON.stringify({
          model: id,
          messages: [{ role: "user", content: "ping" }],
          stream: false,
          max_tokens: 5,
        }),
      });
      const elapsed = Date.now() - started;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setTests((t) => ({ ...t, [id]: { ok: true, ms: elapsed } }));
      toast(`${id} siap dipakai`, "ok");
    } catch (e: any) {
      setTests((t) => ({ ...t, [id]: { ok: false, ms: Date.now() - started, note: e?.message } }));
      toast(`${id} gagal: ${e?.message}`, "err");
    }
  };

  const exportJson = () => {
    downloadBlob(
      new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), count: models.length, models }, null, 2)], {
        type: "application/json",
      }),
      `models-${stamp()}.json`
    );
    toast("Daftar model di-export", "ok");
  };

  return (
    <section>
      <Eyebrow>Models</Eyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <BigTitle a="Cek model." b="Semua daftar, satu klik." />
        <div className="flex gap-2 pb-1">
          <Btn variant="light" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : Icon.refresh} Muat ulang
          </Btn>
          <Btn variant="outline" onClick={exportJson} disabled={!models.length}>
            {Icon.download} JSON
          </Btn>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Input placeholder="Cari model…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <span className="text-sm text-muted font-semibold">
          {models.length} model{ms != null ? ` · respon ${ms} ms` : ""}
        </span>
      </div>

      {error ? (
        <Card className="mt-6 p-6 text-sm font-semibold text-red-700 dark:text-red-300">{error}</Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((m, i) => {
          const t = tests[m.id];
          return (
            <Card key={m.id} className="p-5 animate-fadeUp" >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold tracking-tight text-lg truncate">{m.id}</p>
                  <p className="mt-1 text-xs text-muted font-semibold">
                    {m.owned_by || "router"}
                    {m.created ? ` · ${new Date(m.created * 1000).getFullYear()}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border ${
                    t === "loading"
                      ? "border-line text-muted"
                      : t
                      ? t.ok
                        ? "border-line bg-chip text-emerald-700 dark:text-emerald-300"
                        : "border-line bg-chip text-red-700 dark:text-red-300"
                      : "border-line text-muted"
                  }`}
                >
                  {t === "loading" ? "tes…" : t ? (t.ok ? `ok ${t.ms}ms` : "gagal") : "belum dites"}
                </span>
              </div>
              {t && t !== "loading" && !t.ok && t.note ? (
                <p className="mt-3 text-xs text-red-700 dark:text-red-300 font-mono break-words">{t.note}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Btn variant="light" onClick={() => test(m.id)} disabled={t === "loading"} className="px-4 py-2.5 text-xs">
                  {t === "loading" ? <Spinner className="w-4 h-4" /> : Icon.spark} Tes model
                </Btn>
              </div>
            </Card>
          );
        })}
        {!loading && !filtered.length ? (
          <Card className="p-10 text-center sm:col-span-2">
            <p className="text-muted font-semibold">Tidak ada model cocok.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
