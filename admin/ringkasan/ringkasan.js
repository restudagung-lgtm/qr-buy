/*
  ringkasan.js
  ------------
  Halaman /ringkasan/: statistik ringkas lintas semua toko di alun-alun.
*/

async function init(){
  const acc = await requireAdminAuth();
  if(!acc) return;
  const dashContent = renderDashShell('ringkasan');
  dashContent.innerHTML = `<div class="empty">${ic('loader-2',24)} Memuat ringkasan…</div>`;
  mountIcons();

  const storeKeys = await sList('store:', true);
  const stores = (await Promise.all(storeKeys.map(k => sGet(k, true)))).filter(Boolean);
  const orderKeys = await sList('order:', true);
  const orders = (await Promise.all(orderKeys.map(k => sGet(k, true)))).filter(Boolean);
  const selesai = orders.filter(o => o.status === 'selesai');
  const dibatalkan = orders.filter(o => o.status === 'dibatalkan');
  const berjalan = orders.length - selesai.length - dibatalkan.length;
  const pendapatan = selesai.reduce((a,o) => a + o.total, 0);
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);

  dashContent.innerHTML = `
  <div class="card"><div class="muted">Jumlah toko terdaftar</div><h3>${stores.length}</h3></div>
  <div class="card"><div class="muted">Pesanan hari ini</div><h3>${todayOrders.length}</h3></div>
  <div class="card"><div class="muted">Pesanan sedang berjalan</div><h3>${berjalan}</h3></div>
  <div class="card"><div class="muted">Dibatalkan pembeli</div><h3>${dibatalkan.length}</h3></div>
  <div class="card"><div class="muted">Total pesanan (semua waktu)</div><h3>${orders.length}</h3></div>
  <div class="card"><div class="muted">Total pendapatan seluruh toko (pesanan selesai)</div><h3>${rupiah(pendapatan)}</h3></div>
  <div class="card">
    <h3>Tautan Cepat</h3>
    <div class="stack" style="margin-top:10px;">
      <a href="${BUYER_SITE_URL}" target="_blank" class="btn btn-outline" style="text-align:center;text-decoration:none;">Buka Web Pembeli</a>
      <a href="${SELLER_SITE_URL}" target="_blank" class="btn btn-outline" style="text-align:center;text-decoration:none;">Buka Web Penjual</a>
    </div>
  </div>`;
  mountIcons();
}

init();
