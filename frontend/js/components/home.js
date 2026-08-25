import { sports } from '../data/home-data.js?v=20260809-live-only';

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const emptySection = title => `<div class="home-empty-state"><strong>${title}</strong></div>`;
let exhibitionTimers = [];
const greetingCard = (item, index, photoUrls) => { const english = document.documentElement.lang === 'en'; const message = english ? (item.messageEn || item.message || item.messageId) : (item.messageId || item.message); const slides = photoUrls.length ? photoUrls : ['assets/images/portrait-head.svg']; const slideMarkup = slides.map((url, slideIndex) => `<img class="exhibition-slide${slideIndex === 0 ? ' active' : ''}" src="${escapeHtml(url)}" alt="${english ? 'Exhibition match photo' : 'Foto exhibition match'}"${slideIndex ? ' aria-hidden="true"' : ''}>`).join(''); return `<article class="greeting-card exhibition-card" data-message="${escapeHtml(message)}"><div class="exhibition-copy"><small>BRIDGESTONE CUP BP 2026</small><span>EXHIBITION MATCH ${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(english ? 'A shared start to the competition' : 'Awal kebersamaan menuju kompetisi')}</h3><p class="exhibition-type" aria-live="polite"></p><b>${escapeHtml(english ? (item.roleEn || item.role || item.roleId || 'Bridgestone Cup Family') : (item.roleId || item.role || 'Keluarga Bridgestone Cup'))}</b></div><div class="exhibition-photo" data-slide-count="${slides.length}">${slideMarkup}<i>PHOTO STORY</i><em>${String(index + 1).padStart(2, '0')}</em></div></article>`; };

function startExhibitionMotion() {
  exhibitionTimers.forEach(timer => clearInterval(timer)); exhibitionTimers = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.exhibition-card').forEach(card => {
    const message = card.dataset.message || '';
    const type = card.querySelector('.exhibition-type');
    if (reduced) type.textContent = message;
    else { type.textContent = ''; let cursor = 0; const typeTimer = setInterval(() => { type.textContent = message.slice(0, cursor += 1); if (cursor >= message.length) clearInterval(typeTimer); }, 28); exhibitionTimers.push(typeTimer); }
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
    ? exhibitionItems.map((item, index) => greetingCard(item, index, photoUrls)).join('')
    : emptySection('GREETING BELUM TERSEDIA');
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
  const itemsBySport = new Map();
  items.filter(item => item.sportId).forEach(item => {
    if (!itemsBySport.has(item.sportId)) itemsBySport.set(item.sportId, []);
    itemsBySport.get(item.sportId).push(item);
  });
  const random = hourlyGalleryRandom(hourBucket);
  const sportGroups = [...itemsBySport.entries()]
    .sort(([sportA], [sportB]) => String(sportA).localeCompare(String(sportB)))
    .map(([sportId, sportItems]) => [sportId, [...sportItems].sort((itemA, itemB) => String(itemA.id || itemA.publicUrl).localeCompare(String(itemB.id || itemB.publicUrl)))]);
  for (let index = sportGroups.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [sportGroups[index], sportGroups[randomIndex]] = [sportGroups[randomIndex], sportGroups[index]];
  }
  const selectedItems = sportGroups.slice(0, 3).map(([, sportItems]) => sportItems[Math.floor(random() * sportItems.length)]);
  list.dataset.count = String(selectedItems.length);
  list.closest('#gallery')?.setAttribute('data-gallery-count', String(selectedItems.length));
  if (!selectedItems.length) {
    list.innerHTML = '<article class="gallery-preview-empty"><strong>FOTO BELUM TERSEDIA</strong></article>';
    return;
  }
  const cards = selectedItems.map((item, index) => {
    const slug = String(item.sportId || '').replace(/^sport-/, '');
    const english = document.documentElement.lang === 'en';
    const title = english ? (item.titleEn || item.titleId || 'TOURNAMENT MOMENT') : (item.titleId || 'MOMEN TURNAMEN');
    const link = slug ? `pages/gallery-sport.html?sport=${encodeURIComponent(slug)}` : 'pages/gallery.html';
    return `<a href="${link}"><article class="live"><img src="${escapeHtml(item.publicUrl)}" alt="${escapeHtml(english ? (item.altEn || item.altId || title) : (item.altId || title))}"><small>0${index + 1}</small><h3>${escapeHtml(title)}</h3></article></a>`;
  });
  list.innerHTML = cards.join('');
}

export function renderHome(exhibitionItems = []) {
  renderGreetings(exhibitionItems);
  renderSchedules();
  renderSports();
  renderGalleryPreview();
  renderSupporters();
}
