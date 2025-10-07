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
// PERUBAHAN: chartInstance dihapus karena grafik dihapus
// let chartInstance = null; 

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

// ... (Bagian 4 sampai 7 tetap sama karena tidak ada perubahan fungsi CRUD) ...

// ======================
// ======================
// 4) AUTH FUNCTIONS
// ======================

// Registrasi akun baru
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

// Login pengguna
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

// Logout
function logoutUser() {
  auth.signOut().then(() => {
    document.getElementById("dashboard-container").style.display = "none";
    showAuthView("login");
  });
}

// Listener untuk status login
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
// 5) GEDUNG CRUD
// ... (Kode tetap) ...

// ======================
// 6) RUANGAN CRUD
// ... (Kode tetap) ...

// ======================
// 7) BARANG CRUD
// ... (Kode tetap) ...

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

    // PERUBAHAN: Set logo di header dan laporan kop
    if (d.logoUrl) {
      document.getElementById("logo-preview").src = d.logoUrl; // Laporan
      document.getElementById("header-logo").src = d.logoUrl; // Header
    } else {
      document.getElementById("logo-preview").src = "";
      document.getElementById("header-logo").src = "";
    }
  });
}

// ======================
// 9) DASHBOARD: table per ruangan (Chart logic DIHAPUS)
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
    // Kosongkan tabel
    document.getElementById("dashboard-barang-body").innerHTML = "<tr><td colspan='5'>Pilih ruangan untuk melihat data.</td></tr>";
    return;
  }
  
  // Ambil data barang di ruangan yang dipilih
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

    // render table (tanpa kolom ruangan)
    document.getElementById("dashboard-barang-body").innerHTML = rowsHtml || "<tr><td colspan='5'>Tidak ada barang di ruangan ini.</td></tr>";
  });
}

// PERUBAHAN: renderChart DIHAPUS

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

// ... (Bagian 10 dan 11 diinisiasi ulang untuk menghapus referensi chart) ...

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
  // PERUBAHAN: HAPUS: setup empty chart (renderChart([], []))
  // pastikan dashboard ruangan terupdate:
  updateDashboardRuangan();
  // ensure laporan also ready
  loadLaporan();
}

// ... (Bagian 12 tetap sama) ...
