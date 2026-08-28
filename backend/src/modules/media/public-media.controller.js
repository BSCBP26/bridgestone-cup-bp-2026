import { getR2Client } from "../../config/r2.js";
import { AppError } from "../../shared/app-error.js";

const VALID_KEY = /^(gallery|greetings|support)\/[a-f0-9-]+\.[a-z0-9]+$/;

export function getDownloadDisposition(request, key) {
  if (request.query?.download !== "1") return null;

  const extension = key.match(/\.([a-z0-9]+)$/i)?.[1] || "bin";
  const requestedName = String(request.query?.name || `bridgestone-cup-media.${extension}`)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const filename = requestedName || `bridgestone-cup-media.${extension}`;
  return `attachment; filename="${filename}"`;
}

export async function getPublicR2Media(request, response, next) {
  try {
    const key = `${request.params.folder}/${request.params.filename}`;
    if (!VALID_KEY.test(key)) throw new AppError(404, "Media not found");

    const range = request.headers?.range;
    const object = await getR2Client().getObject(key, range ? { range } : {});
    const contentType = object.headers.get("content-type");
    const contentLength = object.headers.get("content-length");
    if (contentType) response.set("content-type", contentType);
    if (contentLength) response.set("content-length", contentLength);
    response.set("accept-ranges", object.headers.get("accept-ranges") || "bytes");
    if (object.headers.get("content-range")) response.set("content-range", object.headers.get("content-range"));
    const disposition = getDownloadDisposition(request, key);
    if (disposition) response.set("content-disposition", disposition);
    response.set("cache-control", "public, max-age=31536000, immutable");
    response.status(object.status === 206 ? 206 : 200).send(Buffer.from(await object.arrayBuffer()));
  } catch (error) {
    next(error);
  }
}
