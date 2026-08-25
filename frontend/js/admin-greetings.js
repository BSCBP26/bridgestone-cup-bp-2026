import { adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const form = document.querySelector('#greeting-form');
const status = document.querySelector('#form-status');
const items = document.querySelector('#greeting-items');
const cancel = document.querySelector('#cancel-edit');
let greetings = [];
const field = name => form.elements.namedItem(name);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const cropModal = document.querySelector('#crop-modal');
const cropCanvas = document.querySelector('#crop-canvas');
const cropZoom = document.querySelector('#crop-zoom');
const cropCounter = document.querySelector('#crop-counter');
let cropQueue = [], croppedFiles = [], cropIndex = 0, cropImage = null, cropOffsetX = 0, cropOffsetY = 0, dragStart = null;
function drawCrop() { if (!cropImage) return; const ctx = cropCanvas.getContext('2d'); const zoom = Number(cropZoom.value); const base = Math.max(cropCanvas.width / cropImage.width, cropCanvas.height / cropImage.height); const drawWidth = cropImage.width * base * zoom; const drawHeight = cropImage.height * base * zoom; const dx = (cropCanvas.width - drawWidth) / 2 + cropOffsetX; const dy = (cropCanvas.height - drawHeight) / 2 + cropOffsetY; ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height); ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height); ctx.drawImage(cropImage, dx, dy, drawWidth, drawHeight); }
async function openCropQueue(files) { cropQueue = files; croppedFiles = []; cropIndex = 0; cropModal.hidden = false; await showCrop(); }
async function showCrop() { if (cropIndex >= cropQueue.length) { cropModal.hidden = true; field('photo').value = ''; return; } cropCounter.textContent = `Foto ${cropIndex + 1} dari ${cropQueue.length}: ${cropQueue[cropIndex].name}`; cropZoom.value = '1'; cropOffsetX = 0; cropOffsetY = 0; cropImage = await createImageBitmap(cropQueue[cropIndex]); drawCrop(); }
function finishCrop(skip = false) { const file = cropQueue[cropIndex]; if (skip) croppedFiles.push(file); else cropCanvas.toBlob(blob => { croppedFiles.push(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type:'image/jpeg' })); cropIndex += 1; showCrop(); }, 'image/jpeg', .9); if (skip) { cropIndex += 1; showCrop(); } }
document.querySelector('#crop-zoom').addEventListener('input', drawCrop);
cropCanvas.addEventListener('pointerdown', event => { cropCanvas.setPointerCapture(event.pointerId); dragStart = { x:event.clientX, y:event.clientY, offsetX:cropOffsetX, offsetY:cropOffsetY }; });
cropCanvas.addEventListener('pointermove', event => { if (!dragStart) return; const scale = cropCanvas.getBoundingClientRect().width / cropCanvas.width; cropOffsetX = dragStart.offsetX + (event.clientX - dragStart.x) / scale; cropOffsetY = dragStart.offsetY + (event.clientY - dragStart.y) / scale; drawCrop(); });
cropCanvas.addEventListener('pointerup', () => { dragStart = null; });
cropCanvas.addEventListener('pointercancel', () => { dragStart = null; });
document.querySelector('#crop-apply').addEventListener('click', () => finishCrop(false));
document.querySelector('#crop-skip').addEventListener('click', () => finishCrop(true));
document.querySelector('#crop-cancel').addEventListener('click', () => { cropQueue = []; croppedFiles = []; cropModal.hidden = true; field('photo').value = ''; });
field('photo').addEventListener('change', () => { if (field('photo').files.length) openCropQueue([...field('photo').files]); });

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }
function resetForm() { form.reset(); field('id').value = ''; field('sortOrder').value = '1'; document.querySelector('#form-title').textContent = 'Tambah Exhibition Match'; cancel.hidden = true; }
function render() {
  if (!greetings.length) { items.innerHTML = '<p>Belum ada Exhibition Match tersimpan.</p>'; return; }
  items.innerHTML = greetings.map(item => { const photos = item.photoUrls || (item.photoUrl ? [item.photoUrl] : []); const panelNumber = Math.min(3, Math.max(1, Number(item.sortOrder) || 1)); return `<article class="item greeting-item" data-id="${item.id}">${photos.length ? `<div class="panel-photos">${photos.map(url => `<img src="${escapeHtml(url)}" alt="Foto ${escapeHtml(item.name)}">`).join('')}</div>` : `<div class="placeholder">${escapeHtml(initials(item.name))}</div>`}<div class="item-body"><strong>Panel ${panelNumber} dari 3 · ${escapeHtml(item.name)}</strong><span>${escapeHtml(item.roleId)} · ${escapeHtml(item.status)} · ${photos.length} foto</span><p>${escapeHtml(item.messageId)}</p><div class="item-actions"><button class="edit" type="button">Edit panel ${panelNumber}</button><button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`; }).join('');
}
async function load() { items.innerHTML = '<p>Memuat Exhibition Match…</p>'; greetings = (await adminRequest('/admin/exhibition-matches')).data; render(); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('.primary');
  const current = greetings.find(item => item.id === field('id').value);
  let uploaded;
  button.disabled = true;
  try {
    let photoStoragePaths = current?.photoStoragePaths || (current?.photoStoragePath ? [current.photoStoragePath] : []);
    const files = croppedFiles.length ? croppedFiles : [...field('photo').files];
    if (files.length) {
      setStatus(`Mengunggah ${files.length} foto panel…`);
      uploaded = { storagePaths: [] };
      for (const file of files) uploaded.storagePaths.push((await adminRequest('/admin/media/images', { method:'POST', body:file, headers:{ 'Content-Type':file.type, 'X-Media-Folder':'greetings' } })).data.storagePath);
      photoStoragePaths = uploaded.storagePaths;
    }
    const payload = { name:field('name').value.trim(), roleId:field('roleId').value.trim(), roleEn:field('roleEn').value.trim(), messageId:field('messageId').value.trim(), messageEn:field('messageEn').value.trim(), photoStoragePaths, sortOrder:Number(field('sortOrder').value), status:field('status').value };
    await adminRequest(current ? `/admin/exhibition-matches/${current.id}` : '/admin/exhibition-matches', { method:current ? 'PUT' : 'POST', body:JSON.stringify(payload) });
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
      for (const name of ['id','name','roleId','roleEn','messageId','messageEn','status']) field(name).value = item[name] ?? '';
      field('sortOrder').value = Math.min(3, Math.max(1, Number(item.sortOrder) || 1));
      document.querySelector('#form-title').textContent = 'Edit Exhibition Match'; cancel.hidden = false; form.scrollIntoView({ behavior:'smooth' }); return;
    }
    if (event.target.closest('.toggle')) await adminRequest(`/admin/exhibition-matches/${item.id}`, { method:'PUT', body:JSON.stringify({ ...item, status:item.status === 'published' ? 'draft' : 'published' }) });
    if (event.target.closest('.danger')) {
      if (!confirm(`Hapus Exhibition Match “${item.name}”?`)) return;
      await adminRequest(`/admin/exhibition-matches/${item.id}`, { method:'DELETE' });
      for (const storagePath of (item.photoStoragePaths || (item.photoStoragePath ? [item.photoStoragePath] : []))) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) });
    }
    await load();
  } catch (error) { setStatus(error.message, true); }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', () => load().catch(error => setStatus(error.message, true)));
document.querySelector('#logout-button').addEventListener('click', () => { clearAdminSession(); location.replace('admin-login.html'); });
if (await requireAdmin()) load().catch(error => setStatus(error.message, true));
