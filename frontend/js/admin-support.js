import { adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const form = document.querySelector('#support-form');
const status = document.querySelector('#form-status');
const items = document.querySelector('#support-items');
const cancel = document.querySelector('#cancel-edit');
let messages = [];
const field = name => form.elements.namedItem(name);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }
function resetForm() { form.reset(); field('id').value = ''; field('sortOrder').value = '0'; document.querySelector('#form-title').textContent = 'Tambah Support'; cancel.hidden = true; }
function render() {
  if (!messages.length) { items.innerHTML = '<p>Belum ada support tersimpan.</p>'; return; }
  items.innerHTML = messages.map(item => `<article class="item greeting-item" data-id="${item.id}">${item.photoUrl ? `<img src="${escapeHtml(item.photoUrl)}" alt="Foto dukungan ${escapeHtml(item.author)}">` : `<div class="placeholder">${escapeHtml((item.label || 'SUP').slice(0, 3))}</div>`}<div class="item-body"><strong>${escapeHtml(item.author)}</strong><span>${escapeHtml(item.teamName)} · ${escapeHtml(item.label || 'Tanpa label')} · ${escapeHtml(item.status)}</span><p>${escapeHtml(item.messageId)}</p><div class="item-actions"><button class="edit" type="button">Edit</button><button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`).join('');
}
async function load() { items.innerHTML = '<p>Memuat support…</p>'; messages = (await adminRequest('/admin/support')).data; render(); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('.primary');
  const current = messages.find(item => item.id === field('id').value);
  let uploaded;
  button.disabled = true;
  try {
    let photoStoragePath = current?.photoStoragePath || null;
    const file = field('photo').files[0];
    if (file) {
      setStatus('Mengunggah foto…');
      uploaded = (await adminRequest('/admin/media/images', {method:'POST', body:file, headers:{'Content-Type':file.type,'X-Media-Folder':'support'}})).data;
      photoStoragePath = uploaded.storagePath;
    }
    const payload = {author:field('author').value.trim(), teamName:field('teamName').value.trim(), label:field('label').value.trim(), messageId:field('messageId').value.trim(), messageEn:field('messageEn').value.trim(), photoStoragePath, sortOrder:Number(field('sortOrder').value), status:field('status').value};
    await adminRequest(current ? `/admin/support/${current.id}` : '/admin/support', {method:current ? 'PUT' : 'POST', body:JSON.stringify(payload)});
    if (uploaded && current?.photoStoragePath) await adminRequest('/admin/media/images', {method:'DELETE', body:JSON.stringify({storagePath:current.photoStoragePath})}).catch(() => {});
    setStatus(current ? 'Support berhasil diperbarui.' : 'Support berhasil disimpan.');
    resetForm();
    await load();
  } catch (error) {
    if (uploaded?.storagePath) await adminRequest('/admin/media/images', {method:'DELETE', body:JSON.stringify({storagePath:uploaded.storagePath})}).catch(() => {});
    setStatus(error.message, true);
  } finally { button.disabled = false; }
});

items.addEventListener('click', async event => {
  const card = event.target.closest('.item');
  if (!card) return;
  const item = messages.find(entry => entry.id === card.dataset.id);
  try {
    if (event.target.closest('.edit')) {
      for (const name of ['id','author','teamName','label','messageId','messageEn','sortOrder','status']) field(name).value = item[name] ?? '';
      document.querySelector('#form-title').textContent = 'Edit Support'; cancel.hidden = false; form.scrollIntoView({behavior:'smooth'}); return;
    }
    if (event.target.closest('.toggle')) await adminRequest(`/admin/support/${item.id}`, {method:'PUT', body:JSON.stringify({...item, status:item.status === 'published' ? 'draft' : 'published'})});
    if (event.target.closest('.danger')) {
      if (!confirm(`Hapus support “${item.author}”?`)) return;
      await adminRequest(`/admin/support/${item.id}`, {method:'DELETE'});
      if (item.photoStoragePath) await adminRequest('/admin/media/images', {method:'DELETE', body:JSON.stringify({storagePath:item.photoStoragePath})});
    }
    await load();
  } catch (error) { setStatus(error.message, true); }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', () => load().catch(error => setStatus(error.message, true)));
document.querySelector('#logout-button').addEventListener('click', () => { clearAdminSession(); location.replace('admin-login.html'); });
if (await requireAdmin()) load().catch(error => setStatus(error.message, true));
