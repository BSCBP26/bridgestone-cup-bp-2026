import { AppError } from "../../shared/app-error.js";
import { getSportById } from "../sports/sports.service.js";
import { getTournament } from "../tournaments/tournaments.service.js";
import { generateSingleEliminationBracket } from "./bracket-generator.js";
import { createBracket, findBracketByTournamentId, replaceBracket } from "./brackets.repository.js";

const THIRD_PLACE_TOURNAMENT_IDS = new Set([
  "badminton-bp-2026", "futsal-bp-2026", "chess-bp-2026",
  "table-tennis-bp-2026", "football-bp-2026",
]);

function createThirdPlaceMatch(roundNumber) {
  return { id:"third-place", roundNumber, roundName:"Third Place", position:1, homeParticipant:null, awayParticipant:null, homeScore:null, awayScore:null, scheduledAt:null, venue:null, winnerParticipantId:null, status:"pending", nextMatchId:null, nextMatchSlot:null };
}

function addThirdPlaceMatch(tournamentId, bracket) {
  if (THIRD_PLACE_TOURNAMENT_IDS.has(tournamentId)) {
    bracket.thirdPlaceMatch = createThirdPlaceMatch(bracket.rounds.length);
    bracket.thirdPlaceParticipantId = null;
  }
  return bracket;
}

export async function ensureThirdPlacePlayoff(tournamentId) {
  if (!THIRD_PLACE_TOURNAMENT_IDS.has(tournamentId)) throw new AppError(422, "Third-place playoff is not available for this tournament");
  const bracket = await getSavedTournamentBracket(tournamentId);
  if (!bracket.thirdPlaceMatch) addThirdPlaceMatch(tournamentId, bracket);
  for (const match of bracket.rounds.flatMap(round => round.matches)) {
    if (match.roundName !== "Semi Final" || match.status !== "completed") continue;
    const loser = match.winnerParticipantId === match.homeParticipant?.id ? match.awayParticipant : match.homeParticipant;
    if (loser) updateThirdPlaceParticipant(bracket, match, loser);
  }
  bracket.updatedAt = new Date().toISOString();
  return replaceBracket(tournamentId, bracket);
}

function validateParticipants(input, maximum) {
  if (!Array.isArray(input)) {
    throw new AppError(422, "Participants must be an array");
  }
  if (input.length < 2 || input.length > maximum) {
    throw new AppError(422, `Participant count must be between 2 and ${maximum}`);
  }

  const participants = input.map((participant, index) => {
    const id = typeof participant?.id === "string" ? participant.id.trim() : "";
    const name = typeof participant?.name === "string" ? participant.name.trim() : "";
    if (!id || !name) {
      throw new AppError(422, `Participant at index ${index} must have a non-empty id and name`);
    }
    if (id.length > 100 || name.length > 100) {
      throw new AppError(422, `Participant at index ${index} exceeds the 100 character limit`);
    }
    return { id, name };
  });

  const ids = new Set(participants.map((participant) => participant.id));
  if (ids.size !== participants.length) {
    throw new AppError(422, "Participant ids must be unique");
  }
  return participants;
}

export function previewTournamentBracket(tournamentId, input) {
  const tournament = getTournament(tournamentId);
  const sport = getSportById(tournament.sportId);
  if (!tournament.format.includes("single_elimination")) {
    throw new AppError(422, "This tournament does not support a single-elimination bracket");
  }

  const maximum = Math.min(sport.participantLimit, 16);
  const participants = validateParticipants(input, maximum);

  return {
    tournament: { id: tournament.id, name: tournament.name },
    sport: { id: sport.id, slug: sport.slug, name: sport.name },
    bracket: generateSingleEliminationBracket(participants),
  };
}

