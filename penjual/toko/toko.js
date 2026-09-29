/*
  toko.js
  -------
  Halaman /toko/: rating toko, foto toko, profil (nama/deskripsi/kategori/
  meja rujukan), QRIS pembayaran (dengan baca-otomatis nominal), dan
  cetak/unduh QR kode meja.
*/

let SELLER, dashContent, _lastQRs = [];

async function init(){
  SELLER = await requireSellerAuth();
  if(!SELLER) return;
  dashContent = renderDashShell(SELLER, 'toko');
  await renderStoreTab();
}

async function renderStoreTab(){
  const store = await sGet('store:' + SELLER.storeId, true);
  const premium = isPremium(store);
  dashContent.innerHTML = `
  <div class="plan-card ${premium ? 'is-premium' : 'is-free'}">
    <div class="row" style="align-items:flex-start;">
      <div>
        <h3 style="display:flex;align-items:center;gap:6px;">${premium ? ic('crown',18) : ic('store',18)} Paket ${premium ? 'Premium' : 'Gratis'}</h3>
        <p class="muted" style="margin-top:2px;">${premium ? (planExpiryLabel(store) || 'Premium aktif') : `Maksimal ${FREE_MENU_LIMIT} menu aktif.`}</p>
      </div>
      ${premium ? premiumBadge(store) : ''}
    </div>
    <div class="plan-compare">
      <div class="pc-col">
        <h4>Gratis</h4>
        <ul>
          <li>Maks. ${FREE_MENU_LIMIT} menu aktif</li>
          <li>QRIS, foto toko &amp; menu</li>
          <li>Cetak/unduh QR meja</li>
        </ul>
      </div>
      <div class="pc-col pc-premium">
        <h4>${ic('crown',12)} Premium</h4>
        <ul>
          <li>Menu tanpa batas</li>
          <li>Badge Premium di web pembeli</li>
          <li>Semua fitur Gratis</li>
        </ul>
      </div>
    </div>
    <p class="faint" style="margin-top:10px;">Upgrade paket dikelola manual oleh admin alun-alun (bukan pembayaran otomatis) -- hubungi admin untuk aktivasi Premium.</p>
  </div>
  <div class="card">
    <div class="row" style="align-items:flex-start;">
      <h3>Rating Toko</h3>
      ${ratingBadge(store)}
    </div>
    <p class="muted" style="margin-top:4px;">Rating didapat dari penilaian pembeli setelah pesanan selesai.</p>
  </div>
  <div class="card">
    <h3>Foto Toko</h3>
    <p class="muted" style="margin:4px 0 10px;">Tampil di daftar lapak yang dilihat pembeli.</p>
    <label class="photo-upload upload-banner" id="stPhotoBox">
      <input type="file" accept="image/*" id="stPhoto" onchange="uploadStorePhoto(this)">
      <img id="stPhotoPreview" src="${store?.photoURL || ''}" style="${store?.photoURL ? 'display:block;' : ''}">
      <span class="ph-ic">${ic('camera',20)}</span><span id="stPhotoLabel">${store?.photoURL ? 'Ganti foto toko' : 'Tambah foto toko'}</span>
    </label>
  </div>
  <div class="card">
    <h3>Profil Toko</h3>
    <div class="field" style="margin-top:10px;"><label>Nama toko</label><input id="stName" type="text" value="${escapeHtml(store?.name || '')}"></div>
    <div class="field"><label>Deskripsi</label><input id="stDesc" type="text" value="${escapeHtml(store?.desc || '')}"></div>
    <div class="field"><label>Kategori toko</label>
      <select id="stCat">${catOptionsHTML(store?.category)}</select>
    </div>
    <div class="field">
      <label>Toko kamu paling dekat dengan meja nomor berapa?</label>
      <input id="stNearTable" type="number" min="1" max="30" value="${store?.nearTable || ''}" placeholder="contoh: 5">
    </div>
    <p class="faint" style="margin-top:-6px;">Dipakai untuk mengurutkan toko dari yang terdekat saat pembeli scan QR di suatu meja.</p>
    <button class="btn btn-primary" onclick="saveStore()">Simpan Perubahan</button>
    <p id="stMsg" class="muted" style="margin-top:8px;"></p>
  </div>
  <div class="card">
    <h3>QRIS Pembayaran</h3>
    <p class="muted" style="margin:4px 0 10px;">Unggah gambar QRIS toko kamu. Nominal transaksi akan otomatis disisipkan ke kode ini setiap pembeli checkout, dan tetap bisa dipindai GoPay, OVO, DANA, ShopeePay, atau m-banking apa pun karena semua memakai standar QRIS yang sama.</p>
    <label class="photo-upload" style="height:150px;" id="qrisPhotoBox">
      <input type="file" accept="image/*" id="qrisPhoto" onchange="uploadQrisPhoto(this)">
      <img id="qrisPhotoPreview" src="${store?.qrisImage || ''}" style="${store?.qrisImage ? 'display:block;object-fit:contain;background:#fff;' : ''}">
      <span class="ph-ic">${ic('qr-code',20)}</span><span id="qrisPhotoLabel">${store?.qrisImage ? 'Ganti gambar QRIS' : 'Unggah gambar QRIS'}</span>
    </label>
    <p id="qrisStatusMsg" class="muted" style="margin-top:8px;">${store?.qrisPayload ? ic('check',13)+' Nominal otomatis aktif.' : (store?.qrisImage ? 'Gambar tersimpan, tapi belum bisa dibaca otomatis untuk nominal.' : '')}</p>
  </div>
  <div class="card">
    <h3>QR Kode Meja</h3>
    <p class="muted">Cetak dan tempel di tiap meja. Setiap QR membawa pembeli langsung ke <strong>web pembeli</strong> dengan nomor meja terisi otomatis.</p>
    <div class="field"><label>Jumlah meja</label><input id="qrCount" type="number" value="8" min="1" max="30"></div>
    <button class="btn btn-outline" onclick="renderQRs()">Buat QR</button>
    <div id="qrGrid" class="qr-grid"></div>
    <div class="qr-actions" id="qrActions" style="display:none;">
      <button class="btn btn-primary btn-block-sm" onclick="printAllQRs()">${ic('printer',15)} Cetak Semua</button>
      <button class="btn btn-outline btn-block-sm" onclick="downloadAllQRs()">${ic('download',15)} Unduh Semua</button>
    </div>
    <p class="faint" style="margin-top:10px;">QR ini memakai alamat: ${escapeHtml(BUYER_SITE_URL)}<br>Kalau alamat web pembeli berubah, ubah dulu di file <code>shared/site-config.js</code>, lalu buat ulang QR di sini.</p>
  </div>`;
  mountIcons();
}

