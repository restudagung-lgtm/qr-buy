/*
  pesanan.js
  ----------
  Halaman /pesanan/: daftar pesanan masuk untuk toko ini, bisa menandai
  progres (diproses -> diantar -> selesai), lihat denah meja, dan lihat
  lokasi GPS pembeli (kalau pembeli mengizinkan lokasi saat checkout).
*/

let SELLER, dashContent, mapOpenFor = null;

async function init(){
  SELLER = await requireSellerAuth();
  if(!SELLER) return;
  purgeOldOrders(); // jalan di latar belakang, tidak menahan tampilan
  dashContent = renderDashShell(SELLER, 'pesanan');
  await renderOrders();
}

async function renderOrders(){
  dashContent.innerHTML = `<div class="empty">${ic('loader-2',24)} Memuat pesanan…</div>`;
  mountIcons();
  const keys = await sList('order:', true);
  let orders = (await Promise.all(keys.map(k => sGet(k, true)))).filter(Boolean);
  orders = orders.filter(o => o.storeId === SELLER.storeId).sort((a,b) => b.createdAt - a.createdAt);
  if(orders.length === 0){ dashContent.innerHTML = `<div class="empty">${ic('receipt',30)}<br>Belum ada pesanan masuk.</div>`; mountIcons(); return; }
  const totalTables = await getTotalTables();
  dashContent.innerHTML = `<p class="faint" style="text-align:center;margin-bottom:10px;">${ic('clock',11)} Nota pesanan tersimpan 30 hari, lalu terhapus otomatis.</p>` + orders.map(o => {
    const canceled = o.status === 'dibatalkan';
    const idx = STATUS_FLOW.indexOf(o.status);
    const next = !canceled ? STATUS_FLOW[idx + 1] : null;
    const mapOpen = mapOpenFor === o.id;
    const payLabel = o.paymentMethod === 'qris' ? 'QRIS' : 'Tunai';
    const payStatus = o.paymentStatus || (o.paymentMethod === 'qris' ? 'lunas' : 'bayar_ditempat');
    const gmaps = mapsLink(o.location);
    return `<div class="card">
      <div class="row">
        <div><strong>Meja No. ${o.table}</strong> <span class="muted">· ${new Date(o.createdAt).toLocaleTimeString('id-ID')}</span></div>
        <span class="badge badge-${o.status}">${STATUS_LABEL[o.status]}</span>
      </div>
      <div style="margin:10px 0;">
        ${o.items.map(it => `<div class="muted" style="display:flex;justify-content:space-between;font-size:13.5px;"><span>${it.qty}× ${escapeHtml(it.name)}</span><span>${rupiah(it.price*it.qty)}</span></div>`).join('')}
        ${o.discount ? `<div class="muted" style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--leaf);"><span>Diskon${o.promoLabel ? ' ('+escapeHtml(o.promoLabel)+')' : ''}</span><span>-${rupiah(o.discount)}</span></div>` : ''}
      </div>
      <div class="row"><strong>${rupiah(o.total)}</strong><span class="badge badge-${payStatus}">${payLabel} ${payStatus === 'lunas' ? '· Lunas' : '· Bayar di tempat'}</span></div>
      <div style="margin-top:10px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
        <button class="linklike" onclick="toggleMap('${o.id}')">${mapOpen ? 'Sembunyikan denah' : 'Lihat denah meja'}</button>
        <button class="linklike" onclick="printOrderSlip('${o.id}')">${ic('printer',13)} Cetak</button>
        ${gmaps ? `<a class="linklike" href="${gmaps}" target="_blank" style="text-decoration:none;">${ic('navigation',13)} Lokasi GPS pembeli</a>` : ''}
        ${next ? `<button class="btn btn-sm btn-primary" style="margin-left:auto;" onclick="advanceOrder('${o.id}')">Tandai: ${STATUS_LABEL[next]}</button>` : (canceled ? `<span class="muted" style="margin-left:auto;">Dibatalkan pembeli</span>` : `<span class="muted" style="margin-left:auto;">Pesanan selesai</span>`)}
      </div>
      ${mapOpen ? `<div class="map-wrap" style="margin-top:10px;">${tableMapSVG(o.table, totalTables)}</div>` : ''}
    </div>`;
  }).join('');
  mountIcons();
}

function toggleMap(orderId){
  mapOpenFor = mapOpenFor === orderId ? null : orderId;
  renderOrders();
}

async function advanceOrder(orderId){
  const key = 'order:' + orderId;
  const o = await sGet(key, true);
  if(!o || o.status === 'dibatalkan') return;
  const idx = STATUS_FLOW.indexOf(o.status);
  if(idx < STATUS_FLOW.length - 1){ o.status = STATUS_FLOW[idx + 1]; await sSet(key, o, true); }
  renderOrders();
}

async function printOrderSlip(orderId){
  const o = await sGet('order:' + orderId, true);
  if(!o) return;
  const win = window.open('', '_blank');
  const itemsHtml = o.items.map(it => `<div class="rline"><span>${it.qty}× ${escapeHtml(it.name)}</span><span>${rupiah(it.price*it.qty)}</span></div>`).join('');
  win.document.write(`
  <!doctype html><html><head><title>Pesanan #${o.id.toUpperCase()}</title><meta charset="UTF-8">
  <style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:24px;background:#fff;color:#231A0E;}
    .slip{max-width:300px;margin:0 auto;border:1.5px dashed #999;border-radius:10px;padding:18px;}
    .slip h2{font-size:22px;text-align:center;margin:0 0 2px;}
    .center{text-align:center;color:#555;font-size:12px;margin-bottom:10px;}
    .dashed{border-top:1.5px dashed #ccc;margin:12px 0;}
    .rline{display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;}
    .total{font-weight:700;font-size:16px;}
    @media print{ @page{ margin:10mm; } }
  </style></head>
  <body onload="setTimeout(function(){window.print();},400)">
    <div class="slip">
      <h2>MEJA ${o.table}</h2>
      <div class="center">#${o.id.toUpperCase()} · ${new Date(o.createdAt).toLocaleTimeString('id-ID')}</div>
      <div class="dashed"></div>
      ${itemsHtml}
      <div class="dashed"></div>
      <div class="rline total"><span>Total</span><span>${rupiah(o.total)}</span></div>
      <div class="rline"><span>Bayar</span><span>${o.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'}</span></div>
    </div>
  </body></html>`);
  win.document.close();
}

init();
