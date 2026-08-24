import { env } from "../../config/env.js";
import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";

const bracketsByTournament = new Map();
const clone = value => structuredClone(value);
export const bracketPersistence = () => env.supabaseConfigured ? "supabase" : "memory";

export async function createBracket(tournamentId, bracket, adminId) {
  if (!env.supabaseConfigured) {
    if (bracketsByTournament.has(tournamentId)) return null;
    bracketsByTournament.set(tournamentId, clone(bracket));
    return clone(bracket);
  }
  const { data, error } = await getSupabaseAdminClient().from("bracket_snapshots").insert({ tournament_id:tournamentId, bracket, created_by:adminId || null }).select("bracket").single();
  if (error?.code === "23505") return null;
  if (error) throw new AppError(502, "Bracket could not be saved");
  return clone(data.bracket);
}

export async function findBracketByTournamentId(tournamentId) {
  if (!env.supabaseConfigured) return bracketsByTournament.has(tournamentId) ? clone(bracketsByTournament.get(tournamentId)) : null;
  const { data, error } = await getSupabaseAdminClient().from("bracket_snapshots").select("bracket").eq("tournament_id", tournamentId).maybeSingle();
  if (error) throw new AppError(502, "Bracket could not be loaded");
  return data?.bracket ? clone(data.bracket) : null;
}

export async function replaceBracket(tournamentId, bracket) {
  if (!env.supabaseConfigured) { bracketsByTournament.set(tournamentId, clone(bracket)); return clone(bracket); }
  const { data, error } = await getSupabaseAdminClient().from("bracket_snapshots").update({ bracket }).eq("tournament_id", tournamentId).select("bracket").single();
  if (error || !data) throw new AppError(404, "Bracket not found");
  return clone(data.bracket);
}

export function clearBrackets() { bracketsByTournament.clear(); }
