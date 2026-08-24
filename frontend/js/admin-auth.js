import { initializeAdminI18n } from './admin-i18n.js';
export { API_BASE } from './api-config.js';
import { API_BASE } from './api-config.js';

const SESSION_KEY = 'bridgestone_admin_session';

// Older workspace modules still bind their logout handler during startup.
// Keep a hidden compatibility target when navigation intentionally omits it.
if (/\/pages\/admin-(?!login|reset-password)/.test(location.pathname)
  && !document.querySelector('#logout-button')) {
  const compatibilityLogout = document.createElement('button');
  compatibilityLogout.id = 'logout-button';
  compatibilityLogout.type = 'button';
  compatibilityLogout.hidden = true;
  compatibilityLogout.setAttribute('aria-hidden', 'true');
  document.body.append(compatibilityLogout);
}

const workspaceCopy = {
  'admin-standings.html': ['PENGATURAN GRUP & KLASEMEN', 'Pengaturan Grup & Klasemen — Bridgestone Cup'],
  'admin-top-scorers.html': ['PENGATURAN TOP SCORER FUTSAL', 'Pengaturan Top Scorer Futsal — Bridgestone Cup'],
  'admin-fishing.html': ['PENGATURAN FISHING', 'Pengaturan Fishing — Bridgestone Cup'],
  'admin-gallery.html': ['PENGATURAN GALERI', 'Pengaturan Galeri — Bridgestone Cup'],
  'admin-greetings.html': ['PENGATURAN SAMBUTAN', 'Pengaturan Sambutan — Bridgestone Cup'],
  'admin-support.html': ['PENGATURAN PESAN DUKUNGAN', 'Pengaturan Pesan Dukungan — Bridgestone Cup'],
  'admin-announcements.html': ['PENGATURAN PENGUMUMAN', 'Pengaturan Pengumuman — Bridgestone Cup'],
};

const workspaceFile = location.pathname.split('/').pop();
const activeWorkspaceCopy = workspaceCopy[workspaceFile];
if (activeWorkspaceCopy) {
  const heading = document.querySelector('main > header h1');
  if (heading) heading.textContent = activeWorkspaceCopy[0];
  document.title = activeWorkspaceCopy[1];
}

const adminTermReplacements = new Map([
  ['MANUAL ENTRY', 'INPUT MANUAL'],
  ['TEAM PAIRS / BRACKET', 'TIM & PEMANCING'],
  ['RANKING & WINNER', 'PERINGKAT & PEMENANG'],
  ['MEDIA LIBRARY', 'FOTO TERSIMPAN'],
  ['GREETING LIBRARY', 'SAMBUTAN TERSIMPAN'],
  ['SUPPORT LIBRARY', 'PESAN DUKUNGAN TERSIMPAN'],
  ['ANNOUNCEMENT LIBRARY', 'PENGUMUMAN TERSIMPAN'],
  ['GROUP TO BRACKET', 'PESERTA LOLOS KE BRACKET'],
]);

document.querySelectorAll('main small').forEach(label => {
  const replacement = adminTermReplacements.get(label.textContent.trim());
  if (replacement) label.textContent = replacement;
});

initializeAdminI18n();

let browserConfig = null;
let refreshPromise = null;

export function getAdminSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveAdminSession(payload) {
  const expiresAt = payload.expires_at
    ? Number(payload.expires_at) * 1000
    : Date.now() + Number(payload.expires_in || 3600) * 1000;
  const session = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function getBrowserConfig() {
  if (browserConfig) return browserConfig;
  if (!API_BASE) throw new Error('URL backend belum dikonfigurasi.');
  const response = await fetch(`${API_BASE}/config`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || 'Konfigurasi login gagal dimuat.');
  const { supabaseUrl, supabasePublishableKey } = payload.data || {};
  if (!supabaseUrl || !supabasePublishableKey) throw new Error('Konfigurasi login Supabase belum tersedia.');
  browserConfig = { supabaseUrl, supabasePublishableKey };
  return browserConfig;
}

async function refreshAdminSession() {
  if (refreshPromise) return refreshPromise;
  const session = getAdminSession();
  if (!session?.refreshToken) throw new Error('Sesi admin sudah berakhir.');
  refreshPromise = (async () => {
    const { supabaseUrl, supabasePublishableKey } = await getBrowserConfig();
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method:'POST',
      headers:{ apikey:supabasePublishableKey, 'Content-Type':'application/json' },
      body:JSON.stringify({ refresh_token:session.refreshToken }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.access_token) {
      clearAdminSession();
      throw new Error('Sesi admin sudah berakhir. Silakan masuk kembali.');
    }
    return saveAdminSession(payload);
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function validSession() {
  const session = getAdminSession();
  if (!session?.accessToken) return null;
  if (session.expiresAt && session.expiresAt - Date.now() < 60_000) return refreshAdminSession();
  return session;
}

export async function adminRequest(path, options = {}, allowRetry = true) {
  if (!API_BASE) throw new Error('URL backend belum dikonfigurasi.');
  const session = await validSession();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers:{
      ...(options.body ? { 'Content-Type':'application/json' } : {}),
      ...(session?.accessToken ? { Authorization:`Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (response.status === 401 && allowRetry && getAdminSession()?.refreshToken) {
    await refreshAdminSession();
    return adminRequest(path, options, false);
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAdminSession();
    throw new Error(payload?.message || `Request gagal (${response.status})`);
  }
  return payload;
}

export async function requireAdmin() {
  if (!getAdminSession()) {
    location.replace('admin-login.html');
    return null;
  }
  try {
    return (await adminRequest('/admin/me')).data;
  } catch {
    location.replace('admin-login.html');
    return null;
  }
}

export async function signInAdmin(email, password) {
  const { supabaseUrl, supabasePublishableKey } = await getBrowserConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method:'POST',
    headers:{ apikey:supabasePublishableKey, 'Content-Type':'application/json' },
    body:JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) throw new Error('Email atau password salah.');
  saveAdminSession(payload);
  const currentAdmin = await requireAdmin();
  if (!currentAdmin) {
    clearAdminSession();
    throw new Error('Akun ini tidak memiliki akses admin aktif.');
  }
  return currentAdmin;
}

export async function requestAdminPasswordReset(email, redirectTo) {
  const { supabaseUrl, supabasePublishableKey } = await getBrowserConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method:'POST',
    headers:{ apikey:supabasePublishableKey, 'Content-Type':'application/json' },
    body:JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.msg || payload?.message || 'Email reset gagal dikirim.');
}

export async function updateAdminPassword(accessToken, password) {
  const { supabaseUrl, supabasePublishableKey } = await getBrowserConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method:'PUT',
    headers:{ apikey:supabasePublishableKey, Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ password }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.msg || payload?.message || 'Password gagal diperbarui. Link mungkin sudah kedaluwarsa.');
  clearAdminSession();
  return payload;
}
