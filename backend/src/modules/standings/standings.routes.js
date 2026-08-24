import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getStandings,putRanking,putStandings,qualifyBracket } from "./standings.controller.js";
export const publicStandingsRouter=Router();publicStandingsRouter.get("/:id/standings",getStandings);
export const adminStandingsRouter=Router();adminStandingsRouter.put("/tournaments/:id/standings",authenticateAdmin,putStandings);
adminStandingsRouter.put("/tournaments/:id/ranking",authenticateAdmin,putRanking);
adminStandingsRouter.post("/tournaments/:id/qualifiers",authenticateAdmin,qualifyBracket);
