import{Router}from"express";import{authenticateAdmin}from"../../middleware/admin-auth.js";import{getFishingPairs,putFishingPairs}from"./fishing.controller.js";
export const publicFishingRouter=Router();publicFishingRouter.get("/fishing-bp-2026/pairs",getFishingPairs);
export const adminFishingRouter=Router();adminFishingRouter.put("/tournaments/fishing-bp-2026/pairs",authenticateAdmin,putFishingPairs);
