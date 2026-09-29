# Lapak Alun-Alun — Web Penjual

Dashboard untuk penjual/pedagang: kelola menu, pantau pesanan masuk, atur
profil toko + QRIS, dan cetak/unduh QR meja. Tanpa proses build (HTML/CSS/JS
polos) + Firebase (Firestore untuk data, Storage untuk foto).

## Struktur folder

Setiap layar dashboard adalah **halaman HTML sungguhan** di folder sendiri:

```
penjual-web/
├── index.html            halaman utama: masuk / daftar toko baru
├── login.js               skrip untuk index.html
├── menu/
│   ├── index.html         tambah / edit / hapus menu (+batas paket Gratis)
│   └── menu.js
├── pesanan/
│   ├── index.html         pesanan masuk, ubah status, lihat lokasi pembeli
│   └── pesanan.js
├── qr-meja/
│   ├── index.html         cetak/unduh QR meja
│   └── qr-meja.js
├── ringkasan/
│   ├── index.html         statistik ringkas (pesanan, pendapatan, rating)
│   └── ringkasan.js
├── profil/
│   ├── index.html         PUSAT PENGATURAN: foto profil toko, info toko,
│   │                      QRIS, status langganan, ganti password, keluar
│   └── profil.js          (dibuka lewat avatar bundar di pojok kanan atas)
└── shared/                 file yang dipakai bersama semua halaman di atas
    ├── firebase-config.js
    ├── storage.js
    ├── utils.js            fungsi bantu umum, ikon, QRIS dinamis, rating, dst.
    ├── categories.js        daftar kategori menu/toko
    ├── plan.js               aturan paket Gratis/Premium
    ├── cleanup.js            retensi nota pesanan 30 hari
    ├── auth-guard.js        cek sesi login di tiap halaman dashboard
    ├── nav.js                kerangka topbar (+avatar) & tab bar bawah
    ├── paths.js              BASE_PATH & fungsi pindah halaman (goTo/pageUrl)
    ├── site-config.js        alamat web PEMBELI
    └── style.css
```

Avatar bundar di pojok kanan atas (foto profil toko, atau ikon toko kalau
belum ada foto) ada di semua halaman dashboard -- diklik akan membuka
halaman **/profil/**, pusat pengaturan toko: ganti foto profil, edit info
toko, unggah QRIS, lihat status langganan, ganti password, dan keluar.
Kelola foto per-menu tetap di halaman **/menu/** (karena tiap menu punya
fotonya sendiri-sendiri), tapi ada jalan pintas ke sana dari halaman Profil.

Karena tiap halaman dashboard berdiri sendiri (bukan SPA), setiap halaman
yang butuh login memanggil `requireSellerAuth()` (dari `shared/auth-guard.js`)
di awal skripnya sendiri — kalau sesi tidak ditemukan, otomatis dilempar
balik ke halaman masuk.

## PENTING: `BASE_PATH` di `shared/paths.js`

Karena semua tombol/link di sini memakai path seperti `/menu/`, `/qr-meja/`,
dst., situs ini perlu tahu di subfolder mana dia berjalan kalau di-deploy
lewat **GitHub Pages project site** (`https://username.github.io/nama-repo/`).

Buka `shared/paths.js`:

```js
const BASE_PATH = '/penjual-web';
```

- Kalau nama repo GitHub kamu **persis** `penjual-web`, biarkan seperti itu.
- Kalau beda, ganti jadi `/nama-repo-kamu`.
- Kalau pakai domain sendiri / hosting yang filenya di root, ganti jadi
  string kosong: `const BASE_PATH = '';`

## Setup sebelum dipakai

1. **Firebase**: isi `shared/firebase-config.js` dengan konfigurasi project
   Firebase kamu.
2. **Firebase Storage**: aktifkan di Firebase Console supaya fitur unggah
   foto toko, foto menu, dan QRIS jalan.
3. **Alamat web pembeli**: isi `shared/site-config.js` dengan alamat situs
   pembeli kamu setelah di-deploy (dipakai untuk membuat QR meja).
4. **Deploy**: push folder ini ke repo GitHub, aktifkan GitHub Pages, lalu
   cek `BASE_PATH` di atas sudah cocok dengan nama repo-nya.

## Paket Gratis vs Premium

Toko baru otomatis mulai di paket **Gratis** (maksimal 5 menu aktif). Status
**Premium** (menu tanpa batas + badge di web pembeli) **dikelola manual oleh
admin alun-alun** lewat halaman `/toko/` di web admin — situs ini tidak
tersambung ke payment gateway apa pun, jadi tidak ada tagihan otomatis.
Alurnya: penjual bayar langganan langsung ke pengelola alun-alun (tunai/
transfer di luar sistem), lalu admin menekan tombol "Aktifkan Premium" di
web admin. Aturan & batasnya ada di `shared/plan.js`.

## Retensi nota pesanan (30 hari)

Nota/riwayat pesanan otomatis dihapus setelah 30 hari lewat `shared/cleanup.js`.
Karena situs ini file statis tanpa server sendiri, pembersihan ini berjalan
**setiap kali halaman "Pesanan" dibuka** (dibatasi maksimal sekali tiap 6 jam
per perangkat) — bukan proses latar belakang 24 jam yang jalan sendiri tanpa
ada yang membuka situsnya. Kalau butuh retensi yang benar-benar berjalan
sendiri tanpa bergantung kunjungan, itu perlu Firebase Cloud Functions
berjadwal (paket Blaze) yang di luar cakupan situs statis ini.

## Fitur QRIS dinamis

Saat mengunggah foto QRIS di halaman **Toko & QR**, sistem otomatis mencoba
membaca kode QR di gambar itu (pakai library jsQR). Kalau berhasil terbaca,
nominal transaksi akan otomatis disisipkan setiap kali pembeli checkout —
satu kode ini tetap bisa dipindai GoPay, OVO, DANA, ShopeePay, atau
m-banking apa pun karena semuanya memakai standar QRIS yang sama. Kalau
gambar gagal terbaca (misalnya buram/miring), fitur nominal otomatis tidak
aktif, tapi gambar tetap tersimpan sebagai QRIS statis biasa (pembeli
mencocokkan nominal secara manual).

## Pembaruan tampilan & fitur terbaru

- **Tema terang** (sebelumnya gelap), tetap mobile-first.
- **Stok menu**: field stok opsional di form tambah/edit menu -- kalau diisi, menu otomatis "Habis" ke pembeli saat stok 0, dan berkurang otomatis tiap ada pesanan masuk.
- **Jam operasional & saklar Buka/Tutup**: di halaman `/profil/`, ada saklar manual "Toko sedang buka" (yang benar-benar mengunci pemesanan) plus jam buka/tutup sebagai info teks untuk pembeli.
- **Promo/diskon**: satu kode promo aktif per toko, diatur di `/profil/`, pembeli memasukkannya saat checkout.
- **Ulasan pembeli**: daftar rating & komentar per menu dari pembeli, tampil di halaman `/profil/`.
- **Cetak nomor pesanan**: tombol cetak di tiap kartu pesanan (`/pesanan/`) untuk slip dapur sederhana.
