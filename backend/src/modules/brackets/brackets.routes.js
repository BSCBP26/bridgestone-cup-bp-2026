import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import {
  createBracket,
  deleteBracket,
  getBracket,
  previewBracket,
  patchMatchSchedule,
  replaceBracket,
  replaceMatchResult,
  updateMatchResult,
  putTopScorers,
  getTopScorers,
} from "./brackets.controller.js";

export const publicBracketsRouter = Router();

export function createBracketsRouter(adminAuthentication = authenticateAdmin) {
  const router = Router();
  router.use(adminAuthentication);
  router.post("/tournaments/:id/bracket/preview", previewBracket);
  router.post("/tournaments/:id/bracket", createBracket);
  router.put("/tournaments/:id/bracket", replaceBracket);
  router.delete("/tournaments/:id/bracket", deleteBracket);
  router.patch("/tournaments/:id/matches/:matchId/result", updateMatchResult);
  router.put("/tournaments/:id/matches/:matchId/result", replaceMatchResult);
  router.patch("/tournaments/:id/matches/:matchId/schedule", patchMatchSchedule);
  router.put("/tournaments/:id/top-scorers", putTopScorers);
  return router;
}

export const bracketsRouter = createBracketsRouter();

publicBracketsRouter.get("/:id/bracket", getBracket);
publicBracketsRouter.get("/:id/top-scorers", getTopScorers);
