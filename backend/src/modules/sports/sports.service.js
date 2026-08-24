import { AppError } from "../../shared/app-error.js";
import { findAllSports, findSportById, findSportBySlug } from "./sports.repository.js";

export function listSports() {
  return findAllSports();
}

export function getSport(slug) {
  const sport = findSportBySlug(slug);
  if (!sport) throw new AppError(404, "Sport not found");
  return sport;
}

export function getSportById(id) {
  const sport = findSportById(id);
  if (!sport) throw new AppError(404, "Sport not found");
  return sport;
}
