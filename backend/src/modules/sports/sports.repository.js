import { sports } from "../../data/sports.data.js";

export function findAllSports() {
  return sports;
}

export function findSportBySlug(slug) {
  return sports.find((sport) => sport.slug === slug);
}

export function findSportById(id) {
  return sports.find((sport) => sport.id === id);
}
