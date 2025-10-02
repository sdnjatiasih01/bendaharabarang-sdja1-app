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
      showView('beranda');
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
    document.getElementById("app-container").style.display = "none";
  }).catch(error => {
    console.error("Logout gagal:", error.message);
  });
}

// Tambahkan Event Listener untuk tombol navigasi
document.addEventListener('DOMContentLoaded', () => {
    // Logika ini akan berjalan setelah seluruh HTML dimuat
    const navButtons = document.querySelectorAll('#top-nav .nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Hapus kelas 'active' dari semua tombol
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Tambahkan kelas 'active' ke tombol yang baru diklik
            event.target.classList.add('active');
            
            // Tampilkan view yang sesuai
            const viewId = event.target.getAttribute('data-view');
            showView(viewId);
        });
    });
});

// Pastikan fungsi showView() Anda sudah memuat data yang relevan
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

    // Panggil fungsi pemuatan data di sini:
    if (viewId === 'beranda') {
        loadDataBarang();
        loadKondisiBarang();
    } else if (viewId === 'referensi') {
        loadPenanggungJawabTable(); // Fungsi yang kita bahas sebelumnya
    }
    // ... tambahkan untuk 'identitas', 'ruangan', 'barang', dll.
}
// Load Data Barang
function loadDataBarang() {
  const tableBody = document.getElementById("barang-data-body");
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

// Kondisi Barang
function loadKondisiBarang() {
  const baik = document.getElementById("kondisi-baik");
  const rr = document.getElementById("kondisi-rr");
  const rb = document.getElementById("kondisi-rb");
  const total = document.getElementById("kondisi-total");
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

// Save Barang
function saveDataBarang(event) {
  event.preventDefault();
  const namaBarang = document.getElementById("form-nama-barang").value;
  const merkType = document.getElementById("form-merk-type").value;
  const ruangan = document.getElementById("form-ruangan").value;
  const kondisi = document.getElementById("form-kondisi").value;
  db.collection("barang").add({ namaBarang, merkType, ruangan, kondisi })
    .then(() => {
      console.log("Barang berhasil ditambahkan!");
      closeModal();
      document.getElementById("form-barang-modal").reset();
    })
    .catch(error => {
      console.error("Gagal menambahkan barang:", error);
      alert("Error: " + error.message);
    });
}

// Modal
function openModal(formId) {
  const modal = document.getElementById('modal-container');
  document.querySelectorAll('.modal-form').forEach(form => form.style.display = 'none');
  document.getElementById(`modal-${formId}`).style.display = 'block';
  modal.style.display = 'block';
}
function closeModal() { document.getElementById('modal-container').style.display = 'none'; }

// Delete Data
function deleteData(docId, collectionName) {
  db.collection(collectionName).doc(docId).delete()
    .then(() => console.log("Data berhasil dihapus"))
    .catch(error => console.error("Gagal hapus:", error));
}

// Observer
auth.onAuthStateChanged(user => {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  if (user) {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    console.log("User logged in:", user.email);
    showView('beranda');
  } else {
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
    console.log("User logged out.");
  }
});
function applyFilter() {
  const namaFilter = document.getElementById("filter-nama-barang").value.toLowerCase();
  const lokasiFilter = document.getElementById("filter-lokasi").value;
  const kondisiFilter = document.getElementById("filter-kondisi").value;

  const tableBody = document.getElementById("barang-data-body");
  tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';

  db.collection("barang").get().then(snapshot => {
    tableBody.innerHTML = "";
    let i = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      let match = true;

      if (namaFilter && !data.namaBarang.toLowerCase().includes(namaFilter)) match = false;
      if (lokasiFilter && data.ruangan !== lokasiFilter) match = false;
      if (kondisiFilter && data.kondisi !== kondisiFilter) match = false;

      if (match) {
        tableBody.innerHTML += `
          <tr>
            <td>${i++}</td>
            <td>${data.namaBarang || '-'}</td>
            <td>${data.merkType || '-'}</td>
            <td>${data.ruangan || '-'}</td>
            <td>${data.kondisi || '-'}</td>
            <td>
              <button onclick="editBarang('${doc.id}')">Edit</button>
              <button onclick="deleteData('${doc.id}', 'barang')">Hapus</button>
            </td>
          </tr>
        `;
      }
    });
    if (tableBody.innerHTML === "") {
      tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data sesuai filter.</td></tr>';
    }
  });
}
function editBarang(docId) {
  db.collection("barang").doc(docId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("form-nama-barang").value = data.namaBarang;
      document.getElementById("form-merk-type").value = data.merkType;
      document.getElementById("form-ruangan").value = data.ruangan;
      document.getElementById("form-kondisi").value = data.kondisi;

      openModal('barang');

      // override fungsi save agar update, bukan tambah
      const form = document.getElementById("form-barang-modal");
      form.onsubmit = (event) => {
        event.preventDefault();
        db.collection("barang").doc(docId).update({
          namaBarang: document.getElementById("form-nama-barang").value,
          merkType: document.getElementById("form-merk-type").value,
          ruangan: document.getElementById("form-ruangan").value,
          kondisi: document.getElementById("form-kondisi").value
        }).then(() => {
          console.log("Barang berhasil diupdate!");
          closeModal();
          form.reset();
          // kembalikan fungsi save default
          form.onsubmit = saveDataBarang;
        });
      };
    }
  });
}
