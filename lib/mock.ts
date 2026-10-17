// MODE DEMO: dipakai otomatis kalau AI_ROUTER_API_KEY belum diisi.
// Semua respon berbentuk sama seperti router OpenAI-compatible biar UI bisa dites penuh.

const MODELS = [
  { id: "demo-chat-pro", object: "model", owned_by: "router-demo", created: 1730000000 },
  { id: "demo-chat-mini", object: "model", owned_by: "router-demo", created: 1730000001 },
  { id: "demo-vision-xl", object: "model", owned_by: "router-demo", created: 1730000002 },
  { id: "demo-image-v2", object: "model", owned_by: "router-demo", created: 1730000003 },
  { id: "demo-video-turbo", object: "model", owned_by: "router-demo", created: 1730000004 },
];

export function mockModels() {
  return { object: "list", data: MODELS };
}

export function mockSvg(prompt: string, i: number) {
  const hues = ["#262220", "#3a3531", "#4a443e"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <rect width="768" height="768" fill="#EDEBE4"/>
  <circle cx="${200 + i * 120}" cy="260" r="180" fill="${hues[i % 3]}" opacity="0.9"/>
  <circle cx="520" cy="500" r="230" fill="none" stroke="#262220" stroke-width="3" opacity="0.35"/>
  <rect x="80" y="560" width="608" height="4" rx="2" fill="#262220" opacity="0.25"/>
  <text x="80" y="640" font-family="system-ui,sans-serif" font-size="30" font-weight="800" fill="#262220">${escapeXml(prompt.slice(0, 34) || "demo image")}</text>
  <text x="80" y="680" font-family="system-ui,sans-serif" font-size="18" fill="#8a857c">mode demo — set AI_ROUTER_API_KEY untuk hasil asli</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function mockImages(prompt: string, n: number) {
  const data = Array.from({ length: Math.max(1, Math.min(n || 1, 4)) }, (_, i) => ({
    url: mockSvg(prompt, i),
    revised_prompt: prompt,
  }));
  return { created: Math.floor(Date.now() / 1000), data };
}

const MOCK_REPLY = [
  "Halo! Aku balas dari **mode demo** router console ini.",
  "",
  "Begitu `AI_ROUTER_API_KEY` diisi di environment variables, semua panel (chat, model, foto, video) langsung menembak ke router kamu yang asli.",
  "",
  "Contoh blok kode dengan highlight:",
  "",
  "```ts",
  "const res = await fetch('/api/proxy/chat', {",
  "  method: 'POST',",
  "  body: JSON.stringify({ model, messages }),",
  "});",
  "const text = await res.text();",
  "```",
  "",
  "| Panel | Fungsi |",
  "|---|---|",
  "| Chat | streaming + highlight kode |",
  "| Model | cek daftar & latency |",
  "| Foto / Video | generate + export ZIP |",
  "",
  "> Semua setting endpoint bisa diganti dari panel Setting. Full custom.",
].join("\n");

export async function* mockStream() {
  const tokens = MOCK_REPLY.split(/(\s+)/);
  for (const t of tokens) {
    yield `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`;
    await sleep(18);
  }
  yield "data: [DONE]\n\n";
}

export function mockChatJson() {
  return { choices: [{ message: { role: "assistant", content: MOCK_REPLY } }] };
}

export function mockVideoCreate() {
  return { id: "mock-" + Date.now(), status: "queued", progress: 0, created_at: Date.now() };
}

export function mockVideoStatus(id: string) {
  const created = Number(id.replace("mock-", "")) || Date.now();
  const elapsed = (Date.now() - created) / 1000;
  if (elapsed < 3) return { id, status: "queued", progress: 10 };
  if (elapsed < 7) return { id, status: "running", progress: Math.min(90, Math.round((elapsed / 7) * 100)) };
  return {
    id,
    status: "succeeded",
    progress: 100,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
