import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE as apiBase } from './api-config.js';
import { loadTournamentCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { loadCategories, renderCategorySelector, selectedCategory, tournamentByCategory } from './competition-categories.js';
import {
  apiBracketView,
  bracketWinnerView,
  shell,
  standingView,
} from './sports.js?v=20260821-empty-bracket';

const host = document.querySelector('#sport-view');
let groups = [];
let liveBracket = null;
let standingSource = 'empty';
let bracketSource = 'empty';

const emptyState = title => `
  <div class="public-empty-state">
    <strong>${title}</strong>
  </div>`;

function render(id) {
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