async function uploadStorePhoto(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const label = document.getElementById('stPhotoLabel');
  const oldLabel = label.textContent;
  label.textContent = 'Mengunggah…';
  previewImageInput(input, 'stPhotoPreview');
  try{
    const blob = await resizeImageToBlob(file, 1000, 0.78);
    const url = await sUploadImage(`stores/${SELLER.storeId}/photo.jpg`, blob);
    const store = await sGet('store:' + SELLER.storeId, true) || {id: SELLER.storeId};
    store.photoURL = url;
    await sSet('store:' + SELLER.storeId, store, true);
    label.textContent = 'Ganti foto toko';
  }catch(e){
    console.error('Gagal unggah foto toko:', e);
    alert('Gagal mengunggah foto.\n\nPesan error: ' + (e.code || e.message || e) +
      '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di shared/firebase-config.js bagian Storage Rules.');
    label.textContent = oldLabel;
  }
}

async function uploadQrisPhoto(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const label = document.getElementById('qrisPhotoLabel');
  const preview = document.getElementById('qrisPhotoPreview');
  const statusMsg = document.getElementById('qrisStatusMsg');
  const oldLabel = label.textContent;
  label.textContent = 'Mengunggah…';
  statusMsg.textContent = 'Membaca kode QRIS…';
  previewImageInput(input, 'qrisPhotoPreview');
  preview.style.objectFit = 'contain';
  preview.style.background = '#fff';
  try{
    const payload = await decodeQRISFromFile(file);
    const blob = await resizeImageToBlob(file, 700, 0.85);
    const url = await sUploadImage(`stores/${SELLER.storeId}/qris.jpg`, blob);
    const store = await sGet('store:' + SELLER.storeId, true) || {id: SELLER.storeId};
    store.qrisImage = url;
    store.qrisPayload = payload || null;
    await sSet('store:' + SELLER.storeId, store, true);
    label.textContent = 'Ganti gambar QRIS';
    statusMsg.innerHTML = payload
      ? ic('check',13) + ' Terbaca! Nominal transaksi akan otomatis terisi untuk pembeli.'
      : 'Gambar tersimpan, tapi kodenya belum terbaca otomatis (coba foto lebih tegak lurus & terang). Pembeli tetap bisa bayar manual dengan mencocokkan nominal.';
    mountIcons();
  }catch(e){
    console.error('Gagal unggah QRIS:', e);
    statusMsg.textContent = '';
    alert('Gagal mengunggah QRIS.\n\nPesan error: ' + (e.code || e.message || e) +
      '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di shared/firebase-config.js bagian Storage Rules.');
    label.textContent = oldLabel;
  }
}

