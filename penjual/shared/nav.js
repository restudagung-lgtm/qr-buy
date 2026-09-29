/*
  nav.js
  ------
  Kerangka tampilan yang sama dipakai di semua halaman dashboard
  (/menu/, /pesanan/, /qr-meja/, /ringkasan/): topbar dengan nama toko +
  avatar bundar (menuju halaman /profil/), dan tab bar bawah untuk pindah
  antar halaman. Tombol "Keluar" sekarang ada di halaman /profil/, bukan
  di topbar lagi -- sama seperti pola avatar di kebanyakan aplikasi.
  renderDashShell() mengembalikan elemen <div id="dashContent"> supaya
  skrip halaman tinggal mengisi innerHTML-nya.
*/
function renderDashShell(seller, activeTab){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar">
    <div style="flex:1;"><h2>${escapeHtml(seller.storeName || 'Toko Saya')}</h2><div class="sub">@${escapeHtml(seller.username || '')}</div></div>
    <button class="avatar-btn" onclick="goTo('/profil/')" aria-label="Profil">
      <div class="avatar-circle" id="navAvatarCircle">${ic('store',18)}</div>
    </button>
  </div>
  <div class="content" id="dashContent"></div>
  <div class="tabbar">
    <button class="${activeTab==='menu'?'active':''}" onclick="goTo('/menu/')">${ic('utensils',20)}<span>Menu</span></button>
    <button class="${activeTab==='pesanan'?'active':''}" onclick="goTo('/pesanan/')">${ic('receipt',20)}<span>Pesanan</span></button>
    <button class="${activeTab==='qrmeja'?'active':''}" onclick="goTo('/qr-meja/')">${ic('qr-code',20)}<span>QR Meja</span></button>
    <button class="${activeTab==='ringkasan'?'active':''}" onclick="goTo('/ringkasan/')">${ic('bar-chart-3',20)}<span>Ringkasan</span></button>
  </div>`;
  mountIcons();

  // Foto profil toko dimuat belakangan (tidak menahan tampilan utama) --
  // kalau ada, avatar bundar di topbar ikut menampilkan foto itu.
  sGet('store:' + seller.storeId, true).then(store => {
    const el = document.getElementById('navAvatarCircle');
    if(el && store && store.photoURL){ el.innerHTML = `<img src="${store.photoURL}" alt="">`; }
  }).catch(() => {});

  return document.getElementById('dashContent');
}
