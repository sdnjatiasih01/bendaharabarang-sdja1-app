// =================================================================
// 1. FIREBASE CONFIGURATION & INIT
// =================================================================
const firebaseConfig = {
    // PASTIKAN CONFIG INI SAMA PERSIS DENGAN PROJECT FIREBASE ANDA
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

// GLOBAL VARIABLE UNTUK TRACK EDIT MODE BARANG
let currentBarangId = null;

// =================================================================
// 2. AUTHENTICATION & UI SWITCHING (Perbaikan Login/Register/Error)
// =================================================================

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

function registerUser() {
    // Tambahkan .trim() untuk membersihkan spasi
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim(); 
    const messageElement = document.getElementById("reg-message");
    messageElement.textContent = "Mendaftarkan...";

    if (!email || !password) {
        messageElement.textContent = "Email dan Password tidak boleh kosong.";
        return;
    }

    if (password.length < 6) {
        messageElement.textContent = "Password harus minimal 6 karakter.";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                role: 'guru',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            messageElement.textContent = "Pendaftaran berhasil! Silakan Login.";
            document.getElementById("register-email").value = '';
            document.getElementById("register-password").value = '';
            showAuthView('login');
        })
        .catch(error => {
            // Penanganan error Firebase yang lebih detail
            if (error.code === 'auth/email-already-in-use') {
                messageElement.textContent = "Registrasi gagal: Email sudah terdaftar.";
            } else if (error.code === 'auth/invalid-email') {
                messageElement.textContent = "Registrasi gagal: Format email tidak valid.";
            } else {
                messageElement.textContent = `Registrasi gagal: ${error.message}`;
            }
        });
}

function loginUser() {
    // Tambahkan .trim() untuk membersihkan spasi
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const messageElement = document.getElementById("auth-message");
    messageElement.textContent = "Loading...";

    if (!email || !password) {
        messageElement.textContent = "Email dan Password tidak boleh kosong.";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            messageElement.textContent = ""; 
        })
        .catch(error => {
            // Penanganan error Firebase yang lebih detail
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                messageElement.textContent = "Login gagal: Email atau Password salah.";
            } else if (error.code === 'auth/invalid-email') {
                messageElement.textContent = "Login gagal: Format email tidak valid.";
            } else {
                messageElement.textContent = `Login gagal: ${error.message}`; 
            }
        });
}

function logoutUser() {
    auth.signOut().then(() => {
        // Observer auth.onAuthStateChanged akan menangani tampilan login
    }).catch(error => {
        console.error("Logout gagal:", error.message);
    });
}

auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        if (loginContainer) loginContainer.style.display = 'none';
        if (registerContainer) registerContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'flex'; 
        showView('beranda'); 
    } else {
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        showAuthView('login');
    }
});

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

    if (viewId === 'beranda') {
        loadKondisiBarang(); 
        loadRuanganForFilter();
        loadDataBarang(); 
    } else if (viewId === 'input_barang') {
        loadRuanganForInputBarang(); 
        document.getElementById("form-barang")?.reset();
        document.querySelector('#form-barang button[type="submit"]').textContent = 'Save';
        currentBarangId = null;
    } else if (viewId === 'input_ruangan') {
        loadGedungForDropdown(); 
        document.getElementById("form-gedung")?.reset();
        document.getElementById("form-ruangan")?.reset();
        
        // Sembunyikan tabel referensi saat masuk ke view
        document.getElementById("gedung-data-table")?.style.display = 'none';
        document.getElementById("ruangan-data-table")?.style.display = 'none';
    }
} 

// =================================================================
// 3. DATA RUANGAN & GEDUNG (CRUD DENGAN SORTING DAN VALIDASI PENGHAPUSAN)
// =================================================================

