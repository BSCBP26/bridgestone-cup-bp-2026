import { randomUUID } from "node:crypto";
import { getActiveMediaStorage, getMediaStorageForPath, mediaPublicUrl, R2_PREFIX } from "../../config/media-storage.js";
import { AppError } from "../../shared/app-error.js";
import { env } from "../../config/env.js";
import { getR2PresignedPutUrl } from "../../config/r2.js";

const EXTENSIONS = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
  ["image/gif", "gif"], ["image/avif", "avif"], ["image/bmp", "bmp"],
  ["image/tiff", "tif"], ["image/svg+xml", "svg"], ["image/heic", "heic"], ["image/heif", "heif"],
  ["video/mp4", "mp4"], ["video/webm", "webm"], ["video/quicktime", "mov"],
  ["video/x-msvideo", "avi"], ["video/ogg", "ogv"], ["video/mpeg", "mpeg"],
  ["video/3gpp", "3gp"], ["video/x-matroska", "mkv"],
]);

const IMAGE_TYPES = new Set([...EXTENSIONS.keys()].filter(type => type.startsWith("image/")));

const FOLDERS = new Set(["gallery", "greetings", "support"]);

export function createMediaUploadUrl(mimeType, folder = "gallery") {
  const extension = EXTENSIONS.get(mimeType);
  if (!extension) throw new AppError(415, "Format file tidak didukung");
  if (!FOLDERS.has(folder)) throw new AppError(422, "Invalid media folder");
  if (env.mediaStorageProvider !== "r2") throw new AppError(503, "Direct upload belum tersedia untuk storage ini");
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  const storagePath = `${R2_PREFIX}${objectPath}`;
  return { uploadUrl: getR2PresignedPutUrl(objectPath), storagePath, publicUrl: mediaPublicUrl(storagePath), mimeType, provider: "r2" };
}

export async function uploadMedia(buffer, mimeType, storage, folder = "gallery", imagesOnly = false) {
  const extension = EXTENSIONS.get(mimeType);
  if (!extension || (imagesOnly && !IMAGE_TYPES.has(mimeType))) throw new AppError(415, "Format file tidak didukung");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new AppError(422, "File media wajib diisi");

  if (!FOLDERS.has(folder)) throw new AppError(422, "Invalid media folder");
  const activeStorage = storage || getActiveMediaStorage();
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  try {
    await activeStorage.upload(objectPath, buffer, mimeType);
  } catch {
    throw new AppError(502, "Media upload failed");
  }
  const storagePath = `${activeStorage.prefix || ""}${objectPath}`;
  return { storagePath, publicUrl: mediaPublicUrl(storagePath), size: buffer.length, mimeType, provider: activeStorage.provider };
}

export async function uploadImage(buffer, mimeType, storage, folder = "gallery") {
  return uploadMedia(buffer, mimeType, storage, folder, true);
}

export async function deleteImage(storagePath, storage) {
  if (typeof storagePath !== "string" || !/^(?:r2\/)?(gallery|greetings|support)\/[a-f0-9-]+\.[a-z0-9]+$/.test(storagePath)) {
    throw new AppError(422, "Invalid media storage path");
  }
  const selectedStorage = storage || getMediaStorageForPath(storagePath);
  const objectPath = storagePath.startsWith(R2_PREFIX) ? storagePath.slice(R2_PREFIX.length) : storagePath;
  try {
    await selectedStorage.delete(objectPath);
  } catch {
    throw new AppError(502, "Media deletion failed");
  }
}
