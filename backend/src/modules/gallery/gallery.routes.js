import { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { getAdminGallery, getPublicGallery, postGalleryItem, putGalleryItem, removeGalleryItem } from "./gallery.controller.js";

export const publicGalleryRouter = Router();
publicGalleryRouter.get("/", getPublicGallery);
export const adminGalleryRouter = Router();
adminGalleryRouter.use(authenticateAdmin);
adminGalleryRouter.get("/", getAdminGallery);
adminGalleryRouter.post("/", postGalleryItem);
adminGalleryRouter.put("/:id", putGalleryItem);
adminGalleryRouter.delete("/:id", removeGalleryItem);
