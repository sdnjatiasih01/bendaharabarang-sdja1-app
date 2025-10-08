// ===============================
// KONFIGURASI FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
  authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
  projectId: "inventaris-sekolah-6aa45",
  storageBucket: "inventaris-sekolah-6aa45.firebasestorage.app",
  messagingSenderId: "482992763821",
  appId: "1:482992763821:web:3476cb5bd7320d840c2724",
  measurementId: "G-C51S4NNKXM"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ===============================
// LOGIN DAN REGISTER
// ===============================
function showAuthView(view) {
  document.getElementById("login-container").style.display = view === "login" ? "block" : "none";
  document.getElementById("register-container").style.display = view === "register" ? "block" : "none";
}

function registerUser() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => showAuthView('login'))
    .catch(err => document.getElementById("reg-message").innerText = err.message);
}

function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("register-container").style.display = "none";
      document.getElementById("dashboard-container").style.display = "block";
      loadIdentitas();
      loadRuanganSelects();
      tampilkanLaporanBarang();
    })
    .catch(err => document.getElementById("auth-message").innerText = err.message);
}

function logoutUser() {
  auth.signOut().then(() => location.reload());
}

// ===============================
// NAVIGASI
// ===============================
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.getElementById(viewId + "-view").style.display = "block";

  if (viewId === "laporan") tampilkanLaporanBarang();
  if (viewId === "identitas") loadIdentitas();
}

// ===============================
// CRUD GEDUNG
// ===============================
function saveGedung(e) {
  e.preventDefault();
  db.collection("gedung").add({
    nama: document.getElementById("nama-gedung").value,
    luas: document.getElementById("luas-gedung").value,
    tahun: document.getElementById("tahun-gedung").value,
    sumber: document.getElementById("sumber-gedung").value
  }).then(() => e.target.reset());
}

// ===============================
// CRUD RUANGAN
// ===============================
function loadRuanganSelects() {
  db.collection("ruangan").onSnapshot(snap => {
    const selectBarang = document.getElementById("ruangan-select");
    const selectFilter = document.getElementById("filter-ruangan");
    const selectLaporan = document.getElementById("laporan-filter-ruangan");

    [selectBarang, selectFilter, selectLaporan].forEach(sel => {
      sel.innerHTML = '<option value="">-- Semua Ruangan --</option>';
      snap.forEach(doc => {
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = doc.data().nama;
        sel.appendChild(opt);
      });
    });
  });
}

// ===============================
// CRUD BARANG
// ===============================
function saveBarang(e) {
  e.preventDefault();
  const data = {
    ruangan: document.getElementById("ruangan-select").value,
    namaBarang: document.getElementById("nama-barang").value,
    merkBarang: document.getElementById("merk-barang").value,
    jumlah: parseInt(document.getElementById("jumlah-barang").value),
    kondisi: document.getElementById("kondisi-barang").value
  };
  db.collection("barang").add(data).then(() => e.target.reset());
}

// ===============================
// IDENTITAS SEKOLAH
// ===============================
function saveIdentitas(e) {
  e.preventDefault();
  db.collection("identitas").doc("sekolah").set({
    nama: document.getElementById("nama-sekolah").value,
    alamat: document.getElementById("alamat-sekolah").value,
    logo: document.getElementById("logo-sekolah").value,
    bendaharaNama: document.getElementById("bendahara-nama").value,
    bendaharaNip: document.getElementById("bendahara-nip").value,
    pjNama: document.getElementById("pj-nama").value, // Kepala Sekolah
    pjNip: document.getElementById("pj-nip").value
  }).then(() => alert("Identitas sekolah disimpan"));
}

function loadIdentitas() {
  db.collection("identitas").doc("sekolah").get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      document.getElementById("nama-sekolah").value = d.nama || "";
      document.getElementById("alamat-sekolah").value = d.alamat || "";
      document.getElementById("logo-sekolah").value = d.logo || "";
      document.getElementById("bendahara-nama").value = d.bendaharaNama || "";
      document.getElementById("bendahara-nip").value = d.bendaharaNip || "";
      document.getElementById("pj-nama").value = d.pjNama || "";
      document.getElementById("pj-nip").value = d.pjNip || "";

      document.getElementById("lap-logo-sekolah").src = d.logo || "";
      document.getElementById("lap-nama-sekolah").textContent = d.nama || "";
      document.getElementById("lap-alamat-sekolah").textContent = d.alamat || "";
      document.getElementById("lap-pj-nama").textContent = d.pjNama || "";
      document.getElementById("lap-pj-nip").textContent = d.pjNip ? "NIP. " + d.pjNip : "";
      document.getElementById("lap-bendahara-nama").textContent = d.bendaharaNama || "";
      document.getElementById("lap-bendahara-nip").textContent = d.bendaharaNip ? "NIP. " + d.bendaharaNip : "";
    }
  });
}

// ===============================
// LAPORAN BARANG
// ===============================
function tampilkanLaporanBarang() {
  const ruangan = document.getElementById("laporan-filter-ruangan").value;
  const kondisi = document.getElementById("laporan-filter-kondisi").value;

  let query = db.collection("barang");

  if (ruangan) query = query.where("ruangan", "==", ruangan);
  if (kondisi) query = query.where("kondisi", "==", kondisi);

  query.get().then(snapshot => {
    const tbody = document.getElementById("laporan-body");
    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${d.namaBarang}</td>
        <td>${d.merkBarang}</td>
        <td>${d.jumlah}</td>
        <td>${d.kondisi}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ===============================
// CETAK & UNDUH PDF
// ===============================
function printLaporan() {
  window.print();
}

function downloadLaporanPDF() {
  const laporanEl = document.getElementById("laporan-container");
  html2canvas(laporanEl, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("Laporan-Inventaris.pdf");
  });
}
// ===============================
// TAMPILKAN DATA GEDUNG
// ===============================
function loadGedung() {
  db.collection("gedung").onSnapshot(snapshot => {
    const tbody = document.getElementById("gedung-body");
    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${d.nama}</td>
        <td>${d.luas}</td>
        <td>${d.tahun}</td>
        <td>${d.sumber}</td>
        <td><button onclick="hapusGedung('${doc.id}')">Hapus</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function hapusGedung(id) {
  if (confirm("Hapus data gedung ini?")) {
    db.collection("gedung").doc(id).delete();
  }
}

// ===============================
// TAMPILKAN DATA RUANGAN
// ===============================
function loadRuangan() {
  db.collection("ruangan").onSnapshot(snapshot => {
    const tbody = document.getElementById("ruangan-body");
    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${d.nama}</td>
        <td>${d.gedung || '-'}</td>
        <td>${d.penanggung || '-'}</td>
        <td><button onclick="hapusRuangan('${doc.id}')">Hapus</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function hapusRuangan(id) {
  if (confirm("Hapus data ruangan ini?")) {
    db.collection("ruangan").doc(id).delete();
  }
}

// ===============================
// PANGGIL SAAT LOGIN
// ===============================
function initDataAfterLogin() {
  loadGedung();
  loadRuangan();
  loadRuanganSelects();
  loadIdentitas();
  tampilkanLaporanBarang();
}

// Revisi fungsi login agar otomatis memanggil initDataAfterLogin()
function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("register-container").style.display = "none";
      document.getElementById("dashboard-container").style.display = "block";
      initDataAfterLogin();
    })
    .catch(err => document.getElementById("auth-message").innerText = err.message);
}
