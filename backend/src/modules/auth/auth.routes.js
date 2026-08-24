import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getCurrentAdmin } from "./auth.controller.js";

export const authRouter = Router();

authRouter.get("/me", authenticateAdmin, getCurrentAdmin);
