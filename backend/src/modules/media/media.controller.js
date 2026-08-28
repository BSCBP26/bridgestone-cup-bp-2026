import { createMediaUploadUrl, deleteImage, uploadImage, uploadMedia } from "./media.service.js";

export function postMediaUploadUrl(request, response, next) {
  try {
    const { mimeType, folder } = request.body || {};
    response.status(200).json({ success: true, data: createMediaUploadUrl(mimeType, folder || "gallery") });
  } catch (error) { next(error); }
}

export async function postImage(request, response, next) {
  try {
    const image = await uploadImage(request.body, request.headers["content-type"], undefined, request.headers["x-media-folder"] || "gallery");
    response.status(201).json({ success: true, data: image });
  } catch (error) { next(error); }
}

export async function postMedia(request, response, next) {
  try {
    const media = await uploadMedia(request.body, request.headers["content-type"], undefined, request.headers["x-media-folder"] || "gallery");
    response.status(201).json({ success: true, data: media });
  } catch (error) { next(error); }
}

export async function removeImage(request, response, next) {
  try {
    await deleteImage(request.body?.storagePath);
    response.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
}
