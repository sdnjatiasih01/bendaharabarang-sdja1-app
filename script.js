// ... (Kode Inisialisasi Firebase tetap sama) ...

// --- Logika Navigasi & Tampilan ---
// Awal file script.js
// Bagian 1: Konfigurasi Anda
const firebaseConfig = {
    apiKey: "AIzaSyAkVZlF1T3EYiUQxeUnEiew2uXanuQcFJ8",
    authDomain: "inventaris-sekolah-6aa45.firebaseapp.com",
    projectId: "inventaris-sekolah-6aa45",
    storageBucket: "inventaris-sekolah-6aa45.appspot.com",
    messagingSenderId: "482992763821",
    appId: "1:482992763821:web:3476cb5bd7320d840c2724",
    measurementId: "G-C51S4NNKXM"
};//
//=== BARIS KRITIS YANG HILANG/TERHAPUS===
const app = firebase.initializeApp(firebaseConfig); 

const auth = app.auth(); // <--- BARIS KRITIS INI HARUS ADA!
const db = app.firestore(); // Baris ini juga penting

// ... (lanjut ke fungsi loginUser dan lainnya) ...
/**
 * Fungsi untuk menampilkan view tertentu dan menyembunyikan yang lain.
 */
function showView(viewId) {
    // Sembunyikan semua view
    document.querySelectorAll('.content-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active-view');
    });

    // Tampilkan view yang diminta
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active-view');
    }

    // Update status aktif tombol navigasi
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        }
    });
    
    // Khusus untuk Beranda, muat data
    if (viewId === 'beranda') {
        loadDataBarang();
        loadKondisiBarang();
    }
    if (viewId === 'ruangan') {
        loadDataRuanganTable();
    }
    // TODO: Tambahkan fungsi load untuk view lainnya (identitas, barang, referensi, dir)
}

// Tambahkan event listener untuk tombol navigasi
document.addEventListener('DOMContentLoaded', () => {
    // Tambahkan ini setelah inisialisasi Firebase selesai
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const view = e.target.getAttribute('data-view');
            showView(view);
        });
    });
    
    // ... (kode DOMContentLoaded lainnya) ...
});

// --- Logika Modal (Popup) ---

/**
 * Menampilkan modal dan menampilkan form yang sesuai.
 */
function openModal(formId) {
    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    
    // Sembunyikan semua form di modal
    document.querySelectorAll('.modal-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Tampilkan form yang diminta
    const targetForm = document.getElementById(`modal-${formId}`);
    if (targetForm) {
        targetForm.style.display = 'block';
        
        // Atur judul modal
        switch (formId) {
            case 'identitas': title.textContent = 'Edit Data Identitas'; break;
            case 'ruangan': title.textContent = 'Input Data Ruangan'; break;
            case 'barang': title.textContent = 'Input Data Barang'; break;
            case 'referensi': title.textContent = 'Input Data Referensi'; break;
            default: title.textContent = 'Form Input';
        }
        
        modal.style.display = 'block';
    }
}

/**
 * Menyembunyikan modal.
 */
function closeModal() {
    document.getElementById('modal-container').style.display = 'none';
}

// Tutup modal ketika pengguna mengklik di luar area modal
window.onclick = function(event) {
    const modal = document.getElementById('modal-container');
    if (event.target === modal) {
        closeModal();
    }
}


// --- Logika CRUD (Contoh: loadDataRuanganTable) ---

/**
 * Memuat data ruangan dari Firestore dan menampilkannya dalam bentuk tabel.
 */
function loadDataRuanganTable() {
    const tableBody = document.getElementById('ruangan-data-body');
    tableBody.innerHTML = '<tr><td colspan="5">Memuat data ruangan...</td></tr>';
    
    db.collection("ruangan").onSnapshot((snapshot) => {
        tableBody.innerHTML = '';
        let htmlContent = '';
        let i = 1;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            htmlContent += `
                <tr>
                    <td>${i++}</td>
                    <td>${data.namaRuangan || 'N/A'}</td>
                    <td>${data.namaGedung || 'N/A'}</td>
                    <td>${data.penanggungJawab || '-'}</td>
                    <td>
                        <button onclick="editRuangan('${doc.id}')">Edit</button>
                        <button onclick="deleteData('${doc.id}', 'ruangan')">Hapus</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = htmlContent || '<tr><td colspan="5">Tidak ada data ruangan.</td></tr>';
    });
}
// script.js (di bagian Logika Tampilan & CRUD)

/**
 * Memuat daftar Penanggung Jawab dari Firestore ke dalam dropdown di modal ruangan.
 */
async function loadPenanggungJawabDropdown() {
    // ID Dropdown di form Data Ruangan (misalnya: 'barang-penanggung-jawab' di form barang)
    const dropdown = document.getElementById('barang-penanggung-jawab'); 
    if (!dropdown) return; // Keluar jika elemen tidak ditemukan

    dropdown.innerHTML = '<option value="">-- Pilih Penanggung Jawab --</option>';

    try {
        const snapshot = await db.collection("penanggungjawab").orderBy("namaPetugas").get();
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Gunakan doc.id sebagai value
            const option = document.createElement('option');
            option.value = doc.id; 
            option.setAttribute('data-nip', data.nipNik || ''); // Simpan NIP/NIK sebagai data attribute
            option.textContent = data.namaPetugas;
            dropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Gagal memuat daftar penanggung jawab:", error);
    }
}

/**
 * Fungsi yang dipanggil saat memilih Penanggung Jawab untuk mengisi NIP/NIK otomatis.
 */
function updateNipNik() {
    const dropdown = document.getElementById('barang-penanggung-jawab');
    const nipInput = document.getElementById('barang-nip-nik');
    
    // Ambil opsi yang dipilih
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        // Ambil NIP/NIK dari data-nip attribute
        nipInput.value = selectedOption.getAttribute('data-nip') || '';
    } else {
        nipInput.value = '';
    }
}
// ... (loadDataBarang, loadKondisiBarang, saveDataBarang, dll. disesuaikan untuk merender tabel baru) ...
// CATATAN: Fungsi loadDataBarang perlu diperbarui untuk mengisi #barang-data-body di Beranda.

// --- Observers / Inisiasi Awal ---

// Di dalam auth.onAuthStateChanged(user => { ... })
// Panggil showView('beranda') setelah user login.

auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container'); // Ganti dashboard-container
    
    if (user) {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        console.log("User logged in:", user.email);
        
        // PENTING: Arahkan ke Beranda saat login
        showView('beranda'); 

    } else {
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        console.log("User logged out.");
    }
});