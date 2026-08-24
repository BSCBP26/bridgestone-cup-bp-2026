import { env } from "../config/env.js";

export function errorHandler(error, _request, response, _next) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const isServerError = statusCode >= 500;
  if (isServerError) console.error(error);

  const body = {
    success: false,
    message: isServerError ? "Internal server error" : error.message,
  };
  if (error.details !== undefined) body.details = error.details;
  if (env.nodeEnv === "development" && isServerError) body.debug = error.message;

  response.status(statusCode).json(body);
}
