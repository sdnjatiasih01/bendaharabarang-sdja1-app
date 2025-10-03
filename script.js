// Firebase Config & Init
const firebaseConfig = {
  apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
  authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
  projectId: "inventaris-sekolah-6aa45",
  storageBucket: "inventaris-sekolah-6aa45.appspot.com",
  messagingSenderId: "482992763821",
  appId: "1:482992763821:web:3476cb5bd7320d840c2724",
  measurementId: "G-C51S4NNKXM"
};
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();

// Login
function loginUser() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      console.log("Login berhasil:", userCredential.user.email);
      document.getElementById("login-message").textContent = "";
      // showView('beranda') dipanggil oleh Observer setelah login berhasil
    })
    .catch(error => {
      console.error("Login gagal:", error.message);
      document.getElementById("login-message").textContent = "Login gagal: " + error.message;
    });
}

// Logout
function logoutUser() {
  auth.signOut().then(() => {
    console.log("Logout berhasil");
    document.getElementById("login-container").style.display = "block";
    // Gunakan ID yang benar dari index.html
    document.getElementById("dashboard-container").style.display = "none";
  }).catch(error => {
    console.error("Logout gagal:", error.message);
  });
}

// Fungsi Navigasi Tampilan (showView)
function showView(viewId) {
    // Sembunyikan semua section view
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
		    view.classList.remove('active-view');
    });

    // Tampilkan view yang diminta
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.style.display = 'block';
		    targetView.classList.add('active-view');
    }

    // Perbarui kelas 'active' pada sidebar
    document.querySelectorAll('#sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Cari elemen navigasi yang sesuai dengan viewId dan tambahkan kelas 'active'
    document.querySelector(`#sidebar a[onclick="showView('${viewId}')"]`)?.classList.add('active');
    
    // Panggil fungsi pemuatan data sesuai viewId:
    if (viewId === 'beranda') {
        loadKondisiBarang();
        // loadDataBarang(); // Dianggap memuat data untuk ringkasan di beranda
	} else if (viewId === 'input_barang') {
        // loadDataRuanganList(); // Asumsi Anda memiliki fungsi ini untuk mengisi dropdown ruangan
	} 
    // Tambahkan logika pemuatan data untuk view lain di sini jika diperlukan
} 


// Load Data Barang (contoh pemuatan tabel)
function loadDataBarang() {
  // Fungsi ini tidak memuat data di beranda, tapi di tampilan data barang,
  // namun tetap disertakan agar fungsi loadKondisiBarang dapat berjalan
  const tableBody = document.getElementById("barang-data-body");
  if (!tableBody) return; // Exit jika elemen tidak ada
  tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
  db.collection("barang").onSnapshot(snapshot => {
    tableBody.innerHTML = "";
    let i = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      tableBody.innerHTML += `
        <tr>
          <td>${i++}</td>
          <td>${data.namaBarang || '-'}</td>
          <td>${data.merkType || '-'}</td>
          <td>${data.ruangan || '-'}</td>
          <td>${data.kondisi || '-'}</td>
          <td>
            <button onclick="deleteData('${doc.id}', 'barang')">Hapus</button>
          </td>
        </tr>`;
    });
    if (snapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data barang.</td></tr>';
    }
  });
}

// Kondisi Barang (Untuk Beranda)
function loadKondisiBarang() {
  const baik = document.getElementById("kondisi-baik");
  const rr = document.getElementById("kondisi-rr");
  const rb = document.getElementById("kondisi-rb");
  const total = document.getElementById("kondisi-total");

  // Jika elemen tidak ditemukan (misalnya saat di halaman login), hentikan fungsi
  if (!baik || !rr || !rb || !total) return; 

  db.collection("barang").onSnapshot(snapshot => {
    let countBaik = 0, countRR = 0, countRB = 0, countTotal = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      countTotal++;
      if (data.kondisi === "B") countBaik++;
      else if (data.kondisi === "RR") countRR++;
      else if (data.kondisi === "RB") countRB++;
    });
    baik.textContent = countBaik;
    rr.textContent = countRR;
    rb.textContent = countRB;
    total.textContent = countTotal;
  });
}

