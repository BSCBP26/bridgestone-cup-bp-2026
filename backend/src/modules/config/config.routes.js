import { Router } from "express";
import { getPublicConfig } from "./config.controller.js";

export const configRouter = Router();
configRouter.get("/", getPublicConfig);
