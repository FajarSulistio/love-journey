# Our Love Journey — versi Vercel

## Apa yang berubah

Sebelumnya web ini static (HTML doang) dan datanya nembak langsung ke Supabase
dari browser pakai anon key yang ke-hardcode di kode. Kemungkinan besar itu
sebab foto "gak masuk": kalau bucket Storage di Supabase belum di-set public /
policy insert-nya belum diizinkan buat anon key, upload foto gagal diam-diam,
terus kodenya fallback nyimpen fotonya sebagai base64 di localStorage —
jadi cuma nyangkut di HP/browser itu doang, gak ke-sync ke device lain.

Sekarang:

- **Hosting**: static file (`index.html`, `manifest.json`, `sw.js`) + serverless
  functions di folder `api/` → jalan di Vercel, jadi "dinamis" (ada backend
  beneran, bukan cuma file statis kayak GitHub Pages).
- **Foto**: upload langsung dari browser ke **Vercel Blob** (lewat
  `api/upload.js` yang cuma nerbitin token, filenya sendiri gak lewat server
  jadi gak kena limit 4.5MB). Ini juga sekalian aman — gak ada API key yang
  nempel di kode kayak sebelumnya.
- **Data lain** (checklist, catatan, love letter) disimpan sebagai satu file
  JSON kecil di Blob storage juga, lewat `api/data.js`.
- `api/migrate.js` — buat sekali pakai, narik data lama dari Supabase (yang
  behasil kesimpen) ke sistem baru. Boleh dihapus setelah dipakai.

## Struktur

```
index.html       ← frontend (sama persis tampilannya, cuma bagian simpan data diganti)
manifest.json
sw.js
api/
  data.js        ← GET/POST checklist + catatan + love letter
  upload.js      ← generate token buat client upload foto ke Blob
  delete-photo.js
  migrate.js     ← one-time import dari Supabase lama (boleh dihapus nanti)
package.json
```

## Cara deploy

1. **Push ke GitHub** (repo baru atau replace yang lama).

2. **Import ke Vercel**: vercel.com → New Project → pilih repo ini. Framework
   preset biarin "Other", gak perlu build command apa-apa.

3. **Aktifin Vercel Blob** (ini gantiin Supabase):
   - Di project Vercel → tab **Storage** → **Create Database** → pilih **Blob**.
   - Connect ke project ini. Vercel otomatis nambahin env var
     `BLOB_READ_WRITE_TOKEN` — gak perlu isi manual.

4. **Deploy**. Setelah selesai, buka domain Vercel-nya, harusnya langsung
   jalan dengan data kosong (fresh start).

## Migrasi data lama dari Supabase (opsional, sekali doang)

Kalau mau narik checklist/catatan yang udah ada dari Supabase lama:

1. Di project Vercel → **Settings → Environment Variables**, tambahin
   `MIGRATE_SECRET` = terserah string rahasia apa aja (misal `pindahin123`).
   Redeploy biar env var kepakai.
2. Buka `https://domain-kamu.vercel.app/api/migrate?secret=pindahin123` sekali
   di browser.
3. Kalau sukses bakal muncul JSON `{ "ok": true, "migratedDates": ... }`.
4. Setelah itu, boleh hapus file `api/migrate.js` dan env var `MIGRATE_SECRET`,
   terus push ulang.

**Catatan penting**: foto yang berhasil ke-upload dulu ke Supabase URL-nya
tetap dipertahankan apa adanya (gak dipindah fisik ke Blob) — jadi tetap
nongol selama project Supabase lama gak dihapus/di-pause. Foto yang gagal
upload dan cuma nyangkut sebagai base64 di localStorage HP lama gak ikut
kebawa (soalnya emang gak pernah nyampe ke server) — itu-itu doang yang kudu
di-upload ulang manual kalau masih ada.

## Development lokal

Butuh [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

`vercel dev` yang bakal jalanin `api/*` sebagai serverless function lokal +
serve `index.html`. Buka file-nya langsung (double click) gak akan jalan
fitur simpan-datanya, karena butuh `/api/...` yang cuma ada kalau di-serve
lewat Vercel.

## Batasan kecil

- Ukuran foto dibatasin 25MB per foto (bisa diubah di `api/upload.js`,
  `maximumSizeInBytes`).
- Upload foto pakai library `@vercel/blob/client` yang di-import langsung di
  browser dari CDN esm.sh (soalnya `index.html` gak pakai bundler). Kalau
  suatu saat mau lebih rapi, ini bisa dipindah ke setup Next.js/Vite biar
  di-bundle sendiri — tapi buat sekarang ini paling minim perubahan dari kode
  aslinya.
