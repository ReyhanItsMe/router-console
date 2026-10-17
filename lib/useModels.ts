"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

export type ModelInfo = { id: string; owned_by?: string; created?: number };

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [ms, setMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const started = Date.now();
    try {
      const res = await api("/api/proxy/models");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const list: any[] = json.data || json.models || (Array.isArray(json) ? json : []);
      setModels(
        list.map((m) => ({
          id: m.id || m.name || m.model_name || String(m),
          owned_by: m.owned_by || m.owner || m.creator,
          created: m.created,
        }))
      );
      setMs(json._ms ?? Date.now() - started);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat model");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("rc-config", onChange);
    return () => window.removeEventListener("rc-config", onChange);
  }, [load]);

  return { models, ms, loading, error, reload: load };
}
