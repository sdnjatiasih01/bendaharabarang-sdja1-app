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
// 2. AUTHENTICATION & UI SWITCHING
// =================================================================

function showAuthView(view) {
    const login = document.getElementById('login-container');
    const register = document.getElementById('register-container');
    const authMessage = document.getElementById('auth-message');
    const regMessage = document.getElementById('reg-message');

    if (login && register && authMessage && regMessage) {
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
}

function registerUser() {
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
        // Otomatis ditangani oleh auth.onAuthStateChanged
    }).catch(error => {
        console.error("Logout gagal:", error.message);
    });
}

auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        if (loginContainer) loginContainer.style.display = 'none';
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
        
        document.getElementById("gedung-data-table")?.style.display = 'none';
        document.getElementById("ruangan-data-table")?.style.display = 'none';
    }
} 

// =================================================================
// 3. DATA RUANGAN & GEDUNG (CRUD)
// =================================================================
// (lanjut sesuai file Anda)

// =================================================================
// 4. DATA BARANG (CRUD)
// =================================================================
// (lanjut sesuai file Anda)
