/*
  pesanan.js
  ----------
  Halaman /pesanan/: daftar 50 pesanan terbaru lintas semua toko.
*/

async function init(){
  const acc = await requireAdminAuth();
  if(!acc) return;
  purgeOldOrders(); // jalan di latar belakang, tidak menahan tampilan
  const dashContent = renderDashShell('pesanan');
  dashContent.innerHTML = `<div class="empty">${ic('loader-2',24)} Memuat pesanan…</div>`;
  mountIcons();

  const orderKeys = await sList('order:', true);
  let orders = (await Promise.all(orderKeys.map(k => sGet(k, true)))).filter(Boolean);
  orders.sort((a,b) => b.createdAt - a.createdAt);
  if(orders.length === 0){ dashContent.innerHTML = `<div class="empty">${ic('receipt',30)}<br>Belum ada pesanan.</div>`; mountIcons(); return; }
  const shown = orders.slice(0, 50);
  dashContent.innerHTML = `<p class="faint" style="text-align:center;margin-bottom:10px;">${ic('clock',11)} Nota pesanan tersimpan 30 hari, lalu terhapus otomatis.</p>` + shown.map(o => {
    const payLabel = o.paymentMethod === 'qris' ? 'QRIS' : 'Tunai';
    const payStatus = o.paymentStatus || (o.paymentMethod === 'qris' ? 'lunas' : 'bayar_ditempat');
    return `
    <div class="card">
      <div class="row">
        <div><strong>${escapeHtml(o.storeName)}</strong> <span class="muted">· Meja ${o.table}</span></div>
        <span class="badge badge-${o.status}">${STATUS_LABEL[o.status]}</span>
      </div>
      <div class="row" style="margin-top:6px;">
        <span class="muted">${new Date(o.createdAt).toLocaleString('id-ID')}</span>
        <strong>${rupiah(o.total)}</strong>
      </div>
      <div class="row" style="margin-top:6px;">
        <span class="badge badge-${payStatus}">${payLabel} ${payStatus === 'lunas' ? '· Lunas' : '· Bayar di tempat'}</span>
      </div>
    </div>`;
  }).join('') + (orders.length > 50
      ? `<p class="muted" style="text-align:center;">Menampilkan 50 pesanan terbaru dari total ${orders.length}.</p>`
      : '');
  mountIcons();
}

init();
