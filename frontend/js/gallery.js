import './public-i18n.js?v=20260812-gallery-nav-v2';
import { API_BASE as apiBase } from './api-config.js';
import { gallerySports } from './data/gallery-data.js?v=20260809-live-only';

const filters = document.querySelector('#gallery-filters');
const selectedId = new URLSearchParams(location.search).get('sport');
const selectedSport = gallerySports.find(item => item.id === selectedId) || gallerySports[0];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const english = document.documentElement.lang === 'en';
window.addEventListener('publiclanguagechange', () => location.reload());

if (filters) {
  const all = `<a class="${document.querySelector('#collection-grid') ? 'active' : ''}" href="gallery.html">ALL</a>`;
  const sports = gallerySports.map(sport => `<a class="${sport.id === selectedId ? 'active' : ''}" href="gallery-sport.html?sport=${sport.id}">${sport.name}</a>`).join('');
  const video = '<a class="gallery-video-link" href="https://drive.google.com/drive/folders/1VaQ7tqffTW3U4CJslgH-LlO7anHGg8Hy?usp=drive_link" target="_blank" rel="noopener noreferrer">VIDEO <span aria-hidden="true">↗</span></a>';
  filters.innerHTML = all + sports + video;
}

async function loadGallery(path = '') {
  if (!apiBase) return [];
  try {
    const response = await fetch(`${apiBase}/gallery${path}`, { signal:AbortSignal.timeout(5000) });
    const payload = await response.json();
    return response.ok && Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

const collectionGrid = document.querySelector('#collection-grid');
if (collectionGrid) {
  const publishedItems = await loadGallery();
  collectionGrid.dataset.source = publishedItems.length ? 'api' : 'empty';
  collectionGrid.innerHTML = gallerySports.map((sport, index) => {
    const sportItems = publishedItems.filter(item => item.sportId === `sport-${sport.id}`);
    const featured = sportItems.length ? sportItems[Math.floor(Math.random() * sportItems.length)] : null;
    const count = sportItems.length;
    const photoWord = english ? (count === 1 ? 'PHOTO' : 'PHOTOS') : 'FOTO';
    const title = english ? (featured?.titleEn || featured?.titleId) : featured?.titleId;
    const alt = english ? (featured?.altEn || featured?.altId || title || `Photo of ${sport.name}`) : (featured?.altId || title || `Foto ${sport.name}`);
    return `<a class="collection-card${featured ? ' live' : ' empty'}" style="--accent:${sport.accent}" href="gallery-sport.html?sport=${sport.id}">${featured ? `<img src="${escapeHtml(featured.publicUrl)}" alt="${escapeHtml(alt)}">` : ''}<small>${String(index + 1).padStart(2, '0')}</small><span class="sport-code">${sport.code}</span><div><h2>${sport.name} ${english ? 'GALLERY' : 'GALERI'}</h2><p>${count ? `${english ? 'OPEN COLLECTION' : 'BUKA KOLEKSI'} &middot; ${count} ${photoWord}` : (english ? 'PHOTO NOT AVAILABLE' : 'FOTO BELUM TERSEDIA')}</p><b>&rarr;</b></div></a>`;
  }).join('');
}

const momentsGrid = document.querySelector('#moments-grid');
if (momentsGrid) {
  document.title = `${selectedSport.name} Gallery — Bridgestone Cup BP 2026`;
  document.querySelector('#sport-gallery-title').textContent = `${selectedSport.name} MOMENTS`;
  document.querySelector('#footer-sport').textContent = selectedSport.name;
  momentsGrid.style.setProperty('--accent', selectedSport.accent);

  const payloadItems = await loadGallery(`?sportId=sport-${encodeURIComponent(selectedSport.id)}`);
  const moments = payloadItems.map((item, index) => ({ number:String(index + 1).padStart(2, '0'), title:english ? (item.titleEn || item.titleId || `${selectedSport.name} TOURNAMENT MOMENT`) : (item.titleId || `${selectedSport.name} MOMEN TURNAMEN`), sport:selectedSport.name, imageUrl:item.publicUrl, alt:english ? (item.altEn || item.altId || item.titleEn || item.titleId || `Photo of ${selectedSport.name}`) : (item.altId || item.titleId || `Foto ${selectedSport.name}`) }));
  momentsGrid.dataset.source = moments.length ? 'api' : 'empty';
  const photoWord = moments.length === 1 ? 'PHOTO' : 'PHOTOS';
  const momentWord = moments.length === 1 ? 'MOMENT' : 'MOMENTS';
  const photoCount = document.querySelector('#photo-count');
  if (photoCount) photoCount.textContent = `${moments.length} ${photoWord}`;
  document.querySelector('#archive-count').textContent = `${moments.length} ${momentWord} ARCHIVED`;
  document.querySelector('.gallery-heading>span').textContent = moments.length ? `${moments.length} tournament ${photoWord.toLowerCase()} — select any image to view the full moment.` : 'Belum ada foto yang dipublikasikan untuk cabang olahraga ini.';

  if (!moments.length) {
    momentsGrid.innerHTML = '<div class="gallery-empty-state"><strong>FOTO BELUM TERSEDIA</strong></div>';
  } else {
    momentsGrid.innerHTML = moments.map((moment, index) => `<button class="moment-card live" style="--accent:${selectedSport.accent}" type="button" data-index="${index}" aria-label="Buka ${escapeHtml(moment.title)} ${moment.number}"><img src="${escapeHtml(moment.imageUrl)}" alt="${escapeHtml(moment.alt)}"><span>${moment.number}</span><i>↗</i><div><small>${escapeHtml(moment.sport)}</small><strong>${escapeHtml(moment.title)}</strong></div></button>`).join('');
    const dialog = document.querySelector('#gallery-lightbox');
    let activeIndex = 0;
    const paint = index => {
      activeIndex = (index + moments.length) % moments.length;
      const moment = moments[activeIndex];
      const image = document.querySelector('#lightbox-photo');
      image.src = moment.imageUrl;
      image.alt = moment.alt;
      image.hidden = false;
      document.querySelector('#lightbox-number').hidden = true;
      document.querySelector('#lightbox-sport').textContent = moment.sport;
      document.querySelector('#lightbox-title').textContent = moment.title;
      document.querySelector('#lightbox-image').style.setProperty('--accent', selectedSport.accent);
    };
    momentsGrid.addEventListener('click', event => { const card = event.target.closest('.moment-card'); if (!card) return; paint(Number(card.dataset.index)); dialog.showModal(); });
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.previous').addEventListener('click', () => paint(activeIndex - 1));
    dialog.querySelector('.next').addEventListener('click', () => paint(activeIndex + 1));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
}
