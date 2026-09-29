/*
  categories.js
  -------------
  Daftar kategori menu/toko, dipakai bersama oleh halaman daftar toko baru
  (root), kelola menu (/menu/), dan profil toko (/profil/) -- supaya
  daftarnya selalu konsisten di semua tempat.
*/
const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }
function catOptionsHTML(selected){
  return CATS.map(c => `<option value="${c.id}" ${selected===c.id?'selected':''}>${c.label}</option>`).join('');
}
