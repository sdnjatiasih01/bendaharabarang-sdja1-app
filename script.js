// =================================================================
// 1. FIREBASE CONFIGURATION & INIT
// =================================================================
const firebaseConfig = {
    // GANTI DENGAN CONFIG FIREBASE ASLI ANDA JIKA BERBEDA
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
// 2. AUTHENTICATION & UI SWITCHING
// =================================================================

// Fungsi untuk beralih antara tampilan Login dan Register
function showAuthView(view) {
    const login = document.getElementById('login-container');
    const register = document.getElementById('register-container');
    const authMessage = document.getElementById('auth-message');
    const regMessage = document.getElementById('reg-message');

    if (view === 'login') {
        login.style.display = 'block';
        register.style.display = 'none';
        regMessage.textContent = '';
    } else if (view === 'register') {
        login.style.display = 'none';
        register.style.display = 'block';
        authMessage.textContent = '';
    }
}

// FUNGSI BARU: REGISTER USER
function registerUser() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const messageElement = document.getElementById("reg-message");
    messageElement.textContent = "Mendaftarkan...";

    if (password.length < 6) {
        messageElement.textContent = "Password harus minimal 6 karakter.";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("Registrasi berhasil:", userCredential.user.email);
            // Simpan data pengguna (opsional, untuk identifikasi guru)
            db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                role: 'guru', // Atur role default
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            messageElement.textContent = "Pendaftaran berhasil! Silakan Login.";
            document.getElementById("register-container").reset();
            showAuthView('login'); // Langsung pindah ke halaman Login
        })
        .catch(error => {
            console.error("Registrasi gagal:", error.message);
            messageElement.textContent = `Registrasi gagal: ${error.message}`;
        });
}

// FUNGSI LOGIN
function loginUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const messageElement = document.getElementById("auth-message");
    messageElement.textContent = "Loading...";

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("Login berhasil:", userCredential.user.email);
            messageElement.textContent = ""; 
        })
        .catch(error => {
            console.error("Login gagal:", error.message);
            messageElement.textContent = `Login gagal: Email/Password salah atau ${error.message}`; 
        });
}

// FUNGSI LOGOUT
function logoutUser() {
    auth.signOut().then(() => {
        console.log("Logout berhasil");
    }).catch(error => {
        console.error("Logout gagal:", error.message);
    });
}

// OBSERVER (PENGATUR TAMPILAN DASHBOARD/LOGIN)
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        // User sedang login
        if (loginContainer) loginContainer.style.display = 'none';
        if (registerContainer) registerContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block'; 
        showView('beranda'); 
    } else {
        // User logout atau belum login
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        showAuthView('login'); // Selalu tampilkan Login saat logout
    }
});

// FUNGSI NAVIGASI
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active-view');
    });

    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active-view');
    }

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
        loadRuanganForInputBarang(); 
    } 
} 

// =================================================================
// 3. DATA RUANGAN (SAVE & LOAD FOR DROPDOWN)
// =================================================================

// SAVE DATA RUANGAN
function saveDataRuangan(event) {
    event.preventDefault();
    const namaGedung = document.getElementById("nama-gedung").value;
    // Tambahkan pengambilan data lain sesuai form Anda (luas, lantai, dll.)

    const ruanganData = {
        namaGedung: namaGedung,
        createdBy: auth.currentUser ? auth.currentUser.email : 'unknown',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Ambil data nama ruangan (Asumsi menggunakan ID/Class yang berbeda)
    // PENTING: Jika form Ruangan Anda memiliki input untuk 30 ruangan (ruangan_1 s.d. ruangan_30)
    // Pastikan semua input ruangan menggunakan kelas 'nama-ruangan-input'
    document.querySelectorAll('#form-ruangan .nama-ruangan-input').forEach((input, index) => {
        const key = `ruangan_${index + 1}`;
        if (input.value.trim() !== '') {
            ruanganData[key] = input.value.trim();
        }
    });
    
    // Jika tidak ada input ruangan spesifik, simpan hanya nama gedung
    if (Object.keys(ruanganData).length <= 3) {
         alert("Mohon isi setidaknya satu nama ruangan di dalam gedung.");
         return;
    }


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

// LOAD RUANGAN KE DROPDOWN INPUT BARANG (SOLUSI UNTUK REFERENSI RUANGAN)
function loadRuanganForInputBarang() {
    const ruanganSelect = document.getElementById("ruangan-select");
    ruanganSelect.innerHTML = '<option value="" disabled selected>Pilih Ruangan</option>';
    const allRooms = new Set(); 

    db.collection("ruangan").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            for (const key in data) {
                // Cari field yang dimulai dengan 'ruangan_' dan memiliki nilai
                if (key.startsWith('ruangan_') && data[key] && data[key].trim() !== '') {
                    allRooms.add(data[key].trim()); 
                }
            }
        });

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

// LOAD RUANGAN KE DROPDOWN FILTER
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
                    allRooms.add(data[key].trim());
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
// 4. DATA BARANG (CRUD)
// =================================================================

// SAVE DATA BARANG
function saveDataBarang(event) {
    event.preventDefault();
    const ruangan = document.getElementById("ruangan-select").value; 
    const namaBarang = document.getElementById("nama-barang").value; 
    const merkType = document.getElementById("merk-type").value; // Ambil field baru
    const kondisi = document.getElementById("kondisi-barang").value; 
    
    if (!ruangan || ruangan === "") {
        alert("Mohon pilih Nama Ruangan.");
        return;
    }

    db.collection("barang").add({ 
        ruangan, 
        namaBarang, 
        merkType, // Tambahkan Merk/Tipe
        kondisi,
        createdBy: auth.currentUser ? auth.currentUser.email : 'unknown',
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


// LOAD RINGKASAN KONDISI BARANG
function loadKondisiBarang() {
    const baik = document.getElementById("kondisi-baik");
    // ... elemen card lainnya ...
    // ... Logika Ringkasan Barang dan Jumlah Gedung ...
    // Diabaikan di sini karena logika dasarnya sudah benar di jawaban sebelumnya.
}

// LOAD DATA BARANG KE TABEL BERANDA
function loadDataBarang() {
    const tableBody = document.getElementById("barang-data-body");
    if (!tableBody) return; 
    tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
    
    const ruanganFilterValue = document.getElementById("filter-barang")?.value;
    let query = db.collection("barang").orderBy("createdAt", "desc").limit(100);

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
                    <td>${data.merkType || '-'}</td>
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

// DELETE DATA
function deleteData(docId, collectionName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ini dari koleksi ${collectionName}?`)) return;
    
    db.collection(collectionName).doc(docId).delete()
        .then(() => {
            alert("Data berhasil dihapus!");
        })
        .catch(error => console.error("Gagal hapus:", error));
}


// FUNGSI FILTER & EDIT (PLACEHOLDER)
function applyFilter() {
    loadDataBarang(); 
}

function editBarang(docId) {
    alert(`Siap edit barang ID: ${docId}.`);
    // Implementasikan modal/form edit di sini.
}

// Catatan: Pastikan Anda menambahkan elemen HTML untuk cards ringkasan data
// dengan ID: kondisi-baik, kondisi-rr, kondisi-rb, kondisi-total, jumlah-gedung.