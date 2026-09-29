/*
  ringkasan.js
  ------------
  Halaman /ringkasan/: statistik ringkas -- total pesanan, selesai,
  berjalan, dibatalkan, pendapatan, dan rating toko.
*/

async function init(){
  const seller = await requireSellerAuth();
  if(!seller) return;
  const dashContent = renderDashShell(seller, 'ringkasan');

  const keys = await sList('order:', true);
  let orders = (await Promise.all(keys.map(k => sGet(k, true)))).filter(Boolean);
  orders = orders.filter(o => o.storeId === seller.storeId);
  const selesai = orders.filter(o => o.status === 'selesai');
  const dibatalkan = orders.filter(o => o.status === 'dibatalkan');
  const totalPendapatan = selesai.reduce((a,o) => a + o.total, 0);
  const berjalan = orders.length - selesai.length - dibatalkan.length;
  const store = await sGet('store:' + seller.storeId, true);

  dashContent.innerHTML = `
  <div class="card"><div class="row"><span class="muted">Rating toko</span>${ratingBadge(store)}</div></div>
  <div class="card"><div class="muted">Total pesanan masuk</div><h3>${orders.length}</h3></div>
  <div class="card"><div class="muted">Pesanan selesai</div><h3>${selesai.length}</h3></div>
  <div class="card"><div class="muted">Sedang berjalan</div><h3>${berjalan}</h3></div>
  <div class="card"><div class="muted">Dibatalkan pembeli</div><h3>${dibatalkan.length}</h3></div>
  <div class="card"><div class="muted">Pendapatan (pesanan selesai)</div><h3>${rupiah(totalPendapatan)}</h3></div>
  `;
  mountIcons();
}

init();
