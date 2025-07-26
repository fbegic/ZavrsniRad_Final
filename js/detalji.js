import { db } from './app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const SUPABASE_URL = 'https://hvfonsxtrhzayhadlrxo.supabase.co';
const SUPABASE_ANON_KEY = 'tK1-QZ7QVTxEV2AnZJJK3Gvk39iQgF1AJUzAfGj7AGE';  // stavi svoj ključ
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadPropertyDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('propertyDetails');

  if (!id) {
    container.innerHTML = '<p>Nekretnina nije pronađena.</p>';
    return;
  }

  try {
    const docRef = doc(db, 'ads', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      container.innerHTML = '<p>Nekretnina nije pronađena.</p>';
      return;
    }

    const data = docSnap.data();

    // Carousel slika
    let imagesHtml = '';
    if (data.images && data.images.length > 0) {
      imagesHtml = `
        <div class="carousel" style="max-width: 600px; margin: auto;">
          ${data.images.map((url, i) => `
            <img
              src="${url}"
              alt="Slika nekretnine"
              class="carousel-image"
              style="display: ${i === 0 ? 'block' : 'none'}; width: 100%; border-radius: 5px;"
            >
          `).join('')}
          <button class="carousel-prev">&#10094;</button>
          <button class="carousel-next">&#10095;</button>
        </div>
      `;
    } else {
      imagesHtml = `<img src="images/placeholder.png" alt="Nema slike" style="width: 100%; border-radius: 5px;">`;
    }

    // Mapa (Google Maps embed)
    const mapHtml = `
      <iframe
        width="100%"
        height="300"
        frameborder="0"
        style="border:0; margin-top: 1rem;"
        src="https://www.google.com/maps?q=${encodeURIComponent(data.location)}&output=embed"
        allowfullscreen>
      </iframe>
    `;

    container.innerHTML = `
  ${imagesHtml}
  <h2 style="margin-top: 1rem;">${data.title || 'Nema naslova'}</h2>
  <p><strong>Tip:</strong> ${data.type || '-'}</p>
  <p><strong>Lokacija:</strong> ${data.location || '-'}</p>
  <p><strong>Cijena:</strong> ${data.price ? data.price + ' €' : '-'}</p>
  <p><strong>Broj soba:</strong> ${data.rooms || '-'}</p>
  <p><strong>Godina izgradnje:</strong> ${data.yearBuilt || '-'}</p>
  <p><strong>Parking:</strong> ${data.parking || '-'}</p>
  <p><strong>Grijanje:</strong> ${data.heating || '-'}</p>

  <h3 style="margin-top: 1.5rem;">Detaljniji opis:</h3>
  <p>${data.description || ''}</p>

  <h3>Lokacija na karti</h3>
  ${mapHtml}

  <h3>Kontakt</h3>
  <p>Za više informacija kontaktirajte nas na: 
    <a href="mailto:${data.contact || 'info@nekretnine.hr'}">
      ${data.contact || 'info@nekretnine.hr'}
    </a>
  </p>
`;


    // Carousel logika
    let currentIndex = 0;
    const carousel = container.querySelector('.carousel');
    if (carousel) {
      const images = carousel.querySelectorAll('.carousel-image');
      const prevBtn = carousel.querySelector('.carousel-prev');
      const nextBtn = carousel.querySelector('.carousel-next');

      function showImage(index) {
        images.forEach((img, i) => {
          img.style.display = i === index ? 'block' : 'none';
        });
      }

      prevBtn.addEventListener('click', () => {
        currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        showImage(currentIndex);
      });

      nextBtn.addEventListener('click', () => {
        currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        showImage(currentIndex);
      });
    }

  } catch (error) {
    container.innerHTML = `<p>Greška pri dohvaćanju podataka: ${error.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadPropertyDetails);
