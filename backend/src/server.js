import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`Bridgestone Cup API listening on http://localhost:${env.port}`);
});

function shutDown(signal) {
  console.log(`${signal} received. Closing HTTP server...`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server cleanly", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));
