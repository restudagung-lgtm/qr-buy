/*
  storage.js
  ----------
  Semua bagian lain dari aplikasi (customer.js, seller.js, admin.js, app.js) HANYA
  memanggil fungsi-fungsi ini untuk baca/tulis data: sGet, sSet, sList, sDel,
  dan sUploadImage untuk unggah foto. Itu sengaja dibuat begitu dari awal, supaya
  kalau suatu saat kamu mau ganti "mesin" penyimpanan lagi (misalnya dari Firebase
  ke Supabase, atau ke backend sendiri), cukup ubah isi file ini saja — file lain
  tidak perlu disentuh.

  Cara kerja saat ini:
  - Semua data (toko, menu, pesanan, akun penjual, pengaturan) disimpan
    sebagai satu koleksi Firestore bernama "kv" (key-value), satu dokumen
    per key, isinya field "value" berupa JSON string.
  - Foto (foto toko, foto menu, foto QRIS) diunggah ke Firebase Storage lewat
    sUploadImage(), hasilnya berupa URL yang lalu disimpan sebagai field biasa
    di dalam data toko/menu (misalnya store.photoURL).
  - Khusus key "session" (dipakai untuk mengingat login penjual/admin di HP itu
    saja), disimpan di localStorage browser, BUKAN ke Firestore — karena
    sifatnya memang per-perangkat, bukan data bersama.

  PENTING soal foto: fitur ini butuh Firebase Storage aktif di project kamu.
  1. Buka https://console.firebase.google.com -> pilih project -> menu kiri
     "Build" -> "Storage" -> "Get started" -> pilih lokasi server yang sama
     dengan Firestore -> mulai di "test mode" dulu supaya cepat jalan.
  2. Kalau project baru (paket Spark/gratis) diminta upgrade ke paket Blaze,
     itu wajar dari Firebase untuk mengaktifkan Storage -- kuota gratis
     bulanannya tetap ada, jadi untuk skala warung/lapak biasanya tidak kena biaya.
  3. Lihat README.md untuk contoh Storage Rules yang lebih aman sebelum dipakai sungguhan.
*/

const KV_COLLECTION = 'kv';

async function sGet(key, shared){
  if(key === 'session'){
    const v = localStorage.getItem('session');
    return v ? JSON.parse(v) : null;
  }
  try{
    const doc = await db.collection(KV_COLLECTION).doc(key).get();
    if(!doc.exists) return null;
    return JSON.parse(doc.data().value);
  }catch(e){
    console.error('sGet error:', key, e);
    return null;
  }
}

async function sSet(key, val, shared){
  if(key === 'session'){
    localStorage.setItem('session', JSON.stringify(val));
    return true;
  }
  try{
    await db.collection(KV_COLLECTION).doc(key).set({
      value: JSON.stringify(val),
      updatedAt: Date.now()
    });
    return true;
  }catch(e){
    console.error('sSet error:', key, e);
    return false;
  }
}

async function sDel(key, shared){
  if(key === 'session'){
    localStorage.removeItem('session');
    return;
  }
  try{
    await db.collection(KV_COLLECTION).doc(key).delete();
  }catch(e){
    console.error('sDel error:', key, e);
  }
}

async function sList(prefix, shared){
  try{
    const end = prefix + '\uf8ff';
    const snap = await db.collection(KV_COLLECTION)
      .where(firebase.firestore.FieldPath.documentId(), '>=', prefix)
      .where(firebase.firestore.FieldPath.documentId(), '<', end)
      .get();
    return snap.docs.map(d => d.id);
  }catch(e){
    console.error('sList error:', prefix, e);
    return [];
  }
}

/*
  sUploadImage(path, blob)
  -------------------------
  Unggah satu file/blob gambar ke Firebase Storage di lokasi "path"
  (contoh: 'stores/abc123/photo.jpg'), lalu kembalikan URL publik untuk
  disimpan di data toko/menu.

  PENTING: fungsi ini SENGAJA tidak menelan error-nya sendiri (tidak ada
  try/catch di sini) -- errornya dilempar apa adanya ke pemanggil supaya
  pesan aslinya bisa ditampilkan ke pengguna. Penyebab paling umum upload
  gagal adalah Storage Security Rules default Firebase yang mewajibkan
  login (request.auth != null), padahal aplikasi ini tidak memakai Firebase
  Authentication. Lihat komentar di firebase-config.js untuk aturan yang
  perlu dipasang di Firebase Console -> Storage -> Rules.
*/
async function sUploadImage(path, blob){
  if(typeof firebase.storage !== 'function'){
    throw new Error('Firebase Storage belum dimuat -- cek apakah script firebase-storage-compat.js ada di index.html halaman ini.');
  }
  const ref = firebase.storage().ref().child(path);
  await ref.put(blob, { contentType: blob.type || 'image/jpeg' });
  return await ref.getDownloadURL();
}

