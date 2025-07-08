import { db, auth } from './app.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const SUPABASE_URL = 'https://hvfonsxtrhzayhadlrxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Zm9uc3h0cmh6YXloYWRscnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTk2ODcsImV4cCI6MjA2Njk3NTY4N30.tK1-QZ7QVTxEV2AnZJJK3Gvk39iQgF1AJUzAfGj7AGE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fileInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const propertyList = document.getElementById('propertyList');

let selectedFiles = [];  // Spremi sve odabrane slike

// Prikaz preview slika za upload
function updateImagePreview() {
  if (!imagePreview) return;
  imagePreview.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '100px';
      img.style.marginRight = '10px';
      img.style.marginTop = '10px';
      img.title = file.name;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'x';
      removeBtn.style.marginLeft = '5px';
      removeBtn.style.cursor = 'pointer';
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        updateImagePreview();
      });

      const container = document.createElement('div');
      container.style.display = 'inline-block';
      container.style.position = 'relative';

      container.appendChild(img);
      container.appendChild(removeBtn);
      imagePreview.appendChild(container);
    };
    reader.readAsDataURL(file);
  });
}

// Dodavanje slika u selectedFiles i prikaz preview-a
if (fileInput) {
  fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    selectedFiles = selectedFiles.concat(files);
    updateImagePreview();
    fileInput.value = ''; // reset input da može ponovo birati iste
  });
}

// Glavna funkcija za submit forme i upload slika
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addPropertyForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userId = auth.currentUser?.uid;
      if (!userId) {
      alert('Morate biti prijavljeni da biste dodali nekretninu!');
      showModal(loginModal);  // koristi popup umjesto redirect
      return;
      }


      // Očisti i parsiraj cijenu tako da prihvati npr. 250.000,00 ili 250000 ili 250000.00
      const priceRaw = document.getElementById('price')?.value || '';
      const priceCleaned = priceRaw.replace(/\./g, '').replace(/,/g, '.');
      const price = parseFloat(priceCleaned) || 0;

      const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
      let imageUrls = [];

      for (const file of selectedFiles) {
        const uniqueSuffix = crypto.randomUUID();
        const fileName = `${userId}_${Date.now()}_${uniqueSuffix}_${sanitizeFileName(file.name)}`;

        const { data, error } = await supabase.storage.from('nekretnine').upload(fileName, file);
        if (error) {
          alert('Greška pri uploadu slike: ' + error.message);
          return;
        }

        const { data: publicData } = supabase.storage.from('nekretnine').getPublicUrl(fileName);
        imageUrls.push(publicData.publicUrl);
      }

      const nekretnina = {
        title: document.getElementById('title')?.value || '',
        type: document.getElementById('type')?.value || '',
        location: document.getElementById('location')?.value || '',
        price: price,
        size: document.getElementById('size')?.value ? Number(document.getElementById('size').value) : null,
        rooms: document.getElementById('rooms')?.value ? Number(document.getElementById('rooms').value) : null,
        description: document.getElementById('description')?.value || '',
        yearBuilt: document.getElementById('yearBuilt')?.value || '',
        parking: document.getElementById('parking')?.value || '',
        heating: document.getElementById('heating')?.value || '',
        contact: document.getElementById('contact')?.value || '',
        userId,
        images: imageUrls,
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'ads'), nekretnina);
        alert('Nekretnina uspješno dodana!');
        window.location.href = 'dashboard.html';
      } catch (error) {
        alert(`Greška: ${error.message}`);
      }
    });
  }

  // Funkcija za dohvat i prikaz oglasa na dashboardu s filtriranjem i carouselom
  async function loadFilteredProperties(typeFilter, minPrice, maxPrice) {
    if (!propertyList) return;

    propertyList.innerHTML = '<p class="loading">Učitavanje nekretnina...</p>';

    try {
      const querySnapshot = await getDocs(collection(db, 'ads'));
      if (querySnapshot.empty) {
        propertyList.innerHTML = '<p class="no-results">Nema pronađenih nekretnina.</p>';
        return;
      }

      propertyList.innerHTML = '';

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Filtriraj po tipu ako je zadano
        if (typeFilter && typeFilter !== '' && data.type !== typeFilter) return;

        // Filtriraj po cijeni ako su zadane
        if (minPrice !== null && data.price < minPrice) return;
        if (maxPrice !== null && data.price > maxPrice) return;

        let imagesHtml = '';
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          imagesHtml = `
            <div class="carousel">
              ${data.images.map((url, index) => `
                <img
                  src="${url}"
                  alt="Slika nekretnine"
                  class="carousel-image"
                  style="display: ${index === 0 ? 'block' : 'none'}; max-width: 100%; border-radius: 5px;"
                >
              `).join('')}
              <button class="carousel-prev">&#10094;</button>
              <button class="carousel-next">&#10095;</button>
            </div>
          `;
        } else {
          imagesHtml = `<img src="images/placeholder.png" alt="Nema slike" style="max-width: 100%; border-radius: 5px;">`;
        }

        const card = document.createElement('div');
        card.classList.add('property-card');

        card.innerHTML = `
          ${imagesHtml}
          <div class="property-details">
            <h3>${data.title || 'Nema naslova'}</h3>
            <p><strong>Tip:</strong> ${data.type || '-'}</p>
            <p><strong>Lokacija:</strong> ${data.location || '-'}</p>
            <p><strong>Veličina:</strong> ${data.size ? data.size + ' m²' : '-'}</p>
            <p><strong>Cijena:</strong> ${data.price ? data.price + ' €' : '-'}</p>
            <p><strong>Broj soba:</strong> ${data.rooms || '-'}</p>
            <button class="btn btn-details" onclick="location.href='detalji.html?id=${doc.id}'">Više informacija</button>
          </div>
        `;

        propertyList.appendChild(card);
      });

      // Inicijaliziraj carousel funkcionalnost
      document.querySelectorAll('.carousel').forEach(carousel => {
        let currentIndex = 0;
        const images = carousel.querySelectorAll('.carousel-image');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');

        function showImage(index) {
          images.forEach((img, i) => {
            img.style.display = (i === index) ? 'block' : 'none';
          });
        }

        prevBtn.addEventListener('click', () => {
          currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
          showImage(currentIndex);
        });

        nextBtn.addEventListener('click', () => {
          currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
          showImage(currentIndex);
        });
      });

    } catch (error) {
      propertyList.innerHTML = `<p class="error">Greška pri učitavanju: ${error.message}</p>`;
    }
  }

  // Učitaj inicijalno sve oglase bez filtera
  loadFilteredProperties('', null, null);

  // Dodaj event listener za filtriranje
 const filterBtn = document.getElementById('filterBtn');
if (filterBtn) {
  filterBtn.addEventListener('click', () => {
    const typeFilter = document.getElementById('tipNekretnine').value;
    const minPriceInput = document.getElementById('minCijena').value;
    const maxPriceInput = document.getElementById('maxCijena').value;

    const minPrice = minPriceInput ? Number(minPriceInput) : null;
    const maxPrice = maxPriceInput ? Number(maxPriceInput) : null;

    loadFilteredProperties(typeFilter, minPrice, maxPrice);
  });
}
});