// SIMPAN DATA GEDUNG
function saveDataGedung(event) {
    event.preventDefault();
    const namaGedung = document.getElementById("nama-gedung-input").value.trim();
    
    if (namaGedung === '') {
        alert("Nama Gedung tidak boleh kosong.");
        return;
    }

    const gedungData = {
        namaGedung: namaGedung,
        createdBy: auth.currentUser ? auth.currentUser.email : 'unknown',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection("gedung").add(gedungData)
        .then(() => {
            alert(`Gedung "${namaGedung}" berhasil ditambahkan!`);
            document.getElementById("form-gedung").reset();
            loadGedungForDropdown();
            loadKondisiBarang();
        })
        .catch(error => {
            console.error("Gagal menambahkan gedung:", error);
            alert("Error: Gagal menyimpan data gedung.");
        });
}

// SIMPAN DATA RUANGAN
function saveDataRuangan(event) {
    event.preventDefault();
    const namaRuangan = document.getElementById("nama-ruangan").value.trim();
    const gedungInduk = document.getElementById("gedung-select").value;
    
    if (!namaRuangan || !gedungInduk) {
         alert("Mohon isi Nama Ruangan dan pilih Gedung Induk.");
         return;
    }

    const ruanganData = {
        namaRuangan: namaRuangan,
        namaGedung: gedungInduk,
        createdBy: auth.currentUser ? auth.currentUser.email : 'unknown',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection("ruangan").add(ruanganData)
        .then(() => {
            alert(`Ruangan "${namaRuangan}" berhasil ditambahkan di Gedung ${gedungInduk}!`);
            document.getElementById("form-ruangan").reset();
            loadRuanganForInputBarang(); 
            loadRuanganForFilter(); 
        })
        .catch(error => {
            console.error("Gagal menambahkan ruangan:", error);
            alert("Error: Gagal menyimpan data ruangan.");
        });
}

// LOAD GEDUNG UNTUK DROPDOWN INPUT RUANGAN (Ditambahkan sorting)
function loadGedungForDropdown() {
    const gedungSelect = document.getElementById("gedung-select");
    if (!gedungSelect) return;
    gedungSelect.innerHTML = '<option value="" disabled selected>Pilih Gedung</option>';
    
    db.collection("gedung").orderBy("namaGedung").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.namaGedung;
            option.textContent = data.namaGedung;
            gedungSelect.appendChild(option);
        });

        if (snapshot.empty) {
            gedungSelect.innerHTML += '<option value="" disabled>Tidak ada data gedung</option>';
        }
    }).catch(error => {
        console.error("Gagal memuat daftar gedung:", error);
    });
}

// LOAD RUANGAN UNTUK DROPDOWN INPUT BARANG (Ditambahkan sorting)
function loadRuanganForInputBarang() {
    const ruanganSelect = document.getElementById("ruangan-select");
    if (!ruanganSelect) return;
    ruanganSelect.innerHTML = '<option value="" disabled selected>Pilih Ruangan</option>';

    db.collection("ruangan").orderBy("namaRuangan").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.namaRuangan; 
            option.textContent = `${data.namaRuangan} (${data.namaGedung})`;
            ruanganSelect.appendChild(option);
        });

        if (snapshot.empty) {
            ruanganSelect.innerHTML += '<option value="" disabled>Tidak ada data ruangan</option>';
        }
        
    }).catch(error => {
        console.error("Gagal memuat daftar ruangan:", error);
    });
}

// LOAD RUANGAN UNTUK DROPDOWN FILTER (Ditambahkan sorting)
function loadRuanganForFilter() {
    const filterSelect = document.getElementById("filter-barang");
    if (!filterSelect) return;
    filterSelect.innerHTML = '<option value="">Semua Ruangan</option>';

    db.collection("ruangan").orderBy("namaRuangan").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.namaRuangan;
            option.textContent = `${data.namaRuangan} (${data.namaGedung})`;
            filterSelect.appendChild(option);
        });
    });
}

