import './analytics.js';
import './public-i18n.js';
import { API_BASE } from './api-config.js';
import { shell } from './sports.js';

const host=document.querySelector('#runner-dashboard');
const name=new URLSearchParams(location.search).get('name')?.trim()||'';
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const formatKm=value=>`${new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(value)} KM`;
const formatPace=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} /KM`;
const formatDuration=seconds=>[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(value=>String(value).padStart(2,'0')).join(':');
const dateLabel=date=>new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${date}T00:00:00+07:00`));

function personalChart(activities){
  const chronological=[...activities].sort((a,b)=>a.date.localeCompare(b.date));
  const width=1000,height=300,left=55,right=30,top=38,bottom=62,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const maximum=Math.max(...chronological.map(row=>row.distanceKm),1);
  const points=chronological.map((row,index)=>({...row,x:left+(chronological.length===1?plotWidth/2:index*plotWidth/(chronological.length-1)),y:top+plotHeight-row.distanceKm/maximum*plotHeight}));
  const line=points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area=points.length?`${line} L ${points.at(-1).x.toFixed(1)} ${top+plotHeight} L ${points[0].x.toFixed(1)} ${top+plotHeight} Z`:'';
  const grid=[0,.25,.5,.75,1].map(step=>{const y=top+plotHeight*step;return `<g class="chart-grid"><line x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="${left-12}" y="${y+4}" text-anchor="end">${(maximum*(1-step)).toFixed(0)}</text></g>`}).join('');
  const nodes=points.map(point=>`<g class="line-point"><title>${escapeHtml(`${dateLabel(point.date)}: ${formatKm(point.distanceKm)}, pace ${formatPace(point.paceSeconds)}`)}</title><circle cx="${point.x}" cy="${point.y}" r="6"/><circle class="point-hit" cx="${point.x}" cy="${point.y}" r="18"/><text class="point-value" x="${point.x}" y="${point.y-16}" text-anchor="middle">${point.distanceKm.toFixed(1)}</text><text class="point-name" x="${point.x}" y="${height-17}" text-anchor="middle">${escapeHtml(dateLabel(point.date).replace(' 2026',''))}</text></g>`).join('');
  return `<section class="running-chart-panel personal-chart"><header class="running-chart-head"><div><small>PERJALANAN PESERTA</small><h2>JARAK PER AKTIVITAS</h2><p>Line chart perkembangan jarak lari berdasarkan tanggal aktivitas.</p></div><span class="chart-total">${activities.length} AKTIVITAS</span></header><div class="running-chart-scroll"><svg class="running-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart aktivitas ${escapeHtml(name)}"><defs><linearGradient id="runningArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b33f" stop-opacity=".32"/><stop offset="1" stop-color="#e4b33f" stop-opacity="0"/></linearGradient></defs>${grid}<path class="line-area" d="${area}"/><path class="line-path" d="${line}"/>${nodes}</svg></div></section>`;
}

function render(data){
  const runner=data.runners[0];const activities=data.activities||[];
  if(!runner){host.innerHTML='<div class="running-empty">DATA PELARI TIDAK DITEMUKAN</div>';return;}
  host.innerHTML=`<a class="runner-back" href="running.html">← KEMBALI KE KLASEMEN</a><header class="runner-profile"><div class="runner-avatar">${escapeHtml(runner.name.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase())}</div><div><p class="running-kicker">DASHBOARD PESERTA</p><h1>${escapeHtml(runner.name)}</h1><p>Ringkasan performa dan seluruh catatan aktivitas peserta.</p></div></header><section class="running-summary"><article class="running-stat"><small>TOTAL JARAK</small><strong>${formatKm(runner.totalKm)}</strong><span>akumulasi jarak</span></article><article class="running-stat"><small>PACE TERCEPAT</small><strong>${formatPace(runner.fastestPaceSeconds)}</strong><span>catatan terbaik</span></article><article class="running-stat"><small>AKTIVITAS</small><strong>${runner.activities}</strong><span>lari tercatat</span></article></section>${personalChart(activities)}<section class="running-table-panel"><header class="running-table-head"><div><small>RIWAYAT LARI</small><h2>SEMUA AKTIVITAS</h2></div></header><div class="running-table-scroll"><table class="running-table activity-table"><thead><tr><th>TANGGAL</th><th>JARAK</th><th>DURASI</th><th>PACE</th><th>STATUS</th></tr></thead><tbody>${activities.map(row=>`<tr><td>${dateLabel(row.date)}</td><td>${formatKm(row.distanceKm)}</td><td>${formatDuration(row.durationSeconds)}</td><td>${formatPace(row.paceSeconds)}</td><td><span class="recorded-status">Tercatat</span></td></tr>`).join('')}</tbody></table></div></section>`;
}

shell('Running',[{id:'leaderboard',label:'Leaderboard'}],()=>{});
if(!name){host.innerHTML='<div class="running-empty">NAMA PELARI BELUM DIPILIH</div>';}else{fetch(`${API_BASE}/running/dashboard?name=${encodeURIComponent(name)}`).then(response=>response.ok?response.json():Promise.reject()).then(payload=>render(payload.data)).catch(()=>{host.innerHTML='<div class="running-empty">DASHBOARD PESERTA BELUM DAPAT DIMUAT</div>';});}
