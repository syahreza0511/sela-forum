# Sela

Sela adalah forum diskusi berbahasa Indonesia untuk proyek React dengan Redux di Dicoding. Daftar thread, detail, komentar, dan leaderboard terbuka untuk pengunjung. Masuk dengan akun forum untuk menerbitkan diskusi, berkomentar, dan memberikan vote.

## Jalankan secara lokal

Gunakan Node.js 20.19+ pada lini 20 atau Node.js 22.12 ke atas. Ekstrak arsip, buka folder yang memuat `package.json`, lalu jalankan:

```sh
npm ci
npm run dev
```

Buka alamat lokal yang dicetak Vite. Aplikasi membutuhkan koneksi internet untuk mengakses [Dicoding Forum API](https://forum-api.dicoding.dev/v1/). Form daftar membuat akun forum, dan form masuk menggunakan akun tersebut.

## Pemeriksaan proyek

```sh
npm run lint
npm run build
npm run preview
```

Jalankan `preview` setelah build untuk memeriksa hasil produksi di browser. Build ditulis ke folder `dist`. Aplikasi memakai hash routing sehingga rute detail tetap bisa dibuka langsung pada hosting statis.

## Fitur

| Kriteria | Implementasi |
| --- | --- |
| Daftar dan masuk | Form terpisah, validasi input, pesan kegagalan, dan pemulihan sesi saat tab dimuat ulang |
| Daftar thread | Judul, cuplikan isi, waktu, jumlah komentar, nama dan avatar pembuat |
| Detail thread | Isi lengkap, waktu, nama dan avatar pembuat, serta daftar komentar |
| Menulis | Diskusi dan komentar dengan pemeriksaan sesi |
| Indikator loading | Indikator global, status pemuatan per halaman, dan status kirim pada form |
| Vote | Upvote, downvote, dan pembatalan vote untuk thread serta komentar. Skor dan tombol langsung berubah, lalu kembali ke nilai sebelumnya saat API gagal |
| Leaderboard | Peringkat berdasarkan data API, dengan nama, avatar, dan skor |
| Filter | Kategori dan pencarian judul diproses di frontend |

## Struktur kode

- `src/pages` memuat halaman dan `src/components` memuat komponen UI yang digunakan kembali.
- `src/state` memuat Redux Toolkit store, slice, selector, dan thunk. Loader rute serta event form men-dispatch thunk.
- `src/lib/api.js` menyimpan kontrak permintaan ke Dicoding Forum API. `src/lib/format.js` menangani tampilan tanggal, cuplikan, dan sanitasi HTML.
- `src/main.jsx` mengaktifkan React Strict Mode. ESLint memakai [Dicoding Academy JavaScript Style Guide](https://github.com/dicodingacademy/javascript-style-guide).

## Keputusan desain

Sela memakai identitas visual hijau pinus, kartu diskusi, dan navigasi bawah di layar kecil. Pencarian judul merupakan tambahan di luar rubrik. Vite menangani bundling dan server pengembangan.
