import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getAdminSupport,getPublicSupport,postSupport,putSupport,removeSupport } from "./support.controller.js";
export const publicSupportRouter=Router();publicSupportRouter.get("/",getPublicSupport);
export const adminSupportRouter=Router();adminSupportRouter.use(authenticateAdmin);adminSupportRouter.get("/",getAdminSupport);adminSupportRouter.post("/",postSupport);adminSupportRouter.put("/:id",putSupport);adminSupportRouter.delete("/:id",removeSupport);
