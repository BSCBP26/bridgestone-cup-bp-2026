import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { matchesRouter } from "./modules/matches/matches.routes.js";
import { createBracketsRouter, publicBracketsRouter } from "./modules/brackets/brackets.routes.js";
import { sportsRouter } from "./modules/sports/sports.routes.js";
import { adminTournamentsRouter, tournamentsRouter } from "./modules/tournaments/tournaments.routes.js";
import { configRouter } from "./modules/config/config.routes.js";
import { mediaRouter, publicMediaRouter } from "./modules/media/media.routes.js";
import { adminGalleryRouter, publicGalleryRouter } from "./modules/gallery/gallery.routes.js";
import { adminGreetingsRouter, publicGreetingsRouter } from "./modules/greetings/greetings.routes.js";
import { adminSupportRouter, publicSupportRouter } from "./modules/support/support.routes.js";
import { adminAnnouncementsRouter, publicAnnouncementsRouter } from "./modules/announcements/announcements.routes.js";
import { adminStandingsRouter, publicStandingsRouter } from "./modules/standings/standings.routes.js";
import { adminFishingRouter, publicFishingRouter } from "./modules/fishing/fishing.routes.js";
import { adminCompetitionCategoriesRouter, publicCompetitionCategoriesRouter } from "./modules/competition-categories/competition-categories.routes.js";
import { storageUsageRouter } from "./modules/storage-usage/storage-usage.routes.js";

export function createApp({ bracketAuthentication } = {}) {
  const app = express();

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error("Origin is not allowed by CORS");
    error.statusCode = 403;
    callback(error);
  },
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRouter);
app.use("/api/config", configRouter);
app.use("/api/admin", authRouter);
app.use("/api/admin", mediaRouter);
app.use("/api/admin", storageUsageRouter);
app.use("/api/media", publicMediaRouter);
app.use("/api/admin/gallery", adminGalleryRouter);
app.use("/api/gallery", publicGalleryRouter);
app.use("/api/admin/greetings", adminGreetingsRouter);
app.use("/api/greetings", publicGreetingsRouter);
app.use("/api/admin/support", adminSupportRouter);
app.use("/api/support", publicSupportRouter);
app.use("/api/admin/announcements", adminAnnouncementsRouter);
app.use("/api/announcements", publicAnnouncementsRouter);
app.use("/api/admin", adminStandingsRouter);
app.use("/api/admin", adminTournamentsRouter);
app.use("/api/admin", adminCompetitionCategoriesRouter);
app.use("/api/admin", adminFishingRouter);
app.use("/api/admin", createBracketsRouter(bracketAuthentication));
app.use("/api/tournaments", publicBracketsRouter);
app.use("/api/tournaments", matchesRouter);
app.use("/api/sports", sportsRouter);
app.use("/api/sports", publicCompetitionCategoriesRouter);
app.use("/api/tournaments", tournamentsRouter);
app.use("/api/tournaments", publicStandingsRouter);
app.use("/api/tournaments", publicFishingRouter);

app.use(notFoundHandler);
app.use(errorHandler);

  return app;
}

export const app = createApp();
