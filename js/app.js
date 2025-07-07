import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyDtf2EIZuaBi28OeQGFx_1qOmdBdxB0pWg",
  authDomain: "nekretnine-be366.firebaseapp.com",
  projectId: "nekretnine-be366",
  storageBucket: "nekretnine-be366.appspot.com",
  messagingSenderId: "774606719599",
  appId: "1:774606719599:web:04ce3fa7282b0a9e1c5b9a",
  measurementId: "G-9HGWDF49BE"
};

// Inicijalizacija Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
window.db = db;
window.auth = auth;

