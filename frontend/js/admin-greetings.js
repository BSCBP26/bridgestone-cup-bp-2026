import { adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const form = document.querySelector('#greeting-form');
const status = document.querySelector('#form-status');
const items = document.querySelector('#greeting-items');
const cancel = document.querySelector('#cancel-edit');
let greetings = [];
const field = name => form.elements.namedItem(name);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }
function resetForm() { form.reset(); field('id').value = ''; field('sortOrder').value = '0'; document.querySelector('#form-title').textContent = 'Tambah Greeting'; cancel.hidden = true; }
function render() {
  if (!greetings.length) { items.innerHTML = '<p>Belum ada greeting tersimpan.</p>'; return; }
  items.innerHTML = greetings.map(item => `<article class="item greeting-item" data-id="${item.id}">${item.photoUrl ? `<img src="${escapeHtml(item.photoUrl)}" alt="Foto ${escapeHtml(item.name)}">` : `<div class="placeholder">${escapeHtml(initials(item.name))}</div>`}<div class="item-body"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.roleId)} · ${escapeHtml(item.status)}</span><p>${escapeHtml(item.messageId)}</p><div class="item-actions"><button class="edit" type="button">Edit</button><button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`).join('');
}
async function load() { items.innerHTML = '<p>Memuat greeting…</p>'; greetings = (await adminRequest('/admin/greetings')).data; render(); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('.primary');
  const current = greetings.find(item => item.id === field('id').value);
  let uploaded;
  button.disabled = true;
  try {
    let photoStoragePath = current?.photoStoragePath || null;
    const file = field('photo').files[0];
    if (file) {
      setStatus('Mengunggah foto…');
      uploaded = (await adminRequest('/admin/media/images', { method:'POST', body:file, headers:{ 'Content-Type':file.type, 'X-Media-Folder':'greetings' } })).data;
      photoStoragePath = uploaded.storagePath;
    }
    const payload = { name:field('name').value.trim(), roleId:field('roleId').value.trim(), roleEn:field('roleEn').value.trim(), messageId:field('messageId').value.trim(), messageEn:field('messageEn').value.trim(), photoStoragePath, sortOrder:Number(field('sortOrder').value), status:field('status').value };
    await adminRequest(current ? `/admin/greetings/${current.id}` : '/admin/greetings', { method:current ? 'PUT' : 'POST', body:JSON.stringify(payload) });
    if (uploaded && current?.photoStoragePath) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath:current.photoStoragePath }) }).catch(() => {});
    setStatus(current ? 'Greeting berhasil diperbarui.' : 'Greeting berhasil disimpan.');
    resetForm(); await load();
  } catch (error) {
    if (uploaded?.storagePath) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath:uploaded.storagePath }) }).catch(() => {});
    setStatus(error.message, true);
  } finally { button.disabled = false; }
});

items.addEventListener('click', async event => {
  const card = event.target.closest('.item'); if (!card) return;
  const item = greetings.find(entry => entry.id === card.dataset.id);
  try {
    if (event.target.closest('.edit')) {
      for (const name of ['id','name','roleId','roleEn','messageId','messageEn','sortOrder','status']) field(name).value = item[name] ?? '';
      document.querySelector('#form-title').textContent = 'Edit Greeting'; cancel.hidden = false; form.scrollIntoView({ behavior:'smooth' }); return;
    }
    if (event.target.closest('.toggle')) await adminRequest(`/admin/greetings/${item.id}`, { method:'PUT', body:JSON.stringify({ ...item, status:item.status === 'published' ? 'draft' : 'published' }) });
    if (event.target.closest('.danger')) {
      if (!confirm(`Hapus greeting “${item.name}”?`)) return;
      await adminRequest(`/admin/greetings/${item.id}`, { method:'DELETE' });
      if (item.photoStoragePath) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath:item.photoStoragePath }) });
    }
    await load();
  } catch (error) { setStatus(error.message, true); }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', () => load().catch(error => setStatus(error.message, true)));
document.querySelector('#logout-button').addEventListener('click', () => { clearAdminSession(); location.replace('admin-login.html'); });
if (await requireAdmin()) load().catch(error => setStatus(error.message, true));
