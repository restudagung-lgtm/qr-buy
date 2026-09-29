/*
  toko.js
  -------
  Halaman /toko/: daftar semua toko yang terdaftar di alun-alun ini,
  lengkap dengan rating & jumlah menu, dan opsi hapus toko.
*/

let dashContent;

async function init(){
  const acc = await requireAdminAuth();
  if(!acc) return;
  dashContent = renderDashShell('toko');
  await renderToko();
}

async function renderToko(){
  dashContent.innerHTML = `<div class="empty">${ic('loader-2',24)} Memuat toko…</div>`;
  mountIcons();
  const storeKeys = await sList('store:', true);
  const stores = (await Promise.all(storeKeys.map(k => sGet(k, true)))).filter(Boolean);
  if(stores.length === 0){ dashContent.innerHTML = `<div class="empty">${ic('store',30)}<br>Belum ada toko terdaftar.</div>`; mountIcons(); return; }
  const rows = await Promise.all(stores.map(async s => {
    const menuKeys = await sList('menu:' + s.id + ':', true);
    return {...s, menuCount: menuKeys.length};
  }));
  dashContent.innerHTML = rows.map(s => {
    const premium = isPremium(s);
    return `
    <div class="card">
      <div class="row" style="align-items:flex-start;">
        <div style="display:flex;gap:12px;align-items:center;">
          <div class="store-thumb" style="width:48px;height:48px;${s.photoURL ? `background-image:url('${s.photoURL}')` : ''}">${s.photoURL ? '' : ic('store',20)}</div>
          <div>
            <h3 style="margin-bottom:2px;display:flex;align-items:center;gap:6px;">${escapeHtml(s.name)} ${premiumBadge(s)}</h3>
            <p class="muted" style="margin:0;">${escapeHtml(s.desc || 'Belum ada deskripsi')}</p>
            <div style="margin-top:2px;">${ratingBadge(s)}</div>
          </div>
        </div>
        <span class="badge badge-diproses">${s.menuCount} menu</span>
      </div>
      <div class="row" style="margin-top:10px;">
        <span class="muted">Meja rujukan: ${s.nearTable || '- belum diisi -'}${s.qrisImage ? ' · QRIS ✓' : ''}</span>
        <button class="ic-btn" style="color:var(--chili);" onclick="deleteToko('${s.id}')">${ic('trash-2',16)}</button>
      </div>
      <div style="border-top:1px solid var(--line);margin:10px 0;"></div>
      <div class="row">
        <span class="muted">${premium ? (planExpiryLabel(s) || 'Premium aktif') : `Paket Gratis (maks ${FREE_MENU_LIMIT} menu)`}</span>
        ${premium
          ? `<button class="btn btn-sm btn-outline" onclick="revokePremium('${s.id}')">Cabut Premium</button>`
          : `<button class="btn btn-sm btn-primary" onclick="grantPremium('${s.id}')">${ic('crown',13)} Aktifkan Premium ${PREMIUM_DEFAULT_DAYS} Hari</button>`}
      </div>
    </div>`;
  }).join('');
  mountIcons();
}

async function grantPremium(storeId){
  const store = await sGet('store:' + storeId, true);
  if(!store) return;
  store.plan = 'premium';
  store.premiumUntil = Date.now() + PREMIUM_DEFAULT_DAYS*24*60*60*1000;
  await sSet('store:' + storeId, store, true);
  renderToko();
}

async function revokePremium(storeId){
  if(!confirm('Cabut status Premium toko ini? Menu di atas batas gratis tidak akan otomatis terhapus, tapi penjual tidak bisa menambah menu baru sampai di bawah batas lagi.')) return;
  const store = await sGet('store:' + storeId, true);
  if(!store) return;
  store.plan = 'free';
  store.premiumUntil = null;
  await sSet('store:' + storeId, store, true);
  renderToko();
}

async function deleteToko(storeId){
  if(!confirm('Hapus toko ini beserta seluruh menunya? Riwayat pesanan lama tidak akan ikut terhapus, tapi tindakan ini tidak bisa dibatalkan.')) return;
  const store = await sGet('store:' + storeId, true);
  const menuKeys = await sList('menu:' + storeId + ':', true);
  for(const k of menuKeys){ await sDel(k, true); }
  await sDel('store:' + storeId, true);
  if(store && store.ownerUsername){ await sDel('seller:' + store.ownerUsername, true); }
  renderToko();
}

init();