// MENAMPILKAN DATA REFERENSI (GEDUNG/RUANGAN)
function loadDataReference(collectionName) {
    const tableBody = document.getElementById(`${collectionName}-data-body`);
    const table = document.getElementById(`${collectionName}-data-table`);
    if (!tableBody || !table) return;

    // Toggle tampilan tabel
    if (table.style.display === 'none') {
        table.style.display = 'table';
    } else {
        table.style.display = 'none';
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    db.collection(collectionName).get().then(snapshot => {
        tableBody.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            let row = `<tr>`;

            if (collectionName === 'gedung') {
                row += `<td>${data.namaGedung || '-'}</td>`;
                row += `<td><button class="btn btn-delete" onclick="deleteData('${doc.id}', 'gedung', '${data.namaGedung}')">Hapus</button></td>`;
            } else if (collectionName === 'ruangan') {
                row += `<td>${data.namaRuangan || '-'}</td>`;
                row += `<td>${data.namaGedung || '-'}</td>`;
                row += `<td><button class="btn btn-delete" onclick="deleteData('${doc.id}', 'ruangan', '${data.namaRuangan}')">Hapus</button></td>`;
            }
            
            row += `</tr>`;
            tableBody.innerHTML += row;
        });

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="3">Tidak ada data.</td></tr>';
        }
    }).catch(error => {
        console.error(`Gagal memuat data ${collectionName}:`, error);
        tableBody.innerHTML = '<tr><td colspan="3">Gagal memuat data.</td></tr>';
    });
}

// MENGHAPUS DATA DENGAN VALIDASI (PENCEGAHAN KESALAHAN PENGHAPUSAN)
async function deleteData(docId, collectionName, referenceName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${referenceName}" dari koleksi ${collectionName}? Tindakan ini TIDAK dapat dibatalkan.`)) {
        return;
    }

    try {
        if (collectionName === 'gedung') {
            // VALIDASI GEDUNG: Cek apakah masih ada ruangan yang terikat
            const ruanganSnapshot = await db.collection("ruangan").where("namaGedung", "==", referenceName).limit(1).get();
            if (!ruanganSnapshot.empty) {
                alert(`Gagal menghapus Gedung "${referenceName}". Masih ada ruangan yang terikat. Hapus semua Ruangan terlebih dahulu.`);
                return;
            }
        } 
        
        else if (collectionName === 'ruangan') {
            // VALIDASI RUANGAN: Cek apakah masih ada barang di ruangan ini
            const barangSnapshot = await db.collection("barang").where("ruangan", "==", referenceName).limit(1).get();
            if (!barangSnapshot.empty) {
                alert(`Gagal menghapus Ruangan "${referenceName}". Masih ada barang di dalamnya. Pindahkan atau Hapus semua Barang terlebih dahulu.`);
                return;
            }
        }
        
        // HAPUS DATA setelah melewati validasi
        await db.collection(collectionName).doc(docId).delete();
        
        alert("Data berhasil dihapus!");

        // Update UI
        // KOREKSI ERROR BARIS 167: Mengganti kode yang ambigu dengan panggilan fungsi yang jelas
        if (collectionName === 'barang') {
            loadKondisiBarang(); 
            loadDataBarang();
        } else if (collectionName === 'ruangan' || collectionName === 'gedung') {
            loadGedungForDropdown();
            loadRuanganForInputBarang();
            loadRuanganForFilter();
            loadKondisiBarang();
            loadDataReference(collectionName); 
        }

    } catch (error) {
        console.error("Gagal menghapus data:", error);
        alert("Error: Gagal menghapus data. Periksa koneksi atau konsol untuk detail.");
    }
}


// =================================================================
// 4. DATA BARANG (CRUD)
// =================================================================

function saveDataBarang(event) {
    event.preventDefault();
    const ruangan = document.getElementById("ruangan-select").value; 
    const namaBarang = document.getElementById("nama-barang").value.trim(); 
    const merkType = document.getElementById("merk-type").value.trim(); 
    const kondisi = document.getElementById("kondisi-barang").value; 
    
    if (!ruangan || ruangan === "") {
        alert("Mohon pilih Nama Ruangan.");
        return;
    }
    if (!namaBarang) {
        alert("Nama Barang tidak boleh kosong.");
        return;
    }

    const barangData = { 
        ruangan, 
        namaBarang, 
        merkType, 
        kondisi,
        createdBy: auth.currentUser ? auth.currentUser.email : 'unknown',
    };

    const submitButton = document.querySelector('#form-barang button[type="submit"]');

    if (currentBarangId) {
        // Mode EDIT
        db.collection("barang").doc(currentBarangId).update(barangData)
        .then(() => {
            alert(`Barang "${namaBarang}" berhasil diupdate!`);
            document.getElementById("form-barang").reset();
            currentBarangId = null; 
            submitButton.textContent = 'Save';
            loadDataBarang(); 
            loadKondisiBarang();
        })
        .catch(error => {
            console.error("Gagal update barang:", error);
            alert("Error: Gagal menyimpan data barang.");
        });

    } else {
        // Mode ADD
        barangData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection("barang").add(barangData)
        .then(() => {
            alert(`Barang "${namaBarang}" berhasil ditambahkan!`);
            document.getElementById("form-barang").reset();
            loadKondisiBarang(); 
            loadDataBarang(); 
        })
        .catch(error => {
            console.error("Gagal menambahkan barang:", error);
            alert("Error: Gagal menyimpan data barang.");
        });
    }
}


