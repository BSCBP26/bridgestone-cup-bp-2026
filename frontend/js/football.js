import './public-i18n.js?v=20260809-clean-empty-copy';
import { API_BASE } from './api-config.js';
import { loadCompetitionFormat, withOptionalStanding } from './competition-format.js';
import { apiBracketView, scheduleView, shell, standingView } from './sports.js?v=20260821-empty-bracket';

const host = document.querySelector('#sport-view');
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
    const [bracketResponse, matchesResponse, standingsResponse] = await Promise.all([
      fetch(`${apiBase}/tournaments/football-bp-2026/bracket`, { signal: AbortSignal.timeout(1500) }),
      fetch(`${apiBase}/tournaments/football-bp-2026/matches?scheduledOnly=true`, { signal: AbortSignal.timeout(1500) }),
      fetch(`${apiBase}/tournaments/football-bp-2026/standings`, { signal: AbortSignal.timeout(1500) }),
    ]);
    if (!bracketResponse.ok) return { bracket: null, matches: [], groups:[] };
    const bracketPayload = await bracketResponse.json();
    const matchesPayload = matchesResponse.ok ? await matchesResponse.json() : null;
    const standingsPayload = standingsResponse.ok ? await standingsResponse.json() : null;
    return {
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
    const date = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta',
    }).format(new Date(match.scheduledAt)).toUpperCase();
    const time = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
    }).format(new Date(match.scheduledAt)).replace('.', ':');
    return [
      `${date} • ${time} WIB`,
      match.homeParticipant?.name || 'MENUNGGU HASIL',
      match.awayParticipant?.name || 'MENUNGGU HASIL',
      match.venue ? `${match.roundName} • ${match.venue}` : match.roundName,
    ];
  });
}

const apiData = await loadApiData();
const competitionFormat=await loadCompetitionFormat('football');

shell('Football', withOptionalStanding(competitionFormat,[
  { id: 'bracket', label: 'Bracket' },
  { id: 'schedule', label: 'Schedule' },
]), id => {
  if(id==='group-standing'){host.innerHTML=standingView(apiData.groups);host.dataset.source=apiData.groups.length?'api':'empty';return}
  if (id === 'schedule') {
    host.innerHTML = scheduleView(apiData.matches.length ? apiScheduleRows(apiData.matches) : []);
    host.dataset.source = apiData.matches.length ? 'api' : 'empty';
    return;
  }

  const hasBracket = Boolean(apiData.bracket?.participants?.length && apiData.bracket?.rounds?.length);
  host.innerHTML = hasBracket
    ? apiBracketView('CHAMPIONSHIP BRACKET', apiData.bracket)
    : emptyBracket;
  host.dataset.source = hasBracket ? 'api' : 'empty';
});
