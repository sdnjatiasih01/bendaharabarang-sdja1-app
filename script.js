// =================================================================
// 1. FIREBASE CONFIGURATION
// =================================================================
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

// =================================================================
// 2. AUTHENTICATION (LOGIN/LOGOUT)
// =================================================================

function loginUser() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const messageElement = document.getElementById("login-message");
  messageElement.textContent = "Loading...";

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      console.log("Login berhasil:", userCredential.user.email);
      messageElement.textContent = "";
      // showView('beranda') akan dipanggil oleh Observer
    })
    .catch(error => {
      console.error("Login gagal:", error.message);
      messageElement.textContent = "Login gagal: " + error.message;
    });
}

function logoutUser() {
  auth.signOut().then(() => {
    console.log("Logout berhasil");
  }).catch(error => {
    console.error("Logout gagal:", error.message);
  });
}

// Observer Status Autentikasi (PENTING untuk menampilkan dashboard/login)
auth.onAuthStateChanged(user => {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (user) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'flex'; // Gunakan flex
    console.log("User logged in:", user.email);
    showView('beranda'); // Tampilkan halaman Beranda saat berhasil login
  } else {
    if (loginContainer) loginContainer.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    console.log("User logged out.");
  }
});


// =================================================================
// 3. UI & NAVIGATION
// =================================================================

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
    // Menjadikan item sidebar yang sesuai aktif
    const navItem = document.querySelector(`#sidebar a[onclick*="showView('${viewId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Panggil fungsi pemuatan data sesuai viewId:
    if (viewId === 'beranda') {
        loadKondisiBarang(); // Load ringkasan
        loadDataBarang(); // Load tabel barang
        loadRuanganForFilter(); // Muat data ruangan ke filter
	} else if (viewId === 'input_barang') {
        loadRuanganForInputBarang(); // Muat data ruangan ke dropdown
	} 
    // Data pada view 'identitas' bersifat statis, tidak perlu fungsi load
} 

// =================================================================
// 4. DATA RUANGAN (CRUD)
// =================================================================

// FUNGSI UTAMA: MENYIMPAN DATA RUANGAN DARI FORM
function saveDataRuangan(event) {
    event.preventDefault();
    const namaGedung = document.getElementById("nama-gedung").value;
    const luasBangunan = document.getElementById("luas-bangunan").value;
    const jumlahLantai = document.querySelector('input[name="jumlah-lantai"]:checked').value;
    const keteranganRuangan = document.getElementById("keterangan-ruangan").value;

    const ruanganData = {
        namaGedung,
        luasBangunan: parseFloat(luasBangunan),
        jumlahLantai: parseInt(jumlahLantai),
        keterangan: keteranganRuangan,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Ambil data nama ruangan dari 30 input
    document.querySelectorAll('.nama-ruangan-input').forEach((input, index) => {
        const key = `ruangan_${index + 1}`;
        if (input.value.trim() !== '') {
            ruanganData[key] = input.value.trim();
        }
    });

    db.collection("ruangan").add(ruanganData)
        .then(() => {
            alert("Data Ruangan berhasil ditambahkan!");
            document.getElementById("form-ruangan").reset();
        })
        .catch(error => {
            console.error("Gagal menambahkan ruangan:", error);
            alert("Error: " + error.message);
        });
}

// FUNGSI UTAMA: MEMUAT DATA RUANGAN KE DROPDOWN INPUT BARANG (SOLUSI MASALAH)
function loadRuanganForInputBarang() {
    const ruanganSelect = document.getElementById("ruangan-select");
    ruanganSelect.innerHTML = '<option value="" disabled selected>Pilih Ruangan</option>';
    const allRooms = new Set(); // Menggunakan Set untuk memastikan nama ruangan unik

    db.collection("ruangan").get().then(snapshot => {
        // Loop melalui setiap dokumen (setiap gedung)
        snapshot.forEach(doc => {
            const data = doc.data();
            // Loop melalui field ruangan_1, ruangan_2, dst.
            for (const key in data) {
                if (key.startsWith('ruangan_') && data[key] && data[key].trim() !== '') {
                    allRooms.add(data[key]); // Tambahkan nama ruangan ke Set
                }
            }
        });

        // Isi dropdown dengan nama-nama ruangan yang unik
        allRooms.forEach(roomName => {
            const option = document.createElement('option');
            option.value = roomName;
            option.textContent = roomName;
            ruanganSelect.appendChild(option);
        });

        if (allRooms.size === 0) {
            ruanganSelect.innerHTML += '<option value="" disabled>Tidak ada data ruangan</option>';
        }
        
    }).catch(error => {
        console.error("Gagal memuat daftar ruangan:", error);
    });
}

// FUNGSI TAMBAHAN: MEMUAT RUANGAN KE DROPDOWN FILTER DI BERANDA
function loadRuanganForFilter() {
    const filterSelect = document.getElementById("filter-barang");
    filterSelect.innerHTML = '<option value="">Semua Ruangan</option>';
    const allRooms = new Set();

    db.collection("ruangan").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            for (const key in data) {
                if (key.startsWith('ruangan_') && data[key] && data[key].trim() !== '') {
                    allRooms.add(data[key]);
                }
            }
        });

        allRooms.forEach(roomName => {
            const option = document.createElement('option');
            option.value = roomName;
            option.textContent = roomName;
            filterSelect.appendChild(option);
        });
    });
}

// Fungsi loadDataRuangan (Jika Anda ingin menampilkan tabel daftar ruangan di view input_ruangan)
function loadDataRuangan() {
    // Implementasi untuk memuat data gedung/ruangan ke tabel jika ada elemennya.
    // Saat ini, fungsi ini hanya log
    console.log("Fungsi loadDataRuangan dipanggil.");
}

// =================================================================
// 5. DATA BARANG (CRUD)
// =================================================================

// FUNGSI UTAMA: MENYIMPAN DATA BARANG
function saveDataBarang(event) {
  event.preventDefault();
  // Ambil nilai dari input form
  const ruangan = document.getElementById("ruangan-select").value; 
  const namaBarang = document.getElementById("nama-barang").value; 
  const kondisi = document.getElementById("kondisi-barang").value; 
  
  // Validasi sederhana
  if (!ruangan || ruangan === "") {
      alert("Mohon pilih Nama Ruangan.");
      return;
  }

  db.collection("barang").add({ 
      ruangan, 
      namaBarang, 
      kondisi,
      createdAt: firebase.firestore.FieldValue.serverTimestamp() 
    })
    .then(() => {
      alert(`Barang "${namaBarang}" berhasil ditambahkan ke ruangan "${ruangan}"!`);
      document.getElementById("form-barang").reset();
    })
    .catch(error => {
      console.error("Gagal menambahkan barang:", error);
      alert("Error: " + error.message);
    });
}


// FUNGSI UTAMA: MEMUAT RINGKASAN KONDISI BARANG DI BERANDA
function loadKondisiBarang() {
  const baik = document.getElementById("kondisi-baik");
  const rr = document.getElementById("kondisi-rr");
  const rb = document.getElementById("kondisi-rb");
  const total = document.getElementById("kondisi-total");

  if (!baik || !total) return; // Exit jika elemen tidak ada (misal: di halaman login) 

  db.collection("barang").onSnapshot(snapshot => {
    let countBaik = 0, countRR = 0, countRB = 0, countTotal = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      countTotal++;
      if (data.kondisi === "B") countBaik++;
      else if (data.kondisi === "RR") countRR++;
      else if (data.kondisi === "RB") countRB++;
    });

    // Update elemen HTML
    baik.textContent = countBaik;
    rr.textContent = countRR;
    rb.textContent = countRB;
    total.textContent = countTotal;
  });
  
  // Update jumlah gedung (mengambil jumlah dokumen di koleksi ruangan)
  const jumlahGedung = document.getElementById("jumlah-gedung");
  if(jumlahGedung) {
    db.collection("ruangan").get().then(snapshot => {
        jumlahGedung.textContent = snapshot.size;
    });
  }
}

// FUNGSI UTAMA: MEMUAT DATA BARANG KE TABEL BERANDA (dengan filter)
function loadDataBarang() {
  const tableBody = document.getElementById("barang-data-body");
  if (!tableBody) return; 
  tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
  
  let query = db.collection("barang").orderBy("createdAt", "desc").limit(50); // Batasi 50 data terbaru

  // Terapkan filter ruangan jika ada
  const ruanganFilterValue = document.getElementById("filter-barang")?.value;
  if (ruanganFilterValue) {
      query = query.where("ruangan", "==", ruanganFilterValue);
  }

  query.onSnapshot(snapshot => {
    tableBody.innerHTML = "";
    let i = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      // Asumsi Anda juga menyimpan merk/tipe di form, tapi karena di HTML tidak ada, 
      // saya asumsikan merkType diambil dari data (jika ada) atau '-'
      const merkType = data.merkType || '-'; 
      tableBody.innerHTML += `
        <tr>
          <td>${i++}</td>
          <td>${data.namaBarang || '-'}</td>
          <td>${merkType}</td>
          <td>${data.ruangan || '-'}</td>
          <td>${data.kondisi || '-'}</td>
          <td>
            <button class="btn btn-edit" onclick="editBarang('${doc.id}')">Edit</button>
            <button class="btn btn-delete" onclick="deleteData('${doc.id}', 'barang')">Hapus</button>
          </td>
        </tr>`;
    });
    if (snapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data barang.</td></tr>';
    }
  });
}

// FUNGSI DELETE
function deleteData(docId, collectionName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data ini dari koleksi ${collectionName}?`)) return;
  
  db.collection(collectionName).doc(docId).delete()
    .then(() => console.log("Data berhasil dihapus"))
    .catch(error => console.error("Gagal hapus:", error));
}


// FUNGSI FILTER (Dipanggil saat tombol Tampilkan di Beranda diklik)
function applyFilter() {
    loadDataBarang(); // Panggil ulang fungsi loadDataBarang yang sudah dilengkapi logika filter
}

// FUNGSI EDIT BARANG (Placeholder)
function editBarang(docId) {
  // Karena Anda belum memiliki Modal/Form Edit, fungsi ini hanya akan log
  // Jika Anda menambahkan modal, letakkan logika GET dan UPDATE di sini.
  db.collection("barang").doc(docId).get().then(doc => {
    if (doc.exists) {
        console.log("Data Barang untuk Edit:", doc.data());
        alert(`Siap edit barang dengan ID: ${docId}. Silakan lengkapi Modal/Form Edit di HTML.`);
    }
  });
}

// FUNGSI openModal dan closeModal
// (Dibuat sebagai placeholder jika Anda ingin menggunakan modal untuk edit/input)
function openModal(formType) {
    const modal = document.getElementById('modal-container');
    if (modal) modal.style.display = 'block';
    // Logika menampilkan form spesifik di dalam modal
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    if (modal) modal.style.display = 'none';
}