// LOAD RINGKASAN KONDISI BARANG
function loadKondisiBarang() {
    const totalEl = document.getElementById("kondisi-total");
    const baikEl = document.getElementById("kondisi-baik");
    const rrEl = document.getElementById("kondisi-rr");
    const rbEl = document.getElementById("kondisi-rb");
    const gedungEl = document.getElementById("jumlah-gedung");

    let count = { total: 0, B: 0, RR: 0, RB: 0 };

    // 1. Hitung Barang
    db.collection("barang").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            count.total++;
            if (data.kondisi === 'B') count.B++;
            else if (data.kondisi === 'RR') count.RR++;
            else if (data.kondisi === 'RB') count.RB++;
        });

        if (totalEl) totalEl.textContent = count.total;
        if (baikEl) baikEl.textContent = count.B;
        if (rrEl) rrEl.textContent = count.RR;
        if (rbEl) rbEl.textContent = count.RB;
    }).catch(error => console.error("Gagal memuat ringkasan barang:", error));

    // 2. Hitung Gedung
    db.collection("gedung").get().then(snapshot => {
        if (gedungEl) gedungEl.textContent = snapshot.size;
    }).catch(error => console.error("Gagal memuat jumlah gedung:", error));
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
            let kondisiText = '';
            if (data.kondisi === 'B') kondisiText = 'Baik';
            else if (data.kondisi === 'RR') kondisiText = 'Rusak Ringan';
            else if (data.kondisi === 'RB') kondisiText = 'Rusak Berat';
            
            tableBody.innerHTML += `
                <tr>
                    <td>${i++}</td>
                    <td>${data.namaBarang || '-'}</td>
                    <td>${data.merkType || '-'}</td>
                    <td>${data.ruangan || '-'}</td>
                    <td>${kondisiText || data.kondisi || '-'}</td>
                    <td>
                        <button class="btn btn-edit" onclick="editBarang('${doc.id}')">Edit</button>
                        <button class="btn btn-delete" onclick="deleteData('${doc.id}', 'barang', '${data.namaBarang}')">Hapus</button>
                    </td>
                </tr>`;
        });
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data barang.</td></tr>';
        }
        loadKondisiBarang();
    });
}


// FUNGSI EDIT BARANG
function editBarang(docId) {
    showView('input_barang');

    const submitButton = document.querySelector('#form-barang button[type="submit"]');
    submitButton.textContent = 'Memuat...';

    db.collection("barang").doc(docId).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                
                document.getElementById("nama-barang").value = data.namaBarang;
                document.getElementById("merk-type").value = data.merkType || '';
                document.getElementById("kondisi-barang").value = data.kondisi;

                // Memastikan dropdown ruangan sudah terisi sebelum set value
                // Digunakan setTimeout karena loadRuanganForInputBarang() berjalan secara async
                setTimeout(() => {
                    document.getElementById("ruangan-select").value = data.ruangan;
                }, 300); 

                currentBarangId = docId;
                submitButton.textContent = 'Update';
                
            } else {
                alert("Data barang tidak ditemukan.");
                submitButton.textContent = 'Save';
            }
        })
        .catch(error => {
            console.error("Gagal memuat data edit:", error);
            alert("Gagal memuat data untuk diedit.");
            submitButton.textContent = 'Save';
        });
}


// FUNGSI FILTER
function applyFilter() {
    loadDataBarang(); 
}