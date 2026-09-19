import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getDashboard, importWorkbook } from "./running.controller.js";
export const publicRunningRouter = Router();
publicRunningRouter.get("/dashboard", getDashboard);
export const adminRunningRouter = Router();
adminRunningRouter.post("/import", authenticateAdmin, importWorkbook);
