"use client";

import React, { useEffect, useState } from "react";
import { BigTitle, Btn, Card, Eyebrow, Field, Icon, Input, Select, Spinner } from "../ui";
import { api, downloadBlob, loadLS, saveLS, toast, urlToBlob } from "@/lib/client";
import { useModels } from "@/lib/useModels";
import { exportMediaZip } from "@/lib/zip";

type ImgItem = { url?: string; b64?: string; prompt: string; model: string; at: number };
const LS = "aix.images.v1";

export default function ImagesPanel() {
  const { models } = useModels();
  const [form, setForm] = useState(() =>
    loadLS("aix.images.form.v1", { prompt: "", model: "", size: "1024x1024", n: 1 })
  );
  const [items, setItems] = useState<ImgItem[]>(() => loadLS<ImgItem[]>(LS, []));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!form.model && models.length) setForm((f: any) => ({ ...f, model: models[0].id }));
  }, [models, form.model]);
  useEffect(() => saveLS(LS, items.slice(0, 24)), [items]);
  useEffect(() => saveLS("aix.images.form.v1", form), [form]);

  const generate = async () => {
    if (!form.prompt.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api("/api/proxy/images", {
        method: "POST",
        body: JSON.stringify({ model: form.model, prompt: form.prompt, size: form.size, n: Number(form.n) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      const fresh: ImgItem[] = (j.data || []).map((d: any) => ({
        url: d.url,
        b64: d.b64,
        prompt: form.prompt,
        model: form.model,
        at: Date.now(),
      }));
      setItems((it) => [...fresh, ...it]);
      toast(`${fresh.length} foto jadi`, "ok");
    } catch (e: any) {
      toast(e?.message || "Gagal generate foto", "err");
    } finally {
      setBusy(false);
    }
  };

  const src = (it: ImgItem) => (it.b64 ? `data:image/png;base64,${it.b64}` : it.url || "");

  const downloadOne = async (it: ImgItem, i: number) => {
    const blob = await urlToBlob(src(it));
    if (!blob) return toast("Gagal mengunduh", "err");
    downloadBlob(blob, `foto-${i + 1}.png`);
  };

  return (
    <section>
      <Eyebrow>Studio foto</Eyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <BigTitle a="Bikin foto." b="Dari teks jadi gambar." />
        <div className="flex gap-2 pb-1">
          <Btn variant="light" onClick={() => exportMediaZip(items, "foto")} disabled={!items.length}>
            {Icon.zip} Export ZIP
          </Btn>
        </div>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <Field label="Prompt">
          <Input
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Contoh: poster minimalis krem dengan tipografi tebal…"
          />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Model">
            <Select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
              {!models.length ? <option value="">belum ada model</option> : null}
            </Select>
          </Field>
          <Field label="Ukuran">
            <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
              {["1024x1024", "1024x1536", "1536x1024", "512x512"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah">
            <Select value={String(form.n)} onChange={(e) => setForm({ ...form, n: Number(e.target.value) })}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Btn onClick={generate} disabled={busy || !form.prompt.trim()} className="mt-5 w-full py-4 text-base">
          {busy ? <Spinner /> : Icon.spark} Generate foto
        </Btn>
      </Card>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {items.map((it, i) => (
          <Card key={it.at + "-" + i} className="overflow-hidden animate-fadeUp">
            <div className="aspect-square bg-bg2 grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(it)} alt={it.prompt} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted font-semibold truncate">{it.prompt}</p>
              <button
                onClick={() => downloadOne(it, i)}
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line text-muted hover:text-ink transition"
                title="Unduh"
              >
                {Icon.download}
              </button>
            </div>
          </Card>
        ))}
        {!items.length ? (
          <Card className="p-10 text-center sm:col-span-2">
            <p className="text-muted font-semibold">Belum ada foto.</p>
            <p className="mt-2 text-sm text-muted">Hasil generate muncul di sini dan bisa di-export ZIP sekaligus.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
