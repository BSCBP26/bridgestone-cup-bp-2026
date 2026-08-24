import { getR2Client } from "../../config/r2.js";
import { AppError } from "../../shared/app-error.js";

const VALID_KEY = /^(gallery|greetings|support)\/[a-f0-9-]+\.(jpg|png|webp)$/;

export async function getPublicR2Media(request, response, next) {
  try {
    const key = `${request.params.folder}/${request.params.filename}`;
    if (!VALID_KEY.test(key)) throw new AppError(404, "Media not found");

    const object = await getR2Client().getObject(key);
    const contentType = object.headers.get("content-type");
    const contentLength = object.headers.get("content-length");
    if (contentType) response.set("content-type", contentType);
    if (contentLength) response.set("content-length", contentLength);
    response.set("cache-control", "public, max-age=31536000, immutable");
    response.send(Buffer.from(await object.arrayBuffer()));
  } catch (error) {
    next(error);
  }
}
