import './analytics.js?v=20260828-ga1';
import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE as apiBase } from './api-config.js';
import { loadCompetitionFormat, withOptionalStanding } from './competition-format.js';
import {
  apiBracketView,
  bracketWinnerView,
  scheduleView,
  shell,
  standingView,
} from './sports.js?v=20260821-empty-bracket';

const host = document.querySelector('#sport-view');
let groups = [];
let liveBracket = null;
let topScorers = [];
let standingSource = 'empty';
let bracketSource = 'empty';
let scorerSource = 'empty';
let groupMatches = [];

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

const emptyState = title => `
  <div class="public-empty-state">
    <strong>${escapeHtml(title)}</strong>
  </div>`;

function scorers() {
  const content = topScorers.length
    ? topScorers.map((player, index) => `
        <article><b>${String(index + 1).padStart(2, '0')}</b><strong>${escapeHtml(player.name)}</strong><span>${player.goals} GOALS${player.team ? ` &bull; ${escapeHtml(player.team)}` : ''}</span></article>`).join('')
    : emptyState('TOP SCORER BELUM TERSEDIA');
  return `<aside class="top-scorers" data-source="${scorerSource}"><header><span>PLAYER RANKING</span><h2>TOP SCORER</h2></header><div>${content}</div></aside>`;
}

function render(id) {
  if (id === 'group-standing') {
    host.dataset.source = standingSource;
    host.innerHTML = standingView(groups);
    return;
  }
  if (id === 'schedule') {
    host.dataset.source = groupMatches.length ? 'api' : 'empty';
    const rows = groupMatches.filter(match => match.scheduledAt).sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).map(match => {
      const date = new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',timeZone:'Asia/Jakarta'}).format(new Date(match.scheduledAt)).toUpperCase();
      const time = new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date(match.scheduledAt)).replace('.',':');
      return [`${date} • ${time} WIB`, match.home, match.away, `${match.groupName}${match.venue ? ` • ${match.venue}` : ''}`];
    });
    host.innerHTML = scheduleView(rows);
    return;
  }
  if (id === 'winner') {
    host.dataset.source = bracketSource;
    host.innerHTML = liveBracket
      ? bracketWinnerView('FUTSAL WINNERS', liveBracket)
      : emptyState('HASIL BELUM TERSEDIA');
    return;
  }
  host.dataset.source = bracketSource;
  const bracket = liveBracket
    ? apiBracketView('TOURNAMENT BRACKET', liveBracket)
    : emptyState('BRACKET BELUM TERSEDIA');
  host.innerHTML = `${bracket}${scorers()}`;
}

const competitionFormat=await loadCompetitionFormat('futsal');
shell('Futsal', withOptionalStanding(competitionFormat,[
  { id: 'bracket', label: 'Bracket' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'winner', label: 'Winner Futsal' },
]), render);

if (apiBase) {
  Promise.allSettled([
    fetch(`${apiBase}/tournaments/futsal-bp-2026/standings`).then(response => response.ok ? response.json() : Promise.reject()),
    fetch(`${apiBase}/tournaments/futsal-bp-2026/bracket`).then(response => response.ok ? response.json() : Promise.reject()),
    fetch(`${apiBase}/tournaments/futsal-bp-2026/top-scorers`).then(response => response.ok ? response.json() : Promise.reject()),
    fetch(`${apiBase}/tournaments/futsal-bp-2026/group-matches`).then(response => response.ok ? response.json() : Promise.reject()),
  ]).then(([standingResult, bracketResult, scorerResult, groupMatchResult]) => {
    const standingData = standingResult.status === 'fulfilled' ? standingResult.value.data : null;
    if (standingData?.length) {
      groups = standingData.map(group => group.rows.map(row => [row.name, row.points]));
      standingSource = 'api';
    }
    if (bracketResult.status === 'fulfilled' && bracketResult.value.data) {
      liveBracket = bracketResult.value.data;
      bracketSource = 'api';
    }
    if (scorerResult.status === 'fulfilled') {
      topScorers = scorerResult.value.data || [];
      scorerSource = topScorers.length ? 'api' : 'empty';
    }
    if (groupMatchResult.status === 'fulfilled') groupMatches = groupMatchResult.value.data || [];
    const requestedView=location.hash.slice(1);render(!competitionFormat.usesGroupStage&&requestedView==='group-standing'?'bracket':requestedView||(competitionFormat.usesGroupStage?'group-standing':'bracket'));
  });
}
import './analytics.js';
