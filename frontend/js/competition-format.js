import { API_BASE } from './api-config.js';

export const tournamentIds = Object.freeze({ badminton:'badminton-bp-2026', futsal:'futsal-bp-2026', chess:'chess-bp-2026', 'table-tennis':'table-tennis-bp-2026', football:'football-bp-2026' });
const defaults = Object.freeze({ badminton:false, futsal:true, chess:true, 'table-tennis':true, football:false });

export async function loadCompetitionFormat(sport) {
  const fallback={format:defaults[sport]?'group_and_single_elimination':'single_elimination',usesGroupStage:Boolean(defaults[sport])};
  if(!API_BASE||!tournamentIds[sport])return fallback;
  try{const response=await fetch(`${API_BASE}/tournaments/${tournamentIds[sport]}/competition-format`);if(!response.ok)return fallback;return(await response.json()).data||fallback}catch{return fallback}
}

export async function loadTournamentCompetitionFormat(tournamentId, fallbackUsesGroup = false) {
  const fallback={format:fallbackUsesGroup?'group_and_single_elimination':'single_elimination',usesGroupStage:Boolean(fallbackUsesGroup)};
  if(!API_BASE||!tournamentId)return fallback;
  try{const response=await fetch(`${API_BASE}/tournaments/${tournamentId}/competition-format`);if(!response.ok)return fallback;return(await response.json()).data||fallback}catch{return fallback}
}

export function withOptionalStanding(format, tabs) {
  return [...(format.usesGroupStage?[{id:'group-standing',label:'Group Standing'}]:[]),...tabs];
}
