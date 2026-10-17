# router console

Panel pribadi untuk **AI router kamu sendiri** — React + Next.js + Tailwind, siap deploy ke **Vercel tanpa terminal**.

Fitur:

- 🔐 **Login** pakai akun dari environment variables (`APP_USERNAME` / `APP_PASSWORD`). Sesi pakai cookie HttpOnly bertanda tangan HMAC.
- 🔑 **API key router aman di server** — browser tidak pernah melihat key-nya. Semua permintaan lewat proxy `/api/proxy/*`.
- 💬 **Chat** dengan streaming, markdown, **highlight kode** + tombol salin per blok kode, system prompt, temperatur, dan param JSON bebas.
- 🧩 **Cek model** — daftar model, latency, pencarian, dan tes ping per model.
- 🖼️ **Bikin foto** — prompt, ukuran, jumlah; galeri + unduh satuan.
- 🎬 **Bikin video** — buat job, polling status otomatis tiap 3 detik, player + progress bar.
- 🗜️ **Export ZIP** — obrolan (`.md` + `.json`), semua foto, semua video, atau export lengkap satu klik (pakai JSZip, di browser).
- 🎨 **Tema krem/charcoal** (pill toggle, kartu membulat, tipografi tebal) + mode gelap. Full custom: base URL & semua path endpoint bisa diganti dari panel Setting.
- 🧪 **Mode demo otomatis** kalau `AI_ROUTER_API_KEY` belum diisi — semua panel tetap bisa dicoba dengan data contoh.

## 0) Hubungkan ke router kamu (paling cepat, tanpa terminal)

App ini sudah berbicara format OpenAI-compatible, sama seperti curl kamu:

```bash
curl https://router.bangunweb.com/v1/chat/completions \
  -H "Authorization: Bearer bwr_live_..." \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-5.5","messages":[{"role":"user","content":"Halo"}]}'
```

Dua cara pakai AI beneran:

1. **Tempel key di app (sekali saja).** Login → panel **Setting** → kolom **API key router** → tempel `bwr_live_...` → **Simpan setting** → **Tes koneksi**. Key disimpan hanya di browser kamu dan dikirim ke server app kamu sendiri lewat HTTPS. Cocok buat coba-coba cepat.
2. **Env Vercel (paling aman, permanen).** Set `AI_ROUTER_API_KEY=bwr_live_...` dan `AI_ROUTER_BASE_URL=https://router.bangunweb.com/v1` di Vercel → Settings → Environment Variables → redeploy. Key tidak pernah menyentuh browser.

Path default sudah cocok dengan router di atas (`/models`, `/chat/completions`, `/images/generations`, `/videos/generations`, `/videos/{id}`). Kalau router kamu punya path image/video berbeda, ganti di panel Setting.

## 1) Set environment variables

Di Vercel: **Project → Settings → Environment Variables**, tambahkan:

| Nama | Contoh | Wajib |
|---|---|---|
| `APP_USERNAME` | `nama-kamu` | ya |
| `APP_PASSWORD` | `password-kuat` | ya |
| `AI_ROUTER_API_KEY` | `sk-router-...` | ya (kosong = mode demo) |
| `AI_ROUTER_BASE_URL` | `https://routerkamu.com/v1` | disarankan |
| `AUTH_SECRET` | hasil `openssl rand -hex 32` | disarankan |
| `AI_ROUTER_EXTRA_HEADERS` | `{"X-Custom":"1"}` | opsional |

## 2) Deploy ke Vercel tanpa terminal

**Opsi A — lewat GitHub (paling gampang, klik-klik saja):**

1. Buat repository baru di github.com → **New repository**.
2. Upload isi folder project ini (boleh drag & drop seluruh folder `router-console` ke halaman upload GitHub; struktur folder ikut).
3. Buka vercel.com → **Add New… → Project** → **Import** repo itu.
4. Vercel otomatis detect Next.js. Masukkan env variables di langkah itu (atau nanti di Settings).
5. **Deploy**. Selesai — setiap push ke repo otomatis deploy ulang.

**Opsi B — kalau suatu saat mau pakai terminal (opsional):**

```bash
npm install
npm run dev      # lokal
npx vercel       # deploy
```

## 3) Endpoint yang dipanggil proxy

Default bergaya OpenAI-compatible (base URL sudah termasuk `/v1`):

| Fungsi | Method | Path default |
|---|---|---|
| Daftar model | GET | `/models` |
| Chat | POST | `/chat/completions` |
| Foto | POST | `/images/generations` |
| Video (buat job) | POST | `/videos/generations` |
| Video (status) | GET | `/videos/{id}` |

Kalau router kamu pakai path berbeda, **tidak perlu ubah kode**: buka panel **Setting** di aplikasi dan ganti path-nya (tersimpan di browser), atau set env-nya. Respon dengan bentuk berbeda pun dinormalisasi otomatis (field `data`, `images`, `output`, `video_url`, `status`, dll.).

## Struktur singkat

```
app/
  api/auth/*        login, me, logout (cookie HttpOnly)
  api/status        info mode demo
  api/proxy/*       proxy ke router (key di server)
components/         UI bertema + panel (Chat, Models, Images, Videos, Settings)
lib/                auth HMAC, config, mock demo, zip export
```

## Lokal

```bash
cp .env.example .env.local   # isi username/password
npm install
npm run dev
```

Login dengan nilai `APP_USERNAME` / `APP_PASSWORD` yang kamu isi.
