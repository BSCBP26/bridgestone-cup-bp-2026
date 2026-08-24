import { tournaments } from "../../data/tournaments.data.js";
import { env } from "../../config/env.js";
import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";

const formatOverrides = new Map();

export function findTournamentById(id) {
  return tournaments.find((tournament) => tournament.id === id);
}

export function findTournamentsBySportId(sportId) {
  return tournaments.filter((tournament) => tournament.sportId === sportId);
}

export async function findTournamentCompetitionFormat(id) {
  const fallback = findTournamentById(id);
  if (!fallback) return null;
  if (!env.supabaseConfigured) return formatOverrides.get(id) || fallback.format;
  const { data, error } = await getSupabaseAdminClient()
    .from("tournaments")
    .select("format")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(502, "Competition format could not be loaded");
  return data?.format || fallback.format;
}

export async function saveTournamentCompetitionFormat(id, format) {
  if (!env.supabaseConfigured) {
    formatOverrides.set(id, format);
    return format;
  }
  const { data, error } = await getSupabaseAdminClient()
    .from("tournaments")
    .update({ format })
    .eq("id", id)
    .select("format")
    .single();
  if (error || !data) throw new AppError(502, "Competition format could not be saved");
  return data.format;
}

export function clearTournamentFormatOverrides() {
  formatOverrides.clear();
}
