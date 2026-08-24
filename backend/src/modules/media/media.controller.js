import { deleteImage, uploadImage } from "./media.service.js";

export async function postImage(request, response, next) {
  try {
    const image = await uploadImage(request.body, request.headers["content-type"], undefined, request.headers["x-media-folder"] || "gallery");
    response.status(201).json({ success: true, data: image });
  } catch (error) { next(error); }
}

export async function removeImage(request, response, next) {
  try {
    await deleteImage(request.body?.storagePath);
    response.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
}
