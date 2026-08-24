import { AppError } from "../../shared/app-error.js";
import { createGalleryItem, deleteGalleryItem, listGallery, updateGalleryItem } from "./gallery.service.js";

function validate(body) {
  if (!body || typeof body.storagePath !== "string" || !/^(?:r2\/)?gallery\/[a-f0-9-]+\.(jpg|png|webp)$/.test(body.storagePath)) throw new AppError(422, "storagePath is required");
  if (body.status && !["draft", "published", "archived"].includes(body.status)) throw new AppError(422, "Invalid gallery status");
  if (body.sortOrder !== undefined && (!Number.isInteger(body.sortOrder) || body.sortOrder < 0)) throw new AppError(422, "sortOrder must be a non-negative integer");
  return body;
}
export async function getPublicGallery(request, response, next) { try { const data = await listGallery({ sportId: request.query.sportId }); response.json({ success: true, data, meta: { total: data.length, visibility: "published" } }); } catch (error) { next(error); } }
export async function getAdminGallery(_request, response, next) { try { const data = await listGallery({ includeUnpublished: true }); response.json({ success: true, data, meta: { total: data.length } }); } catch (error) { next(error); } }
export async function postGalleryItem(request, response, next) { try { response.status(201).json({ success: true, data: await createGalleryItem(validate(request.body), request.admin.id) }); } catch (error) { next(error); } }
export async function putGalleryItem(request, response, next) { try { response.json({ success: true, data: await updateGalleryItem(request.params.id, validate(request.body)) }); } catch (error) { next(error); } }
export async function removeGalleryItem(request, response, next) { try { response.json({ success: true, data: await deleteGalleryItem(request.params.id) }); } catch (error) { next(error); } }
