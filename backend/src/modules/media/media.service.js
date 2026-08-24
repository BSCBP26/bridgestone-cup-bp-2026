import { randomUUID } from "node:crypto";
import { getActiveMediaStorage, getMediaStorageForPath, mediaPublicUrl, R2_PREFIX } from "../../config/media-storage.js";
import { AppError } from "../../shared/app-error.js";

const EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const FOLDERS = new Set(["gallery", "greetings", "support"]);

export async function uploadImage(buffer, mimeType, storage, folder = "gallery") {
  const extension = EXTENSIONS.get(mimeType);
  if (!extension) throw new AppError(415, "Image must be JPEG, PNG, or WebP");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new AppError(422, "Image file is required");

  if (!FOLDERS.has(folder)) throw new AppError(422, "Invalid media folder");
  const activeStorage = storage || getActiveMediaStorage();
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  try {
    await activeStorage.upload(objectPath, buffer, mimeType);
  } catch {
    throw new AppError(502, "Image upload failed");
  }
  const storagePath = `${activeStorage.prefix || ""}${objectPath}`;
  return { storagePath, publicUrl: mediaPublicUrl(storagePath), size: buffer.length, mimeType, provider: activeStorage.provider };
}

export async function deleteImage(storagePath, storage) {
  if (typeof storagePath !== "string" || !/^(?:r2\/)?(gallery|greetings|support)\/[a-f0-9-]+\.(jpg|png|webp)$/.test(storagePath)) {
    throw new AppError(422, "Invalid media storage path");
  }
  const selectedStorage = storage || getMediaStorageForPath(storagePath);
  const objectPath = storagePath.startsWith(R2_PREFIX) ? storagePath.slice(R2_PREFIX.length) : storagePath;
  try {
    await selectedStorage.delete(objectPath);
  } catch {
    throw new AppError(502, "Image deletion failed");
  }
}
