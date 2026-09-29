/*
  profil.js
  ---------
  Halaman /profil/ admin: dibuka lewat avatar bundar di pojok kanan atas.
  Isinya: foto profil admin, ganti password, dan keluar. Pengaturan yang
  sifatnya sistem (jumlah meja) tetap ada di halaman /pengaturan/.
*/

let acc;

async function init(){
  acc = await requireAdminAuth();
  if(!acc) return;
  render();
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/ringkasan/')">${ic('arrow-left',18)}</button><div><h2>Profil Admin</h2></div></div>
  <div class="content">
    <div class="profile-header">
      <label class="avatar-upload" id="avatarUploadBox">
        <input type="file" accept="image/*" id="avatarPhoto" onchange="uploadAvatarPhoto(this)">
        <div class="avatar-circle-lg" id="avatarCircle">${acc.photoURL ? `<img src="${acc.photoURL}" alt="">` : ic('shield',34)}</div>
        <div class="avatar-edit-badge">${ic('camera',14)}</div>
      </label>
      <h2>Admin Alun-Alun</h2>
      <div class="sub">Pengelola pusat semua toko &amp; pesanan</div>
    </div>

    <div class="profile-link-card" onclick="goTo('/pengaturan/')">
      <div class="plc-ic">${ic('settings',19)}</div>
      <div class="plc-info"><h3>Pengaturan Sistem</h3><p class="muted" style="margin:0;">Jumlah meja di alun-alun</p></div>
      <div class="plc-arrow">${ic('chevron-right',18)}</div>
    </div>
    <div class="profile-link-card" onclick="goTo('/toko/')">
      <div class="plc-ic">${ic('crown',19)}</div>
      <div class="plc-info"><h3>Kelola Langganan Toko</h3><p class="muted" style="margin:0;">Aktifkan/cabut status Premium</p></div>
      <div class="plc-arrow">${ic('chevron-right',18)}</div>
    </div>

    <div class="section-title">Keamanan Akun</div>
    <div class="card">
      <div class="field"><label>Password baru</label>
        <div class="pwd-wrap">
          <input id="newPass" type="password" placeholder="minimal 6 karakter">
          <button type="button" class="pwd-toggle ic-btn" onclick="togglePwd('newPass', this)">${ic('eye',16)}</button>
        </div>
      </div>
      <button class="btn btn-outline" onclick="changePassword()">Simpan Password Baru</button>
      <p id="passMsg" class="muted" style="margin-top:8px;"></p>
    </div>

    <button class="btn btn-danger" style="margin-top:6px;" onclick="doAdminLogout()">${ic('log-out',16)} Keluar</button>
  </div>`;
  mountIcons();
}

async function uploadAvatarPhoto(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const circle = document.getElementById('avatarCircle');
  const oldHTML = circle.innerHTML;
  circle.innerHTML = `<span style="font-size:11px;">Mengunggah…</span>`;
  try{
    const blob = await resizeImageToBlob(file, 1000, 0.78);
    const url = await sUploadImage('admin/photo.jpg', blob);
    acc.photoURL = url;
    await sSet('admin:owner', acc, true);
    circle.innerHTML = `<img src="${url}" alt="">`;
  }catch(e){
    console.error('Gagal unggah foto profil admin:', e);
    alert('Gagal mengunggah foto.\n\nPesan error: ' + (e.code || e.message || e) +
      '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di shared/firebase-config.js bagian Storage Rules.');
    circle.innerHTML = oldHTML;
  }
}

async function changePassword(){
  const p = document.getElementById('newPass').value;
  const msg = document.getElementById('passMsg');
  if(!p || p.length < 6){ msg.textContent = 'Password minimal 6 karakter.'; return; }
  acc.password = p;
  await sSet('admin:owner', acc, true);
  msg.textContent = 'Password admin diperbarui.';
  document.getElementById('newPass').value = '';
}

init();
