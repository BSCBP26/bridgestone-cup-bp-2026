import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE } from './api-config.js';
import { shell } from './sports.js?v=20260809-clean-empty-copy';

const host = document.querySelector('#sport-view');
let teams = [];
let ranking = [];
let pairSource = 'empty';
let rankingSource = 'empty';

const escape = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

const emptyState = title => `
  <div class="public-empty-state">
    <strong>${escape(title)}</strong>
  </div>`;

function winner() {
  const content = ranking.length
    ? `<div class="champion"><small>CHAMPION</small><strong>${escape(ranking[0].name)}</strong></div>`
    : emptyState('HASIL BELUM TERSEDIA');
  const rows = ranking.length
    ? `<article class="winner-panel"><h2>STANDING SCORE</h2>${ranking.map(row => `
        <div class="ranking-row"><small>RANK ${row.rank}</small><strong>${escape(row.name)}</strong><b>${row.score} POINT</b></div>`).join('')}</article>`
    : '';
  return `<section class="fishing-layout"><div><p class="section-kicker">BRIDGESTONE CUP BP 2026</p><h1 class="section-title">WINNER FISHING</h1>${content}</div>${rows}</section>`;
}

function teamCards() {
  if (!teams.length) {
    return `<h1 class="section-title">FISHING TEAM PAIRS</h1>${emptyState('PESERTA BELUM TERSEDIA')}`;
  }
  return `<h1 class="section-title">FISHING TEAM PAIRS</h1><section class="participant-grid">${teams.map(team => `
    <article class="participant"><b>${escape(team[0])}</b><div class="team-pair"><strong>${escape(team[1])}</strong><strong>${escape(team[2])}</strong></div></article>`).join('')}
    <article class="participant event-date"><b>PERTANDINGAN DILAKSANAKAN</b><strong>SABTU, 13 DESEMBER 2026</strong><small>07.00 WIB &bull; EMPANG IKAN MAS BUNGUR</small></article>
  </section>`;
}

function render(id) {
  host.innerHTML = id === 'bracket' ? teamCards() : winner();
  host.dataset.source = id === 'winner' ? rankingSource : pairSource;
}

shell('Fishing', [
  { id: 'bracket', label: 'Bracket' },
  { id: 'winner', label: 'Winner Fishing' },
], render);

if (API_BASE) {
  Promise.allSettled([
    fetch(`${API_BASE}/tournaments/fishing-bp-2026/standings`).then(response => response.ok ? response.json() : Promise.reject()),
    fetch(`${API_BASE}/tournaments/fishing-bp-2026/pairs`).then(response => response.ok ? response.json() : Promise.reject()),
  ]).then(([rankingResult, pairResult]) => {
    const rows = rankingResult.status === 'fulfilled' ? rankingResult.value.data?.[0]?.rows : null;
    if (rows?.length) {
      ranking = rows.map(row => ({ name: row.name, score: row.points, rank: row.rank }));
      rankingSource = 'api';
    }
    const pairs = pairResult.status === 'fulfilled' ? pairResult.value.data : null;
    if (pairs?.length) {
      teams = pairs.map(pair => [pair.teamName, pair.anglerOne, pair.anglerTwo]);
      pairSource = 'api';
    }
    render(location.hash.slice(1) || 'bracket');
  });
}
