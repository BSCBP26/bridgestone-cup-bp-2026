import { Router } from "express";
import { getSportBySlug, getSports } from "./sports.controller.js";
import { getTournamentsBySport } from "../tournaments/tournaments.controller.js";

export const sportsRouter = Router();

sportsRouter.get("/", getSports);
sportsRouter.get("/:slug/tournaments", getTournamentsBySport);
sportsRouter.get("/:slug", getSportBySlug);
