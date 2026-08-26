import { sports } from '../data/home-data.js?v=20260809-live-only';

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const emptySection = title => `<div class="home-empty-state"><strong>${title}</strong></div>`;
let exhibitionTimers = [];
let galleryCollageTimers = [];
const greetingCard = (item, index, photoUrls) => { const english = document.documentElement.lang === 'en'; const message = english ? (item.messageEn || item.message || item.messageId) : (item.messageId || item.message); const title = item.name || (english ? 'A shared start to the competition' : 'Awal kebersamaan menuju kompetisi'); const slides = photoUrls.length ? photoUrls : ['assets/images/portrait-head.svg']; const slideMarkup = slides.map((url, slideIndex) => `<img class="exhibition-slide${slideIndex === 0 ? ' active' : ''}" src="${escapeHtml(url)}" alt="${english ? 'Exhibition match photo' : 'Foto exhibition match'}"${slideIndex ? ' aria-hidden="true"' : ''}>`).join(''); return `<article class="greeting-card exhibition-card" data-title="${escapeHtml(title)}" data-message="${escapeHtml(message)}"><div class="exhibition-copy"><small>BRIDGESTONE CUP BP 2026</small><span>EXHIBITION MATCH ${String(index + 1).padStart(2, '0')}</span><h3 class="exhibition-title" aria-live="polite"></h3><p class="exhibition-type" aria-live="polite"></p><b>${escapeHtml(english ? (item.roleEn || item.role || item.roleId || 'Bridgestone Cup Family') : (item.roleId || item.role || 'Keluarga Bridgestone Cup'))}</b></div><div class="exhibition-photo" data-slide-count="${slides.length}">${slideMarkup}<i>PHOTO STORY</i><em>${String(index + 1).padStart(2, '0')}</em></div></article>`; };

function startExhibitionMotion() {
  exhibitionTimers.forEach(timer => clearInterval(timer)); exhibitionTimers = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loopTypewriter = (titleElement, descriptionElement, titleText, descriptionText) => {
    titleElement.textContent = titleText;
    if (reduced) { descriptionElement.textContent = descriptionText; return; }
    let phase = 'description', cursor = 0, pause = 0;
    const timer = setInterval(() => {
      descriptionElement.classList.toggle('typing-active', phase === 'description' || phase === 'hold' || phase === 'deleteDescription');
      if (pause > 0) { pause -= 1; return; }
      if (phase === 'description') { cursor += 1; descriptionElement.textContent = descriptionText.slice(0, cursor); if (cursor >= descriptionText.length) { phase = 'hold'; pause = 364; } }
      else if (phase === 'hold') { phase = 'deleteDescription'; cursor = descriptionText.length; }
      else if (phase === 'deleteDescription') { cursor -= 1; descriptionElement.textContent = descriptionText.slice(0, cursor); if (cursor <= 0) { phase = 'between'; pause = 5; } }
      else if (phase === 'between') { phase = 'description'; cursor = 0; descriptionElement.textContent = ''; }
    }, 55);
    exhibitionTimers.push(timer);
  };
  document.querySelectorAll('.exhibition-card').forEach(card => {
    const title = card.querySelector('.exhibition-title');
    const titleText = card.dataset.title || '';
    const message = card.dataset.message || '';
    const type = card.querySelector('.exhibition-type');
    loopTypewriter(title, type, titleText, message);
    if (reduced) return;
    const slides = [...card.querySelectorAll('.exhibition-slide')]; if (slides.length < 2) return;
    let active = 0; exhibitionTimers.push(setInterval(() => { slides[active].classList.remove('active'); active = (active + 1) % slides.length; slides[active].classList.add('active'); }, 3000));
  });
}

export function renderGreetings(items = [], source = 'empty') {
  const list = document.querySelector('#greeting-list');
  list.dataset.source = source;
  const exhibitionItems = items.slice(0, 3);
  const photoUrls = items.map(item => item.photoUrl).filter(Boolean);
  list.innerHTML = exhibitionItems.length
    ? exhibitionItems.map((item, index) => greetingCard(item, index, item.photoUrls?.length ? item.photoUrls : (item.photoUrl ? [item.photoUrl] : []))).join('')
    : emptySection('LOADING…');
  if (exhibitionItems.length) startExhibitionMotion();
}

const supporterImages = {
  'PRODUCTION TEAM':'assets/images/support-production.png',
  'QA TEAM':'assets/images/support-qa.png',
  'MAINTENANCE TEAM':'assets/images/support-maintenance.png',
};

