/*
  nav.js
  ------
  Kerangka tampilan yang sama dipakai di keempat halaman panel admin
  (/ringkasan/, /toko/, /pesanan/, /pengaturan/): topbar dengan avatar
  bundar (menuju halaman /profil/), dan tab bar bawah untuk pindah antar
  halaman. Tombol "Keluar" ada di halaman /profil/, bukan di topbar lagi.
*/
function renderDashShell(activeTab){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar">
    <div style="flex:1;"><h2 style="display:flex;align-items:center;gap:8px;">${ic('shield',20)} Panel Admin</h2><div class="sub">Pantau semua toko &amp; pesanan</div></div>
    <button class="avatar-btn" onclick="goTo('/profil/')" aria-label="Profil">
      <div class="avatar-circle" id="navAvatarCircle">${ic('shield',18)}</div>
    </button>
  </div>
  <div class="content" id="dashContent"></div>
  <div class="tabbar">
    <button class="${activeTab==='ringkasan'?'active':''}" onclick="goTo('/ringkasan/')">${ic('bar-chart-3',20)}<span>Ringkasan</span></button>
    <button class="${activeTab==='toko'?'active':''}" onclick="goTo('/toko/')">${ic('store',20)}<span>Toko</span></button>
    <button class="${activeTab==='pesanan'?'active':''}" onclick="goTo('/pesanan/')">${ic('receipt',20)}<span>Pesanan</span></button>
    <button class="${activeTab==='pengaturan'?'active':''}" onclick="goTo('/pengaturan/')">${ic('settings',20)}<span>Pengaturan</span></button>
  </div>`;
  mountIcons();

  // Foto profil admin dimuat belakangan (tidak menahan tampilan utama).
  sGet('admin:owner', true).then(acc => {
    const el = document.getElementById('navAvatarCircle');
    if(el && acc && acc.photoURL){ el.innerHTML = `<img src="${acc.photoURL}" alt="">`; }
  }).catch(() => {});

  return document.getElementById('dashContent');
}
