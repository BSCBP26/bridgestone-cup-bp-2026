import { AppError } from "../../shared/app-error.js";
import { getSavedTournamentBracket } from "../brackets/brackets.service.js";

const MATCH_STATUSES = new Set(["pending", "scheduled", "completed", "bye"]);

function parseScheduledOnly(value) {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError(422, "scheduledOnly must be true or false");
}

export async function listTournamentMatches(tournamentId, query = {}) {
  const bracket = await getSavedTournamentBracket(tournamentId);
  const scheduledOnly = parseScheduledOnly(query.scheduledOnly);
  const status = query.status;

  if (status !== undefined && !MATCH_STATUSES.has(status)) {
    throw new AppError(422, "status must be pending, scheduled, completed, or bye");
  }

  let matches = bracket.rounds.flatMap(round => round.matches);
  if (status) matches = matches.filter(match => match.status === status);
  if (scheduledOnly) matches = matches.filter(match => match.scheduledAt !== null);

  matches.sort((left, right) => {
    if (left.scheduledAt && right.scheduledAt) return left.scheduledAt.localeCompare(right.scheduledAt);
    if (left.scheduledAt) return -1;
    if (right.scheduledAt) return 1;
    return left.roundNumber - right.roundNumber || left.position - right.position;
  });

  return matches;
}
