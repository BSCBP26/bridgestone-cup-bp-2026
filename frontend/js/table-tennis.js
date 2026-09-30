import './analytics.js?v=20260828-ga1';
import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE as apiBase } from './api-config.js';
import { loadTournamentCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { loadCategories, renderCategorySelector, selectedCategory, tournamentByCategory } from './competition-categories.js';
import { tableTennisGroupWinners } from './data/table-tennis-group-winners.js?v=20260930-podium';
import {
  apiBracketView,
  bracketWinnerView,
  shell,
  standingView,
} from './sports.js?v=20260930-mini-soccer';

const host = document.querySelector('#sport-view');
let groups = [];
let liveBracket = null;
let standingSource = 'empty';
let bracketSource = 'empty';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const groupWinnersView = () => `<section class="tt-group-winners score-layout"><article class="winner-panel"><header class="tt-winner-heading"><img src="../assets/images/trophy-gold.svg" alt="" width="72" height="72"><div><span>GROUP</span><h2>TABLE TENNIS WINNERS</h2></div></header><div class="tt-podium-list">${tableTennisGroupWinners.map(({rank,members}, index) => `<section class="tt-group-ranking tt-place-${index + 1}" aria-label="Juara ${escapeHtml(rank)}"><div class="tt-rank-emblem"><img src="../assets/images/trophy-gold.svg" alt="" width="42" height="42"><b>${escapeHtml(rank)}</b></div><div class="tt-roster"><h3>JUARA ${escapeHtml(rank)}</h3><ul>${members.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul></div></section>`).join('')}</div></article></section>`;

const emptyState = title => `
  <div class="public-empty-state">
    <strong>${title}</strong>
  </div>`;

function render(id) {
  if (id === 'winner-group') {
    host.dataset.source = 'owner';
    host.innerHTML = groupWinnersView();
    return;
  }
  if (id === 'group-standing') {
    host.dataset.source = standingSource;
    host.innerHTML = standingView(groups);
    return;
  }
  host.dataset.source = bracketSource;
  if (id === 'winner') {
    host.innerHTML = liveBracket
      ? bracketWinnerView('TABLE TENNIS WINNERS', liveBracket)
      : emptyState('HASIL BELUM TERSEDIA');
    return;
  }
  host.innerHTML = liveBracket
    ? apiBracketView('TABLE TENNIS CHAMPIONSHIP BRACKET', liveBracket)
    : emptyState('BRACKET BELUM TERSEDIA');
}

const categories=await loadCategories('table-tennis');
const category=selectedCategory(categories);
const tournamentId=tournamentByCategory['table-tennis'][category];
const competitionFormat=await loadTournamentCompetitionFormat(tournamentId);
shell('Table Tennis', withOptionalStanding(competitionFormat,[
  { id: 'bracket', label: 'Bracket' },
  { id: 'winner', label: 'Winner Table Tennis' },
  { id: 'winner-group', label: 'Winner Group' },
]), render);
renderCategorySelector(categories,category);
const groupCategory = document.createElement('nav');
groupCategory.className = 'competition-category-tabs tt-group-category';
groupCategory.setAttribute('aria-label', 'Kategori pertandingan');
groupCategory.innerHTML = '<a class="active" href="#winner-group" aria-current="page">GROUP</a>';
document.querySelector('.view-tabs').before(groupCategory);

if (apiBase) {
  Promise.allSettled([
    fetch(`${apiBase}/tournaments/${tournamentId}/standings`).then(response => response.ok ? response.json() : Promise.reject()),
    fetch(`${apiBase}/tournaments/${tournamentId}/bracket`).then(response => response.ok ? response.json() : Promise.reject()),
  ]).then(([standingResult, bracketResult]) => {
    const standingData = standingResult.status === 'fulfilled' ? standingResult.value.data : null;
    if (standingData?.length) {
      groups = standingData.map(group => group.rows.map(row => [row.name, row.points]));
      standingSource = 'api';
    }
    if (bracketResult.status === 'fulfilled' && bracketResult.value.data) {
      liveBracket = bracketResult.value.data;
      bracketSource = 'api';
    }
    const requestedView=location.hash.slice(1);render(!competitionFormat.usesGroupStage&&requestedView==='group-standing'?'bracket':requestedView||(competitionFormat.usesGroupStage?'group-standing':'bracket'));
  });
}
import './analytics.js';
