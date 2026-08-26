import './public-i18n.js?v=20260812-gallery-nav-v2';
import { API_BASE as apiBase } from './api-config.js';
import { gallerySports } from './data/gallery-data.js?v=20260809-live-only';

const filters = document.querySelector('#gallery-filters');
const selectedId = new URLSearchParams(location.search).get('sport');
const selectedSport = (!selectedId || selectedId === 'all')
  ? { id:'all', name:'ALL', code:'ALL', accent:'#d4a32e' }
  : (gallerySports.find(item => item.id === selectedId) || gallerySports[0]);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const english = document.documentElement.lang === 'en';
window.addEventListener('publiclanguagechange', () => location.reload());

if (filters) {
  const all = `<a class="${!selectedId ? 'active' : ''}" href="gallery.html">ALL</a>`;
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

const momentsGrid = document.querySelector('#moments-grid');
if (momentsGrid) {
  document.title = `${selectedSport.name} Gallery — Bridgestone Cup BP 2026`;
  document.querySelector('#sport-gallery-title').textContent = `${selectedSport.name} MOMENTS`;
  document.querySelector('#footer-sport').textContent = selectedSport.name;
  momentsGrid.style.setProperty('--accent', selectedSport.accent);

  const payloadItems = await loadGallery(!selectedId || selectedId === 'all' ? '' : `?sportId=sport-${encodeURIComponent(selectedSport.id)}`);
  const moments = payloadItems.map((item, index) => ({ number:String(index + 1).padStart(2, '0'), title:item.mediaType === 'video' ? 'VIDEO TURNAMEN' : 'FOTO TURNAMEN', sport:selectedSport.name, mediaType:item.mediaType, imageUrl:item.publicUrl, alt:`${selectedSport.name} media` }));
  momentsGrid.dataset.source = moments.length ? 'api' : 'empty';
  const photoWord = moments.length === 1 ? 'MEDIA' : 'MEDIA';
  const momentWord = moments.length === 1 ? 'MOMENT' : 'MOMENTS';
  const photoCount = document.querySelector('#photo-count');
  if (photoCount) photoCount.textContent = `${moments.length} ${photoWord}`;
  document.querySelector('#archive-count').textContent = `${moments.length} ${momentWord} ARCHIVED`;
  document.querySelector('.gallery-heading>span').textContent = moments.length ? `${moments.length} tournament media — select any item to view it.` : 'Belum ada media yang dipublikasikan untuk cabang olahraga ini.';

  if (!moments.length) {
    momentsGrid.innerHTML = '<div class="gallery-empty-state"><strong>MEDIA BELUM TERSEDIA</strong></div>';
  } else {
    momentsGrid.innerHTML = moments.map((moment, index) => `<button class="moment-card live" style="--accent:${selectedSport.accent}" type="button" data-index="${index}" aria-label="Buka ${escapeHtml(moment.title)} ${moment.number}">${moment.mediaType === 'video' ? `<video src="${escapeHtml(moment.imageUrl)}" muted autoplay loop playsinline preload="metadata" aria-label="${escapeHtml(moment.alt)}"></video>` : `<img src="${escapeHtml(moment.imageUrl)}" alt="${escapeHtml(moment.alt)}">`}<span>${moment.number}</span><i>↗</i><div><small>${escapeHtml(moment.sport)}</small><strong>${escapeHtml(moment.title)}</strong></div></button>`).join('');
    const dialog = document.querySelector('#gallery-lightbox');
    const download = dialog.querySelector('#lightbox-download') || (() => { const link = document.createElement('a'); link.id = 'lightbox-download'; link.className = 'lightbox-download'; link.href = '#'; link.download = ''; link.setAttribute('aria-label', 'Unduh foto'); link.textContent = '↓'; dialog.append(link); return link; })();
    let activeIndex = 0;
    const paint = index => {
      activeIndex = (index + moments.length) % moments.length;
      const moment = moments[activeIndex];
      const downloadName = `bridgestone-cup-${selectedSport.id}-${moment.number}.${moment.mediaType === 'video' ? 'mp4' : 'jpg'}`;
      const downloadUrl = new URL(moment.imageUrl, location.href);
      downloadUrl.searchParams.set('download', '1');
      downloadUrl.searchParams.set('name', downloadName);
      download.href = downloadUrl.href;
      download.download = downloadName;
      const image = document.querySelector('#lightbox-photo');
      const existingVideo = document.querySelector('#lightbox-video');
      image.hidden = moment.mediaType === 'video';
      if (moment.mediaType === 'video') { existingVideo.src = moment.imageUrl; existingVideo.hidden = false; existingVideo.load(); } else { existingVideo.hidden = true; existingVideo.pause(); existingVideo.removeAttribute('src'); image.src = moment.imageUrl; image.alt = moment.alt; }
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
