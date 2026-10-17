"use client";

import React, { useEffect, useState } from "react";
import { Btn, Field, FloatChip, Icon, Input, Logo, Spinner } from "./ui";
import { applyTheme, toast } from "@/lib/client";

export default function Login({ mock, onDone }: { mock?: boolean; onDone: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    applyTheme();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast(`Selamat datang, ${json.username}`, "ok");
        onDone(json.username);
      } else {
        setErr(json.error || "Gagal masuk.");
        setBusy(false);
      }
    } catch {
      setErr("Tidak bisa menghubungi server.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink relative overflow-hidden">
      {/* dekorasi lingkaran besar seperti tema */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-bg2/80" />
      <div className="pointer-events-none absolute -bottom-56 -left-40 w-[520px] h-[520px] rounded-full bg-bg2/60" />
      <FloatChip className="absolute top-24 right-[12%] animate-floaty hidden sm:grid">{Icon.spark}</FloatChip>
      <FloatChip className="absolute bottom-28 left-[10%] animate-floaty hidden sm:grid" >{Icon.code}</FloatChip>

      <header className="relative px-6 sm:px-10 py-6">
        <Logo />
      </header>

      <main className="relative px-6 pb-20 max-w-md mx-auto mt-6 sm:mt-14 animate-fadeUp">
        <div className="flex justify-center">
          <span className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted">
            Panel pribadi AI router kamu
          </span>
        </div>

        <h1 className="mt-8 text-center text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Masuk dulu.
          <br />
          <span className="text-muted">Semua terkunci.</span>
        </h1>

        <p className="mt-6 text-center text-muted leading-relaxed">
          Akun login dibaca dari environment variables server. API key router tidak pernah keluar ke browser.
        </p>

        <form onSubmit={submit} className={`mt-10 space-y-4 ${err ? "animate-shake" : ""}`}>
          <Field label="Username">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          {err ? (
            <p className="rounded-2xl border border-line bg-chip px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
              {err}
            </p>
          ) : null}

          <Btn type="submit" disabled={busy} className="w-full py-4 text-base">
            {busy ? <Spinner /> : null}
            Masuk ke console
            <span className="translate-y-[-1px]">{Icon.arrow}</span>
          </Btn>
        </form>

        {mock ? (
          <p className="mt-8 text-center text-xs text-muted leading-relaxed">
            Mode demo aktif (AI_ROUTER_API_KEY belum diisi).
            <br />
            Login pakai nilai <code className="font-mono">APP_USERNAME</code> / <code className="font-mono">APP_PASSWORD</code> di env.
          </p>
        ) : null}
      </main>
    </div>
  );
}
