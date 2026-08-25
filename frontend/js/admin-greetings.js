import { adminRequest, clearAdminSession, requireAdmin } from './admin-auth.js';

const form = document.querySelector('#greeting-form');
const status = document.querySelector('#form-status');
const items = document.querySelector('#greeting-items');
const cancel = document.querySelector('#cancel-edit');
let greetings = [];
const field = name => form.elements.namedItem(name);
const photoPreview = document.createElement('div');
photoPreview.className = 'photo-preview';
photoPreview.setAttribute('aria-live', 'polite');
field('photo').insertAdjacentElement('afterend', photoPreview);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const cropModal = document.querySelector('#crop-modal');
const cropCanvas = document.querySelector('#crop-canvas');
const cropCounter = document.querySelector('#crop-counter');
const cropStage = document.querySelector('.crop-stage');
const cropBox = document.createElement('div'); cropBox.className = 'crop-box'; cropBox.innerHTML = '<i data-resize="nw"></i><i data-resize="ne"></i><i data-resize="sw"></i><i data-resize="se"></i>'; cropStage.append(cropBox);
let cropQueue = [], croppedFiles = [], cropIndex = 0, cropImage = null, cropSelection = null, dragStart = null, cropMode = 'move', appendPhotos = false;
function renderPhotoPreview() {
  photoPreview.innerHTML = croppedFiles.length ? croppedFiles.map((file, index) => `<div class="photo-preview-item"><img src="${URL.createObjectURL(file)}" alt="Foto siap upload ${index + 1}"><span>${index + 1}</span></div>`).join('') : '';
}
async function saveCroppedPhotosDirectly() {
  const current = greetings.find(item => item.id === field('id').value);
  if (!appendPhotos || !current || !croppedFiles.length) return false;
  const button = form.querySelector('.primary'); button.disabled = true;
  try {
    setStatus(`Mengunggah ${croppedFiles.length} foto ke draft…`);
    const existing = current.photoStoragePaths || (current.photoStoragePath ? [current.photoStoragePath] : []);
    const uploaded = [];
    for (const file of croppedFiles) uploaded.push((await adminRequest('/admin/media/images', { method:'POST', body:file, headers:{ 'Content-Type':file.type, 'X-Media-Folder':'greetings' } })).data.storagePath);
    await adminRequest(`/admin/exhibition-matches/${current.id}`, { method:'PUT', body:JSON.stringify({ ...current, photoStoragePaths:existing.concat(uploaded).slice(0, 5) }) });
    setStatus('Foto berhasil ditambahkan ke draft panel.');
    croppedFiles = []; appendPhotos = false; field('id').value = ''; field('photo').value = ''; renderPhotoPreview(); await load();
    return true;
  } catch (error) { setStatus(error.message, true); return false; } finally { button.disabled = false; }
}
function syncCropBox() { if (!cropSelection) return; cropBox.style.left = `${cropSelection.x / cropCanvas.width * 100}%`; cropBox.style.top = `${cropSelection.y / cropCanvas.height * 100}%`; cropBox.style.width = `${cropSelection.w / cropCanvas.width * 100}%`; cropBox.style.height = `${cropSelection.h / cropCanvas.height * 100}%`; }
function drawCrop() { if (!cropImage) return; const ctx = cropCanvas.getContext('2d'); const base = Math.min(cropCanvas.width / cropImage.width, cropCanvas.height / cropImage.height); const drawWidth = cropImage.width * base; const drawHeight = cropImage.height * base; const dx = (cropCanvas.width - drawWidth) / 2; const dy = (cropCanvas.height - drawHeight) / 2; ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height); ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height); ctx.drawImage(cropImage, dx, dy, drawWidth, drawHeight); syncCropBox(); }
async function openCropQueue(files) { cropQueue = files.slice(0, 5); croppedFiles = []; cropIndex = 0; cropModal.hidden = false; await showCrop(); }
async function showCrop() { if (cropIndex >= cropQueue.length) { cropModal.hidden = true; field('photo').value = ''; renderPhotoPreview(); if (await saveCroppedPhotosDirectly()) return; setStatus(`${croppedFiles.length} foto siap disimpan ke panel.`); return; } cropCounter.textContent = `Foto ${cropIndex + 1} dari ${cropQueue.length}: atur kotak crop`; cropImage = await createImageBitmap(cropQueue[cropIndex]); cropCanvas.width = 1200; cropCanvas.height = Math.max(675, Math.round(1200 * cropImage.height / cropImage.width)); cropSelection = { x:cropCanvas.width * .08, y:cropCanvas.height * .08, w:cropCanvas.width * .84, h:cropCanvas.height * .84 }; drawCrop(); }
function finishCrop(skip = false) { const file = cropQueue[cropIndex]; if (skip) { croppedFiles.push(file); cropIndex += 1; showCrop(); return; } const selection = cropSelection || { x:0, y:0, w:cropCanvas.width, h:cropCanvas.height }; const base = Math.min(cropCanvas.width / cropImage.width, cropCanvas.height / cropImage.height); const dx = (cropCanvas.width - cropImage.width * base) / 2; const dy = (cropCanvas.height - cropImage.height * base) / 2; const sx = Math.max(0, (selection.x - dx) / base); const sy = Math.max(0, (selection.y - dy) / base); const sw = Math.min(cropImage.width - sx, selection.w / base); const sh = Math.min(cropImage.height - sy, selection.h / base); const out = document.createElement('canvas'); out.width = 1200; out.height = 675; out.getContext('2d').drawImage(cropImage, sx, sy, sw, sh, 0, 0, out.width, out.height); out.toBlob(blob => { croppedFiles.push(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type:'image/jpeg' })); cropIndex += 1; showCrop(); }, 'image/jpeg', .9); }
cropBox.addEventListener('pointerdown', event => { event.stopPropagation(); cropBox.setPointerCapture(event.pointerId); const rect = cropCanvas.getBoundingClientRect(); const scale = cropCanvas.width / rect.width; dragStart = { x:event.clientX, y:event.clientY, selection:{...cropSelection} }; cropMode = event.target.dataset.resize || 'move'; });
cropBox.addEventListener('pointermove', event => { if (!dragStart) return; const rect = cropCanvas.getBoundingClientRect(); const scale = cropCanvas.width / rect.width; const dx = (event.clientX - dragStart.x) * scale; const dy = (event.clientY - dragStart.y) * scale; const s = dragStart.selection; let next = {...s}; if (cropMode === 'move') { next.x = Math.max(0, Math.min(cropCanvas.width-s.w, s.x+dx)); next.y = Math.max(0, Math.min(cropCanvas.height-s.h, s.y+dy)); } else { if (cropMode.includes('e')) next.w = Math.max(80, Math.min(cropCanvas.width-next.x, s.w+dx)); if (cropMode.includes('s')) next.h = Math.max(80, Math.min(cropCanvas.height-next.y, s.h+dy)); if (cropMode.includes('w')) { const nx=Math.max(0,Math.min(s.x+s.w-80,s.x+dx)); next.w=s.w-(nx-s.x); next.x=nx; } if (cropMode.includes('n')) { const ny=Math.max(0,Math.min(s.y+s.h-80,s.y+dy)); next.h=s.h-(ny-s.y); next.y=ny; } } cropSelection=next; syncCropBox(); });
cropBox.addEventListener('pointerup', () => { dragStart = null; }); cropBox.addEventListener('pointercancel', () => { dragStart = null; });
document.querySelector('#crop-apply').addEventListener('click', () => finishCrop(false));
document.querySelector('#crop-skip').addEventListener('click', () => finishCrop(true));
document.querySelector('#crop-cancel').addEventListener('click', () => { cropQueue = []; croppedFiles = []; appendPhotos = false; cropModal.hidden = true; field('photo').value = ''; renderPhotoPreview(); });
field('photo').addEventListener('change', () => { if (field('photo').files.length) openCropQueue([...field('photo').files]); });

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }
function resetForm() { form.reset(); field('id').value = ''; field('sortOrder').value = '1'; croppedFiles = []; appendPhotos = false; renderPhotoPreview(); document.querySelector('#form-title').textContent = 'Tambah Exhibition Match'; cancel.hidden = true; }
function render() {
  if (!greetings.length) { items.innerHTML = '<p>Belum ada Exhibition Match tersimpan.</p>'; return; }
  items.innerHTML = greetings.map(item => { const photos = item.photoUrls || (item.photoUrl ? [item.photoUrl] : []); const paths = item.photoStoragePaths || (item.photoStoragePath ? [item.photoStoragePath] : []); const panelNumber = Math.min(3, Math.max(1, Number(item.sortOrder) || 1)); return `<article class="item greeting-item" data-id="${item.id}">${photos.length ? `<div class="panel-photos">${photos.map((url, index) => `<div class="panel-photo"><img src="${escapeHtml(url)}" alt="Foto ${escapeHtml(item.name)}"><button class="remove-photo" type="button" data-photo-index="${index}" aria-label="Hapus foto ${index + 1}">×</button></div>`).join('')}</div>` : `<div class="placeholder">${escapeHtml(initials(item.name))}</div>`}<div class="item-body"><strong>Panel ${panelNumber} dari 3 · ${escapeHtml(item.name)}</strong><span>${escapeHtml(item.roleId)} · ${escapeHtml(item.status)} · ${photos.length} foto</span><p>${escapeHtml(item.messageId)}</p><div class="item-actions"><button class="edit" type="button">Edit panel ${panelNumber}</button>${photos.length < 5 ? '<button class="add-photo" type="button">+ Tambah foto</button>' : ''}<button class="toggle" type="button">${item.status === 'published' ? 'Jadikan draft' : 'Publish'}</button><button class="danger" type="button">Hapus</button></div></div></article>`; }).join('');
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
      photoStoragePaths = (appendPhotos ? photoStoragePaths : []).concat(uploaded.storagePaths).slice(0, 5);
    }
    const payload = { name:field('name').value.trim(), roleId:field('name').value.trim(), roleEn:'', messageId:field('messageId').value.trim(), messageEn:'', photoStoragePaths, sortOrder:Number(field('sortOrder').value), status:field('status').value };
    await adminRequest(current ? `/admin/exhibition-matches/${current.id}` : '/admin/exhibition-matches', { method:current ? 'PUT' : 'POST', body:JSON.stringify(payload) });
    if (uploaded && current?.photoStoragePaths?.length) for (const storagePath of current.photoStoragePaths) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) }).catch(() => {});
    setStatus(current ? 'Exhibition Match berhasil diperbarui.' : 'Exhibition Match berhasil disimpan.');
    appendPhotos = false; resetForm(); await load();
  } catch (error) {
    if (uploaded?.storagePaths) for (const storagePath of uploaded.storagePaths) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) }).catch(() => {});
    setStatus(error.message, true);
  } finally { button.disabled = false; }
});

