import { AppError } from "../shared/app-error.js";

export function notFoundHandler(request, _response, next) {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} not found`));
}
