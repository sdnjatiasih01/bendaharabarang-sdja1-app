// ======================
// script.js — Full App
// ======================

// ======================
// 1) FIREBASE CONFIG
// ======================
const firebaseConfig = {
  apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
  authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
  projectId: "inventaris-sekolah-6aa45",
  storageBucket: "inventaris-sekolah-6aa45.appspot.com",
  messagingSenderId: "482992763821",
  appId: "G-C51S4NNKXM"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ======================
// 2) UI Helper Functions
// ======================
function showAuthView(view) {
  document.getElementById("login-container").style.display = view === "login" ? "block" : "none";
  document.getElementById("register-container").style.display = view === "register" ? "block" : "none";
}

function showView(v) {
  document.querySelectorAll(".view").forEach(x => x.style.display = "none");
  const el = document.getElementById(v + "-view");
  if (el) el.style.display = "block";

  document.querySelectorAll("#sidebar .nav-item").forEach(a => a.classList.remove("active"));
  const nav = Array.from(document.querySelectorAll("#sidebar .nav-item")).find(a => a.getAttribute("onclick")?.includes(`showView('${v}')`));
  if (nav) nav.classList.add("active");
}

// ======================
// 3) AUTH FUNCTIONS
// ======================
function registerUser() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const msg = document.getElementById("reg-message");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      msg.textContent = "Registrasi berhasil! Silakan login.";
      showAuthView("login");
    })
    .catch(err => {
      msg.textContent = "Gagal registrasi: " + err.message;
    });
}

function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const msg = document.getElementById("auth-message");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      msg.textContent = "";
      document.getElementById("login-container").style.display = "none";
      document.getElementById("dashboard-container").style.display = "flex";
      initializeAppAfterLogin();
    })
    .catch(err => {
      msg.textContent = "Login gagal: " + err.message;
    });
}

function logoutUser() {
  auth.signOut().then(() => {
    document.getElementById("dashboard-container").style.display = "none";
    showAuthView("login");
  });
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("dashboard-container").style.display = "flex";
    initializeAppAfterLogin();
  } else {
    document.getElementById("dashboard-container").style.display = "none";
    showAuthView("login");
  }
});

// ======================
// 4) GEDUNG CRUD
// ======================
function saveGedung(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-gedung").value.trim();
  const luas = document.getElementById("luas-gedung").value.trim();
  const tahun = document.getElementById("tahun-gedung").value.trim();
  const sumber = document.getElementById("sumber-gedung").value.trim();

  db.collection("gedung").add({
    namaGedung: nama,
    luasGedung: luas,
    tahunGedung: tahun,
    sumberAnggaran: sumber,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Gedung berhasil ditambahkan!");
    document.querySelector("#gedung-view form").reset();
    loadGedung();
  }).catch(err => alert("Gagal tambah gedung: " + err.message));
}

function loadGedung() {
  const body = document.getElementById("gedung-body");
  body.innerHTML = "<tr><td colspan='6'>Memuat...</td></tr>";

  db.collection("gedung").orderBy("namaGedung").get().then(snap => {
    let html = "";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `
        <tr>
          <td>${i++}</td>
          <td>${d.namaGedung || '-'}</td>
          <td>${d.luasGedung || '-'}</td>
          <td>${d.tahunGedung || '-'}</td>
          <td>${d.sumberAnggaran || '-'}</td>
          <td><button onclick="deleteGedung('${doc.id}')">Hapus</button></td>
        </tr>`;
    });
    body.innerHTML = html || "<tr><td colspan='6'>Belum ada data.</td></tr>";
  });
}

function deleteGedung(id) {
  if (confirm("Yakin ingin menghapus gedung ini?")) {
    db.collection("gedung").doc(id).delete().then(() => {
      alert("Gedung dihapus.");
      loadGedung();
    }).catch(err => alert("Gagal hapus: " + err.message));
  }
}

// ======================
// 5) RUANGAN CRUD
// ======================
function saveRuangan(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-ruangan").value.trim();
  const gedungSelect = document.getElementById("gedung-select");
  const namaGedung = gedungSelect.options[gedungSelect.selectedIndex]?.text || "";
  const penanggung = document.getElementById("penanggung-ruangan").value.trim();

  db.collection("ruangan").add({
    namaRuangan: nama,
    namaGedung: namaGedung,
    penanggungJawab: penanggung,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Ruangan berhasil ditambahkan!");
    document.querySelector("#ruangan-view form").reset();
    loadRuangan();
  }).catch(err => alert("Gagal tambah ruangan: " + err.message));
}

