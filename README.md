# Sela

Sela adalah forum diskusi berbahasa Indonesia untuk proyek React dengan Redux di Dicoding. Daftar thread, detail, komentar, dan leaderboard terbuka untuk pengunjung. Masuk dengan akun forum untuk menerbitkan diskusi, berkomentar, dan memberikan vote.

## Jalankan secara lokal

Gunakan Node.js 20.19+ pada lini 20 atau Node.js 22.12 ke atas. Ekstrak arsip, buka folder yang memuat `package.json`, lalu jalankan:

```sh
npm ci
npm run dev
```

Buka alamat lokal yang dicetak Vite. Aplikasi membutuhkan koneksi internet untuk mengakses [Dicoding Forum API](https://forum-api.dicoding.dev/v1/). Form daftar membuat akun forum, dan form masuk menggunakan akun tersebut.

## Automation testing

Dari root proyek yang sama, instal Chromium untuk Playwright sekali, lalu jalankan pemeriksaan berikut.

```sh
npx playwright install chromium
npm run lint
npm test
npm run e2e
npm run build
```

`npm test` menggunakan Vitest untuk reducer dan thunk, serta React Testing Library dengan jsdom untuk komponen. Vitest memakai plugin React yang sama dengan Vite, sehingga berkas JSX bisa diuji dengan konfigurasi terpisah. `npm run e2e` menggunakan Playwright karena bisa menguji aplikasi di browser sungguhan sambil mengendalikan respons API. Perintah itu membangun aplikasi dan menjalankan server preview secara otomatis pada port 4173.

| Jenis | Lokasi | Yang diperiksa |
| --- | --- | --- |
| Reducer (5) | [forum.reducer.test.js](src/state/forum.reducer.test.js) | Status loading saat mencoba lagi, penyimpanan feed, isolasi error detail per thread, sinkronisasi jumlah komentar, dan pencegahan duplikasi |
| Thunk (5) | [forum.thunk.test.js](src/state/forum.thunk.test.js) | Pengambilan feed dan profil penulis, penanganan error, pencegahan request yang sedang berjalan, pemeriksaan sesi dan format payload penerbitan, serta rollback vote |
| Komponen React (5) | [FeedPage.test.jsx](src/pages/FeedPage.test.jsx) | Metadata thread, pemilihan kategori, pencarian judul, reset hasil kosong, dan indikator loading |
| E2E (4) | [forum.spec.js](e2e/forum.spec.js) | Login dan pemulihan sesi, login gagal, pendaftaran sampai upvote, serta filter/pencarian/leaderboard |

Keterangan skenario tersedia pada tiap berkas tes. Tes reducer memeriksa hasil fungsi reducer ketika menerima action. Tes thunk memakai store asli dan mengganti respons metode API dengan fixture. Tes komponen merender `FeedPage` bersama Redux Provider dan router, lalu memeriksa tampilan serta interaksi pengguna.

Pada E2E, browser benar-benar mengisi form, mengirim permintaan, memeriksa tampilan, berpindah rute, dan melakukan reload. Playwright mencegat permintaan HTTP ke Dicoding Forum API untuk menyediakan respons login, profil, dan forum yang konsisten. Aplikasi yang dibuka normal tetap memakai Dicoding Forum API asli.

Kode produksi memakai satu Redux store seperti sebelumnya. [store.js](src/state/store.js) mengekspor `createAppStore()` untuk membuat store terisolasi bagi setiap tes.

Build aplikasi ditulis ke folder `dist`. Jalankan `npm run preview` setelah build untuk memeriksa hasil produksi. Hash routing memungkinkan rute detail dibuka langsung pada hosting statis.

## Storybook

```sh
npm run storybook
npm run build-storybook
```

Buka alamat yang dicetak Storybook, biasanya `http://localhost:6006`. Build statis Storybook tersimpan di `storybook-static`. Konfigurasi ada di [.storybook](.storybook) dan memakai stylesheet yang sama dengan aplikasi.

- [Status permintaan](src/components/Primitives.stories.jsx) memperlihatkan `ErrorNotice` dengan props pesan dan aksi coba lagi, serta `Loading` dengan label pemuatan diskusi.
- [Peringkat](src/components/RankList.stories.jsx) memperlihatkan `RankList` dengan data contoh. Prop `compact` mengubah tampilan halaman leaderboard menjadi versi ringkas yang dipakai di beranda.

## GitHub Actions, proteksi branch, dan Vercel

[Workflow CI](.github/workflows/ci.yml) disiapkan untuk PR menuju `master` dan push ke `master`. Job `Validate Sela` memakai Node.js 24, memasang dependensi dengan lockfile, menjalankan lint dan Vitest, memasang Chromium, menjalankan Playwright, lalu membangun aplikasi dan Storybook.

Repo publik [sela-forum](https://github.com/syahreza0511/sela-forum) memakai `master` sebagai branch utama. GitHub Actions memasok status `Validate Sela` yang diwajibkan sebelum merge. Pembatasan tersebut juga berlaku untuk admin agar pemeriksaan gagal tetap menahan merge.

Pada [PR #1](https://github.com/syahreza0511/sela-forum/pull/1), satu ekspektasi reducer sengaja diubah di branch uji. [Run CI merah](https://github.com/syahreza0511/sela-forum/actions/runs/45302406370) mencatat kegagalan tes dan aturan `master` menahan merge. Setelah ekspektasi dipulihkan, [run CI hijau](https://github.com/syahreza0511/sela-forum/actions/runs/45303313691) meluluskan `Validate Sela`.

Proyek Vercel memakai preset Vite, Node.js 24, `npm ci`, `npm run build`, dan output `dist`. Dengan `master` sebagai production branch pada integrasi Git, merge PR yang lulus memicu deployment ke [domain produksi Sela](https://sela-forum.vercel.app/).

| Bukti dalam ZIP | Yang harus tampak |
| --- | --- |
| `screenshot/1_ci_check_error.png` | Check CI gagal karena tes gagal |
| `screenshot/2_ci_check_pass.png` | Check CI lulus setelah tes dipulihkan |
| `screenshot/3_branch_protection.png` | PR ke `master` tertahan oleh aturan proteksi |

Rujukan pengaturan tersedia di [GitHub branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) dan [integrasi GitHub dengan Vercel](https://vercel.com/docs/git/vercel-for-github).

## Draf catatan submission

Ganti placeholder setelah URL produksi sudah diverifikasi dan ketiga screenshot tersedia di ZIP.

> Halo Kak Reviewer, ini submission akhir saya untuk proyek Sela, aplikasi forum diskusi berbasis React dan Redux. Saya menambahkan pengujian reducer, thunk, komponen, dan alur login di browser. Saya juga menambahkan Storybook untuk melihat beberapa keadaan komponen secara terpisah.
>
> Aplikasi bisa dibuka di [URL Vercel produksi yang sudah diverifikasi]. Bukti CI gagal, CI lulus, dan proteksi branch ada di folder `screenshot/` dalam ZIP. Terima kasih, Kak.

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
