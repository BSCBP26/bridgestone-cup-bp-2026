import './analytics.js?v=20260828-ga1';
import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE as apiBase } from './api-config.js';
import { loadTournamentCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { loadCategories, renderCategorySelector, selectedCategory, tournamentByCategory } from './competition-categories.js';
import { tableTennisGroupWinners } from './data/table-tennis-group-winners.js';
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
const groupWinnersView = () => `<section class="tt-group-winners" aria-labelledby="tt-group-winners-title"><header class="view-heading"><span>BRIDGESTONE CUP BP 2026</span><h1 id="tt-group-winners-title">TABLE TENNIS WINNER GROUP</h1></header><div class="tt-group-winners-list">${tableTennisGroupWinners.map(({rank,members}) => `<article class="tt-group-winner"><div class="tt-group-winner-rank"><small>JUARA</small><strong>${escapeHtml(rank)}</strong></div><ul>${members.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;

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