export function renderSupporters(items = [], source = 'empty') {
  const list = document.querySelector('#support-list');
  list.dataset.source = source;
  list.innerHTML = items.length
    ? items.map(item => {
      const team = String(item.team || 'OTHER TEAM').trim().replace(/\s+/g, ' ').toUpperCase();
      const count = Number(item.count) || 0;
      return `<article><b>${item.rank}</b><img src="${supporterImages[team] || 'assets/images/support-icon.png'}" alt=""><h4>${escapeHtml(team)}</h4><p>${count} Support Card${count === 1 ? '' : 's'}</p></article>`;
    }).join('')
    : emptySection('LEADERBOARD BELUM TERSEDIA');
}

const sportLinks = {
  BADMINTON: 'pages/badminton.html',
  FUTSAL: 'pages/futsal.html',
  CHESS: 'pages/chess.html',
  'TABLE TENNIS': 'pages/table-tennis.html',
  FOOTBALL: 'pages/football.html',
  FISHING: 'pages/fishing.html',
};
const scheduleLinks = Object.fromEntries(Object.entries(sportLinks).map(([name, url]) => [name, `${url}#schedule`]));

const emptyScheduleCard = sport => sport.name === 'FISHING'
  ? `<a class="schedule-card fishing" data-source="event" href="${sportLinks.FISHING}"><header><span>${sport.code}</span><h3>${sport.name}</h3></header><div class="fishing-panel"><time><b>30</b><small>AGUSTUS</small></time><label>LOKASI</label><p>N/A</p><label>WAKTU</label><strong>--:-- WIB</strong></div><div class="final-event">FINAL EVENT<br>Timbang hasil tangkapan</div></a>`
  : `<a class="schedule-card schedule-card-empty" data-source="empty" href="${scheduleLinks[sport.name] || '#sports'}"><header><span>${sport.code}</span><h3>${sport.name}</h3></header><div class="schedule-empty"><strong>JADWAL BELUM TERSEDIA</strong></div></a>`;

const liveScheduleCard = (sport, matches) => `<a class="schedule-card" data-source="api" href="${scheduleLinks[sport.name] || '#sports'}"><header><span>${sport.code}</span><h3>${sport.name}</h3></header><div class="schedule-rows">${matches.map((match, index) => {
  const scheduledAt = new Date(match.scheduledAt);
  const day = new Intl.DateTimeFormat('id-ID', { day:'2-digit', timeZone:'Asia/Jakarta' }).format(scheduledAt);
  const month = new Intl.DateTimeFormat('id-ID', { month:'short', timeZone:'Asia/Jakarta' }).format(scheduledAt).replace('.', '').toUpperCase();
  const time = new Intl.DateTimeFormat('id-ID', { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Jakarta' }).format(scheduledAt).replace('.', ':');

  const homeTeam = match.homeParticipant?.name || match.teamA || '';
  const awayTeam = match.awayParticipant?.name || match.teamB || '';
  
  const versusText = (homeTeam && awayTeam) 
    ? `<strong class="schedule-teams">${escapeHtml(homeTeam)} <small>VS</small> ${escapeHtml(awayTeam)}</strong>` 
    : '';

  return `<div class="schedule-row${index === 0 ? ' current' : ''}">
    <time datetime="${escapeHtml(match.scheduledAt)}"><b>${day}</b><small>${month}</small></time>
    <p>
      ${match.competitionCategory ? `<em class="schedule-category">${escapeHtml(match.competitionCategory)}</em>` : ''}
      ${versusText}
      <small>${escapeHtml(match.venue || 'Venue menunggu')}</small>
      <small>${time} WIB</small>
    </p>
  </div>`;
}).join('')}</div></a>`;

export function renderSchedules(scheduleBySport = {}) {
  const list = document.querySelector('#schedule-list');
  list.innerHTML = sports.map(sport => {
    const matches = scheduleBySport[sport.name] || [];
    return matches.length ? liveScheduleCard(sport, matches) : emptyScheduleCard(sport);
  }).join('');
}

const sportCard = (sport, index, counts = {}) => `<a class="sport-card" data-source="${counts[sport.name] ? 'api' : 'empty'}" href="${sportLinks[sport.name] || '#sports'}" aria-label="Buka ${sport.name}"><img src="assets/images/card-ornament.svg" alt=""><small>0${index + 1}</small><i></i><h3>${sport.name}</h3><b>${escapeHtml(counts[sport.name] || 'DATA MENUNGGU')}</b></a>`;

