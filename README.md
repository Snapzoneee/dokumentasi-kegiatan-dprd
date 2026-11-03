# Sistem Informasi Dokumentasi Kegiatan DPRD Kota Banjarbaru

Aplikasi internal untuk menyimpan, mengelola, mencari, melihat, dan mengunduh dokumentasi kegiatan Sekretariat DPRD Kota Banjarbaru.

## Teknologi

- Next.js 16 App Router dan TypeScript
- Tailwind CSS, dengan komponen antarmuka modular
- SQLite dan Prisma ORM
- Autentikasi sesi JWT bertanda tangan, bcrypt untuk hash kata sandi
- React Hook Form dan Zod untuk validasi formulir
- Lucide React, date-fns, Sonner, Recharts
- Ekspor laporan XLSX tanpa dependensi Excel tambahan

## Persyaratan

- Node.js 20.9 atau lebih baru (Node 22 LTS disarankan)
- npm 10 atau lebih baru
- Ruang tulis pada folder aplikasi untuk database SQLite dan berkas foto

## Instalasi dan menjalankan

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Siapkan environment. Untuk instalasi baru salin `.env.example` menjadi `.env`, lalu ganti `AUTH_SECRET` dengan nilai acak minimal 32 karakter.

   ```bash
   Copy-Item .env.example .env
   ```

3. Buat tabel SQLite dan Prisma Client:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Buat data awal dan akun demo:

   ```bash
   npm run db:seed
   ```

5. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

Untuk membuat ulang data seed tanpa menghapus data yang sudah ada, jalankan `npm run db:seed`. Akun demo dan kegiatan contoh hanya dibuat bila belum ada. Seed menyertakan tiga foto ilustrasi PNG valid.

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `admin@banjarbarukota.go.id` | `AdminDprd2026!` |
| Petugas | `petugas@banjarbarukota.go.id` | `PetugasDprd2026!` |

Ganti kata sandi akun demo sebelum penggunaan bersama atau deployment.

## Fitur

- Dashboard statistik dan grafik enam bulan.
- CRUD kegiatan, kategori, dan akun pengguna sesuai role.
- Unggah banyak foto JPG, PNG, dan WEBP (maksimal 5 MB/foto dan 30 foto/request), dengan pemeriksaan signature berkas.
- Pencarian di SQLite berdasarkan nama kegiatan, kategori, lokasi, deskripsi, dan keterangan; filter kategori/tanggal, urutan, serta pagination.
- Galeri dengan filter, lightbox, tautan detail, dan unduhan foto.
- Rekap periode/kategori, ekspor Excel, serta cetak dari browser (pilih “Save as PDF” untuk membuat PDF).
- File foto dilayani melalui endpoint terautentikasi; metadata foto disimpan di SQLite.

## Database dan penyimpanan

- Database: `prisma/dev.db` (ditentukan oleh `DATABASE_URL=file:./dev.db` relatif terhadap `prisma/schema.prisma`).
- Foto: `storage/uploads/` (dapat diubah melalui `UPLOAD_DIR`).
- Foto tidak disimpan sebagai blob di database. Penghapusan kegiatan admin menghapus metadata melalui relasi cascade dan berkas terkait; kategori yang masih dipakai ditolak saat dihapus.
- Untuk deployment, gunakan penyimpanan persisten untuk SQLite dan foto, HTTPS, `AUTH_SECRET` yang kuat, serta backup rutin untuk database dan folder foto. Penyimpanan lokal tidak dibagikan otomatis antar-replica.

## Perintah npm

```bash
npm run dev          # server pengembangan
npm run build        # generate Prisma Client dan build production
npm run start        # jalankan build production
npm run db:generate  # generate Prisma Client
npm run db:migrate   # migrasi database pengembangan
npm run db:seed      # seed akun, kategori, kegiatan, dan foto demo
```

## Struktur utama

```text
src/app/          App Router pages dan API handlers
src/components/   Shell, form, daftar, galeri, dan halaman interaktif
src/lib/          Prisma, autentikasi, validasi, upload, dan format
prisma/           Skema dan seed SQLite
storage/uploads/  Foto dokumentasi lokal
```

## Hak akses

- **Admin:** semua akses, termasuk pengelolaan kategori/pengguna dan penghapusan kegiatan/foto.
- **Petugas:** menambah, mengubah, mencari, melihat, dan mengunduh kegiatan/foto; tidak dapat mengelola pengguna/kategori atau menghapus kegiatan/foto.
