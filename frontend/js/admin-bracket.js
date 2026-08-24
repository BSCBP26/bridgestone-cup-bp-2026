import { API_BASE, adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const elements = {
  sport: document.querySelector('#sport-select'),
  tournament: document.querySelector('#tournament-select'),
  participants: document.querySelector('#participants-input'),
  summary: document.querySelector('#participant-summary'),
  preview: document.querySelector('#preview-button'),
  save: document.querySelector('#save-button'),
  regenerate: document.querySelector('#regenerate-button'),
  load: document.querySelector('#load-button'),
  workspace: document.querySelector('#bracket-workspace'),
  title: document.querySelector('#workspace-title'),
  status: document.querySelector('#status-message'),
};

const query = new URLSearchParams(location.search);
const requestedSport = query.get('sport');
const requestedTournament = query.get('tournament');
let groupBracketMode = false;
const publicSportLink = document.querySelector('#public-sport-link');
let activeBracket = null;

const categoryTournamentIds = {
  badminton: { singles: 'badminton-singles-bp-2026', doubles: 'badminton-bp-2026' },
  'table-tennis': { singles: 'table-tennis-bp-2026', doubles: 'table-tennis-doubles-bp-2026' },
};

function categoryForTournament(sport, tournamentId) {
  return Object.entries(categoryTournamentIds[sport] || {})
    .find(([, id]) => id === tournamentId)?.[0] || null;
}

function updatePublicSportLink() {
  if (!publicSportLink || !elements.sport.value) return;
  const category = categoryForTournament(elements.sport.value, elements.tournament.value);
  publicSportLink.href = `${elements.sport.value}.html${category ? `?category=${category}` : ''}#bracket`;
}

function applyGroupBracketMode() {
  document.body.classList.toggle('group-bracket-mode', groupBracketMode);
  if (groupBracketMode) {
    elements.title.textContent = 'Memuat bracket hasil grup…';
    elements.status.textContent = 'Peserta diambil otomatis dari hasil Group Standing.';
    elements.workspace.innerHTML = '<div class="empty-state"><strong>Memuat bracket…</strong><span>Peserta berasal dari hasil kelolosan grup.</span></div>';
  }
}

async function syncGroupBracketMode() {
  groupBracketMode = false;
  if (elements.tournament.value) {
    const payload = await api(`/tournaments/${elements.tournament.value}/competition-format`);
    groupBracketMode = Boolean(payload.data?.usesGroupStage);
  }
  applyGroupBracketMode();
  updatePublicSportLink();
}

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function setStatus(message, type = '') {
  elements.status.textContent = message;
  elements.status.className = type;
}

async function api(path, options = {}) {
  if (path.startsWith('/admin/')) return adminRequest(path, options);
  if (!API_BASE) throw new Error('URL backend belum dikonfigurasi.');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Request gagal (${response.status})`);
  return payload;
}

function participantPayload() {
  return elements.participants.value
    .split('\n')
    .map(name => name.trim())
    .filter(Boolean)
    .map((name, index) => ({ id: `entry-${index + 1}`, name }));
}

function updateParticipantSummary() {
  const count = participantPayload().length;
  elements.summary.textContent = `${count} peserta`;
}

function dateTimeLocalValue(value) {
  return value ? value.slice(0, 16) : '';
}

function renderBracket(bracket, source) {
  activeBracket = bracket;
  const tournamentName = elements.tournament.selectedOptions[0]?.textContent || 'Turnamen';
  if (!bracket.participantCount || !bracket.rounds?.length) {
    elements.title.textContent = `${tournamentName} · 0 peserta`;
    elements.workspace.innerHTML = '<div class="empty-state"><strong>Pertandingan belum tersedia</strong></div>';
    setStatus(`Bracket ${source} berhasil disimpan dalam kondisi kosong.`, 'success');
    return;
  }
  elements.title.textContent = `${tournamentName} · ${bracket.participantCount} peserta · ${bracket.bracketSize} slot · ${bracket.byeCount} BYE`;
  const visibleRounds = bracket.thirdPlaceMatch
    ? [...bracket.rounds, { name: 'Perebutan Juara 3', matches: [bracket.thirdPlaceMatch] }]
    : bracket.rounds;
  const rounds = visibleRounds.map(round => `
    <section class="admin-round">
      <h3>${escapeHtml(round.name.toUpperCase())}</h3>
      <div class="admin-matches">
        ${round.matches.map(match => {
          const home = match.homeParticipant?.name || 'Menunggu hasil';
          const away = match.awayParticipant?.name || (match.status === 'bye' ? 'BYE' : 'Menunggu hasil');
          const resultDisabled = !['scheduled', 'completed'].includes(match.status);
          const scheduleDisabled = match.status === 'bye';
          return `
            <article class="admin-match" data-match-id="${escapeHtml(match.id)}">
              <div class="match-id"><span>${escapeHtml(match.id)}</span><b class="status-pill ${escapeHtml(match.status)}">${escapeHtml(match.status)}</b></div>
              <div class="team-line"><strong>${escapeHtml(home)}</strong><input class="home-score" type="number" min="0" value="${match.homeScore ?? ''}" aria-label="Skor ${escapeHtml(home)}"></div>
              <div class="team-line"><strong class="${away === 'BYE' ? 'bye-label' : ''}">${escapeHtml(away)}</strong><input class="away-score" type="number" min="0" value="${match.awayScore ?? ''}" aria-label="Skor ${escapeHtml(away)}"></div>
              <div class="match-tools">
                <div class="schedule-fields">
                  <input class="scheduled-at" type="datetime-local" value="${dateTimeLocalValue(match.scheduledAt)}" aria-label="Tanggal dan waktu ${escapeHtml(match.id)}">
                  <input class="venue" type="text" maxlength="150" value="${escapeHtml(match.venue || '')}" placeholder="Venue" aria-label="Venue ${escapeHtml(match.id)}">
                </div>
                <button class="schedule-button" type="button" ${scheduleDisabled ? 'disabled' : ''}>Simpan jadwal</button>
                <button class="result-button ${match.status === 'completed' ? 'correct' : ''}" type="button" ${resultDisabled ? 'disabled' : ''}>${match.status === 'completed' ? 'Koreksi skor' : 'Simpan hasil'}</button>
              </div>
            </article>`;
        }).join('')}
      </div>
    </section>`).join('');

  const champion = bracket.participants.find(item => item.id === bracket.championParticipantId)?.name || 'Menunggu hasil';
  elements.workspace.innerHTML = `<div class="admin-rounds">${rounds}<aside class="champion-admin"><small>PEMENANG</small><strong>${escapeHtml(champion)}</strong></aside></div>`;
  setStatus(`Bracket ${source} berhasil dimuat.`, 'success');
}

async function loadTournaments() {
  const slug = elements.sport.value;
  const payload = await api(`/sports/${slug}/tournaments`);
  elements.tournament.innerHTML = payload.data
    .filter(item => item.format.includes('single_elimination'))
    .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join('');
  if (requestedTournament && [...elements.tournament.options].some(option => option.value === requestedTournament)) {
    elements.tournament.value = requestedTournament;
  } else if (categoryTournamentIds[slug]) {
    try {
      const categoryPayload = await api(`/sports/${slug}/competition-categories`);
      const activeCategory = categoryPayload.data?.activeCategories?.[0];
      const preferredId = categoryTournamentIds[slug][activeCategory];
      if (preferredId && [...elements.tournament.options].some(option => option.value === preferredId)) {
        elements.tournament.value = preferredId;
      }
    } catch {
      // Tetap gunakan turnamen pertama bila pengaturan kategori belum tersedia.
    }
  }
  const disabled = elements.tournament.options.length === 0;
  [elements.preview, elements.save, elements.regenerate, elements.load].forEach(button => { button.disabled = disabled; });
  if (disabled) setStatus('Turnamen ini belum mendukung bracket single elimination.', 'error');
  else setStatus('Turnamen siap dikelola.');
}

async function initialize() {
  try {
    const payload = await api('/sports');
    elements.sport.innerHTML = payload.data
      .filter(sport => requestedSport ? sport.slug === requestedSport : sport.slug !== 'fishing')
      .map(sport => `<option value="${escapeHtml(sport.slug)}">${escapeHtml(sport.name)}</option>`)
      .join('');
    if (requestedSport && [...elements.sport.options].some(option => option.value === requestedSport)) elements.sport.value = requestedSport;
    await loadTournaments();
    if (elements.tournament.value) {
      await syncGroupBracketMode();
      await loadSavedBracket();
    }
  } catch (error) {
    const message = groupBracketMode && /not found|belum|tidak ditemukan/i.test(error.message)
      ? 'Bracket belum dibuat. Tentukan kelolosan dari Group Standing terlebih dahulu.'
      : error.message;
    setStatus(message, 'error');
    if (groupBracketMode) elements.workspace.innerHTML = '<div class="empty-state"><strong>Bracket belum tersedia</strong><span>Buat bracket dari halaman Group Standing.</span></div>';
    [elements.preview, elements.save, elements.regenerate, elements.load].forEach(button => { button.disabled = true; });
  }
}

async function previewBracket() {
  const tournamentId = elements.tournament.value;
  setStatus('Membuat preview…');
  try {
    const payload = await api(`/admin/tournaments/${tournamentId}/bracket/preview`, {
      method: 'POST',
      body: JSON.stringify({ participants: participantPayload() }),
    });
    renderBracket(payload.data.bracket, 'preview');
  } catch (error) { setStatus(error.message, 'error'); }
}

async function saveBracket() {
  const tournamentId = elements.tournament.value;
  const participants = participantPayload();
  const replacingExisting = Boolean(activeBracket);
  if (participants.length === 0) {
    if (activeBracket?.participantCount > 0
      && !confirm('Semua peserta dihapus. Menyimpan akan mengosongkan pertandingan serta menghapus skor, jadwal, progres, dan juara lama. Lanjutkan?')) return;
    setStatus('Menyimpan bracket kosong…');
    try {
      const payload = await api(`/admin/tournaments/${tournamentId}/bracket`, { method: 'DELETE' });
      renderBracket(payload.data, 'kosong');
    } catch (error) { setStatus(error.message, 'error'); }
    return;
  }
  if (replacingExisting) {
    const previousNames = activeBracket.participants.map(item => item.name.trim());
    const nextNames = participants.map(item => item.name.trim());
    const unchanged = previousNames.length === nextNames.length
      && previousNames.every((name, index) => name === nextNames[index]);
    if (unchanged) {
      setStatus('Tidak ada perubahan peserta untuk disimpan.');
      return;
    }
    if (!confirm('Daftar peserta berubah. Menyimpan perubahan akan membuat ulang bracket serta menghapus skor, jadwal, progres, dan juara lama. Lanjutkan?')) return;
  }
  setStatus(replacingExisting ? 'Memperbarui bracket…' : 'Menyimpan bracket…');
  try {
    const payload = await api(`/admin/tournaments/${tournamentId}/bracket`, {
      method: replacingExisting ? 'PUT' : 'POST',
      body: JSON.stringify(replacingExisting
        ? { participants, confirmReplace: true }
        : { participants }),
    });
    renderBracket(payload.data, replacingExisting ? 'setelah perubahan peserta' : 'tersimpan');
  } catch (error) { setStatus(error.message, 'error'); }
}

async function regenerateBracket() {
  if (!confirm('Regenerate akan menghapus seluruh skor, jadwal, progres, dan juara pada bracket lama. Lanjutkan?')) return;
  const tournamentId = elements.tournament.value;
  setStatus('Membuat ulang bracket…');
  try {
    const payload = await api(`/admin/tournaments/${tournamentId}/bracket`, {
      method: 'PUT',
      body: JSON.stringify({ participants: participantPayload(), confirmReplace: true }),
    });
    renderBracket(payload.data, 'hasil regenerate');
  } catch (error) { setStatus(error.message, 'error'); }
}

async function loadSavedBracket() {
  const tournamentId = elements.tournament.value;
  setStatus('Memuat bracket…');
  try {
    const payload = await api(`/tournaments/${tournamentId}/bracket`);
    elements.participants.value = payload.data.participants.map(item => item.name).join('\n');
    updateParticipantSummary();
    renderBracket(payload.data, 'tersimpan');
  } catch (error) {
    if (/bracket not found|tidak ditemukan/i.test(error.message)) {
      activeBracket = null;
      setStatus('Bracket belum tersimpan. Isi peserta, lalu pilih Preview atau Simpan.');
      elements.workspace.innerHTML = '<div class="empty-state"><strong>Bracket belum tersedia</strong><span>Isi peserta lalu pilih Preview atau Simpan.</span></div>';
      return;
    }
    setStatus(error.message, 'error');
  }
}

elements.workspace.addEventListener('click', async event => {
  const card = event.target.closest('.admin-match');
  if (!card) return;
  const tournamentId = elements.tournament.value;
  const matchId = card.dataset.matchId;

  if (event.target.closest('.schedule-button')) {
    const localDate = card.querySelector('.scheduled-at').value;
    const venue = card.querySelector('.venue').value.trim();
    const scheduledAt = localDate ? `${localDate}:00+07:00` : '';
    setStatus(`Menyimpan jadwal ${matchId}…`);
    try {
      const payload = await api(`/admin/tournaments/${tournamentId}/matches/${matchId}/schedule`, {
        method: 'PATCH', body: JSON.stringify({ scheduledAt, venue }),
      });
      renderBracket(payload.data.bracket, 'setelah pembaruan jadwal');
    } catch (error) { setStatus(error.message, 'error'); }
  }

  if (event.target.closest('.result-button')) {
    const homeScore = Number(card.querySelector('.home-score').value);
    const awayScore = Number(card.querySelector('.away-score').value);
    if (homeScore === awayScore) {
      setStatus('Skor tidak boleh seri pada pertandingan eliminasi. Tentukan salah satu pemenang.', 'error');
      return;
    }
    const method = activeBracket.rounds.flatMap(round => round.matches).find(match => match.id === matchId)?.status === 'completed' ? 'PUT' : 'PATCH';
    setStatus(`${method === 'PUT' ? 'Mengoreksi' : 'Menyimpan'} hasil ${matchId}…`);
    try {
      const payload = await api(`/admin/tournaments/${tournamentId}/matches/${matchId}/result`, {
        method, body: JSON.stringify({ homeScore, awayScore }),
      });
      renderBracket(payload.data.bracket, 'setelah pembaruan hasil');
    } catch (error) { setStatus(error.message, 'error'); }
  }
});

elements.participants.addEventListener('input', updateParticipantSummary);
elements.sport.addEventListener('change', async () => {
  activeBracket = null;
  elements.participants.value = '';
  updateParticipantSummary();
  elements.workspace.innerHTML = '<div class="empty-state"><strong>Memuat bracket…</strong></div>';
  try {
    await loadTournaments();
    if (elements.tournament.value) {
      await syncGroupBracketMode();
      await loadSavedBracket();
    }
  }
  catch (error) { setStatus(error.message, 'error'); }
});
elements.tournament.addEventListener('change', async () => {
  activeBracket = null;
  elements.participants.value = '';
  updateParticipantSummary();
  elements.title.textContent = elements.tournament.selectedOptions[0]?.textContent || 'Bracket belum dimuat';
  elements.workspace.innerHTML = '<div class="empty-state"><strong>Memuat bracket kategori…</strong></div>';
  await syncGroupBracketMode();
  await loadSavedBracket();
});
elements.preview.addEventListener('click', previewBracket);
elements.save.addEventListener('click', saveBracket);
elements.regenerate.addEventListener('click', regenerateBracket);
elements.load.addEventListener('click', loadSavedBracket);

const identity = await requireAdmin();
if (identity) {
  document.querySelector('#logout-button').addEventListener('click', () => {
    clearAdminSession();
    location.replace('admin-login.html');
  });
  updateParticipantSummary();
  initialize();
}
