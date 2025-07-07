import { db, auth } from './app.js'; 
import { collection, getDocs, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const myPropertiesList = document.getElementById('myPropertiesList');

async function loadMyProperties() {
  if (!myPropertiesList) return;

  const user = auth.currentUser;
  if (!user) {
    myPropertiesList.innerHTML = '<p>Molimo prijavite se da vidite svoje oglase.</p>';
    return;
  }

  myPropertiesList.innerHTML = '<p>Učitavanje vaših oglasa...</p>';

  try {
    const adsCollection = collection(db, 'ads');
    const q = query(adsCollection, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      myPropertiesList.innerHTML = '<p>Nemate objavljenih oglasa.</p>';
      return;
    }

    myPropertiesList.innerHTML = '';

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.classList.add('property-card');

      card.innerHTML = `
        <img src="${data.images && data.images.length > 0 ? data.images[0] : 'images/placeholder.png'}" alt="Slika nekretnine" />
        <div class="property-details">
          <h3>${data.title || 'Nema naslova'}</h3>
          <p><strong>Tip:</strong> ${data.type || '-'}</p>
          <p><strong>Lokacija:</strong> ${data.location || '-'}</p>
          <p><strong>Cijena:</strong> ${data.price ? data.price + ' €' : '-'}</p>
          <button class="btn-delete" data-id="${docSnap.id}">Obriši oglas</button>
        </div>
      `;

      myPropertiesList.appendChild(card);
    });

    // Event listeneri za brisanje
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Jeste li sigurni da želite obrisati ovaj oglas?')) {
          try {
            await deleteDoc(doc(db, 'ads', id));
            alert('Oglas je obrisan.');
            loadMyProperties();
          } catch (error) {
            alert('Greška pri brisanju oglasa: ' + error.message);
          }
        }
      });
    });

  } catch (error) {
    myPropertiesList.innerHTML = `<p>Greška pri učitavanju oglasa: ${error.message}</p>`;
  }
}

// Pokreni kad se korisnik prijavi
auth.onAuthStateChanged(user => {
  if (user) {
    loadMyProperties();
  } else {
    myPropertiesList.innerHTML = '<p>Molimo prijavite se da vidite svoje oglase.</p>';
  }
});
