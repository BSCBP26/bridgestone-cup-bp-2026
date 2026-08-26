import './public-i18n.js?v=20260821-live-bracket-counts';
import { API_BASE as apiBase } from './api-config.js';
import { exhibitionDemo } from './data/home-data.js?v=20260825-exhibition-demo-v2';
import { renderGalleryPreview, renderHome, renderGreetings, renderSchedules, renderSports, renderSupporters } from './components/home.js?v=20260826-gallery-collage-v3';

const exhibitionDemoMode = new URLSearchParams(location.search).has('exhibitionDemo');
renderHome(exhibitionDemoMode ? exhibitionDemo : []);

const scheduleTournaments = {
  FUTSAL:'futsal-bp-2026',
  CHESS:'chess-bp-2026',
  BADMINTON:'badminton-bp-2026',
  'TABLE TENNIS':'table-tennis-bp-2026',
  FOOTBALL:'football-bp-2026',
};

const categorizedScheduleTournaments = {
  BADMINTON: [
    { tournamentId: 'badminton-singles-bp-2026', category: 'SINGLES' },
    { tournamentId: 'badminton-bp-2026', category: 'DOUBLES / GANDA' },
  ],
  'TABLE TENNIS': [
    { tournamentId: 'table-tennis-bp-2026', category: 'SINGLES' },
    { tournamentId: 'table-tennis-doubles-bp-2026', category: 'DOUBLES / GANDA' },
  ],
};

async function loadTournamentSchedule(tournamentId, category = '') {
  try {
    const response = await fetch(`${apiBase}/tournaments/${tournamentId}/matches?scheduledOnly=true`);
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.success ? payload.data.map(match => ({ ...match, competitionCategory: category })) : [];
  } catch { return []; }
}

async function loadCategorizedSchedule(sport) {
  const matches = await Promise.all(categorizedScheduleTournaments[sport].map(({ tournamentId, category }) => (
    loadTournamentSchedule(tournamentId, category)
  )));
  return [sport, matches.flat().sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))];
}