/*
  sDeleteImage(path)
  -------------------
  Hapus file gambar lama di Storage (dipanggil saat foto diganti/dihapus).
  Di sini boleh diam-diam gagal (misalnya file memang sudah tidak ada) --
  kegagalan hapus foto lama bukan hal fatal buat pengguna.
*/
async function sDeleteImage(path){
  try{
    if(typeof firebase.storage !== 'function' || !path) return;
    await firebase.storage().ref().child(path).delete();
  }catch(e){
    console.warn('sDeleteImage gagal (diabaikan):', path, e);
  }
}

/*
  explainStorageError(e)
  -----------------------
  Dipanggil setiap kali sUploadImage() gagal, untuk mengubah error teknis
  Firebase jadi penjelasan + langkah perbaikan yang sesuai dengan JENIS
  errornya (karena "gagal upload" punya beberapa kemungkinan sebab yang
  langkah perbaikannya beda-beda).
*/
function explainStorageError(e){
  const code = (e && e.code) || '';
  const msg = (e && e.message) || String(e || '');
  const text = (code + ' ' + msg).toLowerCase();

  if(text.includes('unauthorized') || text.includes('permission')){
    return 'Pesan error: ' + (code || msg) +
      '\n\nSEBAB: Storage Rules menolak upload karena mewajibkan login, ' +
      'padahal aplikasi ini tidak memakai Firebase Authentication.\n\n' +
      'PERBAIKAN:\n1. Buka console.firebase.google.com -> pilih project "lapak-alunalun".\n' +
      '2. Menu kiri "Build" -> "Storage" -> tab "Rules".\n' +
      '3. Ganti isinya jadi:\n   rules_version = \'2\';\n   service firebase.storage {\n     match /b/{bucket}/o {\n       match /{allPaths=**} {\n         allow read, write: if true;\n       }\n     }\n   }\n' +
      '4. Klik "Publish", lalu coba upload lagi.';
  }

  if(text.includes('retry-limit-exceeded') || text.includes('retry limit') ||
     text.includes('network') || text.includes('failed to fetch') ||
     text.includes('err_failed') || text.includes('cors') || code === '' && msg === ''){
    return 'Pesan error: ' + (code || msg || 'koneksi ke Firebase Storage gagal total (retry-limit-exceeded / CORS blocked)') +
      '\n\nSEBAB PALING UMUM: Firebase Storage BELUM benar-benar aktif untuk project ini ' +
      '(belum ada "default bucket"), atau project masih di paket gratis "Spark" padahal ' +
      'Storage sekarang mewajibkan paket "Blaze" (bayar-sesuai-pakai, tapi kuota gratis ' +
      'bulanannya tetap ada dan biasanya cukup untuk skala warung/lapak).\n\n' +
      'CEK & PERBAIKI (urut dari yang paling sering jadi sebab):\n' +
      '1. Buka console.firebase.google.com -> pilih project "lapak-alunalun".\n' +
      '2. Menu kiri "Build" -> "Storage". Kalau yang muncul tombol "Get started" / "Upgrade project" ' +
      '(bukan daftar file), artinya Storage BELUM aktif -> klik tombol itu, lalu kalau diminta ' +
      'upgrade ke paket Blaze, ikuti (tetap ada kuota gratis bulanan). Pilih lokasi server yang ' +
      'SAMA dengan lokasi Firestore kamu, lalu mulai di "test mode".\n' +
      '3. Kalau sudah ada bucket, cek nama bucket-nya di tab "Files" (biasanya tertulis di atas, ' +
      'contoh: gs://lapak-alunalun.firebasestorage.app atau gs://lapak-alunalun.appspot.com) dan ' +
      'cocokkan PERSIS dengan nilai "storageBucket" di shared/firebase-config.js. Kalau beda, upload ' +
      'akan selalu gagal seperti ini -- update nilainya lalu refresh halaman.\n' +
      '4. Kalau Storage sudah aktif & bucket sudah cocok tapi tetap gagal, cek tab "Rules" di Storage ' +
      '(lihat langkah di atas) -- pastikan sudah "allow read, write: if true;" lalu Publish.\n' +
      '5. Coba lagi di jaringan WiFi/data lain (jarang, tapi firewall kantor/sekolah kadang blokir ' +
      'domain firebasestorage.googleapis.com).';
  }

  return 'Pesan error: ' + (code || msg) +
    '\n\nKalau errornya menyebut "unauthorized" atau "permission", cek komentar di ' +
    'shared/firebase-config.js bagian Storage Rules. Kalau errornya soal "retry-limit" atau ' +
    'koneksi/CORS, kemungkinan besar Firebase Storage belum aktif di Firebase Console -> Build -> Storage.';
}
