import serverless from "serverless-http";
import { app } from "../../src/app.js";

// Netlify Functions must receive binary responses as base64. Without this,
// serverless-http converts image bytes to UTF-8 and corrupts PNG/JPEG/WebP.
export const handler = serverless(app, {
  binary: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp", "image/tiff", "image/svg+xml", "image/heic", "image/heif", "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/ogg", "video/mpeg", "video/3gpp", "video/x-matroska"],
});
