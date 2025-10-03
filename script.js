// ======================
// script.js — Full App
// ======================

// ======================
// 1) FIREBASE CONFIG
// ======================
// Ganti dengan config project Anda:
const firebaseConfig = {
  apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
  authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
  projectId: "inventaris-sekolah-6aa45",
  storageBucket: "inventaris-sekolah-6aa45.appspot.com", // contoh: "inventaris-sekolah.appspot.com"
  messagingSenderId: "482992763821",
  appId: "G-C51S4NNKXM"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ======================
// 2) GLOBALS
// ======================
let chartInstance = null;

// ======================
// 3) AUTH & UI Helpers
// ======================
function showAuthView(view) {
  document.getElementById("login-container").style.display = view === "login" ? "block" : "none";
  document.getElementById("register-container").style.display = view === "register" ? "block" : "none";
}

function showView(v) {
  document.querySelectorAll(".view").forEach(x => x.style.display = "none");
  const el = document.getElementById(v + "-view");
  if (el) el.style.display = "block";
  // highlight sidebar active (optional)
  document.querySelectorAll("#sidebar .nav-item").forEach(a => a.classList.remove("active"));
  const nav = Array.from(document.querySelectorAll("#sidebar .nav-item")).find(a => a.getAttribute("onclick")?.includes(`showView('${v}')`));
  if (nav) nav.classList.add("active");
}

// ======================
// 4) AUTH FUNCTIONS
// ======================
function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  document.getElementById("auth-message").innerText = "Loading...";
  if (!email || !password) {
    document.getElementById("auth-message").innerText = "Email dan password wajib diisi.";
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .then(() => { document.getElementById("auth-message").innerText = ""; })
    .catch(err => { document.getElementById("auth-message").innerText = err.message; });
}

function registerUser() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const msg = document.getElementById("reg-message");
  msg.innerText = "Mendaftarkan...";
  if (!email || !password) { msg.innerText = "Email & password wajib diisi."; return; }
  if (password.length < 6) { msg.innerText = "Password minimal 6 karakter."; return; }

  auth.createUserWithEmailAndPassword(email, password)
    .then(uc => {
      // Buat record users dasar (role admin/user default 'user')
      db.collection("users").doc(uc.user.uid).set({
        email: email,
        role: "user",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      msg.innerText = "Pendaftaran berhasil. Silakan login.";
      showAuthView("login");
    })
    .catch(err => { msg.innerText = err.message; });
}

function logoutUser() {
  auth.signOut().catch(err => console.error("Logout error:", err));
}

// Monitor auth state
auth.onAuthStateChanged(user => {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  if (user) {
    loginContainer.style.display = "none";
    document.getElementById("register-container").style.display = "none";
    dashboardContainer.style.display = "flex";
    // Initialize views & data
    initializeAppAfterLogin();
  } else {
    dashboardContainer.style.display = "none";
    loginContainer.style.display = "block";
    showView("beranda");
  }
});

// ======================
// 5) GEDUNG CRUD
// ======================
function saveGedung(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-gedung").value.trim();
  const luas = document.getElementById("luas-gedung").value.trim();
  const tahun = parseInt(document.getElementById("tahun-gedung").value) || null;
  const sumber = document.getElementById("sumber-gedung").value.trim();
  if (!nama) { alert("Nama gedung wajib diisi."); return; }

  db.collection("gedung").add({
    namaGedung: nama,
    luas: luas || null,
    tahun: tahun || null,
    sumberAnggaran: sumber || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("nama-gedung").value = "";
    document.getElementById("luas-gedung").value = "";
    document.getElementById("tahun-gedung").value = "";
    document.getElementById("sumber-gedung").value = "";
    loadGedung();
  }).catch(err => alert("Gagal tambah gedung: " + err.message));
}

function loadGedung() {
  db.collection("gedung").orderBy("namaGedung").get().then(snap => {
    let html = ""; let optsGedung = "<option value=''>Pilih Gedung</option>";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `<tr>
        <td>${i++}</td>
        <td>${d.namaGedung || "-"}</td>
        <td>${d.luas || "-"}</td>
        <td>${d.tahun || "-"}</td>
        <td>${d.sumberAnggaran || "-"}</td>
        <td><button onclick="deleteGedung('${doc.id}', '${d.namaGedung || ""}')">Hapus</button></td>
      </tr>`;
      optsGedung += `<option value="${d.namaGedung}">${d.namaGedung}</option>`;
    });
    document.getElementById("gedung-body").innerHTML = html || "<tr><td colspan='6'>Tidak ada data gedung.</td></tr>";
    document.getElementById("gedung-select").innerHTML = optsGedung;
    // juga update filter-ruangan's gedung? (we only need ruangan list)
  });
}

