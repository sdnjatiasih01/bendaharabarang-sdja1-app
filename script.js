// ======================
// script.js — Inventaris SDN Jatiasih I (Versi Lengkap + Filter Ruangan & Logo Laporan)
// ======================

// ----------------------
// 1) FIREBASE CONFIG
// ----------------------
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

// ----------------------
// 2) VIEW HANDLING
// ----------------------
function showAuthView(view) {
  document.getElementById("login-container").style.display = view === "login" ? "block" : "none";
  document.getElementById("register-container").style.display = view === "register" ? "block" : "none";
}

function showView(v) {
  document.querySelectorAll(".view").forEach(x => x.style.display = "none");
  const el = document.getElementById(v + "-view");
  if (el) el.style.display = "block";

  document.querySelectorAll("#sidebar .nav-item").forEach(a => a.classList.remove("active"));
  const nav = Array.from(document.querySelectorAll("#sidebar .nav-item"))
    .find(a => a.getAttribute("onclick")?.includes(`showView('${v}')`));
  if (nav) nav.classList.add("active");
}

// ----------------------
// 3) AUTH
// ----------------------
function registerUser() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const msg = document.getElementById("reg-message");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      msg.textContent = "Registrasi berhasil! Silakan login.";
      showAuthView("login");
    })
    .catch(err => msg.textContent = "Gagal registrasi: " + err.message);
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
    .catch(err => msg.textContent = "Login gagal: " + err.message);
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

// ----------------------
// 4) CRUD GEDUNG
// ----------------------
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
    let html = "", i = 1;
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

// ----------------------
// 5) CRUD RUANGAN
// ----------------------
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
    let html = "", i = 1;
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

// ----------------------
// 6) CRUD BARANG
// ----------------------
function saveBarang(e) {
  e.preventDefault();
  const ruanganSelect = document.getElementById("ruangan-select");
  const namaRuangan = ruanganSelect.options[ruanganSelect.selectedIndex]?.text || "";
  const namaBarang = document.getElementById("nama-barang").value.trim();
  const merkType = document.getElementById("merk-barang").value.trim();
  const jumlah = parseInt(document.getElementById("jumlah-barang").value.trim()) || 0;
  const kondisi = document.getElementById("kondisi-barang").value.trim();

  db.collection("barang").add({
    namaBarang,
    merkType,
    jumlah,
    kondisi,
    ruangan: namaRuangan,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Barang berhasil ditambahkan!");
    document.querySelector("#barang-view form").reset();
    loadBarang();
  }).catch(err => alert("Gagal tambah barang: " + err.message));
}

function loadBarang() {
  const body = document.getElementById("barang-body");
  const ruanganSelect = document.getElementById("ruangan-select");

  body.innerHTML = "<tr><td colspan='7'>Memuat...</td></tr>";
  ruanganSelect.innerHTML = "";

  db.collection("ruangan").orderBy("namaRuangan").get().then(rSnap => {
    rSnap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = d.namaRuangan;
      ruanganSelect.appendChild(opt);
    });
  });

  db.collection("barang").orderBy("namaBarang").get().then(snap => {
    let html = "", i = 1;
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

// ----------------------
// 7) IDENTITAS SEKOLAH
// ----------------------
const IDENTITAS_DOC_ID = "profil-sekolah";

async function saveIdentitas(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-sekolah").value.trim();
  const alamat = document.getElementById("alamat-sekolah").value.trim();
  const logoUrl = document.getElementById("logo-sekolah").value.trim();
  const bendaharaNama = document.getElementById("bendahara-nama").value.trim();
  const bendaharaNip = document.getElementById("bendahara-nip").value.trim();
  const pjNama = document.getElementById("pj-nama").value.trim();
  const pjNip = document.getElementById("pj-nip").value.trim();

  try {
    await db.collection("identitas").doc(IDENTITAS_DOC_ID).set({
      namaSekolah: nama,
      alamat: alamat,
      logoUrl: logoUrl,
      bendaharaNama,
      bendaharaNip,
      pjNama,
      pjNip
    }, { merge: true });

    alert("Identitas disimpan!");
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
    document.getElementById("logo-sekolah").value = d.logoUrl || "";
    document.getElementById("bendahara-nama").value = d.bendaharaNama || "";
    document.getElementById("bendahara-nip").value = d.bendaharaNip || "";
    document.getElementById("pj-nama").value = d.pjNama || "";
    document.getElementById("pj-nip").value = d.pjNip || "";

    if (d.logoUrl) document.getElementById("logo-preview").src = d.logoUrl;
  });
}

// ----------------------
// 8) LAPORAN (dengan filter ruangan & logo sekolah)
// ----------------------
function updateTanggalCetakManual() {
  const input = document.getElementById("input-tanggal-cetak");
  const span = document.getElementById("tanggal-cetak");
  if (input.value) {
    const tgl = new Date(input.value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    span.textContent = tgl;
  } else {
    span.textContent = "";
  }
}

function loadLaporan() {
  const tbody = document.getElementById("laporan-body");
  const filterSelect = document.getElementById("laporan-filter-ruangan");
  tbody.innerHTML = "<tr><td colspan='5'>Memuat...</td></tr>";

  // isi pilihan ruangan
  filterSelect.innerHTML = "<option value=''>-- Semua Ruangan --</option>";
  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    snap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = d.namaRuangan;
      filterSelect.appendChild(opt);
    });
  });

  tampilkanLaporanBarang();

  // ambil identitas sekolah + logo
  db.collection("identitas").doc(IDENTITAS_DOC_ID).get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    document.getElementById("lap-nama-sekolah").innerText = d.namaSekolah || "";
    document.getElementById("lap-alamat-sekolah").innerText = d.alamat || "";
    document.getElementById("lap-bendahara-nama").innerText = d.bendaharaNama || "";
    document.getElementById("lap-bendahara-nip").innerText = d.bendaharaNip || "";
    if (d.logoUrl) {
      const logoEl = document.getElementById("lap-logo-sekolah");
      if (logoEl) logoEl.src = d.logoUrl;
    }
  });
}

