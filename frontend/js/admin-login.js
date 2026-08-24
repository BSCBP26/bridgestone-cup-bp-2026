import { getAdminSession, requireAdmin, signInAdmin } from './admin-auth.js';

const form = document.querySelector('#login-form');
const status = document.querySelector('#login-status');

if (getAdminSession()) {
  const current = await requireAdmin();
  if (current) location.replace('admin.html');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Memeriksa akun…';
  status.className = '';
  try {
    await signInAdmin(form.email.value.trim(), form.password.value);
    location.replace('admin.html');
  } catch (error) {
    status.textContent = error.message;
    status.className = 'error';
    button.disabled = false;
  }
});
