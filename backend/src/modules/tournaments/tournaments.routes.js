import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getTournamentById, getTournamentCompetitionFormat, putTournamentCompetitionFormat } from "./tournaments.controller.js";

export const tournamentsRouter = Router();

tournamentsRouter.get("/:id", getTournamentById);
tournamentsRouter.get("/:id/competition-format", getTournamentCompetitionFormat);

export const adminTournamentsRouter = Router();
adminTournamentsRouter.put("/tournaments/:id/competition-format", authenticateAdmin, putTournamentCompetitionFormat);
