import './analytics.js?v=20260828-ga1';
import './public-i18n.js?v=20260930-fourth-place';
import { API_BASE as apiBase } from './api-config.js';
import { loadTournamentCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { loadCategories, selectedCategory, tournamentByCategory } from './competition-categories.js';
import { apiBracketView, bracketWinnerView, scheduleView, shell, standingView } from './sports.js?v=20260930-mini-soccer';

const host = document.querySelector('#sport-view');

const emptyBracket = `
  <div class="public-empty-state">
    <strong>BRACKET BELUM TERSEDIA</strong>
  </div>`;

async function loadApiData(tournamentId) {
  try {
    const [bracketResponse, matchesResponse, standingsResponse] = await Promise.all([
      fetch(`${apiBase}/tournaments/${tournamentId}/bracket`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${apiBase}/tournaments/${tournamentId}/matches?scheduledOnly=true`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${apiBase}/tournaments/${tournamentId}/standings`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (!bracketResponse.ok) return { bracket: null, matches: [], groups:[] };
    const bracketPayload = await bracketResponse.json();
    const matchesPayload = matchesResponse.ok ? await matchesResponse.json() : null;
    const standingsPayload=standingsResponse.ok?await standingsResponse.json():null;return {
      bracket: bracketPayload.success ? bracketPayload.data : null,
      matches: matchesPayload?.success ? matchesPayload.data : [],
      groups:standingsPayload?.data?.map(group=>group.rows.map(row=>[row.name,row.points]))||[],
    };
  } catch {
    return { bracket: null, matches: [], groups:[] };
  }
}

function apiScheduleRows(matches) {
  return matches.map(match => {
    const time = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
    }).format(new Date(match.scheduledAt)).replace('.', ':');
    return [
      `${time} WIB`,
      match.homeParticipant?.name || 'MENUNGGU HASIL',
      match.awayParticipant?.name || 'MENUNGGU HASIL',
      match.roundName,
    ];
  });
}

const categories=await loadCategories('badminton');
const category=selectedCategory(categories);
const tournamentId=tournamentByCategory.badminton[category];
const apiData = await loadApiData(tournamentId);
const competitionFormat=await loadTournamentCompetitionFormat(tournamentId);
const placing = match => {
  if (match?.status !== 'completed') return ['MENUNGGU HASIL', 'MENUNGGU HASIL'];
  const homeWon = match.winnerParticipantId === match.homeParticipant?.id;
  return homeWon
    ? [match.homeParticipant?.name, match.awayParticipant?.name]
    : [match.awayParticipant?.name, match.homeParticipant?.name];
};
const finalRanking = [
  ...placing(apiData.bracket?.rounds?.at(-1)?.matches?.[0]),
  ...placing(apiData.bracket?.thirdPlaceMatch),
];
shell('Badminton', withOptionalStanding(competitionFormat,[
  { id: 'bracket', label: 'Bracket' },
  { id: 'schedule', label: 'Schedule' },
  ...(category === 'singles' ? [{ id: 'winner', label: 'Winner Badminton' }] : []),
]), id => {
  if(id==='group-standing'){host.dataset.source=apiData.groups.length?'api':'empty';host.innerHTML=standingView(apiData.groups);return}
  if(id==='winner'){
    host.dataset.source=apiData.bracket?'api':'empty';
    host.innerHTML=apiData.bracket?bracketWinnerView('BADMINTON WINNERS',apiData.bracket,finalRanking):'<div class="public-empty-state"><strong>HASIL BELUM TERSEDIA</strong></div>';
    return;
  }
  host.dataset.source = id === 'schedule'
    ? (apiData.matches.length ? 'api' : 'empty')
    : (apiData.bracket ? 'api' : 'empty');
  host.innerHTML = id === 'schedule'
    ? scheduleView(apiData.matches.length ? apiScheduleRows(apiData.matches) : [])
    : (apiBracketView('CHAMPIONSHIP BRACKET', apiData.bracket,category==='singles'?finalRanking:undefined) || emptyBracket);
});

import './analytics.js';