if (apiBase) {
  Promise.all(Object.entries(scheduleTournaments).map(([sport, tournamentId]) => {
    if (categorizedScheduleTournaments[sport]) return loadCategorizedSchedule(sport);
    return loadTournamentSchedule(tournamentId).then(matches => [sport, matches]);
  })).then(entries => renderSchedules(Object.fromEntries(entries)));

  fetch(`${apiBase}/exhibition-matches`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(payload => {
      if (payload.data?.length && !exhibitionDemoMode) { latestGreetings = payload.data; renderGreetings(latestGreetings, 'api'); }
    })
    .catch(() => {});

  fetch(`${apiBase}/gallery`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(payload => { latestGallery = payload.data || []; renderGalleryPreview(latestGallery, latestGallery.length ? 'api' : 'empty'); })
    .catch(() => {});

  const loadJson = async path => {
    const response = await fetch(`${apiBase}${path}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  };
  const loadBracketTotal = async tournamentId => {
    const response = await fetch(`${apiBase}/tournaments/${tournamentId}/bracket`);
    if (response.status === 404) return 0;
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const payload = await response.json();
    return Number(payload.data?.participantCount || 0);
  };
  const loadActiveCategories = sport => loadJson(`/sports/${sport}/competition-categories`)
    .then(payload => payload.data?.activeCategories || []);
  const categoryCount = (activeCategories, singles, doubles) => {
    const parts = [];
    if (activeCategories.includes('singles')) parts.push(`${singles} SINGLE`);
    if (activeCategories.includes('doubles')) parts.push(`${doubles} GANDA`);
    return parts.join(' • ');
  };

  Promise.allSettled([
    loadBracketTotal('futsal-bp-2026'),
    loadBracketTotal('chess-bp-2026'),
    Promise.all([
      loadActiveCategories('badminton'),
      loadBracketTotal('badminton-singles-bp-2026'),
      loadBracketTotal('badminton-bp-2026'),
    ]),
    Promise.all([
      loadActiveCategories('table-tennis'),
      loadBracketTotal('table-tennis-bp-2026'),
      loadBracketTotal('table-tennis-doubles-bp-2026'),
    ]),
    loadBracketTotal('football-bp-2026'),
    loadJson('/tournaments/fishing-bp-2026/pairs').then(payload => Number(payload.data?.length || 0)),
  ]).then(([futsal, chess, badminton, tableTennis, football, fishing]) => {
    const counts = {};
    if (futsal.status === 'fulfilled') counts.FUTSAL = `${futsal.value} TIM`;
    if (chess.status === 'fulfilled') counts.CHESS = `${chess.value} PESERTA`;
    if (badminton.status === 'fulfilled') {
      const [activeCategories, singles, doubles] = badminton.value;
      counts.BADMINTON = categoryCount(activeCategories, singles, doubles) || '0 PESERTA';
    }
    if (tableTennis.status === 'fulfilled') {
      const [activeCategories, singles, doubles] = tableTennis.value;
      counts['TABLE TENNIS'] = categoryCount(activeCategories, singles, doubles) || '0 PESERTA';
    }
    if (football.status === 'fulfilled') counts.FOOTBALL = `${football.value} TIM`;
    if (fishing.status === 'fulfilled') counts.FISHING = `${fishing.value} PASANGAN`;
    renderSports(counts);
  });
}

let latestAnnouncement = null;
const announcementBanner = document.querySelector('#announcement-banner');
const announcementTitle = document.querySelector('#announcement-title');
const announcementBody = document.querySelector('#announcement-body');
const announcementClose = document.querySelector('#announcement-close');
const dismissalKey = announcement => `bridgestone_announcement_dismissed_${announcement.id}`;
const renderAnnouncement = () => {
  if (!latestAnnouncement) return;
  const english = document.documentElement.lang === 'en';
  announcementTitle.textContent = english ? (latestAnnouncement.titleEn || latestAnnouncement.titleId) : latestAnnouncement.titleId;
  announcementBody.textContent = english ? (latestAnnouncement.bodyEn || latestAnnouncement.bodyId) : latestAnnouncement.bodyId;
  announcementBanner.hidden = sessionStorage.getItem(dismissalKey(latestAnnouncement)) === 'true';
  announcementBanner.dataset.source = 'api';
};
announcementClose.addEventListener('click', () => {
  if (latestAnnouncement) sessionStorage.setItem(dismissalKey(latestAnnouncement), 'true');
  announcementBanner.hidden = true;
});
if (apiBase) {
  fetch(`${apiBase}/announcements`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(payload => {
      if (payload.data?.length) {
        latestAnnouncement = payload.data[0];
        renderAnnouncement();
      }
    })
    .catch(() => {});
}

const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const updateHeaderState = () => header.classList.toggle('is-scrolled', window.scrollY > 32);
window.addEventListener('scroll', updateHeaderState, { passive:true });
updateHeaderState();
toggle.addEventListener('click', () => {
  const open = header.classList.toggle('nav-open');
  toggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => {
  header.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
}));
const sections = [...document.querySelectorAll('main > section')];
const links = [...document.querySelectorAll('#main-nav a')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
}), { rootMargin:'-35% 0px -55%' });
sections.forEach(section => observer.observe(section));

// Restrained entrance motion keeps the public homepage lively without
// changing its content hierarchy. Content remains visible without JavaScript.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('motion-ready');
  document.querySelectorAll('main > section').forEach((section, sectionIndex) => {
    const dust = document.createElement('div');
    dust.className = 'ambient-dust';
    dust.setAttribute('aria-hidden', 'true');
    dust.innerHTML = Array.from({ length: 14 }, (_, index) => {
      const x = (index * 37 + sectionIndex * 19) % 96;
      const y = (index * 23 + sectionIndex * 31) % 90;
      const size = 2 + (index % 3);
      const delay = -((index * 1.17 + sectionIndex) % 8);
      const duration = 6 + (index % 5) * 1.4;
      return `<i style="--x:${x}%;--y:${y}%;--size:${size}px;--delay:${delay}s;--duration:${duration}s"></i>`;
    }).join('');
    section.prepend(dust);
    if (!section.classList.contains('hero')) {
      const anniversaryArtwork = {
        greetings: ['from-generation.webp', 'brand-motto-wide'],
        schedule: ['drive-growth.webp', 'brand-motto-wide'],
        sports: ['e8-commitment.webp', 'brand-emblem-round'],
        gallery: ['bridgestone-50th.webp', 'brand-emblem-tall'],
        support: ['bridgestone-gold.webp', 'brand-motto-wide'],
      }[section.id];
      if (anniversaryArtwork) {
        const brandArtwork = document.createElement('div');
        brandArtwork.className = `section-brand-art ${anniversaryArtwork[1]}`;
        brandArtwork.setAttribute('aria-hidden', 'true');
        brandArtwork.innerHTML = `<img src="assets/images/anniversary/${anniversaryArtwork[0]}" alt="">`;
        section.prepend(brandArtwork);
      }
      const tread = document.createElement('div');
      tread.className = 'moving-tread';
      tread.setAttribute('aria-hidden', 'true');
      section.prepend(tread);
      const tireMark = document.createElement('div');
      tireMark.className = 'section-tire-mark';
      tireMark.setAttribute('aria-hidden', 'true');
      tireMark.innerHTML = '<div class="tire-sidewall"><i></i><i></i><i></i></div><div class="alloy-rim"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></div><svg class="tire-brand-arc" viewBox="0 0 610 610"><defs><path id="tire-brand-path-' + sectionIndex + '" d="M 72 315 A 233 233 0 0 1 538 315"/></defs><text><textPath href="#tire-brand-path-' + sectionIndex + '" startOffset="50%" text-anchor="middle">BRIDGESTONE · 50TH ANNIVERSARY</textPath></text></svg>';
      section.prepend(tireMark);
    }
  });
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-revealed', entry.isIntersecting);
  }), { rootMargin: '0px 0px -12%', threshold: .08 });
  document.querySelectorAll('main > .section').forEach(section => revealObserver.observe(section));

  let scrollFrame;
  const updateScrollMotion = () => {
    scrollFrame = null;
    document.documentElement.style.setProperty('--page-scroll', `${window.scrollY}px`);
  };
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
  }, { passive:true });
  updateScrollMotion();
}
const sportsList = document.querySelector('#sports-list');
const activeSportName = document.querySelector('.arena-active-name');
const arenaHint = document.querySelector('.arena-hint');
const clearActiveSport = () => {
  sportsList.querySelectorAll('.sport-card').forEach(item => {
    item.classList.remove('active');
    item.removeAttribute('aria-current');
    const ornament = item.querySelector('img');
    if (ornament) ornament.src = 'assets/images/card-ornament.svg';
  });
  activeSportName.textContent = '—';
  arenaHint.classList.remove('has-active');
};
const activateSportCard = card => {
  if (!card || card.classList.contains('active')) return;
  sportsList.querySelectorAll('.sport-card').forEach(item => {
    const active = item === card;
    item.classList.toggle('active', active);
    item.setAttribute('aria-current', active ? 'true' : 'false');
    const ornament = item.querySelector('img');
    if (ornament) ornament.src = `assets/images/${active ? 'card-ornament-active' : 'card-ornament'}.svg`;
  });
  activeSportName.textContent = card.querySelector('h3')?.textContent.trim() || '';
  arenaHint.classList.add('has-active');
};
sportsList.addEventListener('pointerover', event => activateSportCard(event.target.closest('.sport-card')));
sportsList.addEventListener('pointerleave', () => {
  if (!sportsList.contains(document.activeElement)) clearActiveSport();
});
sportsList.addEventListener('focusin', event => activateSportCard(event.target.closest('.sport-card')));
sportsList.addEventListener('focusout', event => {
  if (!sportsList.contains(event.relatedTarget)) clearActiveSport();
});
let latestGreetings = [];
let latestGallery = [];
let galleryRotationTimer;
const scheduleHourlyGalleryRotation = () => {
  clearTimeout(galleryRotationTimer);
  const millisecondsUntilNextHour = 3600000 - (Date.now() % 3600000) + 100;
  galleryRotationTimer = setTimeout(() => {
    if (latestGallery.length) renderGalleryPreview(latestGallery, 'api');
    scheduleHourlyGalleryRotation();
  }, millisecondsUntilNextHour);
};
scheduleHourlyGalleryRotation();
window.addEventListener('publiclanguagechange', () => {
  renderAnnouncement();
  if (latestGreetings.length) renderGreetings(latestGreetings, 'api');
  if (latestGallery.length) renderGalleryPreview(latestGallery, 'api');
  renderSupport(activeSupport);
});

let activeSupportSlides = [];
let activeSupport = 0;
let carouselDots = [...document.querySelectorAll('.carousel-dot')];
const supportQuote = document.querySelector('.support-feature blockquote>p');
const supportAuthor = document.querySelector('.support-feature cite');
const supportMedia = document.querySelector('.support-media');
const supportControls = document.querySelector('.carousel-controls');
const supportCard = document.querySelector('.support-feature blockquote');

const renderSupport = index => {
  if (!activeSupportSlides.length) {
    supportQuote.textContent = 'DUKUNGAN BELUM TERSEDIA';
    supportAuthor.textContent = '— BRIDGESTONE CUP BP 2026';
    supportMedia.dataset.label = 'SUPPORT';
    supportMedia.style.backgroundImage = '';
    supportMedia.classList.remove('live');
    supportControls.innerHTML = '';
    supportCard.dataset.source = 'empty';
    return;
  }
  activeSupport = (index + activeSupportSlides.length) % activeSupportSlides.length;
  const slide = activeSupportSlides[activeSupport];
  supportQuote.textContent = document.documentElement.lang === 'en' ? (slide.messageEn || slide.message || slide.messageId) : (slide.messageId || slide.message);
  supportAuthor.textContent = `— ${slide.author}`;
  supportMedia.dataset.label = slide.label || 'SUPPORT';
  supportMedia.style.backgroundImage = slide.photoUrl
    ? `linear-gradient(rgba(3,3,3,.12),rgba(3,3,3,.32)),url("${slide.photoUrl}")`
    : '';
  supportMedia.classList.toggle('live', Boolean(slide.photoUrl));
  carouselDots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeSupport;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-current', active ? 'true' : 'false');
  });
};
const bindDots = () => carouselDots.forEach((dot, index) => dot.addEventListener('click', () => renderSupport(index)));
document.querySelectorAll('.carousel-arrow').forEach(button => button.addEventListener('click', () => {
  renderSupport(activeSupport + (button.classList.contains('next') ? 1 : -1));
}));
bindDots();
renderSupport(0);

if (apiBase) {
  fetch(`${apiBase}/support`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(payload => {
      if (payload.meta?.leaderboard?.length) renderSupporters(payload.meta.leaderboard, 'api');
      if (!payload.data?.length) return;
      activeSupportSlides = payload.data;
      supportControls.innerHTML = activeSupportSlides.map((_, index) => `<button type="button" class="carousel-dot${index === 0 ? ' active' : ''}" aria-label="Support slide ${index + 1}"></button>`).join('');
      carouselDots = [...supportControls.querySelectorAll('.carousel-dot')];
      bindDots();
      supportCard.dataset.source = 'api';
      renderSupport(0);
    })
    .catch(() => {});
}
