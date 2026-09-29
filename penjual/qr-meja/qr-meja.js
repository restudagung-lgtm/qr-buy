/*
  qr-meja.js
  ----------
  Halaman /qr-meja/: buat, cetak, dan unduh QR kode untuk tiap meja. Fitur
  profil toko, foto, dan QRIS pembayaran sekarang ada di halaman /profil/
  (buka lewat avatar bundar di pojok kanan atas).
*/

let SELLER, dashContent, _lastQRs = [];

async function init(){
  SELLER = await requireSellerAuth();
  if(!SELLER) return;
  dashContent = renderDashShell(SELLER, 'qrmeja');
  renderShell();
}

function renderShell(){
  dashContent.innerHTML = `
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
