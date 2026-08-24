import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getAdminStorageUsage } from "./storage-usage.controller.js";

export const storageUsageRouter = Router();
storageUsageRouter.get("/storage-usage", authenticateAdmin, getAdminStorageUsage);