function loadRuangan() {
  const body = document.getElementById("ruangan-body");
  const selectGedung = document.getElementById("gedung-select");
  body.innerHTML = "<tr><td colspan='5'>Memuat...</td></tr>";

  // isi dropdown gedung
  selectGedung.innerHTML = "";
  db.collection("gedung").orderBy("namaGedung").get().then(gSnap => {
    gSnap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaGedung;
      opt.text = d.namaGedung;
      selectGedung.appendChild(opt);
    });
  });

  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    let html = "";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `
        <tr>
          <td>${i++}</td>
          <td>${d.namaRuangan || '-'}</td>
          <td>${d.namaGedung || '-'}</td>
          <td>${d.penanggungJawab || '-'}</td>
          <td><button onclick="deleteRuangan('${doc.id}')">Hapus</button></td>
        </tr>`;
    });
    body.innerHTML = html || "<tr><td colspan='5'>Belum ada data.</td></tr>";
  });
}

function deleteRuangan(id) {
  if (confirm("Yakin ingin menghapus ruangan ini?")) {
    db.collection("ruangan").doc(id).delete().then(() => {
      alert("Ruangan dihapus.");
      loadRuangan();
    }).catch(err => alert("Gagal hapus: " + err.message));
  }
}

// ======================
// 6) BARANG CRUD
// ======================
function saveBarang(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-barang").value.trim();
  const merk = document.getElementById("merk-barang").value.trim();
  const jumlah = parseInt(document.getElementById("jumlah-barang").value.trim());
  const ruangan = document.getElementById("ruangan-select").value.trim();
  const kondisi = document.getElementById("kondisi-barang").value.trim();

  db.collection("barang").add({
    namaBarang: nama,
    merkType: merk,
    jumlah: jumlah,
    ruangan: ruangan,
    kondisi: kondisi,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Barang berhasil ditambahkan!");
    document.querySelector("#barang-view form").reset();
    loadBarang();
  }).catch(err => alert("Gagal tambah barang: " + err.message));
}

function loadBarang() {
  const body = document.getElementById("barang-body");
  const selectRuangan = document.getElementById("ruangan-select");
  body.innerHTML = "<tr><td colspan='7'>Memuat...</td></tr>";

  selectRuangan.innerHTML = "";
  db.collection("ruangan").orderBy("namaRuangan").get().then(rSnap => {
    rSnap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = d.namaRuangan;
      selectRuangan.appendChild(opt);
    });
  });

  db.collection("barang").orderBy("namaBarang").get().then(snap => {
    let html = "";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `
        <tr>
          <td>${i++}</td>
          <td>${d.namaBarang || '-'}</td>
          <td>${d.merkType || '-'}</td>
          <td>${d.jumlah || 0}</td>
          <td>${d.ruangan || '-'}</td>
          <td>${d.kondisi || '-'}</td>
          <td><button onclick="deleteBarang('${doc.id}')">Hapus</button></td>
        </tr>`;
    });
    body.innerHTML = html || "<tr><td colspan='7'>Belum ada data.</td></tr>";
  });
}

function deleteBarang(id) {
  if (confirm("Yakin ingin menghapus barang ini?")) {
    db.collection("barang").doc(id).delete().then(() => {
      alert("Barang dihapus.");
      loadBarang();
    }).catch(err => alert("Gagal hapus: " + err.message));
  }
}

// ======================
// 7) IDENTITAS SEKOLAH
// ======================
const IDENTITAS_DOC_ID = "config";

async function saveIdentitas(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-sekolah").value.trim();
  const alamat = document.getElementById("alamat-sekolah").value.trim();
  const bendaharaNama = document.getElementById("bendahara-nama").value.trim();
  const bendaharaNip = document.getElementById("bendahara-nip").value.trim();
  const pjNama = document.getElementById("pj-nama").value.trim();
  const pjNip = document.getElementById("pj-nip").value.trim();

  const fileInput = document.getElementById("logo-sekolah");
  const file = fileInput.files && fileInput.files[0];

  try {
    let logoUrl = "";
    if (file) {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`logo/logo_${Date.now()}_${file.name}`);
      const snap = await fileRef.put(file);
      logoUrl = await snap.ref.getDownloadURL();
    } else {
      const existing = await db.collection("identitas").doc(IDENTITAS_DOC_ID).get();
      if (existing.exists) logoUrl = existing.data().logoUrl || "";
    }

    await db.collection("identitas").doc(IDENTITAS_DOC_ID).set({
      namaSekolah: nama,
      alamat: alamat,
      logoUrl: logoUrl,
      bendaharaNama: bendaharaNama,
      bendaharaNip: bendaharaNip,
      pjNama: pjNama,
      pjNip: pjNip
    }, { merge: true });

    alert("Identitas disimpan.");
    loadIdentitas();
  } catch (err) {
    alert("Gagal simpan identitas: " + err.message);
  }
}

