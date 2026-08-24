import { adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const form = document.querySelector('#gallery-form');
const status = document.querySelector('#form-status');
const items = document.querySelector('#gallery-items');
const sport = document.querySelector('#sport');
let galleryItems = [];

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }

async function loadSports() {
  const payload = await adminRequest('/sports');
  sport.insertAdjacentHTML('beforeend', payload.data.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join(''));
}

function renderItems() {
  if (!galleryItems.length) { items.innerHTML = '<p>Belum ada foto tersimpan.</p>'; return; }
  items.innerHTML = galleryItems.map(item => `<article class="item" data-id="${item.id}"><img src="${escapeHtml(item.publicUrl)}" alt="${escapeHtml(item.altId || item.titleId || 'Foto turnamen')}"><div class="item-body"><strong>${escapeHtml(item.titleId || 'Tanpa judul')}</strong><span>${escapeHtml(item.sportId || 'Umum')} · ${escapeHtml(item.status)}</span><div class="item-actions"><button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`).join('');
}

async function loadGallery() {
  items.innerHTML = '<p>Memuat foto…</p>';
  const payload = await adminRequest('/admin/gallery');
  galleryItems = payload.data;
  renderItems();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = form.photo.files[0];
  if (!file) return;
  const button = form.querySelector('.primary');
  button.disabled = true;
  setStatus('Mengunggah gambar…');
  let uploaded;
  try {
    uploaded = (await adminRequest('/admin/media/images', { method: 'POST', body: file, headers: { 'Content-Type': file.type } })).data;
    setStatus('Menyimpan metadata Gallery…');
    await adminRequest('/admin/gallery', { method: 'POST', body: JSON.stringify({ storagePath: uploaded.storagePath, sportId: form.sport.value || null, titleId: form.title.value.trim(), altId: form.alt.value.trim(), sortOrder: Number(form.sortOrder.value), status: form.status.value }) });
    form.reset();
    setStatus('Foto berhasil disimpan.');
    await loadGallery();
  } catch (error) {
    if (uploaded?.storagePath) await adminRequest('/admin/media/images', { method: 'DELETE', body: JSON.stringify({ storagePath: uploaded.storagePath }) }).catch(() => {});
    setStatus(error.message, true);
  } finally { button.disabled = false; }
});

items.addEventListener('click', async event => {
  const card = event.target.closest('.item');
  if (!card) return;
  const item = galleryItems.find(entry => entry.id === card.dataset.id);
  try {
    if (event.target.closest('.toggle')) {
      const nextStatus = item.status === 'published' ? 'draft' : 'published';
      await adminRequest(`/admin/gallery/${item.id}`, { method: 'PUT', body: JSON.stringify({ ...item, status: nextStatus }) });
      setStatus(`Status diubah menjadi ${nextStatus}.`);
    }
    if (event.target.closest('.danger')) {
      if (!confirm(`Hapus foto “${item.titleId || 'Tanpa judul'}”?`)) return;
      await adminRequest(`/admin/gallery/${item.id}`, { method: 'DELETE' });
      await adminRequest('/admin/media/images', { method: 'DELETE', body: JSON.stringify({ storagePath: item.storagePath }) });
      setStatus('Foto berhasil dihapus.');
    }
    await loadGallery();
  } catch (error) { setStatus(error.message, true); }
});

document.querySelector('#refresh-button').addEventListener('click', () => loadGallery().catch(error => setStatus(error.message, true)));
document.querySelector('#logout-button').addEventListener('click', () => { clearAdminSession(); location.replace('admin-login.html'); });

if (await requireAdmin()) {
  try { await Promise.all([loadSports(), loadGallery()]); }
  catch (error) { setStatus(error.message, true); }
}
