import { API_BASE, adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const sportsList = document.querySelector('#sports-list');
const storageUsage = document.querySelector('#storage-usage');
const storageChecked = document.querySelector('#storage-checked');

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

async function request(path) {
  if (!API_BASE) throw new Error('URL backend belum dikonfigurasi.');
  const response = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(5000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Request gagal (${response.status})`);
  return payload;
}

async function initializeDashboard() {
  try {
    const sports = await request('/sports');
    sportsList.innerHTML = sports.data.map((sport, index) => `
      <article class="sport-row">
        <b>${String(index + 1).padStart(2, '0')}</b>
        <strong>${escapeHtml(sport.name)}</strong>
        <span>${sport.participantLimit} ${escapeHtml(sport.participantType)}</span>
      </article>`).join('');
  } catch (error) {
    sportsList.innerHTML = '<p class="error">Daftar cabang olahraga belum dapat dimuat. Coba muat ulang halaman.</p>';
  }
}

const formatBytes = bytes => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

function storageCard(name, usage) {
  const statusLabel = usage.status === 'critical' ? 'Hampir penuh' : usage.status === 'warning' ? 'Perlu diperhatikan' : 'Aman';
  return `<article class="storage-card ${usage.status}">
    <div class="storage-card-heading"><strong>${name}</strong><em>${statusLabel}</em></div>
    <b>${formatBytes(usage.usedBytes)} <small>/ ${formatBytes(usage.limitBytes)}</small></b>
    <div class="storage-meter" role="progressbar" aria-label="Pemakaian ${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${usage.percentage}"><i style="width:${usage.percentage}%"></i></div>
    <span>${usage.percentage}% <span>terpakai</span> &middot; <span>tersisa</span> ${formatBytes(usage.remainingBytes)}</span>
  </article>`;
}

async function initializeStorageUsage() {
  try {
    const payload = await adminRequest('/admin/storage-usage');
    storageUsage.innerHTML = storageCard('Supabase', payload.data.supabase) + storageCard('Cloudflare R2', payload.data.r2);
    storageChecked.innerHTML = `<span>Diperiksa</span> ${new Intl.DateTimeFormat('id-ID', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta' }).format(new Date(payload.data.checkedAt))} WIB`;
  } catch {
    storageUsage.innerHTML = '<p class="storage-error">Pemakaian penyimpanan belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>';
    storageChecked.textContent = 'Gagal dimuat';
  }
}

const identity = await requireAdmin();
if (identity) {
  document.querySelector('#admin-identity').textContent = identity.profile.display_name;
  document.querySelector('#logout-button').addEventListener('click', () => {
    clearAdminSession();
    location.replace('admin-login.html');
  });
  initializeDashboard();
  initializeStorageUsage();
}
