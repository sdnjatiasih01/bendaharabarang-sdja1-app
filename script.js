// =================================================================
// 1. FIREBASE CONFIGURATION
// =================================================================
const firebaseConfig = {
    // Pastikan ini adalah konfigurasi Firebase Anda yang sebenarnya
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
// 2. AUTHENTICATION (LOGIN/LOGOUT & OBSERVER)
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
            // showView('beranda') akan dipanggil oleh Observer di bawah
        })
        .catch(error => {
            console.error("Login gagal:", error.message);
            messageElement.textContent = "Login gagal: Email atau Password salah.";
        });
}

function logoutUser() {
    auth.signOut().then(() => {
        console.log("Logout berhasil");
    }).catch(error => {
        console.error("Logout gagal:", error.message);
    });
}

// Observer untuk mengatur tampilan saat login/logout
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        if (loginContainer) loginContainer.style.display = 'none';
        // Menggunakan 'block' karena container utama dashboard biasanya display: block/flex
        if (dashboardContainer) dashboardContainer.style.display = 'block'; 
        showView('beranda'); 
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
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
    document.querySelectorAll('#sidebar a').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.querySelector(`#sidebar a[onclick*="showView('${viewId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Panggil fungsi pemuatan data spesifik
    if (viewId === 'beranda') {
        loadKondisiBarang(); 
        loadRuanganForFilter();
        loadDataBarang(); 
    } else if (viewId === 'input_barang') {
        // PENTING: Memuat ruangan ke dropdown saat masuk ke view Input Barang
        loadRuanganForInputBarang(); 
    } 
    // Tambahkan pemanggilan loadDataRuangan() jika Anda punya tabel daftar ruangan
} 

// =================================================================
// 4. DATA RUANGAN (CREATE & LOAD FOR DROPDOWN)
// =================================================================

// FUNGSI 4.1: MENYIMPAN DATA RUANGAN DARI FORM
function saveDataRuangan(event) {
    event.preventDefault();
    const namaGedung = document.getElementById("nama-gedung").value;
    const luasBangunan = document.getElementById("luas-bangunan").value;
    const jumlahLantai = document.querySelector('input[name="jumlah-lantai"]:checked')?.value;
    const keteranganRuangan = document.getElementById("keterangan-ruangan").value;

    const ruanganData = {
        namaGedung,
        luasBangunan: parseFloat(luasBangunan || 0),
        jumlahLantai: parseInt(jumlahLantai || 0),
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
            alert(`Data Gedung "${namaGedung}" berhasil ditambahkan!`);
            document.getElementById("form-ruangan").reset();
        })
        .catch(error => {
            console.error("Gagal menambahkan ruangan:", error);
            alert("Error: Gagal menyimpan data ruangan.");
        });
}

// FUNGSI 4.2: MEMUAT DATA RUANGAN KE DROPDOWN INPUT BARANG (SOLUSI)
function loadRuanganForInputBarang() {
    const ruanganSelect = document.getElementById("ruangan-select");
    // Bersihkan dan tambahkan opsi default
    ruanganSelect.innerHTML = '<option value="" disabled selected>Pilih Ruangan</option>';
    const allRooms = new Set(); 

    db.collection("ruangan").get().then(snapshot => {
        // Loop melalui setiap dokumen (setiap Gedung)
        snapshot.forEach(doc => {
            const data = doc.data();
            // Loop melalui field ruangan_1, ruangan_2, dst. yang disimpan
            for (const key in data) {
                if (key.startsWith('ruangan_') && data[key] && data[key].trim() !== '') {
                    allRooms.add(data[key]); // Simpan nama ruangan unik
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

// FUNGSI 4.3: MEMUAT RUANGAN KE DROPDOWN FILTER DI BERANDA
function loadRuanganForFilter() {
    const filterSelect = document.getElementById("filter-barang");
    if (!filterSelect) return;
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


// =================================================================
// 5. DATA BARANG (CREATE, READ, DELETE)
// =================================================================

// FUNGSI 5.1: MENYIMPAN DATA BARANG
function saveDataBarang(event) {
    event.preventDefault();
    const ruangan = document.getElementById("ruangan-select").value; 
    const namaBarang = document.getElementById("nama-barang").value; 
    const kondisi = document.getElementById("kondisi-barang").value; 
    
    if (!ruangan || ruangan === "") {
        alert("Mohon pilih Nama Ruangan terlebih dahulu.");
        return;
    }

    db.collection("barang").add({ 
        ruangan, 
        namaBarang, 
        kondisi,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
    })
    .then(() => {
        alert(`Barang "${namaBarang}" berhasil ditambahkan!`);
        document.getElementById("form-barang").reset();
    })
    .catch(error => {
        console.error("Gagal menambahkan barang:", error);
        alert("Error: Gagal menyimpan data barang.");
    });
}


// FUNGSI 5.2: MEMUAT RINGKASAN KONDISI BARANG
function loadKondisiBarang() {
    const baik = document.getElementById("kondisi-baik");
    const rr = document.getElementById("kondisi-rr");
    const rb = document.getElementById("kondisi-rb");
    const total = document.getElementById("kondisi-total");
    const jumlahGedung = document.getElementById("jumlah-gedung");

    if (!baik || !total) return; 

    // Ringkasan Barang
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
    
    // Jumlah Gedung
    if(jumlahGedung) {
        db.collection("ruangan").get().then(snapshot => {
            jumlahGedung.textContent = snapshot.size;
        });
    }
}

// FUNGSI 5.3: MEMUAT DATA BARANG KE TABEL BERANDA
function loadDataBarang() {
    const tableBody = document.getElementById("barang-data-body");
    if (!tableBody) return; 
    tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
    
    const ruanganFilterValue = document.getElementById("filter-barang")?.value;
    let query = db.collection("barang").orderBy("createdAt", "desc").limit(100);

    // Terapkan filter ruangan jika dipilih
    if (ruanganFilterValue) {
        query = query.where("ruangan", "==", ruanganFilterValue);
    }

    query.onSnapshot(snapshot => {
        tableBody.innerHTML = "";
        let i = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
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

// FUNGSI 5.4: DELETE DATA
function deleteData(docId, collectionName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ini dari koleksi ${collectionName}?`)) return;
    
    db.collection(collectionName).doc(docId).delete()
        .then(() => {
            alert("Data berhasil dihapus!");
            // Data barang akan otomatis refresh karena menggunakan onSnapshot
        })
        .catch(error => console.error("Gagal hapus:", error));
}


// =================================================================
// 6. UTILITY FUNCTIONS (FILTER & EDIT PLACEHOLDER)
// =================================================================

// FUNGSI 6.1: Dipanggil saat filter ruangan di Beranda diganti
function applyFilter() {
    loadDataBarang(); 
}

// FUNGSI 6.2: EDIT BARANG (Menggunakan modal yang mungkin ada di HTML Anda)
function editBarang(docId) {
    // Fungsi ini memerlukan elemen modal/form edit di HTML Anda.
    db.collection("barang").doc(docId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            console.log("Data Barang untuk Edit:", data);
            
            // Contoh implementasi: Isi data ke form modal (jika ada)
            // document.getElementById("form-nama-barang").value = data.namaBarang;
            // openModal('barang-edit');

            alert(`Siap edit barang dengan ID: ${docId}. Silakan implementasikan form/modal edit di HTML.`);
        }
    });
}
// Tambahkan fungsi openModal dan closeModal jika Anda menggunakannya
function openModal(modalId) { 
    document.getElementById(modalId)?.style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId)?.style.display = 'none';
}