function loadIdentitas() {
  db.collection("identitas").doc(IDENTITAS_DOC_ID).get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    document.getElementById("nama-sekolah").value = d.namaSekolah || "";
    document.getElementById("alamat-sekolah").value = d.alamat || "";
    document.getElementById("bendahara-nama").value = d.bendaharaNama || "";
    document.getElementById("bendahara-nip").value = d.bendaharaNip || "";
    document.getElementById("pj-nama").value = d.pjNama || "";
    document.getElementById("pj-nip").value = d.pjNip || "";
    if (d.logoUrl) document.getElementById("logo-preview").src = d.logoUrl;
  });
}

// ======================
// 8) DASHBOARD & LAPORAN
// ======================
function loadFilterRuanganOptions() {
  const sel = document.getElementById("filter-ruangan");
  sel.innerHTML = "<option value=''>-- Pilih Ruangan --</option>";
  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    snap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = d.namaRuangan;
      sel.appendChild(opt);
    });
  });
}

function updateDashboardRuangan() {
  const chosen = document.getElementById("filter-ruangan").value;
  if (!chosen) {
    document.getElementById("dashboard-barang-body").innerHTML = "<tr><td colspan='5'>Pilih ruangan untuk melihat data.</td></tr>";
    return;
  }

  db.collection("barang").where("ruangan", "==", chosen).get().then(snap => {
    let rowsHtml = "";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      rowsHtml += `<tr>
        <td>${i++}</td>
        <td>${d.namaBarang || '-'}</td>
        <td>${d.merkType || '-'}</td>
        <td>${d.jumlah || 0}</td>
        <td>${d.kondisi || '-'}</td>
      </tr>`;
    });
    document.getElementById("dashboard-barang-body").innerHTML = rowsHtml || "<tr><td colspan='5'>Tidak ada barang di ruangan ini.</td></tr>";
  });
}

function loadDashboardCountsAndChart() {
  db.collection("barang").get().then(snap => {
    let total = 0, B = 0, RR = 0, RB = 0;
    snap.forEach(doc => {
      const d = doc.data();
      const qty = d.jumlah || 0;
      total += qty;
      if (d.kondisi === "B") B += qty;
      else if (d.kondisi === "RR") RR += qty;
      else if (d.kondisi === "RB") RB += qty;
    });
    document.getElementById("total-barang").innerText = total;
    document.getElementById("total-baik").innerText = B;
    document.getElementById("total-rr").innerText = RR;
    document.getElementById("total-rb").innerText = RB;
  });
}

function loadLaporan() {
  db.collection("barang").orderBy("namaBarang").get().then(snap => {
    let html = ""; let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `<tr>
        <td>${i++}</td>
        <td>${d.namaBarang || '-'}</td>
        <td>${d.merkType || '-'}</td>
        <td>${d.jumlah || 0}</td>
        <td>${d.kondisi || '-'}</td>
      </tr>`;
    });
    document.getElementById("laporan-body").innerHTML = html || "<tr><td colspan='5'>Tidak ada data.</td></tr>";
    document.getElementById("tanggal-cetak").innerText = new Date().toLocaleDateString("id-ID");
  });

  db.collection("identitas").doc(IDENTITAS_DOC_ID).get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    document.getElementById("lap-nama-sekolah").innerText = d.namaSekolah || "";
    document.getElementById("lap-alamat-sekolah").innerText = d.alamat || "";
    document.getElementById("lap-bendahara-nama").innerText = d.bendaharaNama || "";
    document.getElementById("lap-bendahara-nip").innerText = d.bendaharaNip || "";
    document.getElementById("lap-pj-nama").innerText = d.pjNama || "";
    document.getElementById("lap-pj-nip").innerText = d.pjNip || "";
    if (d.logoUrl) document.getElementById("logo-preview").src = d.logoUrl;
  });
}

function printLaporan() {
  showView("laporan");
  loadLaporan();
  setTimeout(() => { window.print(); }, 500);
}

// ======================
// 9) INIT AFTER LOGIN
// ======================
function initializeAppAfterLogin() {
  showView("beranda");
  loadGedung();
  loadRuangan();
  loadBarang();
  loadIdentitas();
  loadFilterRuanganOptions();
  loadDashboardCountsAndChart();
  updateDashboardRuangan();
  loadLaporan();
}
