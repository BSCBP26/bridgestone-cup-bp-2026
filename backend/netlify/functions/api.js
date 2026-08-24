import serverless from "serverless-http";
import { app } from "../../src/app.js";

// Netlify Functions must receive binary responses as base64. Without this,
// serverless-http converts image bytes to UTF-8 and corrupts PNG/JPEG/WebP.
export const handler = serverless(app, {
  binary: ["image/jpeg", "image/png", "image/webp"],
});
