# Shin Nihongo JLPT N5 LMS

Aplikasi latihan soal React + Vite dari PDF Shin Nihongo 500 Mon N4-N5.

## Fitur

- Login/daftar cukup dengan username.
- Progress dan poin disimpan per user.
- Admin khusus username `xzennt`.
- Dashboard admin untuk melihat user, poin, jawaban benar/salah, dan progress Week/Day.
- Deploy-ready untuk Vercel dengan API serverless.

## Development

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Buka `http://127.0.0.1:5173/`.

## Deploy ke Vercel

Project ini bisa dideploy sebagai Vite app di Vercel.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Serverless Database

Untuk membuat dashboard admin bisa melihat semua user dari device berbeda, tambahkan Redis serverless dari Vercel Marketplace, misalnya Upstash Redis.

Set environment variable berikut di Vercel:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Jika env Redis belum tersedia, aplikasi tetap berjalan dengan fallback `localStorage`, tetapi data hanya terlihat di browser yang sama.
