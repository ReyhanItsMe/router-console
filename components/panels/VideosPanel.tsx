"use client";

import React, { useEffect, useRef, useState } from "react";
import { BigTitle, Btn, Card, Eyebrow, Field, Icon, Input, Select, Spinner } from "../ui";
import { api, loadLS, saveLS, toast } from "@/lib/client";
import { useModels } from "@/lib/useModels";
import { exportMediaZip } from "@/lib/zip";

type Job = { id: string; prompt: string; model: string; status: string; progress?: number; video_url?: string; at: number; raw?: any };
const LS = "aix.videos.v1";

export default function VideosPanel() {
  const { models } = useModels();
  const [form, setForm] = useState(() => loadLS("aix.videos.form.v1", { prompt: "", model: "", seconds: "5", size: "1280x720" }));
  const [jobs, setJobs] = useState<Job[]>(() => loadLS<Job[]>(LS, []));
  const [busy, setBusy] = useState(false);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!form.model && models.length) setForm((f: any) => ({ ...f, model: models[0].id }));
  }, [models, form.model]);
  useEffect(() => saveLS(LS, jobs.slice(0, 12)), [jobs]);
  useEffect(() => saveLS("aix.videos.form.v1", form), [form]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const poll = (id: string) => {
    const tick = async () => {
      try {
        const res = await api(`/api/proxy/videos?id=${encodeURIComponent(id)}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
        setJobs((js) => js.map((x) => (x.id === id ? { ...x, status: j.status, progress: j.progress, video_url: j.video_url, raw: j.raw } : x)));
        const done = ["succeeded", "completed", "success", "failed", "error", "cancelled", "canceled"].includes(String(j.status).toLowerCase());
        if (!done) timers.current[id] = window.setTimeout(tick, 3000);
        else if (["succeeded", "completed", "success"].includes(String(j.status).toLowerCase())) toast("Video selesai", "ok");
        else if (done) toast(`Job video: ${j.status}`, "err");
      } catch (e: any) {
        setJobs((js) => js.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
        toast(e?.message || "Gagal cek status video", "err");
      }
    };
    timers.current[id] = window.setTimeout(tick, 2000);
  };

  // lanjutkan polling job yang belum selesai setelah reload
  useEffect(() => {
    jobs.forEach((j) => {
      if (!["succeeded", "completed", "success", "failed", "error", "cancelled", "canceled"].includes(j.status) && !timers.current[j.id]) {
        poll(j.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (!form.prompt.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api("/api/proxy/videos", {
        method: "POST",
        body: JSON.stringify({ model: form.model, prompt: form.prompt, seconds: form.seconds, size: form.size }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      const id = j.id || j.job_id || j.video_id;
      if (!id) throw new Error("Router tidak mengembalikan id job.");
      const job: Job = { id, prompt: form.prompt, model: form.model, status: j.status || "queued", at: Date.now() };
      setJobs((js) => [job, ...js]);
      poll(id);
      toast("Job video dibuat", "ok");
    } catch (e: any) {
      toast(e?.message || "Gagal membuat job video", "err");
    } finally {
      setBusy(false);
    }
  };

  const done = jobs.filter((j) => j.video_url);

  return (
    <section>
      <Eyebrow>Studio video</Eyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <BigTitle a="Bikin video." b="Pantau job sampai jadi." />
        <div className="flex gap-2 pb-1">
          <Btn variant="light" onClick={() => exportMediaZip(done.map((j) => ({ url: j.video_url, prompt: j.prompt, kind: "video" as const })), "video")} disabled={!done.length}>
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
            placeholder="Contoh: drone shot pantai sore, gerakan kamera lambat…"
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
          <Field label="Durasi (detik)">
            <Select value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })}>
              {["4", "5", "8", "10"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Resolusi">
            <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
              {["1280x720", "1920x1080", "720x1280"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Btn onClick={generate} disabled={busy || !form.prompt.trim()} className="mt-5 w-full py-4 text-base">
          {busy ? <Spinner /> : Icon.video} Generate video
        </Btn>
      </Card>

      <div className="mt-8 space-y-5">
        {jobs.map((j) => {
          const running = !["succeeded", "completed", "success", "failed", "error", "cancelled", "canceled"].includes(j.status);
          return (
            <Card key={j.id} className="p-5 animate-fadeUp">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{j.prompt}</p>
                  <p className="mt-1 text-xs text-muted font-mono">{j.id}</p>
                </div>
                <span className={`rounded-full border border-line px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${running ? "text-muted" : j.video_url ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {running ? <span className="flex items-center gap-2"><Spinner className="w-3.5 h-3.5" /> {j.status}</span> : j.status}
                </span>
              </div>

              {running && j.progress != null ? (
                <div className="mt-4 h-2 rounded-full bg-bg2 overflow-hidden">
                  <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${j.progress}%` }} />
                </div>
              ) : null}

              {j.video_url ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-charcoal">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={j.video_url} controls playsInline className="w-full max-h-[420px]" />
                </div>
              ) : null}

              {j.raw ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-muted hover:text-ink">
                    respon mentah router
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-chip border border-line p-4 text-xs font-mono">
                    {JSON.stringify(j.raw, null, 2)}
                  </pre>
                </details>
              ) : null}
            </Card>
          );
        })}
        {!jobs.length ? (
          <Card className="p-10 text-center">
            <p className="text-muted font-semibold">Belum ada job video.</p>
            <p className="mt-2 text-sm text-muted">Job dipolling otomatis tiap 3 detik sampai video jadi.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
