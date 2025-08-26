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
const paginationContainer = document.getElementById('pagination');

let selectedFiles = [];  // Spremi sve odabrane slike
let allProperties = [];  // Svi oglasi za pagination
let currentPage = 1;
const propertiesPerPage = 9;


//Sakrivanje polja kad je zemljište
document.addEventListener('DOMContentLoaded', () => {
  const typeSelect = document.getElementById('type');
  const yearBuiltField = document.getElementById('yearBuilt')?.closest('div');
  const roomsField = document.getElementById('rooms')?.closest('div');
  const parkingField = document.getElementById('parking')?.closest('div');
  const heatingField = document.getElementById('heating')?.closest('div');

  function toggleFieldsForLand() {
    if (!typeSelect) return;
    const isLand = typeSelect.value.toLowerCase() === 'zemljište' || typeSelect.value.toLowerCase() === 'zemljiste';

    [yearBuiltField, roomsField, parkingField, heatingField].forEach(field => {
      if (field) field.style.display = isLand ? 'none' : '';
    });

    // Ukloni ili dodaj required
    ['yearBuilt', 'rooms', 'parking', 'heating'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        if (isLand) {
          input.removeAttribute('required');
        } else {
          input.setAttribute('required', true);
        }
      }
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener('change', toggleFieldsForLand);
    toggleFieldsForLand();
  }
});

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
        showModal(loginModal);
        return;
      }

      const priceRaw = document.getElementById('price')?.value || '';
      const priceCleaned = priceRaw.replace(/\./g, '').replace(/,/g, '.');
      const price = parseFloat(priceCleaned) || 0;

      const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
      let imageUrls = [];

      for (const file of selectedFiles) {
        const uniqueSuffix = crypto.randomUUID();
        const fileName = `${userId}_${Date.now()}_${uniqueSuffix}_${sanitizeFileName(file.name)}`;

        const { error } = await supabase.storage.from('nekretnine').upload(fileName, file);
        if (error) {
          alert('Greška pri uploadu slike: ' + error.message);
          return;
        }

        const { data: publicData } = supabase.storage.from('nekretnine').getPublicUrl(fileName);
        imageUrls.push(publicData.publicUrl);
      }

      const type = document.getElementById('type')?.value || '';
      let yearBuilt = document.getElementById('yearBuilt')?.value || '';
      let rooms = document.getElementById('rooms')?.value || '';
      let parking = document.getElementById('parking')?.value || '';
      let heating = document.getElementById('heating')?.value || '';

      // Ako je zemljište, isprazni vrijednosti
      if (type.toLowerCase() === 'zemljište' || type.toLowerCase() === 'zemljiste') {
        yearBuilt = '';
        rooms = '';
        parking = '';
        heating = '';
      }

      const nekretnina = {
        title: document.getElementById('title')?.value || '',
        type: type,
        location: document.getElementById('location')?.value || '',
        price: price,
        size: document.getElementById('size')?.value ? Number(document.getElementById('size').value) : null,
        rooms: rooms ? Number(rooms) : null,
        description: document.getElementById('description')?.value || '',
        yearBuilt: yearBuilt,
        parking: parking,
        heating: heating,
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


  // Funkcija za kreiranje pojedinačne kartice oglasa
  function createPropertyCard(data, docId) {
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
        <button class="btn btn-details" onclick="location.href='detalji.html?id=${docId}'">Više informacija</button>
      </div>
    `;

    return card;
  }

  // Funkcija za inicijalizaciju carousel funkcionalnosti
  function initializeCarousels() {
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
  }

  // Funkcija za prikaz oglasa na trenutnoj stranici
  function displayCurrentPage() {
    if (!propertyList) return;

    propertyList.innerHTML = '';

    if (allProperties.length === 0) {
      propertyList.innerHTML = '<p class="no-results">Nema pronađenih nekretnina.</p>';
      return;
    }

    const startIndex = (currentPage - 1) * propertiesPerPage;
    const endIndex = startIndex + propertiesPerPage;
    const currentProperties = allProperties.slice(startIndex, endIndex);

    currentProperties.forEach(property => {
      const card = createPropertyCard(property.data, property.id);
      propertyList.appendChild(card);
    });

    initializeCarousels();
  }

  // Funkcija za kreiranje pagination dugmića
  function createPagination() {
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (allProperties.length <= propertiesPerPage) return;

    const totalPages = Math.ceil(allProperties.length / propertiesPerPage);

    // Previous dugme
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = 'Prethodna';
      prevBtn.classList.add('pagination-btn');
      prevBtn.addEventListener('click', () => {
        currentPage--;
        displayCurrentPage();
        createPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      paginationContainer.appendChild(prevBtn);
    }

    // Brojevi stranica
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.classList.add('pagination-btn');
      
      if (i === currentPage) {
        pageBtn.classList.add('active');
      }

      pageBtn.addEventListener('click', () => {
        currentPage = i;
        displayCurrentPage();
        createPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationContainer.appendChild(pageBtn);
    }

    // Next dugme
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Sljedeća';
      nextBtn.classList.add('pagination-btn');
      nextBtn.addEventListener('click', () => {
        currentPage++;
        displayCurrentPage();
        createPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      paginationContainer.appendChild(nextBtn);
    }
  }

  // Funkcija za dohvat i prikaz oglasa na dashboardu s filtriranjem i pagination
  async function loadFilteredProperties(typeFilter,cityFilter, minPrice, maxPrice) {
    if (!propertyList) return;

    propertyList.innerHTML = '<p class="loading">Učitavanje nekretnina...</p>';
    if (paginationContainer) paginationContainer.innerHTML = '';

    try {
      const querySnapshot = await getDocs(collection(db, 'ads'));
      
      if (querySnapshot.empty) {
        propertyList.innerHTML = '<p class="no-results">Nema pronađenih nekretnina.</p>';
        allProperties = [];
        return;
      }

      // Filtriraj oglase
      allProperties = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Filtriraj po tipu ako je zadano
        if (typeFilter && typeFilter !== '' && data.type !== typeFilter) return;

        // Filtriraj po cijeni ako su zadane
        if (minPrice !== null && data.price < minPrice) return;
        if (maxPrice !== null && data.price > maxPrice) return;
        // Filtriraj po gradu (lokaciji) ako je zadano
        if (cityFilter && data.location?.toLowerCase().indexOf(cityFilter) === -1) return;

        allProperties.push({ data, id: doc.id });
      });

      // Reset na prvu stranicu nakon filtriranja
      currentPage = 1;
      
      // Prikaži oglase i pagination
      displayCurrentPage();
      createPagination();

    } catch (error) {
      propertyList.innerHTML = `<p class="error">Greška pri učitavanju: ${error.message}</p>`;
      allProperties = [];
    }
  }

  // Učitaj inicijalno sve oglase bez filtera
  loadFilteredProperties('','', null, null);

  // Dodaj event listener za filtriranje
  const filterBtn = document.getElementById('filterBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const typeFilter = document.getElementById('tipNekretnine').value;
      const minPriceInput = document.getElementById('minCijena').value;
      const maxPriceInput = document.getElementById('maxCijena').value;
      const cityFilter = document.getElementById('grad')?.value.trim().toLowerCase() || '';

      const minPrice = minPriceInput ? Number(minPriceInput) : null;
      const maxPrice = maxPriceInput ? Number(maxPriceInput) : null;

      loadFilteredProperties(typeFilter,cityFilter, minPrice, maxPrice);
    });
  }
});