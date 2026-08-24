import express, { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { postImage, removeImage } from "./media.controller.js";
import { getPublicR2Media } from "./public-media.controller.js";

export const mediaRouter = Router();
export const publicMediaRouter = Router();
publicMediaRouter.get("/:folder/:filename", getPublicR2Media);
mediaRouter.post(
  "/media/images",
  authenticateAdmin,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "8mb" }),
  postImage,
);
mediaRouter.delete("/media/images", authenticateAdmin, removeImage);