export async function saveTournamentBracket(tournamentId, input, adminId) {
  const preview = previewTournamentBracket(tournamentId, input);
  const timestamp = new Date().toISOString();
  const bracket = {
    ...preview.bracket,
    tournamentId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  addThirdPlaceMatch(tournamentId, bracket);
  const saved = await createBracket(tournamentId, bracket, adminId);
  if (!saved) {
    throw new AppError(409, "A bracket already exists for this tournament");
  }
  return saved;
}

export async function regenerateTournamentBracket(tournamentId, input, confirmReplace) {
  const existing = await getSavedTournamentBracket(tournamentId);
  if (confirmReplace !== true) {
    throw new AppError(422, "confirmReplace must be true to regenerate a bracket");
  }

  const preview = previewTournamentBracket(tournamentId, input);
  const timestamp = new Date().toISOString();
  const bracket = {
    ...preview.bracket,
    ...(existing.topScorers ? { topScorers: existing.topScorers } : {}),
    tournamentId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  addThirdPlaceMatch(tournamentId, bracket);
  return replaceBracket(tournamentId, bracket);
}

export async function clearTournamentBracket(tournamentId, adminId) {
  getTournament(tournamentId);
  const existing = await findBracketByTournamentId(tournamentId);
  const timestamp = new Date().toISOString();
  const emptyBracket = {
    format: "single_elimination",
    status: "empty",
    participantCount: 0,
    participants: [],
    bracketSize: 0,
    byeCount: 0,
    championParticipantId: null,
    thirdPlaceParticipantId: null,
    rounds: [],
    tournamentId,
    ...(existing?.topScorers ? { topScorers: existing.topScorers } : {}),
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  if (existing) return replaceBracket(tournamentId, emptyBracket);
  return createBracket(tournamentId, emptyBracket, adminId);
}

export function validateTopScorers(input){if(!Array.isArray(input)||input.length>20)throw new AppError(422,"topScorers must be an array with at most 20 entries");return input.map((row,index)=>{const name=typeof row?.name==="string"?row.name.trim():"",team=typeof row?.team==="string"?row.team.trim():"",goals=row?.goals;if(name.length<2||name.length>120)throw new AppError(422,`Top scorer ${index+1} requires a valid name`);if(team.length<2||team.length>120)throw new AppError(422,`Top scorer ${index+1} requires a valid team`);if(!Number.isInteger(goals)||goals<0)throw new AppError(422,`Top scorer ${index+1} goals must be a non-negative integer`);return{name,team,goals}}).sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name))}
export async function getFutsalTopScorers(tournamentId){if(tournamentId!=="futsal-bp-2026")throw new AppError(422,"Top scorer is only available for Futsal");const bracket=await getSavedTournamentBracket(tournamentId);return bracket.topScorers||[]}
export async function saveFutsalTopScorers(tournamentId,input){if(tournamentId!=="futsal-bp-2026")throw new AppError(422,"Top scorer is only available for Futsal");const bracket=await getSavedTournamentBracket(tournamentId);bracket.topScorers=validateTopScorers(input);bracket.updatedAt=new Date().toISOString();const saved=await replaceBracket(tournamentId,bracket);return saved.topScorers}

export async function getSavedTournamentBracket(tournamentId) {
  getTournament(tournamentId);
  const bracket = await findBracketByTournamentId(tournamentId);
  if (!bracket) throw new AppError(404, "Bracket not found");
  return bracket;
}

function validateScore(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError(422, `${field} must be a non-negative integer`);
  }
  return value;
}

function allMatches(bracket) {
  const matches = bracket.rounds.flatMap((round) => round.matches);
  if (bracket.thirdPlaceMatch) matches.push(bracket.thirdPlaceMatch);
  return matches;
}

function findMatch(bracket, matchId) {
  return allMatches(bracket).find((match) => match.id === matchId);
}

function readResult(input) {
  const homeScore = validateScore(input?.homeScore, "homeScore");
  const awayScore = validateScore(input?.awayScore, "awayScore");
  if (homeScore === awayScore) {
    throw new AppError(422, "Single-elimination matches cannot end in a draw");
  }
  return { homeScore, awayScore };
}

function clearOutcomeAndDescendants(bracket, match) {
  if (match.nextMatchId) {
    const nextMatch = findMatch(bracket, match.nextMatchId);
    clearOutcomeAndDescendants(bracket, nextMatch);
    nextMatch[`${match.nextMatchSlot}Participant`] = null;
    nextMatch.status = nextMatch.homeParticipant && nextMatch.awayParticipant ? "scheduled" : "pending";
  }

  match.homeScore = null;
  match.awayScore = null;
  match.winnerParticipantId = null;
  match.status = match.homeParticipant && match.awayParticipant ? "scheduled" : "pending";
}

function refreshBracketStatus(bracket) {
  bracket.status = bracket.championParticipantId && (!bracket.thirdPlaceMatch || bracket.thirdPlaceMatch.status === "completed") ? "completed" : "active";
}

function updateThirdPlaceParticipant(bracket, match, loser) {
  if (!bracket.thirdPlaceMatch || match.roundName !== "Semi Final") return;
  const field = `${match.position % 2 === 1 ? "home" : "away"}Participant`;
  const thirdPlaceMatch = bracket.thirdPlaceMatch;
  if (thirdPlaceMatch[field]?.id !== loser.id && thirdPlaceMatch.status === "completed") {
    thirdPlaceMatch.homeScore = null;
    thirdPlaceMatch.awayScore = null;
    thirdPlaceMatch.winnerParticipantId = null;
    bracket.thirdPlaceParticipantId = null;
  }
  thirdPlaceMatch[field] = loser;
  thirdPlaceMatch.status = thirdPlaceMatch.homeParticipant && thirdPlaceMatch.awayParticipant ? "scheduled" : "pending";
  refreshBracketStatus(bracket);
}