// Save Barang (Perbaikan ID Input)
function saveDataBarang(event) {
  event.preventDefault();
  // KOREKSI: Gunakan ID yang benar dari index.html
  const namaBarang = document.getElementById("nama-barang").value; 
  // const merkType = document.getElementById("form-merk-type").value; // ID ini TIDAK ADA di HTML, dikomen/dihapus
  const ruangan = document.getElementById("ruangan-select").value; 
  const kondisi = document.getElementById("kondisi-barang").value; 
  
  db.collection("barang").add({ namaBarang, ruangan, kondisi /*, merkType: merkType || '-' */ })
    .then(() => {
      console.log("Barang berhasil ditambahkan!");
      // closeModal(); // Modal tidak ada di HTML yang diberikan, dikomen
      document.getElementById("form-barang").reset();
    })
    .catch(error => {
      console.error("Gagal menambahkan barang:", error);
      alert("Error: " + error.message);
    });
}

// Delete Data
function deleteData(docId, collectionName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data ini dari koleksi ${collectionName}?`)) return;
  
  db.collection(collectionName).doc(docId).delete()
    .then(() => console.log("Data berhasil dihapus"))
    .catch(error => console.error("Gagal hapus:", error));
}


// Fungsi Referensi (Load Penanggung Jawab)
function loadPenanggungJawabTable() {
    // Fungsi ini dikosongkan karena tabel HTML terkait tidak tersedia.
    // Jika Anda menambahkan <section id="referensi-view"> dan tabel, tambahkan logikanya di sini.
    console.log("Fungsi loadPenanggungJawabTable dipanggil.");
}

// Filter (Perbaikan: pastikan elemen filter ada)
function applyFilter() {
  const namaFilter = document.getElementById("filter-barang").value.toLowerCase();
  // Filter lainnya dikomen karena ID-nya tidak ada di Beranda view HTML Anda
  // const lokasiFilter = document.getElementById("filter-lokasi").value;
  // const kondisiFilter = document.getElementById("filter-kondisi").value;

  const tableBody = document.getElementById("barang-data-body");
  if (!tableBody) return;

  // Logika Filter bisa disesuaikan dengan filter yang Anda gunakan di Beranda
  console.log("Filter diterapkan:", namaFilter);
  loadKondisiBarang(); // Memuat ulang data ringkasan
}

// Edit Barang (Perbaikan: Tambahkan kurung kurawal pembuka { yang hilang)
function editBarang(docId) { // <--- KURUNG KURAWAL DITAMBAHKAN
  db.collection("barang").doc(docId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      // Perlu modal/form edit dengan ID yang sesuai. ID di bawah diasumsikan ada di modal.
      /*
      document.getElementById("form-nama-barang").value = data.namaBarang; 
      document.getElementById("form-merk-type").value = data.merkType;
      document.getElementById("form-ruangan").value = data.ruangan;
      document.getElementById("form-kondisi").value = data.kondisi;

      openModal('barang');

      // override fungsi save agar update, bukan tambah
      const form = document.getElementById("form-barang-modal");
      form.onsubmit = (event) => {
        event.preventDefault();
        // ... Logika update ...
        // kembalikan fungsi save default
        form.onsubmit = saveDataBarang;
      };
      */
      console.log("Fungsi editBarang dipanggil untuk ID:", docId);
    }
  });
} // <--- PASTIKAN ADA KURUNG TUTUP DI SINI

// Observer Status Autentikasi (PENTING untuk menampilkan dashboard/login)
auth.onAuthStateChanged(user => {
  const loginContainer = document.getElementById('login-container');
  // KOREKSI: Gunakan ID yang benar dari index.html
  const dashboardContainer = document.getElementById('dashboard-container'); 
  
  if (user) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';
    console.log("User logged in:", user.email);
    showView('beranda'); // Tampilkan halaman Beranda saat berhasil login
  } else {
    if (loginContainer) loginContainer.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    console.log("User logged out.");
  }
});

// Catatan: Fungsi openModal/closeModal, saveDataRuangan, loadDataRuangan dll. 
// yang tidak ada di file Anda perlu ditambahkan jika Anda ingin fitur tersebut berfungsi.