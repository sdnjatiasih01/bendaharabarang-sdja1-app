// ... (Kode Inisialisasi Firebase tetap sama) ...

// --- Logika Navigasi & Tampilan ---

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