import './analytics.js?v=20260828-ga1';
import './public-i18n.js?v=20260930-football-awards';
import { API_BASE } from './api-config.js';
import { loadCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { apiBracketView, bracketWinnerView, scheduleView, shell, standingView } from './sports.js?v=20260930-football-results';

const host = document.querySelector('#sport-view');
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,character=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const emptyBracket = `
  <div class="public-empty-state">
    <strong>BRACKET BELUM TERSEDIA</strong>
  </div>`;

function apiBaseUrl() {
  return API_BASE;
}

async function loadApiData() {
  const apiBase = apiBaseUrl();
  if (!apiBase) return { bracket: null, matches: [], groups:[] };

  try {
    const [bracketResult, standingsResult] = await Promise.allSettled([
      fetch(`${apiBase}/tournaments/football-bp-2026/bracket`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${apiBase}/tournaments/football-bp-2026/standings`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const bracketResponse=bracketResult.status==='fulfilled'?bracketResult.value:null;
    const standingsResponse=standingsResult.status==='fulfilled'?standingsResult.value:null;
    if (!bracketResponse?.ok) return { bracket: null, groups:[] };
    const bracketPayload = await bracketResponse.json();
    const standingsPayload = standingsResponse?.ok ? await standingsResponse.json() : null;
    return {
      bracket: bracketPayload.success ? bracketPayload.data : null,
      groups:standingsPayload?.data?.map(group=>group.rows.map(row=>[row.name,row.points]))||[],
    };
  } catch {
    return { bracket: null, matches: [], groups:[] };
  }
}

function apiScheduleRows(matches) {
  return matches.map(match => {
    const dateValue=match.scheduledDate||match.scheduledAt;
    const date=dateValue?new Intl.DateTimeFormat('id-ID',{
      day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta',
    }).format(new Date(match.scheduledDate?`${dateValue}T12:00:00+07:00`:dateValue)).toUpperCase():'JADWAL MENUNGGU';
    return [
      date,
      match.homeParticipant?.name || 'MENUNGGU HASIL',
      match.awayParticipant?.name || 'MENUNGGU HASIL',
      match.venue ? `${match.roundName} • ${match.venue}` : match.roundName,
    ];
  });
}

const apiData = await loadApiData();
const competitionFormat=await loadCompetitionFormat('football');
const placing=match=>{
  if(match?.status!=='completed')return ['MENUNGGU HASIL','MENUNGGU HASIL'];
  const homeWon=match.winnerParticipantId===match.homeParticipant?.id;
  return homeWon?[match.homeParticipant?.name,match.awayParticipant?.name]:[match.awayParticipant?.name,match.homeParticipant?.name];
};
const finalRanking=[...placing(apiData.bracket?.rounds?.at(-1)?.matches?.[0]),...placing(apiData.bracket?.thirdPlaceMatch)];
const bracketMatches=apiData.bracket?.rounds?.flatMap(round=>round.matches)||[];
const datedMatches=[...bracketMatches,...(apiData.bracket?.thirdPlaceMatch?[apiData.bracket.thirdPlaceMatch]:[])].filter(match=>match.scheduledDate||match.scheduledAt).sort((a,b)=>(a.scheduledDate||a.scheduledAt).localeCompare(b.scheduledDate||b.scheduledAt)||a.roundNumber-b.roundNumber||a.position-b.position);
const awards=apiData.bracket?.awards;
const awardsView=awards?`<article class="winner-panel football-awards"><h2>PENGHARGAAN INDIVIDU</h2><div class="ranking-row"><small>TOP SKOR</small><strong>${escapeHtml(awards.topScorer.name)}</strong><b>${escapeHtml(awards.topScorer.team)}</b></div><div class="ranking-row"><small>KIPER TERBAIK</small><strong>${escapeHtml(awards.bestGoalkeeper.name)}</strong><b>${escapeHtml(awards.bestGoalkeeper.team)}</b></div></article>`:'';

shell('Football', withOptionalStanding(competitionFormat,[
  { id: 'bracket', label: 'Bracket' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'winner', label: 'Winner Football' },
]), id => {
  if(id==='group-standing'){host.innerHTML=standingView(apiData.groups);host.dataset.source=apiData.groups.length?'api':'empty';return}
  if(id==='winner'){
    host.innerHTML=apiData.bracket?bracketWinnerView('FOOTBALL WINNERS',apiData.bracket,finalRanking)+awardsView:'<div class="public-empty-state"><strong>HASIL BELUM TERSEDIA</strong></div>';
    host.dataset.source=apiData.bracket?'api':'empty';
    return;
  }
  if (id === 'schedule') {
    host.innerHTML = scheduleView(apiScheduleRows(datedMatches));
    host.dataset.source = datedMatches.length ? 'api' : 'empty';
    return;
  }

  const hasBracket = Boolean(apiData.bracket?.participants?.length && apiData.bracket?.rounds?.length);
  host.innerHTML = hasBracket
    ? apiBracketView('CHAMPIONSHIP BRACKET', apiData.bracket,finalRanking)
    : emptyBracket;
  host.dataset.source = hasBracket ? 'api' : 'empty';
});
import './analytics.js';
