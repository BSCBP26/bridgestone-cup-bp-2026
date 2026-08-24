import { requestAdminPasswordReset, updateAdminPassword } from './admin-auth.js?v=20260809-reset-flow';

const requestForm = document.querySelector('#request-reset-form');
const updateForm = document.querySelector('#update-password-form');
const status = document.querySelector('#reset-status');
const title = document.querySelector('#reset-title');
const description = document.querySelector('#reset-description');
const hash = new URLSearchParams(location.hash.slice(1));
const recoveryToken = hash.get('access_token');
const recoveryType = hash.get('type');
const recoveryError = hash.get('error_description') || hash.get('error');

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error' : ''; }
function setButtonBusy(form, busy) { form.querySelector('button').disabled = busy; }

if (recoveryToken && recoveryType === 'recovery') {
  requestForm.hidden = true;
  updateForm.hidden = false;
  title.textContent = 'BUAT PASSWORD BARU';
  description.textContent = 'Masukkan password baru minimal 8 karakter.';
  history.replaceState(null, '', location.pathname);
} else if (recoveryError) {
  setStatus(`Link reset tidak valid atau kedaluwarsa. ${recoveryError}`, true);
}

requestForm.addEventListener('submit', async event => {
  event.preventDefault(); setButtonBusy(requestForm, true); setStatus('Mengirim email reset…');
  try {
    await requestAdminPasswordReset(requestForm.email.value.trim(), `${location.origin}${location.pathname}`);
    setStatus('Link reset sudah dikirim. Silakan periksa inbox atau folder spam email admin.');
  } catch (error) { setStatus(error.message, true); }
  finally { setButtonBusy(requestForm, false); }
});

updateForm.addEventListener('submit', async event => {
  event.preventDefault();
  const password = updateForm.password.value;
  if (password !== updateForm.confirmPassword.value) { setStatus('Konfirmasi password tidak sama.', true); return; }
  setButtonBusy(updateForm, true); setStatus('Menyimpan password baru…');
  try {
    await updateAdminPassword(recoveryToken, password);
    updateForm.hidden = true; title.textContent = 'PASSWORD BERHASIL DIUBAH';
    description.textContent = 'Gunakan password baru untuk masuk ke dashboard admin.'; setStatus('Password baru berhasil disimpan.');
  } catch (error) { setStatus(error.message, true); }
  finally { setButtonBusy(updateForm, false); }
});
