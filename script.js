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
      initDataAfterLogin();
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
  if (viewId === "gedung") loadGedung();
  if (viewId === "ruangan") {
    loadRuangan();
    loadGedungSelect(); // perbaikan dropdown gedung
  }
  if (viewId === "dashboard") tampilkanBarangDashboard();
}

// ===============================
// CRUD GEDUNG
// ===============================
function saveGedung(e) {
  e.preventDefault();
  const data = {
    nama: document.getElementById("nama-gedung").value,
    luas: document.getElementById("luas-gedung").value,
    tahun: document.getElementById("tahun-gedung").value,
    sumber: document.getElementById("sumber-gedung").value
  };
  db.collection("gedung").add(data).then(() => e.target.reset());
}

function loadGedung() {
  db.collection("gedung").onSnapshot(snapshot => {
    const tbody = document.getElementById("gedung-body");
    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const nama = d.nama || d.namaGedung || "-";
      const luas = d.luas || "-";
      const tahun = d.tahun || "-";
      const sumber = d.sumber || d.sumberAnggaran || "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${nama}</td>
        <td>${luas}</td>
        <td>${tahun}</td>
        <td>${sumber}</td>
        <td><button onclick="hapusGedung('${doc.id}')">Hapus</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function hapusGedung(id) {
  if (confirm("Hapus data gedung ini?")) db.collection("gedung").doc(id).delete();
}

// ===============================
// CRUD RUANGAN
// ===============================
function loadGedungSelect() {
  db.collection("gedung").onSnapshot(snapshot => {
    const select = document.getElementById("gedung-select");
    select.innerHTML = '<option value="">-- Pilih Gedung --</option>';
    snapshot.forEach(doc => {
      const data = doc.data();
      const opt = document.createElement("option");
      opt.value = data.nama || data.namaGedung;
      opt.textContent = data.nama || data.namaGedung;
      select.appendChild(opt);
    });
  });
}

function saveRuangan(e) {
  e.preventDefault();
  const data = {
    nama: document.getElementById("nama-ruangan").value,
    namaRuangan: document.getElementById("nama-ruangan").value,
    gedung: document.getElementById("gedung-select").value,
    namaGedung: document.getElementById("gedung-select").value,
    penanggung: document.getElementById("penanggung-ruangan").value,
    penanggungJawab: document.getElementById("penanggung-ruangan").value
  };
  db.collection("ruangan").add(data).then(() => e.target.reset());
  loadRuanganSelects();
}

function loadRuangan() {
  db.collection("ruangan").onSnapshot(snapshot => {
    const tbody = document.getElementById("ruangan-body");
    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const nama = d.nama || d.namaRuangan || "-";
      const gedung = d.gedung || d.namaGedung || "-";
      const penanggung = d.penanggung || d.penanggungJawab || "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${nama}</td>
        <td>${gedung}</td>
        <td>${penanggung}</td>
        <td>
          <button onclick="lihatBarangRuangan('${doc.id}')">Lihat Barang</button>
          <button onclick="hapusRuangan('${doc.id}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function hapusRuangan(id) {
  if (confirm("Hapus data ruangan ini?")) db.collection("ruangan").doc(id).delete();
}

// ===============================
// LIHAT BARANG DALAM RUANGAN
// ===============================
function lihatBarangRuangan(ruanganId) {
  const tbody = document.getElementById("barang-ruangan-body");
  tbody.innerHTML = "";
  let no = 1;
  db.collection("barang").where("ruangan", "==", ruanganId).onSnapshot(snapshot => {
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const nama = d.namaBarang || d.nama || "-";
      const merk = d.merkBarang || d.merk || "-";
      const jumlah = d.jumlah || 0;
      const kondisi = d.kondisi || "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${nama}</td>
        <td>${merk}</td>
        <td>${jumlah}</td>
        <td>${kondisi}</td>
      `;
      tbody.appendChild(tr);
    });
  });
  showView("barang-ruangan");
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

function loadRuanganSelects() {
  db.collection("ruangan").onSnapshot(snap => {
    const selectBarang = document.getElementById("ruangan-select");
    const selectLaporan = document.getElementById("laporan-filter-ruangan");

    [selectBarang, selectLaporan].forEach(sel => {
      sel.innerHTML = '<option value="">-- Semua Ruangan --</option>';
      snap.forEach(doc => {
        const data = doc.data();
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = data.nama || data.namaRuangan;
        sel.appendChild(opt);
      });
    });
  });
}

// ===============================
// DASHBOARD BARANG
// ===============================
function tampilkanBarangDashboard() {
  const tbody = document.getElementById("dashboard-body");
  tbody.innerHTML = "";
  let no = 1;
  db.collection("barang").onSnapshot(snapshot => {
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const nama = d.namaBarang || d.nama || "-";
      const merk = d.merkBarang || d.merk || "-";
      const jumlah = d.jumlah || 0;
      const kondisi = d.kondisi || "-";
      const ruangan = d.ruangan || "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${nama}</td>
        <td>${merk}</td>
        <td>${jumlah}</td>
        <td>${kondisi}</td>
        <td>${ruangan}</td>
      `;
      tbody.appendChild(tr);
    });
  });
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
    pjNama: document.getElementById("pj-nama").value,
    pjNip: document.getElementById("pj-nip").value
  }).then(() => alert("Identitas sekolah disimpan"));
}

function loadIdentitas() {
  db.collection("identitas").doc("sekolah").get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
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
      const nama = d.namaBarang || d.nama || "-";
      const merk = d.merkBarang || d.merk || "-";
      const jumlah = d.jumlah || 0;
      const kondisiData = d.kondisi || "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${no++}</td>
        <td>${nama}</td>
        <td>${merk}</td>
        <td>${jumlah}</td>
        <td>${kondisiData}</td>
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
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("Laporan-Inventaris.pdf");
  });
}

// ===============================
// INISIALISASI
// ===============================
function initDataAfterLogin() {
  loadGedung();
  loadGedungSelect();
  loadRuangan();
  loadRuanganSelects();
  tampilkanBarangDashboard();
  loadIdentitas();
  tampilkanLaporanBarang();
}
