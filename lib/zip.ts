"use client";

import JSZip from "jszip";
import { downloadBlob, stamp, urlToBlob } from "./client";

export type ChatMsg = { role: string; content: string };

export function chatToMarkdown(msgs: ChatMsg[], model: string) {
  const head = `# Export obrolan\n\n- Model: \`${model}\`\n- Waktu: ${new Date().toLocaleString("id-ID")}\n\n---\n\n`;
  return (
    head +
    msgs
      .map((m) => `### ${m.role === "user" ? "Kamu" : "Asisten"}\n\n${m.content}\n`)
      .join("\n---\n\n")
  );
}

export async function exportChatZip(msgs: ChatMsg[], model: string) {
  const zip = new JSZip();
  const folder = zip.folder("obrolan")!;
  folder.file("obrolan.md", chatToMarkdown(msgs, model));
  folder.file("obrolan.json", JSON.stringify({ model, exportedAt: new Date().toISOString(), messages: msgs }, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `obrolan-${stamp()}.zip`);
}

export async function exportMediaZip(
  items: { url?: string; b64?: string; prompt: string; kind?: "foto" | "video" }[],
  kind: "foto" | "video"
) {
  const zip = new JSZip();
  const folder = zip.folder(kind)!;
  folder.file("prompts.txt", items.map((i, n) => `${n + 1}. ${i.prompt}`).join("\n"));
  let idx = 0;
  for (const it of items) {
    idx++;
    if (it.b64) {
      folder.file(`${kind}-${idx}.png`, it.b64.replace(/^data:[^;]+;base64,/, ""), { base64: true });
    } else if (it.url) {
      const blob = await urlToBlob(it.url);
      if (blob) {
        const ext = guessExt(it.url, blob.type, kind);
        folder.file(`${kind}-${idx}.${ext}`, blob);
      } else {
        folder.file(`${kind}-${idx}.url.txt`, it.url);
      }
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${kind}-${stamp()}.zip`);
}

export async function exportAllZip(payload: Record<string, unknown>) {
  const zip = new JSZip();
  zip.file("README.txt", "Export lengkap Router Console — " + new Date().toLocaleString("id-ID"));
  zip.file("setting-dan-riwayat.json", JSON.stringify(payload, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `router-console-${stamp()}.zip`);
}

function guessExt(url: string, mime: string, kind: string) {
  const fromMime = mime.split("/")[1]?.split(";")[0];
  if (fromMime && fromMime.length <= 5 && !fromMime.includes("octet")) return fromMime === "svg+xml" ? "svg" : fromMime;
  const m = url.match(/\.(png|jpe?g|webp|gif|svg|mp4|webm|mov)(\?|$)/i);
  if (m) return m[1].replace("jpeg", "jpg");
  return kind === "video" ? "mp4" : "png";
}
