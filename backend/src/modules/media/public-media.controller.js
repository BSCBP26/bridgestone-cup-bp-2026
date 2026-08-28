import { getR2Client } from "../../config/r2.js";
import { AppError } from "../../shared/app-error.js";

const VALID_KEY = /^(gallery|greetings|support)\/[a-f0-9-]+\.[a-z0-9]+$/;
const VIDEO_EXTENSION = /\.(?:mp4|webm|mov|avi|ogv|mpeg|mpg|3gp|mkv)$/i;
const MAX_STREAM_CHUNK_BYTES = 2 * 1024 * 1024;

export function normalizeMediaRange(range, key) {
  const value = String(range || "").trim();
  const match = value.match(/^bytes=(\d*)-(\d*)$/i);

  if (!match) {
    return VIDEO_EXTENSION.test(key) ? `bytes=0-${MAX_STREAM_CHUNK_BYTES - 1}` : null;
  }

  if (!match[1]) {
    const requestedLength = Number(match[2]);
    const length = Number.isSafeInteger(requestedLength) && requestedLength > 0
      ? Math.min(requestedLength, MAX_STREAM_CHUNK_BYTES)
      : MAX_STREAM_CHUNK_BYTES;
    return `bytes=-${length}`;
  }

  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start < 0) return null;
  const requestedEnd = match[2] ? Number(match[2]) : start + MAX_STREAM_CHUNK_BYTES - 1;
  const end = Number.isSafeInteger(requestedEnd) && requestedEnd >= start
    ? Math.min(requestedEnd, start + MAX_STREAM_CHUNK_BYTES - 1)
    : start + MAX_STREAM_CHUNK_BYTES - 1;
  return `bytes=${start}-${end}`;
}

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

    const range = normalizeMediaRange(request.headers?.range, key);
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
