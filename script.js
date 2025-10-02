// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
    authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
    projectId: "inventaris-sekolah-6aa45",
    storageBucket: "inventaris-sekolah-6aa45.appspot.com",
    messagingSenderId: "482992763821",
    appId: "1:482992763821:web:3476cb5bd7320d840c2724",
    measurementId: "G-C51S4NNKXM"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();

// --- Logika Otentikasi (Login/Logout) ---

/**
 * Fungsi untuk menangani proses login.
 * Catatan: Untuk implementasi nyata, Anda perlu mendaftarkan user di Firebase Auth.
 * Contoh email/password: admin@sekolah.edu / admin123
 */
async function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const msgElement = document.getElementById('login-message');
    msgElement.textContent = ''; // Reset pesan error

    if (!email || !password) {
        msgElement.textContent = "Email dan password harus diisi.";
        return;
    }

    try {
        // Otentikasi dengan Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        // Jika berhasil, auth state observer akan menangani transisi ke dashboard
    } catch (error) {
        console.error("Login Gagal:", error.message);
        msgElement.textContent = `Login gagal. Error: ${error.code}`;
    }
}

/**
 * Fungsi untuk menangani proses logout.
 */
function logoutUser() {
    auth.signOut();
}

/**
 * Observer untuk memantau status otentikasi user.
 */
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        // User terautentikasi (Login berhasil)
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        console.log("User logged in:", user.email);
        
        // Muat data setelah login
        loadDataRuangan();
        loadKondisiBarang();
        loadRuanganSelect(); // Muat daftar ruangan untuk form input barang

    } else {
        // User tidak terautentikasi (Logout atau belum login)
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        console.log("User logged out.");
    }
});


// --- Logika Tampilan & CRUD Sederhana (Create/Read) ---

/**
 * Fungsi untuk mengubah tampilan (view) di dashboard.
 */
function openForm(viewId) {
    // Sembunyikan semua view
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    // Tampilkan view yang diminta
    document.getElementById(`${viewId}-view`).style.display = 'block';

    // Update status aktif sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Menemukan item navigasi yang sesuai untuk diaktifkan
    let activeItem;
    if (viewId === 'beranda') {
        activeItem = document.querySelector('.nav-item[href="#"][onclick^="loadKondisiBarang"]');
    } else {
        activeItem = document.querySelector(`.nav-item[onclick="openForm('${viewId}')"]`);
    }
    if (activeItem) {
        activeItem.classList.add('active');
    } else {
        // Default: aktifkan Beranda jika tidak ditemukan
        document.querySelector('.nav-item').classList.add('active');
    }
}

/**
 * Memuat data ruangan dari Firestore dan menampilkannya.
 */
function loadDataRuangan() {
    const listElement = document.getElementById('data-ruangan-list');
    listElement.innerHTML = 'Memuat data ruangan...';
    
    // Mendengarkan perubahan real-time (onSnapshot) dari koleksi 'ruangan'
    db.collection("ruangan").onSnapshot((snapshot) => {
        listElement.innerHTML = '';
        let htmlContent = '';
        let jumlahGedung = new Set();
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            jumlahGedung.add(data.namaGedung); // Asumsi ada field namaGedung
            
            htmlContent += `
                <div>
                    <strong>Ruangan: ${data.namaRuangan || 'N/A'}</strong> (Gedung: ${data.namaGedung || 'N/A'})
                    <button onclick="deleteData('${doc.id}', 'ruangan')">Hapus</button>
                    </div>
            `;
        });

        listElement.innerHTML = htmlContent || '<p>Tidak ada data ruangan.</p>';
        document.getElementById('jumlah-gedung').textContent = jumlahGedung.size;
    }, (error) => {
        console.error("Error memuat data ruangan:", error);
        listElement.innerHTML = '<p style="color: red;">Gagal memuat data ruangan.</p>';
    });
}

/**
 * Memuat ringkasan kondisi barang (Baik, RR, RB) dari Firestore.
 */
function loadKondisiBarang() {
    const filter = document.getElementById('filter-barang').value;
    // Query untuk mengambil semua barang
    let query = db.collection("barang");
    // Jika ada filter spesifik, Anda bisa menambahkannya di sini, misalnya berdasarkan Nama Barang/Kategori.

    query.onSnapshot((snapshot) => {
        let baik = 0;
        let rr = 0;
        let rb = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            switch (data.kondisi) {
                case 'B':
                    baik++;
                    break;
                case 'RR':
                    rr++;
                    break;
                case 'RB':
                    rb++;
                    break;
            }
        });

        // Tampilkan hasil
        document.getElementById('kondisi-baik').textContent = baik;
        document.getElementById('kondisi-rr').textContent = rr;
        document.getElementById('kondisi-rb').textContent = rb;
        document.getElementById('kondisi-total').textContent = baik + rr + rb;
    }, (error) => {
        console.error("Error memuat kondisi barang:", error);
    });
}

/**
 * Memuat daftar ruangan ke dalam select di form input barang.
 * Data diambil dari koleksi 'ruangan'.
 */
function loadRuanganSelect() {
    const selectElement = document.getElementById('ruangan-select');
    selectElement.innerHTML = '<option value="" disabled selected>Pilih Ruangan</option>';

    db.collection("ruangan").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Asumsi field yang menyimpan nama ruangan adalah 'namaRuangan'
            const option = document.createElement('option');
            option.value = doc.id; // Gunakan ID dokumen sebagai nilai (value)
            option.textContent = data.namaRuangan;
            selectElement.appendChild(option);
        });
    }).catch(error => {
        console.error("Error memuat daftar ruangan:", error);
    });
}

/**
 * Menyimpan data barang baru ke Firestore. (Create)
 */
async function saveDataBarang(event) {
    event.preventDefault(); // Mencegah form submit default

    const ruanganId = document.getElementById('ruangan-select').value;
    const namaBarang = document.getElementById('nama-barang').value;
    const kondisi = document.getElementById('kondisi-barang').value;
    
    if (!ruanganId || !namaBarang || !kondisi) {
        alert("Semua field harus diisi!");
        return;
    }

    try {
        await db.collection("barang").add({
            ruanganId: ruanganId,
            namaBarang: namaBarang,
            kondisi: kondisi, // B, RR, atau RB
            tanggalInput: firebase.firestore.FieldValue.serverTimestamp() // Timestamp input
        });
        
        alert("Data Barang berhasil disimpan!");
        document.getElementById('form-barang').reset(); // Reset form
        loadKondisiBarang(); // Refresh ringkasan kondisi
        
    } catch (error) {
        console.error("Error saat menyimpan data barang:", error);
        alert("Gagal menyimpan data barang. Silakan cek konsol.");
    }
}

/**
 * Menghapus data dari Firestore. (Delete - Sederhana)
 */
async function deleteData(docId, collectionName) {
    if (!confirm(`Yakin ingin menghapus data dari koleksi ${collectionName} dengan ID: ${docId}?`)) {
        return;
    }
    
    try {
        await db.collection(collectionName).doc(docId).delete();
        alert("Data berhasil dihapus!");
        // onSnapshot (pada loadDataRuangan) akan otomatis me-refresh tampilan
    } catch (error) {
        console.error("Error saat menghapus data:", error);
        alert("Gagal menghapus data.");
    }
}

// Inisiasi tampilan saat pertama kali load
document.addEventListener('DOMContentLoaded', () => {
    // openForm('beranda'); // Biarkan observer auth yang mengontrol tampilan awal
    console.log("Aplikasi Inventaris Dimuat.");
});