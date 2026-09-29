/*
  paths.js
  --------
  Situs admin terdiri dari beberapa halaman terpisah: halaman utama (login
  / setup) di root "/", lalu /ringkasan/, /toko/, /pesanan/, /pengaturan/
  untuk masing-masing bagian panel admin.
*/

// BASE_PATH dipakai kalau situs ini di-deploy di dalam subfolder, misalnya
// GitHub Pages "project site" (https://username.github.io/nama-repo/...).
// Kalau situsnya ada di root domain sendiri, ganti jadi string kosong ''.
//
// Nilai di bawah ini ditebak dari nama file asal repo ini ("admin-web").
// CEK LAGI alamat GitHub Pages kamu yang sebenarnya setelah deploy -- kalau
// nama repo-nya beda, ganti nilai ini supaya tombol/link antar halaman
// (Ringkasan/Toko/Pesanan/Pengaturan) tidak salah arah.
const BASE_PATH = '/qr-buy/admin';

function pageUrl(path, params){
  let qs = '';
  if(params){
    const entries = Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '');
    if(entries.length) qs = '?' + new URLSearchParams(entries).toString();
  }
  return BASE_PATH + path + qs;
}

function goTo(path, params){
  location.href = pageUrl(path, params);
}
