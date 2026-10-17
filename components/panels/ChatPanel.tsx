"use client";

import React, { useEffect, useRef, useState } from "react";
import { BigTitle, Btn, Card, Eyebrow, Field, Icon, Select, Spinner, Textarea, Input } from "../ui";
import Markdown from "../Markdown";
import { api, cfgHeader, getConfig, loadLS, saveLS, toast } from "@/lib/client";
import { useModels } from "@/lib/useModels";
import { chatToMarkdown, exportChatZip } from "@/lib/zip";
import type { ChatMsg } from "@/lib/zip";

const LS_MSGS = "aix.chat.msgs.v1";
const LS_META = "aix.chat.meta.v1";

export default function ChatPanel() {
  const { models, loading: modelsLoading } = useModels();
  const [meta, setMeta] = useState(() =>
    loadLS(LS_META, { model: "", system: "Kamu asisten yang ringkas dan membantu.", temperature: 0.7, extra: "" })
  );
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => loadLS<ChatMsg[]>(LS_MSGS, []));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdv, setShowAdv] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meta.model && models.length) setMeta((m: any) => ({ ...m, model: models[0].id }));
  }, [models, meta.model]);

  useEffect(() => {
    saveLS(LS_MSGS, msgs.slice(-60));
  }, [msgs]);
  useEffect(() => {
    saveLS(LS_META, meta);
  }, [meta]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (!meta.model) {
      toast("Pilih model dulu", "err");
      return;
    }
    setInput("");
    const history: ChatMsg[] = [
      ...(meta.system ? [{ role: "system", content: meta.system }] : []),
      ...msgs,
      { role: "user", content: text },
    ];
    const next: ChatMsg[] = [...msgs, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMsgs(next);
    setBusy(true);

    let extra: any = undefined;
    if (meta.extra.trim()) {
      try {
        extra = JSON.parse(meta.extra);
      } catch {
        toast("Param JSON tidak valid, dilewati", "err");
      }
    }

    try {
      const res = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cfgHeader() },
        body: JSON.stringify({
          model: meta.model,
          messages: history,
          stream: getConfig().stream,
          temperature: meta.temperature,
          extra,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }

      if (ct.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const l = line.trim();
            if (!l.startsWith("data:")) continue;
            const payload = l.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content ?? "";
              if (delta) {
                acc += delta;
                const snapshot = acc;
                setMsgs((m) => {
                  const copy = [...m];
                  copy[copy.length - 1] = { role: "assistant", content: snapshot };
                  return copy;
                });
              }
            } catch {}
          }
        }
        if (!acc) {
          setMsgs((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: "(balasan kosong)" };
            return copy;
          });
        }
      } else {
        const j = await res.json();
        const content = j.choices?.[0]?.message?.content || "(balasan kosong)";
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content };
          return copy;
        });
      }
    } catch (e: any) {
      toast(e?.message || "Gagal chat", "err");
      setMsgs((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  const copyLast = async () => {
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    await navigator.clipboard.writeText(last.content);
    toast("Balasan disalin", "ok");
  };

  return (
    <section>
      <Eyebrow>Playground</Eyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <BigTitle a="Ngobrol dulu." b="Kode rapi, jawaban mengalir." />
        <div className="flex gap-2 pb-1">
          <Btn variant="light" onClick={() => exportChatZip(msgs, meta.model || "model")} disabled={!msgs.length}>
            {Icon.zip} Export ZIP
          </Btn>
          <Btn
            variant="outline"
            onClick={() => {
              setMsgs([]);
              toast("Obrolan dibersihkan", "ok");
            }}
            disabled={!msgs.length}
          >
            {Icon.trash} Bersihkan
          </Btn>
        </div>
      </div>

      {/* Pengaturan cepat */}
      <Card className="mt-8 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Model">
            <Select value={meta.model} onChange={(e) => setMeta({ ...meta, model: e.target.value })}>
              {modelsLoading ? <option value="">memuat model…</option> : null}
              {!modelsLoading && !models.length ? <option value="">belum ada model</option> : null}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Btn variant="ghost" onClick={() => setShowAdv(!showAdv)}>
              {Icon.settings} {showAdv ? "Tutup opsi" : "Opsi lanjutan"}
            </Btn>
          </div>
        </div>

        {showAdv ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 animate-fadeUp">
            <Field label={`Temperatur — ${meta.temperature}`}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={meta.temperature}
                onChange={(e) => setMeta({ ...meta, temperature: Number(e.target.value) })}
                className="w-full accent-current"
              />
            </Field>
            <Field label="System prompt">
              <Textarea rows={2} value={meta.system} onChange={(e) => setMeta({ ...meta, system: e.target.value })} />
            </Field>
            <Field label="Param JSON tambahan (opsional)" hint='Contoh: {"top_p":0.9,"max_tokens":512}'>
              <Input value={meta.extra} onChange={(e) => setMeta({ ...meta, extra: e.target.value })} placeholder='{"top_p": 0.9}' className="font-mono text-xs" />
            </Field>
          </div>
        ) : null}
      </Card>

      {/* Riwayat chat */}
      <div className="mt-6 space-y-5">
        {msgs.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted font-semibold">Belum ada obrolan.</p>
            <p className="mt-2 text-sm text-muted">Kirim pesan pertama kamu — balasan muncul streaming dengan highlight kode.</p>
          </Card>
        ) : (
          msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-xl3 px-5 py-4 border shadow-soft ${
                  m.role === "user" ? "bg-ink text-bg border-transparent" : "bg-panel border-line"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed">{m.content}</p>
                ) : m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="flex items-center gap-2 text-muted text-sm">
                    <Spinner /> menulis…
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-4 mt-8">
        <Card className="p-3 shadow-pop">
          <div className="flex items-end gap-2">
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Tulis pesan… (Enter kirim, Shift+Enter baris baru)"
              className="border-0 bg-transparent focus:ring-0 focus:border-0 max-h-48"
            />
            <Btn onClick={send} disabled={busy || !input.trim()} className="shrink-0 px-6 py-4">
              {busy ? <Spinner /> : Icon.send}
            </Btn>
          </div>
          <div className="mt-1 flex items-center justify-between px-2 pb-1">
            <span className="text-[11px] text-muted font-semibold">{meta.model || "pilih model"}</span>
            <button onClick={copyLast} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted hover:text-ink transition">
              {Icon.copy} salin balasan
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}
