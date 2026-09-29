/*
  login.js
  --------
  Halaman utama situs penjual: masuk, atau daftar toko baru. Kalau di HP
  ini sudah pernah login sebelumnya (sesi tersimpan), langsung lempar ke
  /menu/ (tab pertama dashboard).
*/

async function init(){
  const username = await sGet('session', false);
  if(username){
    const acc = await sGet('seller:' + username, true);
    if(acc){ goTo('/menu/'); return; }
  }
  renderAuth();
}

function renderAuth(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><div><h2 style="display:flex;align-items:center;gap:8px;">${ic('store',20)} Dashboard Penjual</h2><div class="sub">Kelola toko kamu di alun-alun</div></div></div>
  <div class="content">
    <div class="tabbar" style="border-radius:999px;overflow:hidden;margin-bottom:16px;position:static;background:var(--ink-2);">
      <button id="tabLogin" class="active" onclick="switchAuthTab('login')">Masuk</button>
      <button id="tabReg" onclick="switchAuthTab('reg')">Daftar Toko Baru</button>
    </div>
    <div id="authForm"></div>
    <p class="muted" style="text-align:center;margin-top:18px;">
      Cuma mau lihat cara pembeli memesan? <a href="${BUYER_SITE_URL}" target="_blank">Buka web pembeli</a>
    </p>
  </div>`;
  switchAuthTab('login');
}

function switchAuthTab(tab){
  document.getElementById('tabLogin').className = tab === 'login' ? 'active' : '';
  document.getElementById('tabReg').className = tab === 'reg' ? 'active' : '';
  const el = document.getElementById('authForm');
  if(tab === 'login'){
    el.innerHTML = `
    <div class="card">
      <div class="field"><label>Username</label><input id="lu" type="text" placeholder="username"></div>
      <div class="field"><label>Password</label>
        <div class="pwd-wrap">
          <input id="lp" type="password" placeholder="••••••">
          <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('lp', this)">${ic('eye',16)}</button>
        </div>
      </div>
      <button class="btn btn-primary" onclick="doLogin()">Masuk</button>
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </div>`;
  } else {
    el.innerHTML = `
    <div class="card">
      <div class="field"><label>Nama toko</label><input id="ru" type="text" placeholder="contoh: Nasi Goreng Bu Sri"></div>
      <div class="field"><label>Deskripsi singkat</label><input id="rd" type="text" placeholder="contoh: Nasi goreng & mie goreng"></div>
      <div class="field"><label>Kategori toko</label>
        <select id="rcat">${catOptionsHTML()}</select>
      </div>
      <div class="field"><label>Username</label><input id="rus" type="text" placeholder="username unik"></div>
      <div class="field"><label>Password</label>
        <div class="pwd-wrap">
          <input id="rp" type="password" placeholder="buat password">
          <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('rp', this)">${ic('eye',16)}</button>
        </div>
      </div>
      <button class="btn btn-primary" onclick="doRegister()">Daftar & Masuk</button>
      <p id="regMsg" class="muted" style="margin-top:8px;"></p>
    </div>`;
  }
  mountIcons();
}

async function doRegister(){
  const name = document.getElementById('ru').value.trim();
  const desc = document.getElementById('rd').value.trim();
  const category = document.getElementById('rcat').value;
  const username = document.getElementById('rus').value.trim();
  const pass = document.getElementById('rp').value;
  const msg = document.getElementById('regMsg');
  if(!name || !username || !pass){ msg.textContent = 'Lengkapi semua kolom.'; return; }
  const existing = await sGet('seller:' + username, true);
  if(existing){ msg.textContent = 'Username sudah dipakai, pilih yang lain.'; return; }
  const storeId = genId();
  await sSet('store:' + storeId, {id:storeId, name, desc, category, ownerUsername:username, ratingSum:0, ratingCount:0}, true);
  await sSet('seller:' + username, {password:pass, storeId, storeName:name}, true);
  await sSet('session', username, false);
  goTo('/menu/');
}

async function doLogin(){
  const username = document.getElementById('lu').value.trim();
  const pass = document.getElementById('lp').value;
  const msg = document.getElementById('loginMsg');
  const acc = await sGet('seller:' + username, true);
  if(!acc || acc.password !== pass){ msg.textContent = 'Username atau password salah.'; return; }
  await sSet('session', username, false);
  goTo('/menu/');
}

init();
