import { listTournamentMatches } from "./matches.service.js";

export async function getTournamentMatches(request, response) {
  const data = await listTournamentMatches(request.params.id, request.query);
  response.status(200).json({
    success: true,
    data,
    meta: {
      total: data.length,
      tournamentId: request.params.id,
    },
  });
}
