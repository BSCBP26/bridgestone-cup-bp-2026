import{Router}from'express';import{authenticateAdmin}from'../../middleware/admin-auth.js';import{getCompetitionCategories,putCompetitionCategories}from'./competition-categories.controller.js';
export const publicCompetitionCategoriesRouter=Router();publicCompetitionCategoriesRouter.get('/:slug/competition-categories',getCompetitionCategories);
export const adminCompetitionCategoriesRouter=Router();adminCompetitionCategoriesRouter.put('/sports/:slug/competition-categories',authenticateAdmin,putCompetitionCategories);
