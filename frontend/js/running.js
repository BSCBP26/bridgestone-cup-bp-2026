import './analytics.js';
import './public-i18n.js';
import { API_BASE } from './api-config.js';
import { shell } from './sports.js';

const host = document.querySelector('#running-dashboard');
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const formatKm = value => `${new Intl.NumberFormat('id-ID', { maximumFractionDigits:2 }).format(value)} KM`;
const formatPace = seconds => { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')} /KM`; };
const leader = (title, label, rows, value) => `<section class="running-leader"><header><small>RUNNING CLUB</small><h2>${title}</h2></header><ol>${rows.length ? rows.map((row, index) => `<li><b>${String(index + 1).padStart(2, '0')}</b><strong>${escapeHtml(row.name)}</strong><span>${value(row)}</span></li>`).join('') : '<li><strong>Belum ada data</strong></li>'}</ol></section>`;
function render(data) {
  const { summary, leaders, runners } = data;
  host.innerHTML = `<header class="running-hero"><div><p class="running-kicker">BRIDGESTONE CUP BP 2026</p><h1>RUNNING DASHBOARD</h1></div><p>Pantau perjalanan setiap pelari, dari total jarak hingga pace terbaik dan konsistensi latihan.</p></header>
  <section class="running-summary"><article class="running-stat"><small>TOTAL JARAK</small><strong>${formatKm(summary.totalKm)}</strong><span>akumulasi seluruh aktivitas</span></article><article class="running-stat"><small>PELARI TERDAFTAR</small><strong>${summary.runners}</strong><span>pelari terdaftar</span></article><article class="running-stat"><small>AKTIVITAS</small><strong>${summary.activities}</strong><span>catatan lari tervalidasi</span></article></section>
  <section class="running-leaders">${leader('KM TERBANYAK', 'Total KM', leaders.distance, row => formatKm(row.totalKm))}${leader('PACE TERCEPAT', 'Best pace', leaders.pace, row => formatPace(row.fastestPaceSeconds))}${leader('PELARI TERAJIN', 'Aktivitas', leaders.consistency, row => `${row.activities} AKTIVITAS`)}</section>
  <section class="running-table-panel"><header class="running-table-head"><h2>KLASEMEN PELARI</h2><input id="runner-search" class="running-search" type="search" placeholder="Cari nama pelari" aria-label="Cari nama pelari"></header><table class="running-table"><thead><tr><th>RANK</th><th>NAMA PELARI</th><th>TOTAL KM</th><th>PACE TERCEPAT</th><th>AKTIVITAS</th></tr></thead><tbody id="runner-rows">${tableRows(runners)}</tbody></table></section>`;
  document.querySelector('#runner-search').addEventListener('input', event => { const needle = event.target.value.trim().toLocaleLowerCase('id-ID'); document.querySelector('#runner-rows').innerHTML = tableRows(runners.filter(row => row.name.toLocaleLowerCase('id-ID').includes(needle))); });
}
function tableRows(rows) { return rows.length ? rows.map((row, index) => `<tr><td>${String(index + 1).padStart(2, '0')}</td><td>${escapeHtml(row.name)}</td><td>${formatKm(row.totalKm)}</td><td>${formatPace(row.fastestPaceSeconds)}</td><td>${row.activities}</td></tr>`).join('') : '<tr><td colspan="5">Pelari tidak ditemukan.</td></tr>'; }
shell('Running', [{ id:'leaderboard', label:'Leaderboard' }], () => {});
fetch(`${API_BASE}/running/dashboard`).then(response => response.ok ? response.json() : Promise.reject()).then(payload => render(payload.data)).catch(() => { host.innerHTML = '<div class="running-empty">DASHBOARD RUNNING BELUM DAPAT DIMUAT</div>'; });