async function deleteGedung(docId, namaGedung) {
  if (!confirm(`Hapus gedung "${namaGedung}"? (Aksi ini gagal kalau masih ada ruangan di gedung ini)`)) return;
  try {
    const q = await db.collection("ruangan").where("namaGedung", "==", namaGedung).limit(1).get();
    if (!q.empty) {
      alert("Gagal hapus: masih ada ruangan di gedung ini. Hapus ruangan terlebih dahulu.");
      return;
    }
    await db.collection("gedung").doc(docId).delete();
    loadGedung();
  } catch (err) { alert("Gagal hapus gedung: " + err.message); }
}

// ======================
// 6) RUANGAN CRUD
// ======================
function saveRuangan(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-ruangan").value.trim();
  const gedung = document.getElementById("gedung-select").value;
  const penanggung = document.getElementById("penanggung-ruangan").value.trim();
  if (!nama || !gedung) { alert("Nama ruangan & gedung wajib diisi."); return; }

  db.collection("ruangan").add({
    namaRuangan: nama,
    namaGedung: gedung,
    penanggungJawab: penanggung || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("nama-ruangan").value = "";
    document.getElementById("penanggung-ruangan").value = "";
    loadRuangan();
    loadFilterRuanganOptions(); // update dashboard filter
  }).catch(err => alert("Gagal tambah ruangan: " + err.message));
}

function loadRuangan() {
  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    let html = ""; let i = 1; let opts = "<option value=''>Pilih Ruangan</option>";
    snap.forEach(doc => {
      const d = doc.data();
      html += `<tr>
        <td>${i++}</td>
        <td>${d.namaRuangan || "-"}</td>
        <td>${d.namaGedung || "-"}</td>
        <td>${d.penanggungJawab || "-"}</td>
        <td><button onclick="deleteRuangan('${doc.id}', '${d.namaRuangan || ""}')">Hapus</button></td>
      </tr>`;
      opts += `<option value="${d.namaRuangan}">${d.namaRuangan} (${d.namaGedung || '-'})</option>`;
    });
    document.getElementById("ruangan-body").innerHTML = html || "<tr><td colspan='5'>Tidak ada data ruangan.</td></tr>";
    document.getElementById("ruangan-select").innerHTML = opts;
    loadFilterRuanganOptions(); // also update dashboard filter
  });
}

async function deleteRuangan(docId, namaRuangan) {
  if (!confirm(`Hapus ruangan "${namaRuangan}"? (Aksi ini gagal kalau masih ada barang di ruangan ini)`)) return;
  try {
    const q = await db.collection("barang").where("ruangan", "==", namaRuangan).limit(1).get();
    if (!q.empty) {
      alert("Gagal hapus: masih ada barang di ruangan ini. Hapus atau pindahkan barang terlebih dahulu.");
      return;
    }
    await db.collection("ruangan").doc(docId).delete();
    loadRuangan();
  } catch (err) { alert("Gagal hapus ruangan: " + err.message); }
}

// ======================
// 7) BARANG CRUD
// ======================
function saveBarang(e) {
  e.preventDefault();
  const nama = document.getElementById("nama-barang").value.trim();
  const merk = document.getElementById("merk-barang").value.trim();
  const jumlah = parseInt(document.getElementById("jumlah-barang").value) || 0;
  const ruangan = document.getElementById("ruangan-select").value;
  const kondisi = document.getElementById("kondisi-barang").value;
  if (!nama || !ruangan) { alert("Nama barang dan ruangan wajib diisi."); return; }

  db.collection("barang").add({
    namaBarang: nama,
    merkType: merk || null,
    jumlah: jumlah,
    ruangan: ruangan,
    kondisi: kondisi || "B",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("nama-barang").value = "";
    document.getElementById("merk-barang").value = "";
    document.getElementById("jumlah-barang").value = "";
    loadBarang();
    loadDashboardCountsAndChart();
    loadLaporan();
  }).catch(err => alert("Gagal tambah barang: " + err.message));
}

function loadBarang() {
  // load all barang into barang-view table
  db.collection("barang").orderBy("createdAt", "desc").get().then(snap => {
    let html = ""; let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      html += `<tr>
        <td>${i++}</td>
        <td>${d.namaBarang || '-'}</td>
        <td>${d.merkType || '-'}</td>
        <td>${d.jumlah || 0}</td>
        <td>${d.ruangan || '-'}</td>
        <td>${d.kondisi || '-'}</td>
        <td><button onclick="deleteBarang('${doc.id}')">Hapus</button></td>
      </tr>`;
    });
    document.getElementById("barang-body").innerHTML = html || "<tr><td colspan='7'>Tidak ada data barang.</td></tr>";
  });
}

function deleteBarang(id) {
  if (!confirm("Hapus barang ini?")) return;
  db.collection("barang").doc(id).delete().then(() => {
    loadBarang();
    loadDashboardCountsAndChart();
    loadLaporan();
  });
}

