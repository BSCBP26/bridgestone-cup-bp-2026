import { getSport, listSports } from "./sports.service.js";

export function getSports(_request, response) {
  const data = listSports();
  response.status(200).json({ success: true, data, meta: { total: data.length } });
}

export function getSportBySlug(request, response) {
  response.status(200).json({ success: true, data: getSport(request.params.slug) });
}
