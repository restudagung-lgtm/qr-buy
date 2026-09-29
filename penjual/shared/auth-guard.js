/*
  auth-guard.js
  -------------
  Karena tiap halaman dashboard sekarang berdiri sendiri (dokumen HTML
  terpisah, bukan satu SPA), setiap halaman yang butuh login harus
  mengecek sesi sendiri saat dimuat. Panggil requireSellerAuth() di awal
  script halaman itu -- kalau belum login, otomatis dilempar balik ke
  halaman login (root "/").
*/
async function requireSellerAuth(){
  const username = await sGet('session', false);
  if(!username){ goTo('/'); return null; }
  const acc = await sGet('seller:' + username, true);
  if(!acc){ goTo('/'); return null; }
  return { username, storeId: acc.storeId, storeName: acc.storeName };
}

async function doLogout(){
  await sDel('session', false);
  goTo('/');
}