export function renderSports(counts = {}) {
  document.querySelector('#sports-list').innerHTML = sports.map((sport, index) => sportCard(sport, index, counts)).join('');
}

const hourlyGalleryRandom = hourBucket => {
  let seed = Number(hourBucket) >>> 0;
  seed ^= 0x9e3779b9;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export function renderGalleryPreview(items = [], source = 'empty', hourBucket = Math.floor(Date.now() / 3600000)) {
  const list = document.querySelector('#gallery-list');
  list.dataset.source = source;
  galleryCollageTimers.forEach(timer => clearInterval(timer)); galleryCollageTimers = [];
  const itemsBySport = new Map();
  items.forEach(item => {
    const classification = item.sportId || 'all';
    if (!itemsBySport.has(classification)) itemsBySport.set(classification, []);
    itemsBySport.get(classification).push(item);
  });
  const random = hourlyGalleryRandom(hourBucket);
  const sportGroups = [...itemsBySport.entries()]
    .sort(([sportA], [sportB]) => String(sportA).localeCompare(String(sportB)))
    .map(([sportId, sportItems]) => [sportId, [...sportItems].sort((itemA, itemB) => String(itemA.id || itemA.publicUrl).localeCompare(String(itemB.id || itemB.publicUrl)))]);
  for (let index = sportGroups.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [sportGroups[index], sportGroups[randomIndex]] = [sportGroups[randomIndex], sportGroups[index]];
  }
  const allItems = sportGroups.flatMap(([, sportItems]) => sportItems);
  const shuffledItems = [...allItems];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }
  const collageItems = shuffledItems.slice(0, 28);
  list.dataset.count = String(collageItems.length);
  list.closest('#gallery')?.setAttribute('data-gallery-count', String(collageItems.length));
  if (!collageItems.length) {
    list.innerHTML = '<article class="gallery-preview-empty"><strong>FOTO BELUM TERSEDIA</strong></article>';
    return;
  }
  const collageAlt = item => document.documentElement.lang === 'en'
    ? (item.altEn || item.altId || 'Tournament moment')
    : (item.altId || 'Momen turnamen');
  const backgroundTiles = collageItems.map((item, index) => `<a class="gallery-collage-tile" href="${item.sportId ? `pages/gallery-sport.html?sport=${encodeURIComponent(String(item.sportId).replace(/^sport-/, ''))}` : 'pages/gallery.html'}" aria-label="${escapeHtml(collageAlt(item))}"><img src="${escapeHtml(item.publicUrl)}" alt="" loading="lazy"></a>`).join('');
  const featuredItems = collageItems.slice(0, Math.min(5, collageItems.length));
  const featuredTiles = featuredItems.map((item, index) => `<a class="gallery-collage-feature${index === 0 ? ' is-active' : ''}" href="${item.sportId ? `pages/gallery-sport.html?sport=${encodeURIComponent(String(item.sportId).replace(/^sport-/, ''))}` : 'pages/gallery.html'}"><img src="${escapeHtml(item.publicUrl)}" alt="${escapeHtml(collageAlt(item))}" loading="lazy"><span>${String(index + 1).padStart(2, '0')}</span></a>`).join('');
  list.innerHTML = `<div class="gallery-collage" aria-label="${document.documentElement.lang === 'en' ? 'Tournament photo collage' : 'Kolase foto turnamen'}"><div class="gallery-collage-wall">${backgroundTiles}</div><div class="gallery-collage-features">${featuredTiles}</div></div>`;
  if (featuredItems.length < 2) return;
  let activeFeature = 0;
  let activeBackground = Math.floor(random() * collageItems.length);
  const rotateCollage = () => {
    const features = [...list.querySelectorAll('.gallery-collage-feature')];
    const tiles = [...list.querySelectorAll('.gallery-collage-tile')];
    features[activeFeature]?.classList.remove('is-active');
    tiles[activeBackground]?.classList.remove('is-highlighted');
    activeFeature = Math.floor(random() * features.length);
    activeBackground = Math.floor(random() * tiles.length);
    features[activeFeature]?.classList.add('is-active');
    tiles[activeBackground]?.classList.add('is-highlighted');
  };
  galleryCollageTimers.push(setInterval(rotateCollage, 3200));
}

export function renderHome(exhibitionItems = []) {
  renderGreetings(exhibitionItems);
  renderSchedules();
  renderSports();
  renderGalleryPreview();
  renderSupporters();
}
