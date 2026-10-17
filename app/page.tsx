"use client";

import { useEffect, useState } from "react";
import Login from "@/components/Login";
import Shell from "@/components/Shell";
import type { Status } from "@/lib/config";

export default function Page() {
  const [status, setStatus] = useState<Status | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (me?.ok) {
          setStatus({ ok: true, username: me.username, mock: me.mock });
        } else {
          const st = await fetch("/api/status").then((r) => r.json());
          setStatus({ ok: false, username: "", mock: !!st?.mock });
        }
      } catch {
        setStatus({ ok: false, username: "", mock: true });
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg">
        <div className="flex items-center gap-3 text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-ink animate-blink" />
          <span className="text-xs uppercase tracking-eyebrow">memuat console</span>
        </div>
      </div>
    );
  }

  if (!status?.ok) return <Login mock={status?.mock} onDone={(username) => setStatus({ ok: true, username, mock: !!status?.mock })} />;

  return <Shell username={status.username} mock={status.mock} onLogout={() => setStatus({ ok: false, username: "", mock: status.mock })} />;
}
