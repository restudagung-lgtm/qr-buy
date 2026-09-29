/*
  paths.js
  --------
  Situs penjual terdiri dari beberapa halaman terpisah: halaman utama (login
  / daftar) di root "/", lalu /menu/, /pesanan/, /qr-meja/, /ringkasan/,
  dan /profil/ (dibuka lewat avatar bundar) untuk masing-masing bagian dashboard.
*/

// BASE_PATH dipakai kalau situs ini di-deploy di dalam subfolder, misalnya
// GitHub Pages "project site" (https://username.github.io/nama-repo/...).
// Kalau situsnya ada di root domain sendiri, ganti jadi string kosong ''.
//
// Nilai di bawah ini SUDAH disesuaikan dengan alamat GitHub Pages yang
// tertulis di shared/site-config.js (.../qr-buy/penjual/). Kalau nama repo
// GitHub kamu berbeda, atau kamu pindah ke domain custom, ganti nilai ini.
const BASE_PATH = '/qr-buy/penjual';

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
