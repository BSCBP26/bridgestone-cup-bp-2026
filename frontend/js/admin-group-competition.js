import { adminRequest, API_BASE, requireAdmin } from './admin-auth.js';

function applyFormat(control, format) {
  control.querySelector('select:not(.format-category)').value = format;
  control.classList.toggle('uses-group-stage', format === 'group_and_single_elimination');
}

async function initializeFormat(control) {
  const card = control.closest('[data-tournament]');
  const categorySport = card?.dataset.categorySport;
  const categoryTournamentIds = {
    badminton: { singles: 'badminton-singles-bp-2026', doubles: 'badminton-bp-2026' },
    'table-tennis': { singles: 'table-tennis-bp-2026', doubles: 'table-tennis-doubles-bp-2026' },
  };
  let categorySelect = null;
  if (categorySport) {
    const label = document.createElement('label');
    label.innerHTML = 'Kategori yang diatur<select class="format-category"><option value="singles">Singles</option><option value="doubles">Doubles / Ganda</option></select>';
    control.prepend(label);
    categorySelect = label.querySelector('select');
    categorySelect.value = categorySport === 'badminton' ? 'doubles' : 'singles';
  }
  const getId = () => categorySelect ? categoryTournamentIds[categorySport][categorySelect.value] : (control.dataset.tournament || card?.dataset.tournament);
  const output = control.querySelector('output');
  const loadFormat = async () => { try {
    const response = await fetch(`${API_BASE}/tournaments/${getId()}/competition-format`);
    const payload = await response.json(); if (!response.ok) throw new Error(payload.message);
    applyFormat(control, payload.data.format); output.textContent = '';
  } catch (error) { output.textContent = error.message; } };
  if (categorySelect) categorySelect.onchange = loadFormat;
  await loadFormat();
  control.querySelector('button').onclick = async () => {
    output.textContent = 'Menyimpan format…';
    try {
      const formatSelect = control.querySelector('select:not(.format-category)');
      const payload = await adminRequest(`/admin/tournaments/${getId()}/competition-format`, { method: 'PUT', body: JSON.stringify({ format: formatSelect.value }) });
      applyFormat(control, payload.data.format);
      output.textContent = payload.data.usesGroupStage ? 'Fase grup diaktifkan.' : 'Langsung playoff diaktifkan.';
    } catch (error) { output.textContent = error.message; }
  };
}

async function initializeCategories(card) {
  const sport = card.dataset.categorySport;
  const control = card.querySelector('.category-control');
  const select = control.querySelector('select');
  const output = control.querySelector('output');
  try {
    const response = await fetch(`${API_BASE}/sports/${sport}/competition-categories`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
    select.value = payload.data.mode;
  } catch (error) { output.textContent = error.message; }
  control.querySelector('button').onclick = async () => {
    const activeCategories = select.value === 'both' ? ['singles', 'doubles'] : [select.value];
    output.textContent = 'Menyimpan kategori…';
    try {
      const payload = await adminRequest(`/admin/sports/${sport}/competition-categories`, { method: 'PUT', body: JSON.stringify({ activeCategories }) });
      select.value = payload.data.mode;
      output.textContent = 'Kategori aktif tersimpan.';
    } catch (error) { output.textContent = error.message; }
  };
}

if (await requireAdmin()) {
  await Promise.all([...document.querySelectorAll('.format-control')].map(initializeFormat));
  await Promise.all([...document.querySelectorAll('[data-category-sport]')].map(initializeCategories));
}