// ======================
// 8) IDENTITAS (single doc 'config')
// ======================
const IDENTITAS_DOC_ID = "config"; // single document to hold school identity

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
      // Upload to Firebase Storage under 'logo/logo.png' with timestamp
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`logo/logo_${Date.now()}_${file.name}`);
      const snap = await fileRef.put(file);
      logoUrl = await snap.ref.getDownloadURL();
    } else {
      // preserve existing logo if any
      const existing = await db.collection("identitas").doc(IDENTITAS_DOC_ID).get();
      if (existing.exists) logoUrl = existing.data().logoUrl || "";
    }

    await db.collection("identitas").doc(IDENTITAS_DOC_ID).set({
      namaSekolah: nama || "",
      alamat: alamat || "",
      logoUrl: logoUrl || "",
      bendaharaNama: bendaharaNama || "",
      bendaharaNip: bendaharaNip || "",
      pjNama: pjNama || "",
      pjNip: pjNip || "",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    alert("Identitas disimpan.");
    loadIdentitas();
    loadLaporan(); // update laporan kop
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

    // preview logo in laporan kop
    if (d.logoUrl) {
      document.getElementById("logo-preview").src = d.logoUrl;
    } else {
      document.getElementById("logo-preview").src = "";
    }
  });
}

// ======================
// 9) DASHBOARD: chart + table per ruangan
// ======================
function loadFilterRuanganOptions() {
  // Fill filter dropdown used in dashboard
  const sel = document.getElementById("filter-ruangan");
  sel.innerHTML = "<option value=''>-- Pilih Ruangan --</option>";
  db.collection("ruangan").orderBy("namaRuangan").get().then(snap => {
    snap.forEach(doc => {
      const d = doc.data();
      const opt = document.createElement("option");
      opt.value = d.namaRuangan;
      opt.text = `${d.namaRuangan} (${d.namaGedung || '-'})`;
      sel.appendChild(opt);
    });
  });
}

function updateDashboardRuangan() {
  const chosen = document.getElementById("filter-ruangan").value;
  if (!chosen) {
    // kosongkan chart & tabel
    renderChart([], []);
    document.getElementById("dashboard-barang-body").innerHTML = "<tr><td colspan='5'>Pilih ruangan untuk melihat data.</td></tr>";
    return;
  }
  // Chart: count kondisi in chosen ruangan
  db.collection("barang").where("ruangan", "==", chosen).get().then(snap => {
    let countB = 0, countRR = 0, countRB = 0;
    let labels = ["Baik", "Rusak Ringan", "Rusak Berat"];
    let values = [0,0,0];
    let rowsHtml = "";
    let i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      if (d.kondisi === "B") values[0] += (d.jumlah || 1), countB++;
      else if (d.kondisi === "RR") values[1] += (d.jumlah || 1), countRR++;
      else if (d.kondisi === "RB") values[2] += (d.jumlah || 1), countRB++;
      rowsHtml += `<tr>
        <td>${i++}</td>
        <td>${d.namaBarang || '-'}</td>
        <td>${d.merkType || '-'}</td>
        <td>${d.jumlah || 0}</td>
        <td>${d.kondisi || '-'}</td>
      </tr>`;
    });

    // render chart with values
    renderChart(labels, values);

    // render table (without kolom ruangan)
    document.getElementById("dashboard-barang-body").innerHTML = rowsHtml || "<tr><td colspan='5'>Tidak ada barang di ruangan ini.</td></tr>";
  });
}

function renderChart(labels, values) {
  const ctx = document.getElementById("chartRuangan").getContext("2d");
  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = values;
    chartInstance.update();
    return;
  }
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Jumlah Barang",
        data: values,
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{ ticks: { beginAtZero: true, precision:0 } }]
      }
    }
  });
}

// Also compute global dashboard counts (total across all rooms)
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

// ======================
// 10) LAPORAN
// ======================
function loadLaporan() {
  // fill laporan body + kop data
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

  // identitas kop
  db.collection("identitas").doc(IDENTITAS_DOC_ID).get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    document.getElementById("lap-nama-sekolah").innerText = d.namaSekolah || "";
    document.getElementById("lap-alamat-sekolah").innerText = d.alamat || "";
    document.getElementById("logo-preview").src = d.logoUrl || "";
    document.getElementById("lap-bendahara-nama").innerText = d.bendaharaNama || "";
    document.getElementById("lap-bendahara-nip").innerText = d.bendaharaNip || "";
    document.getElementById("lap-pj-nama").innerText = d.pjNama || "";
    document.getElementById("lap-pj-nip").innerText = d.pjNip || "";
  });
}

function printLaporan() {
  showView("laporan");
  loadLaporan();
  setTimeout(() => { window.print(); }, 500);
}

// ======================
// 11) INIT AFTER LOGIN
// ======================
function initializeAppAfterLogin() {
  // show default view
  showView("beranda");
  // load initial data
  loadGedung();
  loadRuangan();
  loadBarang();
  loadIdentitas();
  loadFilterRuanganOptions();
  loadDashboardCountsAndChart();
  // setup empty chart
  renderChart([], []);
  // ensure laporan also ready
  loadLaporan();
}

// ======================
// 12) Utility: on page load bind events (optional)
// ======================
window.addEventListener("load", () => {
  // nothing required here; auth.onAuthStateChanged handles UI
});
