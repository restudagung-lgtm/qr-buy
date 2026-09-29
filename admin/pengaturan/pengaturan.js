/*
  pengaturan.js
  -------------
  Halaman /pengaturan/: jumlah meja di alun-alun & ganti password admin.
*/

async function init(){
  const acc = await requireAdminAuth();
  if(!acc) return;
  const dashContent = renderDashShell('pengaturan');
  const cfg = await sGet('config:totalTables', true);
  dashContent.innerHTML = `
  <div class="card">
    <h3>Jumlah Meja di Alun-Alun</h3>
    <p class="muted" style="margin:4px 0 10px;">Dipakai untuk denah lokasi & pengurutan toko terdekat di seluruh sistem.</p>
    <div class="field"><label>Jumlah meja</label><input id="setTotal" type="number" min="1" max="50" value="${cfg?.total || 16}"></div>
    <button class="btn btn-primary" onclick="saveTotalTables()">Simpan</button>
    <p id="totalMsg" class="muted" style="margin-top:8px;"></p>
  </div>
  <p class="faint" style="text-align:center;">Ganti password &amp; foto profil ada di halaman Profil (avatar di pojok kanan atas).</p>`;
  mountIcons();
}

async function saveTotalTables(){
  const n = Number(document.getElementById('setTotal').value) || 16;
  await sSet('config:totalTables', {total:n}, true);
  document.getElementById('totalMsg').textContent = 'Tersimpan.';
}

init();
