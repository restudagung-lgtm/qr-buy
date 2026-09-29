/*
  auth-guard.js
  -------------
  Tiap halaman panel admin mengecek sesinya sendiri saat dimuat (karena
  sekarang tiap halaman adalah dokumen HTML terpisah). Panggil
  requireAdminAuth() di awal script halaman -- kalau belum login, otomatis
  dilempar balik ke halaman login (root "/").
*/
async function requireAdminAuth(){
  const session = await sGet('session', false);
  if(session !== 'owner'){ goTo('/'); return null; }
  const acc = await sGet('admin:owner', true);
  if(!acc){ goTo('/'); return null; }
  return acc;
}

async function doAdminLogout(){
  await sDel('session', false);
  goTo('/');
}
