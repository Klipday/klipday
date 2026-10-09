# Klipday

Marketplace dua arah yang menghubungkan brand dan kreator video pendek (clippers) di Indonesia berbasis imbalan penayangan nyata (Pay-per-View / CPM).

> **Dokumentasi Visual Lengkap**: Buka file [`documentation.html`](file:///C:/Projects/klipday/documentation.html) langsung di browser Anda untuk membaca panduan interaktif dengan tata letak visual, alur diagram peran, dan navigasi yang lebih nyaman.

---

## Tentang Klipday

### Solusi Pemasaran Organik & Peluang Monetisasi Kreator
Klipday adalah platform marketplace yang menjembatani pemilik bisnis (brand dan UMKM) dengan para kreator konten video pendek (clippers). Brand dapat membuat kampanye promosi untuk produk fisik, konten digital, maupun layanan/jasa dengan anggaran yang diamankan dalam sistem escrow. Para kreator bergabung ke dalam kampanye, memproduksi video klip promosi, dan mengunggahnya ke akun TikTok pribadi mereka. Penghasilan kreator dihitung secara transparan berdasarkan jumlah tayangan terverifikasi (verified views), memastikan brand hanya membayar untuk hasil nyata dan kreator mendapat jaminan pembayaran atas karya mereka.

---

## Peran Pengguna

### Sistem Akses Berbasis Peran (Roles)
Platform memisahkan hak akses dan navigasi ke dalam tiga peran utama:

- **Brand**: Pemilik produk, bisnis, atau agensi yang mendanai kampanye melalui dompet digital, menentukan brief kreatif dan tarif CPM, serta mengulas video yang masuk.
- **Creator (Clipper)**: Pengguna yang mengedit dan mendistribusikan video promosi ke akun TikTok pribadi mereka untuk mendapatkan kompensasi per tayangan.
- **Admin**: Tim internal platform yang memverifikasi kampanye baru, meninjau permohonan isi ulang saldo/pencairan dana, dan mengelola penyelesaian akhir (settlement).

---

## Cara Kerja Platform

### Alur Kerja untuk Brand
1. **Isi Ulang Saldo**: Brand mengisi dompet saldo melalui transfer bank atau QRIS.
2. **Buat Kampanye**: Mengisi detail kampanye, brief kreatif, materi video mentah, serta parameter kompensasi (tarif CPM, batas minimum views, batas maksimum views, dan total anggaran).
3. **Kunci Anggaran di Escrow**: Anggaran kampanye dikunci secara aman di rekening escrow saat kampanye disubmit.
4. **Kurasi Pengajuan**: Brand meninjau video yang diajukan oleh kreator (Setujui, Minta Revisi, atau Tolak).
5. **Laporan & Hasil**: Anggaran terdistribusi otomatis sesuai performa penayangan video yang valid.

### Alur Kerja untuk Kreator
1. **Pilih Kampanye**: Menemukan kampanye yang sesuai di marketplace dan mengunduh materi yang disediakan.
2. **Verifikasi Akun TikTok**: Menghubungkan akun TikTok melalui kode verifikasi sementara (`KD-XXXX`) di bio profil untuk memastikan kepemilikan akun.
3. **Unggah Video ke TikTok**: Mengedit video dan mengunggahnya langsung ke akun TikTok pribadi sesuai panduan brief (Post-First Model).
4. **Kirim Video di Klipday**: Memilih video dari daftar profil atau menempelkan link video live ke dialog pengajuan di platform.
5. **Dapatkan Pembayaran**: Setelah video disetujui, setiap tayangan valid dikonversi menjadi penghasilan sesuai tarif CPM kampanye.

---

## Fitur yang Sudah Terimplementasi

### Modul Fungsional Utama
- **Autentikasi & Otorisasi**: Pendaftaran dan login dengan email dan kata sandi yang di-hash aman via Bcrypt. Sesi diamankan dengan HTTP-only cookie dan JWT dengan proteksi peran otomatis.
- **Dompet Brand & Sistem Escrow**: Manajemen saldo terintegrasi, riwayat transaksi, permintaan top-up, permintaan penarikan dana (withdrawal), dan penguncian anggaran kampanye secara otomatis.
- **Wizard Pembuatan Kampanye 6 Langkah**: Alur terstruktur untuk brand mulai dari Informasi Dasar, Brief & Pedoman Konten, Skema Imbalan CPM/Views, Unggah Aset Materi, Rangkuman Ulasan, hingga Pembayaran Escrow via saldo dompet.
- **Verifikasi Akun TikTok Anti-Pembajakan**: Handshake satu kali menggunakan kode token sementara di bio TikTok untuk memastikan kreator benar-benar pemilik akun, dengan proteksi keunikan akun di tingkat database (`unique([platform, username])`).
- **Dialog Pengajuan Video Terintegrasi**: Modal 2-kolom langsung pada halaman detail kampanye (Konfirmasi Brief -> Cek Akun TikTok -> Pemilih Video Galeri TikTok / Link URL -> Pratinjau & Kirim).
- **Antrean Kurasi Pengajuan**: Antarmuka review bagi brand untuk menyetujui video, meminta revisi dengan catatan terstruktur, atau menolak pengajuan.

---

## Teknologi yang Digunakan

### Backend (`backend/`)
- **Runtime**: Node.js & TypeScript
- **Framework Web**: Express 5.1
- **Database & ORM**: PostgreSQL (Supabase) dengan Prisma ORM 7.9
- **Validasi Data**: Zod 4.4
- **Keamanan**: Helmet, CORS, Cookie-parser, Bcrypt, JsonWebToken

### Frontend (`frontend/`)
- **Library UI**: React 19 & TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Manajemen State & Data**: TanStack Query v5 & Axios
- **Formulir**: React Hook Form & Zod
- **Komponen Desain**: Radix UI & shadcn/ui
- **Navigasi**: React Router v8 (Data Router dengan Code Splitting)

---

## Struktur Proyek

### Organisasi Berbasis Fitur (Feature Modules)
```text
klipday/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Skema basis data PostgreSQL
│   ├── src/
│   │   ├── features/            # Modul fitur mandiri (auth, campaign, wallet, submission, social-account)
│   │   ├── middleware/          # Penanganan error & auth guard
│   │   ├── app.ts               # Setup Express & registrasi rute
│   │   └── index.ts             # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/ui/       # Primitif UI bersama (shadcn/ui, Radix)
│   │   ├── features/            # Modul fitur frontend (auth, campaign, dashboard, submission, wallet)
│   │   ├── lib/                 # Konfigurasi client API & utilitas
│   │   ├── App.tsx              # Router & layout orchestrator
│   │   └── main.tsx             # Entry point React
│   ├── vite.config.ts           # Konfigurasi Vite & proxy backend
│   └── package.json
│
├── documentation.html           # Dokumentasi web interaktif mandiri
└── README.md                    # Dokumentasi utama repositori
```

---

## Panduan Instalasi & Menjalankan Proyek

### 1. Persiapan
Pastikan komputer Anda memiliki Node.js (>= 20.x), npm, dan akses ke database PostgreSQL (lokal atau cloud Supabase).

### 2. Menjalankan Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```
Server backend akan berjalan di `http://localhost:3000`.

### 3. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplikasi web akan berjalan di `http://localhost:5173` dengan proxy otomatis ke backend.

---

## Rencana Fitur Lanjutan (Roadmap)

### Pengembangan Tahap Berikutnya
- **Dukungan Platform Tambahan**: Integrasi pengajuan video untuk Instagram Reels dan YouTube Shorts.
- **Pencairan Saldo Otomatis**: Integrasi payment gateway untuk pencairan dana otomatis ke bank lokal Indonesia dan e-wallet.
- **Pelacakan Tayangan Otomatis**: Mesin pengumpul tayangan video harian otomatis dengan audit deteksi kecurangan tayangan (view fraud detection).