function advanceWinner(bracket, match, winner) {
  if (match.id === "third-place") {
    bracket.thirdPlaceParticipantId = winner.id;
    refreshBracketStatus(bracket);
    return;
  }
  if (match.nextMatchId) {
    const nextMatch = findMatch(bracket, match.nextMatchId);
    nextMatch[`${match.nextMatchSlot}Participant`] = winner;
    if (nextMatch.homeParticipant && nextMatch.awayParticipant) nextMatch.status = "scheduled";
    return;
  }

  bracket.championParticipantId = winner.id;
  refreshBracketStatus(bracket);
}

export async function submitMatchResult(tournamentId, matchId, input) {
  const bracket = await getSavedTournamentBracket(tournamentId);
  const match = findMatch(bracket, matchId);
  if (!match) throw new AppError(404, "Match not found");
  if (match.status !== "scheduled") {
    throw new AppError(409, "Only scheduled matches can receive a result");
  }

  const { homeScore, awayScore } = readResult(input);

  const winner = homeScore > awayScore ? match.homeParticipant : match.awayParticipant;
  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.winnerParticipantId = winner.id;
  match.status = "completed";

  const loser = winner.id === match.homeParticipant.id ? match.awayParticipant : match.homeParticipant;
  updateThirdPlaceParticipant(bracket, match, loser);
  advanceWinner(bracket, match, winner);

  bracket.updatedAt = new Date().toISOString();
  const saved = await replaceBracket(tournamentId, bracket);
  return {
    match: findMatch(saved, matchId),
    bracket: saved,
  };
}

export async function correctMatchResult(tournamentId, matchId, input) {
  const bracket = await getSavedTournamentBracket(tournamentId);
  const match = findMatch(bracket, matchId);
  if (!match) throw new AppError(404, "Match not found");
  if (match.status !== "completed") {
    throw new AppError(409, "Only completed matches can be corrected");
  }

  const { homeScore, awayScore } = readResult(input);
  const previousWinnerId = match.winnerParticipantId;
  const winner = homeScore > awayScore ? match.homeParticipant : match.awayParticipant;

  if (winner.id !== previousWinnerId && match.nextMatchId) {
    const nextMatch = findMatch(bracket, match.nextMatchId);
    clearOutcomeAndDescendants(bracket, nextMatch);
    nextMatch[`${match.nextMatchSlot}Participant`] = winner;
    nextMatch.status = nextMatch.homeParticipant && nextMatch.awayParticipant ? "scheduled" : "pending";
    bracket.championParticipantId = null;
    bracket.status = "active";
  }

  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.winnerParticipantId = winner.id;

  const loser = winner.id === match.homeParticipant.id ? match.awayParticipant : match.homeParticipant;
  updateThirdPlaceParticipant(bracket, match, loser);

  if (!match.nextMatchId) {
    if (match.id === "third-place") bracket.thirdPlaceParticipantId = winner.id;
    else bracket.championParticipantId = winner.id;
    refreshBracketStatus(bracket);
  }

  bracket.updatedAt = new Date().toISOString();
  const saved = await replaceBracket(tournamentId, bracket);
  return { match: findMatch(saved, matchId), bracket: saved };
}

function validateSchedule(input) {
  const scheduledAt = typeof input?.scheduledAt === "string" ? input.scheduledAt.trim() : "";
  const venue = typeof input?.venue === "string" ? input.venue.trim() : "";
  const isoWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!isoWithTimezone.test(scheduledAt) || Number.isNaN(Date.parse(scheduledAt))) {
    throw new AppError(422, "scheduledAt must be a valid ISO 8601 date-time with timezone");
  }
  if (!venue || venue.length > 150) {
    throw new AppError(422, "venue must contain between 1 and 150 characters");
  }
  return { scheduledAt, venue };
}

export async function updateMatchSchedule(tournamentId, matchId, input) {
  const bracket = await getSavedTournamentBracket(tournamentId);
  const match = findMatch(bracket, matchId);
  if (!match) throw new AppError(404, "Match not found");
  const schedule = validateSchedule(input);

  match.scheduledAt = schedule.scheduledAt;
  match.venue = schedule.venue;
  bracket.updatedAt = new Date().toISOString();
  const saved = await replaceBracket(tournamentId, bracket);
  return { match: findMatch(saved, matchId), bracket: saved };
}