async function saveStore(){
  const store = await sGet('store:' + SELLER.storeId, true) || {id: SELLER.storeId};
  store.name = document.getElementById('stName').value.trim();
  store.desc = document.getElementById('stDesc').value.trim();
  store.category = document.getElementById('stCat').value;
  const nt = Number(document.getElementById('stNearTable').value);
  store.nearTable = nt || null;
  await sSet('store:' + SELLER.storeId, store, true);
  const acc = await sGet('seller:' + SELLER.username, true);
  if(acc){ acc.storeName = store.name; await sSet('seller:' + SELLER.username, acc, true); }
  SELLER.storeName = store.name;
  document.getElementById('stMsg').textContent = 'Tersimpan.';
  dashContent = renderDashShell(SELLER, 'toko');
  renderStoreTab();
}

async function renderQRs(){
  const n = Number(document.getElementById('qrCount').value) || 8;
  await sSet('config:totalTables', {total:n}, true);
  const grid = document.getElementById('qrGrid');
  const base = BUYER_SITE_URL.replace(/\/+$/, '');
  _lastQRs = [];
  let html = '';
  for(let i = 1; i <= n; i++){
    const url = base + '/?table=' + i;
    const qrImg = qrEncodeURL(url, 300);
    _lastQRs.push({ n: i, img: qrImg });
    html += `<div class="qr-card">
      <img src="${qrImg}" alt="QR Meja ${i}">
      <div class="qr-label">Meja No. ${i}</div>
      <button class="qr-dl" onclick="downloadImageURL('${qrImg}','qr-meja-${i}.png')">Unduh</button>
    </div>`;
  }
  grid.innerHTML = html;
  document.getElementById('qrActions').style.display = n > 0 ? 'flex' : 'none';
}

async function downloadAllQRs(){
  if(_lastQRs.length === 0) return;
  for(const q of _lastQRs){
    await downloadImageURL(q.img, `qr-meja-${q.n}.png`);
    await new Promise(r => setTimeout(r, 300));
  }
}

function printAllQRs(){
  if(_lastQRs.length === 0){ alert('Buat QR dulu sebelum mencetak.'); return; }
  const storeName = escapeHtml(SELLER.storeName || 'Toko');
  const win = window.open('', '_blank');
  const cards = _lastQRs.map(q => `
    <div style="width:33.3%;box-sizing:border-box;padding:10px;display:inline-block;text-align:center;page-break-inside:avoid;">
      <div style="border:1.5px dashed #999;border-radius:10px;padding:14px 8px;">
        <img src="${q.img}" style="width:100%;max-width:180px;" />
        <div style="font-family:sans-serif;font-weight:700;margin-top:8px;font-size:14px;">${storeName}</div>
        <div style="font-family:sans-serif;font-size:12px;color:#555;">Meja No. ${q.n}</div>
      </div>
    </div>`).join('');
  win.document.write(`
    <!doctype html><html><head><title>Cetak QR - ${storeName}</title>
    <meta charset="UTF-8">
    <style>
      body{font-family:sans-serif;margin:16px;}
      @media print{ @page{ margin:10mm; } }
    </style>
    </head><body onload="setTimeout(function(){window.print();}, 500)">
    ${cards}
    </body></html>`);
  win.document.close();
}

init();
