/*
  login.js
  --------
  Halaman utama situs admin: setup password admin (kalau belum pernah ada),
  atau masuk. Kalau di HP ini sudah pernah login, langsung lempar ke
  /ringkasan/.
*/

async function init(){
  const session = await sGet('session', false);
  if(session === 'owner'){
    const acc = await sGet('admin:owner', true);
    if(acc){ goTo('/ringkasan/'); return; }
  }
  renderAuth();
}

async function renderAuth(){
  const app = document.getElementById('app');
  const existing = await sGet('admin:owner', true);

  if(!existing){
    app.innerHTML = `
    <div class="hero-card">
      <div class="ic-circle" style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;">${ic('shield',28)}</div>
      <h1>Setup Admin</h1>
      <p>Belum ada akun admin untuk alun-alun ini.<br>Buat password admin sekali di awal.</p>
    </div>
    <div class="content">
      <div class="card">
        <div class="field"><label>Buat password admin</label>
          <div class="pwd-wrap">
            <input id="apNew" type="password" placeholder="minimal 6 karakter">
            <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('apNew', this)">${ic('eye',16)}</button>
          </div>
        </div>
        <div class="field"><label>Ulangi password</label>
          <div class="pwd-wrap">
            <input id="apNew2" type="password" placeholder="ulangi password">
            <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('apNew2', this)">${ic('eye',16)}</button>
          </div>
        </div>
        <button class="btn btn-primary" onclick="setupAdmin()">Buat Akun Admin</button>
        <p id="setupMsg" class="muted" style="margin-top:8px;"></p>
      </div>
    </div>`;
    mountIcons();
    return;
  }

  app.innerHTML = `
  <div class="hero-card">
    <div class="ic-circle" style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;">${ic('shield',28)}</div>
    <h1>Panel Admin</h1>
    <p>Masuk untuk memantau seluruh toko dan pesanan di alun-alun.</p>
  </div>
  <div class="content">
    <div class="card">
      <div class="field"><label>Password admin</label>
        <div class="pwd-wrap">
          <input id="apLogin" type="password" placeholder="••••••">
          <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('apLogin', this)">${ic('eye',16)}</button>
        </div>
      </div>
      <button class="btn btn-primary" onclick="doAdminLogin()">Masuk</button>
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </div>
  </div>`;
  mountIcons();
}

async function setupAdmin(){
  const p1 = document.getElementById('apNew').value;
  const p2 = document.getElementById('apNew2').value;
  const msg = document.getElementById('setupMsg');
  if(!p1 || p1.length < 6){ msg.textContent = 'Password minimal 6 karakter.'; return; }
  if(p1 !== p2){ msg.textContent = 'Password tidak sama.'; return; }
  await sSet('admin:owner', {password:p1, createdAt:Date.now()}, true);
  await sSet('session', 'owner', false);
  goTo('/ringkasan/');
}

async function doAdminLogin(){
  const p = document.getElementById('apLogin').value;
  const msg = document.getElementById('loginMsg');
  const acc = await sGet('admin:owner', true);
  if(!acc || acc.password !== p){ msg.textContent = 'Password salah.'; return; }
  await sSet('session', 'owner', false);
  goTo('/ringkasan/');
}

init();
