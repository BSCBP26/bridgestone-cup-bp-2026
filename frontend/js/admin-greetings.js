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
function resetForm() { form.reset(); field('id').value = ''; field('sortOrder').value = '0'; document.querySelector('#form-title').textContent = 'Tambah Exhibition Match'; cancel.hidden = true; }
function render() {
  if (!greetings.length) { items.innerHTML = '<p>Belum ada Exhibition Match tersimpan.</p>'; return; }
  items.innerHTML = greetings.map(item => { const photos = item.photoUrls || (item.photoUrl ? [item.photoUrl] : []); return `<article class="item greeting-item" data-id="${item.id}">${photos.length ? `<div class="panel-photos">${photos.map(url => `<img src="${escapeHtml(url)}" alt="Foto ${escapeHtml(item.name)}">`).join('')}</div>` : `<div class="placeholder">${escapeHtml(initials(item.name))}</div>`}<div class="item-body"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.roleId)} · ${escapeHtml(item.status)} · ${photos.length} foto</span><p>${escapeHtml(item.messageId)}</p><div class="item-actions"><button class="edit" type="button">Edit panel</button><button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`; }).join('');
}
async function load() { items.innerHTML = '<p>Memuat Exhibition Match…</p>'; greetings = (await adminRequest('/admin/greetings')).data; render(); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('.primary');
  const current = greetings.find(item => item.id === field('id').value);
  let uploaded;
  button.disabled = true;
  try {
    let photoStoragePaths = current?.photoStoragePaths || (current?.photoStoragePath ? [current.photoStoragePath] : []);
    const files = [...field('photo').files];
    if (files.length) {
      setStatus(`Mengunggah ${files.length} foto panel…`);
      uploaded = { storagePaths: [] };
      for (const file of files) uploaded.storagePaths.push((await adminRequest('/admin/media/images', { method:'POST', body:file, headers:{ 'Content-Type':file.type, 'X-Media-Folder':'greetings' } })).data.storagePath);
      photoStoragePaths = uploaded.storagePaths;
    }
    const payload = { name:field('name').value.trim(), roleId:field('roleId').value.trim(), roleEn:field('roleEn').value.trim(), messageId:field('messageId').value.trim(), messageEn:field('messageEn').value.trim(), photoStoragePaths, sortOrder:Number(field('sortOrder').value), status:field('status').value };
    await adminRequest(current ? `/admin/greetings/${current.id}` : '/admin/greetings', { method:current ? 'PUT' : 'POST', body:JSON.stringify(payload) });
    if (uploaded && current?.photoStoragePaths?.length) for (const storagePath of current.photoStoragePaths) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) }).catch(() => {});
    setStatus(current ? 'Exhibition Match berhasil diperbarui.' : 'Exhibition Match berhasil disimpan.');
    resetForm(); await load();
  } catch (error) {
    if (uploaded?.storagePaths) for (const storagePath of uploaded.storagePaths) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) }).catch(() => {});
    setStatus(error.message, true);
  } finally { button.disabled = false; }
});

items.addEventListener('click', async event => {
  const card = event.target.closest('.item'); if (!card) return;
  const item = greetings.find(entry => entry.id === card.dataset.id);
  try {
    if (event.target.closest('.edit')) {
      for (const name of ['id','name','roleId','roleEn','messageId','messageEn','sortOrder','status']) field(name).value = item[name] ?? '';
      document.querySelector('#form-title').textContent = 'Edit Exhibition Match'; cancel.hidden = false; form.scrollIntoView({ behavior:'smooth' }); return;
    }
    if (event.target.closest('.toggle')) await adminRequest(`/admin/greetings/${item.id}`, { method:'PUT', body:JSON.stringify({ ...item, status:item.status === 'published' ? 'draft' : 'published' }) });
    if (event.target.closest('.danger')) {
      if (!confirm(`Hapus Exhibition Match “${item.name}”?`)) return;
      await adminRequest(`/admin/greetings/${item.id}`, { method:'DELETE' });
      for (const storagePath of (item.photoStoragePaths || (item.photoStoragePath ? [item.photoStoragePath] : []))) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) });
    }
    await load();
  } catch (error) { setStatus(error.message, true); }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', () => load().catch(error => setStatus(error.message, true)));
document.querySelector('#logout-button').addEventListener('click', () => { clearAdminSession(); location.replace('admin-login.html'); });
if (await requireAdmin()) load().catch(error => setStatus(error.message, true));
