import { db, auth } from './app.js'; 
import { collection, getDocs, deleteDoc, doc, query, where, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

const myPropertiesList = document.getElementById('myPropertiesList');

if (myPropertiesList) {
  // --- MODAL: selektori i helperi (sigurno postoje samo na ovoj stranici) ---
  const editModal     = document.getElementById('editModal');
  const editForm      = document.getElementById('editForm');
  const editCloseBtn  = document.getElementById('editClose');
  const editCancelBtn = document.getElementById('editCancel');

  const openModal  = () => { if (editModal) editModal.style.display = 'flex'; };
  const closeModal = () => { if (editModal) editModal.style.display = 'none'; };

  if (editCloseBtn)  editCloseBtn.addEventListener('click', closeModal);
  if (editCancelBtn) editCancelBtn.addEventListener('click', closeModal);

  // klik na pozadinu zatvara modal
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeModal();
    });
  }

  // --- Učitavanje mojih oglasa ---
  async function loadMyProperties() {
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
            <div class="property-actions">
              <button class="btn-delete" data-id="${docSnap.id}">Obriši</button>
              <button class="btn-edit" data-id="${docSnap.id}">Uredi</button>
            </div>
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

      // Event listeneri za uređivanje
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const ref = doc(db, 'ads', id);
          const snap = await getDoc(ref);
          if (!snap.exists()) return;

          const d = snap.data();
          if (editForm) {
            editForm['id'].value          = id;
            editForm['price'].value       = d.price ?? '';
            editForm['description'].value = d.description || '';
          }

          openModal(); // otvori modal
        });
      });

    } catch (error) {
      myPropertiesList.innerHTML = `<p>Greška pri učitavanju oglasa: ${error.message}</p>`;
    }
  }

  // Submit forme za uređivanje
  if (editForm) {
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = editForm['id'].value;
      const ref = doc(db, 'ads', id);
      try {
        await updateDoc(ref, {
          price: Number(editForm['price'].value),
          description: editForm['description'].value,
          updatedAt: new Date()
        });
        alert('Oglas ažuriran!');
        closeModal();
        loadMyProperties();
      } catch (error) {
        alert('Greška pri ažuriranju: ' + error.message);
      }
    });
  }

  // Pokreni kad se korisnik prijavi
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadMyProperties();
    } else {
      myPropertiesList.innerHTML = '<p>Molimo prijavite se da vidite svoje oglase.</p>';
    }
  });
}
