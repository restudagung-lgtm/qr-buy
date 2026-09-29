# qr-buy

Gabungan tiga situs (HTML/CSS/JS polos + Firebase, tanpa build) dalam satu repo:

```
qr-buy/
├── penjual/   dashboard penjual
├── pembeli/   situs pembeli (scan QR meja -> pesan)
└── admin/     panel admin
```

Setiap folder berdiri sendiri dan punya `shared/` sendiri (tidak dipakai bersama).
README di tiap folder masih README lama; bagian `BASE_PATH` di sana sudah tidak
berlaku, pakai nilai di bawah ini.

## Alamat (GitHub Pages)

| Situs   | Alamat                                                  | `BASE_PATH` (`shared/paths.js`) |
|---------|---------------------------------------------------------|---------------------------------|
| Penjual | https://restudagung-lgtm.github.io/qr-buy/penjual/      | `/qr-buy/penjual`               |
| Pembeli | https://restudagung-lgtm.github.io/qr-buy/pembeli/      | `/qr-buy/pembeli`               |
| Admin   | https://restudagung-lgtm.github.io/qr-buy/admin/        | `/qr-buy/admin`                 |

Alamat pembeli dan penjual juga tertulis di `shared/site-config.js`
(dipakai untuk isi QR meja dan tautan antar situs). QR meja lama mengarah ke
alamat lama, jadi cetak ulang QR dari dashboard penjual setelah deploy.
