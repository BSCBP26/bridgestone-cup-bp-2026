import { Router } from "express";
import { getTournamentMatches } from "./matches.controller.js";

export const matchesRouter = Router();

matchesRouter.get("/:id/matches", getTournamentMatches);
