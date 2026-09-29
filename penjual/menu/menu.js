/*
  menu.js
  -------
  Halaman /menu/: tambah menu baru (+foto), lihat semua menu, edit
  (nama/harga/kategori/foto), aktif/nonaktifkan, dan hapus.
*/

let SELLER, dashContent;

async function init(){
  SELLER = await requireSellerAuth();
  if(!SELLER) return;
  dashContent = renderDashShell(SELLER, 'menu');
  await renderMenuList();
}

async function renderMenuList(){
  const keys = await sList('menu:' + SELLER.storeId + ':', true);
  const items = (await Promise.all(keys.map(k => sGet(k, true)))).filter(Boolean);
  const store = await sGet('store:' + SELLER.storeId, true);
  const limit = menuLimitFor(store);
  const atLimit = items.length >= limit;

  dashContent.innerHTML = `
  ${atLimit ? `
  <div class="limit-banner">
    <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;">${ic('lock',16)} Batas menu gratis tercapai (${items.length}/${FREE_MENU_LIMIT})</div>
    <p>Paket gratis maksimal ${FREE_MENU_LIMIT} menu aktif. Upgrade ke <strong>Premium</strong> di halaman Toko &amp; QR untuk menu tanpa batas.</p>
    <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="goTo('/profil/')">Lihat Paket Premium</button>
  </div>` : `
  <div class="card">
    <h3>Tambah Menu</h3>
    <div class="upload-row" style="margin-top:10px;">
      <label class="photo-upload upload-square" id="mPhotoBox">
        <input type="file" accept="image/*" id="mPhoto" onchange="previewImageInput(this,'mPhotoPreview')">
        <img id="mPhotoPreview">
        <span class="ph-ic">${ic('camera',20)}</span><span>Foto</span>
      </label>
      <div class="upload-text">Tambahkan foto makanan/minuman supaya menu lebih menarik di mata pembeli. Opsional, bisa dilewati.</div>
    </div>
    <div class="field"><label>Nama menu</label><input id="mName" type="text" placeholder="contoh: Es Teh Manis"></div>
    <div class="field"><label>Harga (Rp)</label><input id="mPrice" type="number" placeholder="5000"></div>
    <div class="field"><label>Kategori</label>
      <select id="mCat">${catOptionsHTML()}</select>
    </div>
    <div class="field"><label>Stok (kosongkan kalau tidak dibatasi)</label><input id="mStock" type="number" min="0" placeholder="contoh: 20"></div>
    <p class="faint" style="margin-top:-10px;">Kalau diisi, menu otomatis berubah jadi "Habis" ke pembeli saat stoknya habis.</p>
    <button class="btn btn-primary" id="mAddBtn" onclick="addMenu()">Tambahkan</button>
    ${!isPremium(store) ? `<p class="faint" style="margin-top:8px;">${items.length}/${FREE_MENU_LIMIT} menu terpakai di paket gratis.</p>` : ''}
  </div>`}
  <div class="section-title">Menu kamu (${items.length})</div>
  ${items.length === 0 ? `<div class="empty">${ic('utensils',30)}<br>Belum ada menu. Tambahkan menu pertama kamu di atas.</div>` :
    items.map(m => {
      const hasStock = m.stock !== undefined && m.stock !== null && m.stock !== '';
      const outOfStock = hasStock && Number(m.stock) <= 0;
      return `
    <div id="mrow-${m.id}">
    <div class="menu-card">
      <div class="menu-thumb" style="${m.photoURL ? `background-image:url('${m.photoURL}')` : ''}">${m.photoURL ? '' : ic(catMeta(m.category).icon,24)}</div>
      <div class="menu-info">
        <div class="menu-name">${escapeHtml(m.name)}</div>
        <div class="menu-price">${rupiah(m.price)}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px;">
          <span class="faint">${catMeta(m.category).label}</span>
          ${m.ratingCount ? ratingBadge(m) : ''}
          ${outOfStock ? '<span class="badge badge-habis">Habis</span>' : (hasStock ? `<span class="faint">Stok: ${m.stock}</span>` : '')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div class="switch ${m.available !== false ? 'on' : ''}" onclick="toggleMenu('${m.id}', ${m.available === false})"><div class="knob"></div></div>
        <div style="display:flex;gap:10px;">
          <button class="ic-btn" style="color:var(--lantern);" onclick="openEditMenu('${m.id}')">${ic('pencil',16)}</button>
          <button class="ic-btn" style="color:var(--chili);" onclick="deleteMenu('${m.id}')">${ic('trash-2',16)}</button>
        </div>
      </div>
    </div>
    <div id="editbox-${m.id}"></div>
    </div>`;
    }).join('')}
  `;
  mountIcons();
}

async function addMenu(){
  const name = document.getElementById('mName').value.trim();
  const price = Number(document.getElementById('mPrice').value);
  const category = document.getElementById('mCat').value;
  const stockRaw = document.getElementById('mStock').value;
  const stock = stockRaw === '' ? null : Math.max(0, Number(stockRaw));
  const fileInput = document.getElementById('mPhoto');
  if(!name || !price){ alert('Isi nama dan harga menu.'); return; }

  // Cek ulang batas paket di detik terakhir (jaga-jaga kalau ada tab lain
  // yang juga menambah menu di saat bersamaan).
  const store = await sGet('store:' + SELLER.storeId, true);
  const keys = await sList('menu:' + SELLER.storeId + ':', true);
  if(keys.length >= menuLimitFor(store)){
    alert(`Batas ${FREE_MENU_LIMIT} menu gratis sudah tercapai. Upgrade ke Premium dulu di halaman Toko & QR untuk menambah lagi.`);
    renderMenuList();
    return;
  }

  const btn = document.getElementById('mAddBtn');
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  const id = genId();
  let photoURL = null;
  const file = fileInput.files && fileInput.files[0];
  if(file){
    try{
      const blob = await resizeImageToBlob(file, 900, 0.75);
      photoURL = await sUploadImage(`stores/${SELLER.storeId}/menu/${id}.jpg`, blob);
    }catch(e){
      console.error('Gagal unggah foto menu:', e);
      alert('Foto gagal diunggah, tapi menu tetap akan disimpan tanpa foto.\n\nPesan error: ' + (e.code || e.message || e) +
        '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di shared/firebase-config.js bagian Storage Rules.');
    }
  }
  await sSet('menu:' + SELLER.storeId + ':' + id, {id, storeId:SELLER.storeId, name, price, category, stock, photoURL, available:true}, true);
  renderMenuList();
}

async function openEditMenu(id){
  const box = document.getElementById('editbox-' + id);
  if(!box) return;
  if(box.innerHTML){ box.innerHTML = ''; return; }
  const key = 'menu:' + SELLER.storeId + ':' + id;
  const m = await sGet(key, true);
  if(!m) return;
  box.innerHTML = `
  <div class="edit-panel">
    <div class="upload-row">
      <label class="photo-upload upload-square" id="ePhotoBox-${id}">
        <input type="file" accept="image/*" id="ePhoto-${id}" onchange="previewImageInput(this,'ePhotoPreview-${id}')">
        <img id="ePhotoPreview-${id}" src="${m.photoURL || ''}" style="${m.photoURL ? 'display:block;' : ''}">
        <span class="ph-ic">${ic('camera',18)}</span><span>Foto</span>
      </label>
      <div class="upload-text">Ganti foto, atau biarkan untuk memakai foto yang sudah ada.</div>
    </div>
    <div class="field"><label>Nama menu</label><input id="eName-${id}" type="text" value="${escapeHtml(m.name)}"></div>
    <div class="field"><label>Harga (Rp)</label><input id="ePrice-${id}" type="number" value="${m.price}"></div>
    <div class="field"><label>Kategori</label>
      <select id="eCat-${id}">${catOptionsHTML(m.category)}</select>
    </div>
    <div class="field"><label>Stok (kosongkan kalau tidak dibatasi)</label><input id="eStock-${id}" type="number" min="0" value="${m.stock === undefined || m.stock === null ? '' : m.stock}" placeholder="contoh: 20"></div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-primary" onclick="saveEditMenu('${id}')">Simpan</button>
      <button class="btn btn-outline" onclick="document.getElementById('editbox-${id}').innerHTML=''">Batal</button>
    </div>
    <p id="eMsg-${id}" class="muted" style="margin-top:8px;"></p>
  </div>`;
  mountIcons();
}

async function saveEditMenu(id){
  const key = 'menu:' + SELLER.storeId + ':' + id;
  const m = await sGet(key, true);
  if(!m) return;
  const name = document.getElementById('eName-' + id).value.trim();
  const price = Number(document.getElementById('ePrice-' + id).value);
  const category = document.getElementById('eCat-' + id).value;
  const stockRaw = document.getElementById('eStock-' + id).value;
  m.stock = stockRaw === '' ? null : Math.max(0, Number(stockRaw));
  if(!name || !price){ document.getElementById('eMsg-' + id).textContent = 'Isi nama dan harga.'; return; }
  m.name = name; m.price = price; m.category = category;
  const fileInput = document.getElementById('ePhoto-' + id);
  const file = fileInput.files && fileInput.files[0];
  if(file){
    try{
      const blob = await resizeImageToBlob(file, 900, 0.75);
      const url = await sUploadImage(`stores/${SELLER.storeId}/menu/${id}.jpg`, blob);
      if(url) m.photoURL = url;
    }catch(e){
      console.error('Gagal unggah foto menu:', e);
      alert('Foto baru gagal diunggah, perubahan lain tetap disimpan.\n\nPesan error: ' + (e.code || e.message || e) +
        '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di shared/firebase-config.js bagian Storage Rules.');
    }
  }
  await sSet(key, m, true);
  renderMenuList();
}

async function toggleMenu(id, makeAvailable){
  const key = 'menu:' + SELLER.storeId + ':' + id;
  const m = await sGet(key, true);
  if(!m) return;
  m.available = makeAvailable;
  await sSet(key, m, true);
  renderMenuList();
}

async function deleteMenu(id){
  if(!confirm('Hapus menu ini?')) return;
  const key = 'menu:' + SELLER.storeId + ':' + id;
  const m = await sGet(key, true);
  await sDel(key, true);
  if(m && m.photoURL){ await sDeleteImage(`stores/${SELLER.storeId}/menu/${id}.jpg`); }
  renderMenuList();
}

init();
