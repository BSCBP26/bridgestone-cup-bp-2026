import { getCompetitionFormat, getTournament, listTournamentsBySport, updateCompetitionFormat } from "./tournaments.service.js";

export function getTournamentById(request, response) {
  response.status(200).json({ success: true, data: getTournament(request.params.id) });
}

export function getTournamentsBySport(request, response) {
  const result = listTournamentsBySport(request.params.slug);
  response.status(200).json({
    success: true,
    data: result.tournaments,
    meta: { total: result.tournaments.length, sport: result.sport.slug },
  });
}

export async function getTournamentCompetitionFormat(request, response, next) {
  try { response.status(200).json({ success: true, data: await getCompetitionFormat(request.params.id) }); }
  catch (error) { next(error); }
}

export async function putTournamentCompetitionFormat(request, response, next) {
  try { response.status(200).json({ success: true, data: await updateCompetitionFormat(request.params.id, request.body?.format) }); }
  catch (error) { next(error); }
}
