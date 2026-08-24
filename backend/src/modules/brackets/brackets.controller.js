import {
  correctMatchResult,
  clearTournamentBracket,
  getSavedTournamentBracket,
  previewTournamentBracket,
  regenerateTournamentBracket,
  saveTournamentBracket,
  submitMatchResult,
  updateMatchSchedule,
  getFutsalTopScorers,
  saveFutsalTopScorers,
} from "./brackets.service.js";
import { bracketPersistence } from "./brackets.repository.js";

export function previewBracket(request, response) {
  const data = previewTournamentBracket(request.params.id, request.body.participants);
  response.status(200).json({
    success: true,
    data,
    meta: { persisted: false },
  });
}

export async function createBracket(request, response) {
  const data = await saveTournamentBracket(request.params.id, request.body.participants, request.admin.id);
  response.status(201).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}

export async function replaceBracket(request, response) {
  const data = await regenerateTournamentBracket(
    request.params.id,
    request.body.participants,
    request.body.confirmReplace,
  );
  response.status(200).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}

export async function deleteBracket(request, response) {
  const data = await clearTournamentBracket(request.params.id, request.admin.id);
  response.status(200).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}

export async function getBracket(request, response) {
  response.status(200).json({
    success: true,
    data: await getSavedTournamentBracket(request.params.id),
    meta: { persisted: bracketPersistence() },
  });
}

export async function updateMatchResult(request, response) {
  const data = await submitMatchResult(request.params.id, request.params.matchId, request.body);
  response.status(200).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}

export async function replaceMatchResult(request, response) {
  const data = await correctMatchResult(request.params.id, request.params.matchId, request.body);
  response.status(200).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}

export async function patchMatchSchedule(request, response) {
  const data = await updateMatchSchedule(request.params.id, request.params.matchId, request.body);
  response.status(200).json({ success: true, data, meta: { persisted: bracketPersistence() } });
}
export async function getTopScorers(request,response){response.json({success:true,data:await getFutsalTopScorers(request.params.id)})}
export async function putTopScorers(request,response){const data=await saveFutsalTopScorers(request.params.id,request.body.topScorers);response.json({success:true,data,meta:{total:data.length}})}
