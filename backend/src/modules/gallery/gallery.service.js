import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";
import { mediaPublicUrl } from "../../config/media-storage.js";

const SELECT = "id, sport_id, media_type, storage_path, title_id, title_en, alt_id, alt_en, sort_order, status, published_at, created_at, updated_at";
const mapItem = item => ({ id: item.id, sportId: item.sport_id, mediaType: item.media_type, storagePath: item.storage_path, publicUrl: mediaPublicUrl(item.storage_path), titleId: item.title_id, titleEn: item.title_en, altId: item.alt_id, altEn: item.alt_en, sortOrder: item.sort_order, status: item.status, publishedAt: item.published_at, createdAt: item.created_at, updatedAt: item.updated_at });
const row = (input, adminId) => ({ sport_id: input.sportId || null, media_type: "photo", storage_path: input.storagePath, title_id: input.titleId || null, title_en: input.titleEn || null, alt_id: input.altId || null, alt_en: input.altEn || null, sort_order: input.sortOrder ?? 0, status: input.status || "draft", published_at: input.status === "published" ? new Date().toISOString() : null, ...(adminId ? { created_by: adminId } : {}) });

export async function listGallery({ includeUnpublished = false, sportId } = {}, client = getSupabaseAdminClient()) {
  let query = client.from("gallery_items").select(SELECT).eq("media_type", "photo").order("sort_order").order("created_at", { ascending: false });
  if (!includeUnpublished) query = query.eq("status", "published");
  if (sportId) query = query.eq("sport_id", sportId);
  const { data, error } = await query;
  if (error) throw new AppError(502, "Gallery could not be loaded");
  return data.map(mapItem);
}
export async function createGalleryItem(input, adminId, client = getSupabaseAdminClient()) {
  const { data, error } = await client.from("gallery_items").insert(row(input, adminId)).select(SELECT).single();
  if (error) throw new AppError(422, "Gallery item could not be created");
  return mapItem(data);
}
export async function updateGalleryItem(id, input, client = getSupabaseAdminClient()) {
  const { data, error } = await client.from("gallery_items").update(row(input)).eq("id", id).select(SELECT).single();
  if (error || !data) throw new AppError(404, "Gallery item not found");
  return mapItem(data);
}
export async function deleteGalleryItem(id, client = getSupabaseAdminClient()) {
  const { data, error } = await client.from("gallery_items").delete().eq("id", id).select("id, storage_path").single();
  if (error || !data) throw new AppError(404, "Gallery item not found");
  return { id: data.id, storagePath: data.storage_path };
}