items.addEventListener('click', async event => {
  const card = event.target.closest('.item'); if (!card) return;
  const item = greetings.find(entry => entry.id === card.dataset.id);
  try {
    if (event.target.closest('.remove-photo')) {
      const index = Number(event.target.closest('.remove-photo').dataset.photoIndex);
      const paths = item.photoStoragePaths || (item.photoStoragePath ? [item.photoStoragePath] : []);
      const [storagePath] = paths.splice(index, 1);
      if (!confirm('Hapus foto ini dari panel?')) return;
      await adminRequest(`/admin/exhibition-matches/${item.id}`, { method:'PUT', body:JSON.stringify({ ...item, photoStoragePaths:paths }) });
      if (storagePath) await adminRequest('/admin/media/images', { method:'DELETE', body:JSON.stringify({ storagePath }) }).catch(() => {});
      setStatus('Foto berhasil dihapus dari panel.'); await load(); return;
    }
    if (event.target.closest('.add-photo')) { appendPhotos = true; field('id').value = item.id; field('name').value = item.name || ''; field('messageId').value = item.messageId || ''; field('sortOrder').value = Math.min(3, Math.max(1, Number(item.sortOrder) || 1)); field('status').value = item.status || 'draft'; field('photo').click(); return; }
    if (event.target.closest('.edit')) {
      for (const name of ['id','name','messageId','status']) field(name).value = item[name] ?? '';
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
