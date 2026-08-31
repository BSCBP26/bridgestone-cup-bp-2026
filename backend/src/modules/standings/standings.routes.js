import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getStandings,putRanking,putStandings,qualifyBracket,getGroupMatches,putGroupMatches } from "./standings.controller.js";
export const publicStandingsRouter=Router();publicStandingsRouter.get("/:id/standings",getStandings);publicStandingsRouter.get("/:id/group-matches",getGroupMatches);
export const adminStandingsRouter=Router();adminStandingsRouter.put("/tournaments/:id/standings",authenticateAdmin,putStandings);adminStandingsRouter.put("/tournaments/:id/group-matches",authenticateAdmin,putGroupMatches);
adminStandingsRouter.put("/tournaments/:id/ranking",authenticateAdmin,putRanking);
adminStandingsRouter.post("/tournaments/:id/qualifiers",authenticateAdmin,qualifyBracket);