function tampilkanLaporanBarang() {
  const tbody = document.getElementById("laporan-body");
  const selectedRuangan = document.getElementById("laporan-filter-ruangan").value;
  tbody.innerHTML = "<tr><td colspan='5'>Memuat...</td></tr>";

  let query = db.collection("barang").orderBy("namaBarang");
  if (selectedRuangan) query = query.where("ruangan", "==", selectedRuangan);

  query.get().then(snap => {
    let html = "", i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `
        <tr>
          <td>${i++}</td>
          <td>${d.namaBarang || '-'}</td>
          <td>${d.merkType || '-'}</td>
          <td>${d.jumlah || 0}</td>
          <td>${d.kondisi || '-'}</td>
        </tr>`;
    });
    tbody.innerHTML = html || "<tr><td colspan='5'>Tidak ada data.</td></tr>";
  });
}

function printLaporan() {
  window.print();
}

// ----------------------
// 9) DASHBOARD
// ----------------------
let chartRuangan = null;

function loadDashboardCountsAndChart() {
  db.collection("barang").get().then(snap => {
    let total = 0, baik = 0, rr = 0, rb = 0;
    snap.forEach(doc => {
      total++;
      const kondisi = (doc.data().kondisi || "").toUpperCase();
      if (kondisi === "B") baik++;
      else if (kondisi === "RR") rr++;
      else if (kondisi === "RB") rb++;
    });

    document.getElementById("total-barang").textContent = total;
    document.getElementById("total-baik").textContent = baik;
    document.getElementById("total-rr").textContent = rr;
    document.getElementById("total-rb").textContent = rb;

    const ctx = document.getElementById("chartRuangan").getContext("2d");
    if (chartRuangan) chartRuangan.destroy();
    chartRuangan = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Baik", "Rusak Ringan", "Rusak Berat"],
        datasets: [{
          label: "Jumlah Barang",
          data: [baik, rr, rb]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  });
}

function loadFilterRuanganOptions() {
  const select = document.getElementById("filter-ruangan");
  select.innerHTML = "";
  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    snap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = d.namaRuangan;
      select.appendChild(opt);
    });
  });
}

function updateDashboardRuangan() {
  const selected = document.getElementById("filter-ruangan").value;
  const body = document.getElementById("dashboard-barang-body");
  if (!selected) {
    body.innerHTML = "<tr><td colspan='5'>Silakan pilih ruangan untuk melihat data barang.</td></tr>";
    return;
  }

  db.collection("barang").where("ruangan", "==", selected).get().then(snap => {
    let html = "", i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `
        <tr>
          <td>${i++}</td>
          <td>${d.namaBarang || '-'}</td>
          <td>${d.merkType || '-'}</td>
          <td>${d.jumlah || 0}</td>
          <td>${d.kondisi || '-'}</td>
        </tr>`;
    });
    body.innerHTML = html || "<tr><td colspan='5'>Tidak ada data.</td></tr>";
  });
}

// ----------------------
// 10) INITIALIZATION
// ----------------------
function initializeAppAfterLogin() {
  loadGedung();
  loadRuangan();
  loadBarang();
  loadFilterRuanganOptions();
  loadDashboardCountsAndChart();
  loadIdentitas();
  loadLaporan();
}
