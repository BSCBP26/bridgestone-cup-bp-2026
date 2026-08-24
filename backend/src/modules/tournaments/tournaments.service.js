import { AppError } from "../../shared/app-error.js";
import { getSport } from "../sports/sports.service.js";
import { findTournamentById, findTournamentCompetitionFormat, findTournamentsBySportId, saveTournamentCompetitionFormat } from "./tournaments.repository.js";

const PLAYOFF_FORMATS = new Set(["single_elimination", "group_and_single_elimination"]);

export function getTournament(id) {
  const tournament = findTournamentById(id);
  if (!tournament) throw new AppError(404, "Tournament not found");
  return tournament;
}

export function listTournamentsBySport(slug) {
  const sport = getSport(slug);
  return {
    sport,
    tournaments: findTournamentsBySportId(sport.id),
  };
}

export async function getCompetitionFormat(id) {
  const tournament = getTournament(id);
  if (tournament.format === "ranking") throw new AppError(422, "Fishing competition format is managed through ranking");
  const format = await findTournamentCompetitionFormat(id);
  return { tournamentId: id, format, usesGroupStage: format === "group_and_single_elimination" };
}

export async function updateCompetitionFormat(id, format) {
  const tournament = getTournament(id);
  if (tournament.format === "ranking") throw new AppError(422, "Fishing competition format cannot be changed");
  if (!PLAYOFF_FORMATS.has(format)) throw new AppError(422, "format must be single_elimination or group_and_single_elimination");
  const savedFormat = await saveTournamentCompetitionFormat(id, format);
  return { tournamentId: id, format: savedFormat, usesGroupStage: savedFormat === "group_and_single_elimination" };
}
