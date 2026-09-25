import './analytics.js';
import './public-i18n.js';
import { API_BASE } from './api-config.js';
import { shell } from './sports.js';

const host = document.querySelector('#running-dashboard');
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const formatKm = value => `${new Intl.NumberFormat('id-ID', { maximumFractionDigits:2 }).format(value)} KM`;
const formatPace = seconds => { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')} /KM`; };
const formatDuration = seconds => [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
const runnerUrl = name => `running-runner.html?name=${encodeURIComponent(name)}`;
const runnerLink = name => `<a class="runner-link" href="${runnerUrl(name)}">${escapeHtml(name)}<span aria-hidden="true">→</span></a>`;
const dateLabel = date => new Intl.DateTimeFormat('id-ID', { day:'2-digit', month:'short', year:'numeric', timeZone:'Asia/Jakarta' }).format(new Date(`${date}T00:00:00+07:00`));
const leader = (title, rows, value) => `<section class="running-leader"><header><small>RUNNING CLUB</small><h2>${title}</h2></header><ol>${rows.length ? rows.map((row, index) => `<li><b>${String(index + 1).padStart(2, '0')}</b><strong>${runnerLink(row.name)}</strong><span>${value(row)}</span></li>`).join('') : '<li><strong>Belum ada data</strong></li>'}</ol></section>`;

function lineChartMarkup(runners) {
  const visible = runners.slice(0, 12);
  const width = 1000; const height = 300; const left = 55; const right = 30; const top = 38; const bottom = 62;
  const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const maximum = Math.max(...visible.map(row => row.totalKm), 1);
  const points = visible.map((row, index) => ({ ...row, x:left + (visible.length === 1 ? plotWidth / 2 : index * plotWidth / (visible.length - 1)), y:top + plotHeight - row.totalKm / maximum * plotHeight }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L ${points.at(-1).x.toFixed(1)} ${(top + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(top + plotHeight).toFixed(1)} Z` : '';
  const grid = [0,.25,.5,.75,1].map(step => { const y=top+plotHeight*step; const value=maximum*(1-step); return `<g class="chart-grid"><line x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="${left-12}" y="${y+4}" text-anchor="end">${value.toFixed(0)}</text></g>`; }).join('');
  const nodes = points.map((point,index) => `<a href="${runnerUrl(point.name)}" class="line-point"><title>${escapeHtml(`${point.name}: ${formatKm(point.totalKm)}`)}</title><circle cx="${point.x}" cy="${point.y}" r="6"/><circle class="point-hit" cx="${point.x}" cy="${point.y}" r="18"/><text class="point-value" x="${point.x}" y="${point.y-16}" text-anchor="middle">${point.totalKm.toFixed(1)}</text><text class="point-name" x="${point.x}" y="${height-25}" text-anchor="middle">${escapeHtml(point.name.split(' ')[0])}</text><text class="point-rank" x="${point.x}" y="${height-9}" text-anchor="middle">#${index+1}</text></a>`).join('');
  return `<section class="running-chart-panel"><header class="running-chart-head"><div><small>KLASEMEN RUNNING CLUB</small><h2>TOTAL KM PESERTA</h2><p>Perbandingan jarak total 12 pelari teratas. Klik titik atau nama untuk melihat dashboard peserta.</p></div><span class="chart-total">${visible.length} PELARI TERATAS</span></header><div class="running-chart-scroll"><svg class="running-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart klasemen berdasarkan total kilometer"><defs><linearGradient id="runningArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b33f" stop-opacity=".32"/><stop offset="1" stop-color="#e4b33f" stop-opacity="0"/></linearGradient><filter id="pointGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${grid}<path class="line-area" d="${area}"/><path class="line-path" d="${line}"/>${nodes}</svg></div><footer><span class="chart-legend-dot"></span>Total KM kumulatif &nbsp;·&nbsp; Arahkan kursor untuk melihat detail.</footer></section>`;
}

function tableRows(rows) { return rows.length ? rows.map((row,index) => `<tr><td>${String(index+1).padStart(2,'0')}</td><td>${runnerLink(row.name)}</td><td>${formatKm(row.totalKm)}</td><td>${formatPace(row.fastestPaceSeconds)}</td><td>${row.activities}</td></tr>`).join('') : '<tr><td colspan="5">Pelari tidak ditemukan.</td></tr>'; }
function activityRows(rows) { return rows.length ? rows.map(row => `<tr><td>${runnerLink(row.name)}</td><td>${dateLabel(row.date)}</td><td>${formatKm(row.distanceKm)}</td><td>${formatDuration(row.durationSeconds)}</td><td>${formatPace(row.paceSeconds)}</td><td><span class="recorded-status">Tercatat</span></td></tr>`).join('') : '<tr><td colspan="6">Aktivitas tidak ditemukan.</td></tr>'; }

function dailyChartMarkup(daily) {
  const visible = [...daily].sort((a,b) => b.date.localeCompare(a.date)).slice(0,14);
  if (!visible.length) return '<section class="running-chart-panel running-empty">Belum ada aktivitas.</section>';
  const width=1000, height=300, left=55, right=30, top=38, bottom=62;
  const plotWidth=width-left-right, plotHeight=height-top-bottom;
  const maximum=Math.max(...visible.map(row=>row.totalKm),1);
  const points=visible.map((row,index)=>({...row,x:left+(visible.length===1?plotWidth/2:index*plotWidth/(visible.length-1)),y:top+plotHeight-row.totalKm/maximum*plotHeight}));
  const line=points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area=`${line} L ${points.at(-1).x.toFixed(1)} ${top+plotHeight} L ${points[0].x.toFixed(1)} ${top+plotHeight} Z`;
  const grid=[0,.25,.5,.75,1].map(step=>{const y=top+plotHeight*step;return `<g class="chart-grid"><line x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="${left-12}" y="${y+4}" text-anchor="end">${(maximum*(1-step)).toFixed(0)}</text></g>`}).join('');
  const nodes=points.map(point=>`<g class="daily-point" role="button" tabindex="0" aria-pressed="false" aria-label="Tampilkan ${point.activities} aktivitas pada ${escapeHtml(dateLabel(point.date))}, total ${escapeHtml(formatKm(point.totalKm))}" data-activity-date="${point.date}"><title>${escapeHtml(`${dateLabel(point.date)}: ${formatKm(point.totalKm)}, ${point.activities} aktivitas`)}</title><rect class="daily-hit" x="${point.x-25}" y="${top-10}" width="50" height="${height-top+10}"/><circle class="daily-dot" cx="${point.x}" cy="${point.y}" r="6"/><text x="${point.x}" y="${height-18}" text-anchor="middle">${escapeHtml(new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'Asia/Jakarta'}).format(new Date(`${point.date}T00:00:00+07:00`)))}</text></g>`).join('');
  return `<section class="running-chart-panel"><header class="running-chart-head"><div><small>AKTIVITAS RUNNING CLUB</small><h2>JARAK HARIAN</h2><p>Tanggal terbaru di kiri. Klik titik tanggal untuk melihat aktivitas pelari pada hari itu.</p></div><span class="chart-total">${visible.length} TANGGAL TERAKHIR</span></header><div class="running-chart-scroll"><svg class="running-chart" viewBox="0 0 ${width} ${height}" role="group" aria-label="Grafik total kilometer aktivitas per tanggal"><defs><linearGradient id="dailyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b33f" stop-opacity=".32"/><stop offset="1" stop-color="#e4b33f" stop-opacity="0"/></linearGradient></defs>${grid}<path class="daily-area" d="${area}"/><path class="line-path" d="${line}"/>${nodes}</svg></div><footer><span class="chart-legend-dot"></span>Total KM per tanggal &nbsp;·&nbsp; Klik titik untuk menyaring daftar.</footer></section>`;
}

function render(data) {
  const { summary, leaders, runners, daily=[], activities=[] } = data;
  const sortedActivities=[...activities].sort((a,b)=>b.date.localeCompare(a.date));
  const recentActivities=sortedActivities.slice(0,12);
  host.innerHTML = `<header class="running-hero"><div><p class="running-kicker">BRIDGESTONE CUP BP 2026</p><h1>RUNNING DASHBOARD</h1></div><p>Pantau perjalanan setiap pelari, dari total jarak hingga pace terbaik dan konsistensi latihan.</p></header>
  <section class="running-summary"><article class="running-stat"><small>TOTAL JARAK</small><strong>${formatKm(summary.totalKm)}</strong><span>akumulasi seluruh aktivitas</span></article><article class="running-stat"><small>PELARI TERDAFTAR</small><strong>${summary.runners}</strong><span>pelari terdaftar</span></article><article class="running-stat"><small>AKTIVITAS</small><strong>${summary.activities}</strong><span>catatan lari tervalidasi</span></article></section>
  <nav class="running-section-tabs" aria-label="Tampilan dashboard Running"><button type="button" class="running-section-tab is-active" data-running-view="standings" aria-pressed="true">KLASEMEN</button><button type="button" class="running-section-tab" data-running-view="recent" aria-pressed="false">AKTIVITAS TERBARU</button></nav>
  <div id="running-standings-view">${lineChartMarkup(runners)}
  <section class="running-leaders">${leader('KM TERBANYAK',leaders.distance,row=>formatKm(row.totalKm))}${leader('PACE TERCEPAT',leaders.pace,row=>formatPace(row.fastestPaceSeconds))}${leader('PELARI TERAJIN',leaders.consistency,row=>`${row.activities} AKTIVITAS`)}</section>
  <section class="running-table-panel"><header class="running-table-head"><div><small>SEMUA PESERTA</small><h2>KLASEMEN PELARI</h2></div><input id="runner-search" class="running-search" type="search" placeholder="Cari nama pelari" aria-label="Cari nama pelari"></header><div class="running-table-scroll"><table class="running-table"><thead><tr><th>RANK</th><th>NAMA PELARI</th><th>TOTAL KM</th><th>PACE TERCEPAT</th><th>AKTIVITAS</th></tr></thead><tbody id="runner-rows">${tableRows(runners)}</tbody></table></div></section>
  <section id="activity-results" class="running-table-panel activity-results" hidden><header class="running-table-head"><div><small>HASIL PENCARIAN</small><h2>AKTIVITAS PESERTA</h2><p id="activity-result-copy"></p></div></header><div class="running-table-scroll"><table class="running-table activity-table"><thead><tr><th>PELARI</th><th>TANGGAL</th><th>JARAK</th><th>DURASI</th><th>PACE</th><th>STATUS</th></tr></thead><tbody id="activity-rows"></tbody></table></div></section></div>
  <div id="running-recent-view" hidden>${dailyChartMarkup(daily)}<section class="running-table-panel"><header class="running-table-head"><div><small>CATATAN TERBARU</small><h2 id="recent-activity-title">AKTIVITAS TERBARU</h2><p id="recent-activity-copy" aria-live="polite">${recentActivities.length} aktivitas terbaru berdasarkan tanggal.</p></div><button id="clear-activity-date" class="clear-activity-date" type="button" hidden>SEMUA TANGGAL</button></header><div class="running-table-scroll"><table class="running-table activity-table"><thead><tr><th>PELARI</th><th>TANGGAL</th><th>JARAK</th><th>DURASI</th><th>PACE</th><th>STATUS</th></tr></thead><tbody id="recent-activity-rows">${activityRows(recentActivities)}</tbody></table></div></section></div>`;
  const recentView=host.querySelector('#running-recent-view');
  function selectActivityDate(date) {
    const rows=date?sortedActivities.filter(row=>row.date===date):recentActivities;
    recentView.querySelector('#recent-activity-title').textContent=date?`AKTIVITAS ${dateLabel(date).toUpperCase()}`:'AKTIVITAS TERBARU';
    recentView.querySelector('#recent-activity-copy').textContent=date?`${rows.length} aktivitas tercatat pada ${dateLabel(date)}.`:`${rows.length} aktivitas terbaru berdasarkan tanggal.`;
    recentView.querySelector('#recent-activity-rows').innerHTML=activityRows(rows);
    recentView.querySelector('#clear-activity-date').hidden=!date;
    recentView.querySelectorAll('[data-activity-date]').forEach(point=>{const selected=point.dataset.activityDate===date;point.classList.toggle('is-selected',selected);point.setAttribute('aria-pressed',String(selected));});
  }
  recentView.querySelectorAll('[data-activity-date]').forEach(point=>{
    point.addEventListener('click',()=>selectActivityDate(point.dataset.activityDate));
    point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectActivityDate(point.dataset.activityDate);}});
  });
  recentView.querySelector('#clear-activity-date').addEventListener('click',()=>selectActivityDate(null));
  host.querySelectorAll('[data-running-view]').forEach(button=>button.addEventListener('click',()=>{
    const recent=button.dataset.runningView==='recent';
    host.querySelector('#running-standings-view').hidden=recent;
    host.querySelector('#running-recent-view').hidden=!recent;
    host.querySelectorAll('[data-running-view]').forEach(tab=>{const active=tab===button;tab.classList.toggle('is-active',active);tab.setAttribute('aria-pressed',String(active));});
  }));
  document.querySelector('#runner-search').addEventListener('input', event => {
    const needle=event.target.value.trim().toLocaleLowerCase('id-ID');
    const matchingRunners=runners.filter(row=>row.name.toLocaleLowerCase('id-ID').includes(needle));
    document.querySelector('#runner-rows').innerHTML=tableRows(matchingRunners);
    const panel=document.querySelector('#activity-results'); panel.hidden=!needle; if(!needle)return;
    const matchingActivities=activities.filter(row=>row.name.toLocaleLowerCase('id-ID').includes(needle));
    document.querySelector('#activity-result-copy').textContent=`${matchingActivities.length} aktivitas dari ${matchingRunners.length} peserta ditemukan.`;
    document.querySelector('#activity-rows').innerHTML=activityRows(matchingActivities);
  });
}

shell('Running', [{id:'leaderboard',label:'Leaderboard'}],()=>{});
fetch(`${API_BASE}/running/dashboard`).then(response=>response.ok?response.json():Promise.reject()).then(payload=>render(payload.data)).catch(()=>{host.innerHTML='<div class="running-empty">DASHBOARD RUNNING BELUM DAPAT DIMUAT</div>';});
