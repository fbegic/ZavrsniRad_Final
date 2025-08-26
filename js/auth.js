import { auth, db } from './app.js';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Elementi
const authButtons = document.getElementById('authButtons');
const userMenuContainer = document.getElementById('userMenuContainer');
const popupOverlay = document.getElementById('popupOverlay');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

const showModal = (modal) => {
  const main = document.getElementById('mainContent');
  popupOverlay.classList.add('active');
  modal.style.display = 'block';
  main?.classList.add('blur');
};

const hideModals = () => {
  const main = document.getElementById('mainContent');
  popupOverlay.classList.remove('active');
  loginModal.style.display = 'none';
  registerModal.style.display = 'none';
  main?.classList.remove('blur');
};


// Praćenje stanja korisnika
onAuthStateChanged(auth, (user) => {
  if (user) {
    authButtons?.style?.setProperty('display', 'none');
    userMenuContainer?.style?.setProperty('display', 'block');

    // Prikaz emaila
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) {
      emailDisplay.textContent = user.email;
    }

  } else {
    authButtons?.style?.setProperty('display', 'block');
    userMenuContainer?.style?.setProperty('display', 'none');

    // Očisti prikaz emaila ako postoji
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) {
      emailDisplay.textContent = '';
    }
  }
});



// Otvaranje popupa
document.getElementById('loginTrigger')?.addEventListener('click', (e) => {
  e.preventDefault();
  showModal(loginModal);
});

document.getElementById('registerTrigger')?.addEventListener('click', (e) => {
  e.preventDefault();
  showModal(registerModal);
});

popupOverlay?.addEventListener('click', hideModals);

// Prelazak iz login u register i obrnuto
document.getElementById('openRegisterFromLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  loginModal.style.display = 'none';
  registerModal.style.display = 'block';
});

document.getElementById('openLoginFromRegister')?.addEventListener('click', (e) => {
  e.preventDefault();
  registerModal.style.display = 'none';
  loginModal.style.display = 'block';
});

// Login iz popup forme
document.getElementById('popupLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('popupLoginEmail').value;
  const password = document.getElementById('popupLoginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    hideModals();
    window.location.reload();
  } catch (error) {
    alert('Greška: ' + error.message);
  }
});

// Registracija iz popup forme
document.getElementById('popupRegisterForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('popupRegisterEmail').value;
  const password = document.getElementById('popupRegisterPassword').value;
  const confirm = document.getElementById('popupRegisterConfirm').value;

  if (password !== confirm) {
    alert('Lozinke se ne podudaraju!');
    return;
  }

  try {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    createdAt: new Date().toISOString(),
    uid: user.uid
  });

  await signOut(auth);  // Odmah odjavi korisnika

  alert('Registracija uspješna! Sada se prijavite.');

  // Otvori login popup
  hideModals();         // zatvori register popup
  showModal(loginModal); // otvori login popup

} catch (error) {
  alert('Greška: ' + error.message);
}
});


// SPRIJEČI otvaranje "dodaj-nekretninu.html" ako nije prijavljen
document.addEventListener('DOMContentLoaded', () => {
  const addLink = document.querySelector('a[href="dodaj-nekretninu.html"]');
  if (!addLink || !loginModal || !popupOverlay) return;

  addLink.addEventListener('click', (e) => {
    if (!auth.currentUser) {
      e.preventDefault(); // spriječi navigaciju
      showModal(loginModal); // otvori popup
    }
  });
});
