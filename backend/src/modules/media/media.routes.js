import express, { Router } from "express";
import { authenticateAdmin } from "../../middleware/admin-auth.js";
import { postImage, postMedia, postMediaUploadUrl, removeImage } from "./media.controller.js";
import { getPublicR2Media } from "./public-media.controller.js";

export const mediaRouter = Router();
export const publicMediaRouter = Router();
publicMediaRouter.get("/:folder/:filename", getPublicR2Media);
mediaRouter.post("/media/upload-url", authenticateAdmin, postMediaUploadUrl);
mediaRouter.post(
  "/media/images",
  authenticateAdmin,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "8mb" }),
  postImage,
);
mediaRouter.post(
  "/media/files",
  authenticateAdmin,
  express.raw({ type: [/^image\//, /^video\//], limit: "50mb" }),
  postMedia,
);
mediaRouter.delete("/media/images", authenticateAdmin, removeImage);
