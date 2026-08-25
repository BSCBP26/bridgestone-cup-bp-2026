import { getSupabaseAdminClient } from "../../config/supabase.js";
import { mediaPublicUrl } from "../../config/media-storage.js";
import { AppError } from "../../shared/app-error.js";

const SELECT = "id, name, role_id, role_en, message_id, message_en, photo_storage_path, photo_storage_paths, sort_order, status, created_at, updated_at";
const TABLE = "exhibition_matches";
const LEGACY_TABLE = "greetings";
const mapGreeting = item => { const photoStoragePaths = Array.isArray(item.photo_storage_paths) && item.photo_storage_paths.length ? item.photo_storage_paths : (item.photo_storage_path ? [item.photo_storage_path] : []); return { id:item.id, name:item.name, roleId:item.role_id, roleEn:item.role_en, messageId:item.message_id, messageEn:item.message_en, photoStoragePath:photoStoragePaths[0] || null, photoStoragePaths, photoUrl:mediaPublicUrl(photoStoragePaths[0]), photoUrls:photoStoragePaths.map(mediaPublicUrl).filter(Boolean), sortOrder:item.sort_order, status:item.status, createdAt:item.created_at, updatedAt:item.updated_at }; };
const row = (input, adminId) => { const paths = Array.isArray(input.photoStoragePaths) ? input.photoStoragePaths : (input.photoStoragePath ? [input.photoStoragePath] : []); return { name:input.name, role_id:input.roleId, role_en:input.roleEn || null, message_id:input.messageId, message_en:input.messageEn || null, photo_storage_path:paths[0] || null, photo_storage_paths:paths, sort_order:input.sortOrder ?? 0, status:input.status || "draft", ...(adminId ? {created_by:adminId} : {}) }; };

export async function listGreetings({includeUnpublished=false}={}, client=getSupabaseAdminClient()) {
  let query=client.from(TABLE).select(SELECT).order("sort_order").order("created_at");
  if (!includeUnpublished) query=query.eq("status","published");
  const {data,error}=await query;
  if(error) { let legacy=client.from(LEGACY_TABLE).select(SELECT).order("sort_order").order("created_at"); if (!includeUnpublished) legacy=legacy.eq("status","published"); const fallback=await legacy; if(fallback.error) throw new AppError(502,"Exhibition Match could not be loaded"); return fallback.data.map(mapGreeting); }
  return data.map(mapGreeting);
}
export async function createGreeting(input,adminId,client=getSupabaseAdminClient()) { let result=await client.from(TABLE).insert(row(input,adminId)).select(SELECT).single(); if(result.error) result=await client.from(LEGACY_TABLE).insert(row(input,adminId)).select(SELECT).single(); if(result.error) throw new AppError(422,"Exhibition Match could not be created"); return mapGreeting(result.data); }
export async function updateGreeting(id,input,client=getSupabaseAdminClient()) { let result=await client.from(TABLE).update(row(input)).eq("id",id).select(SELECT).single(); if(result.error||!result.data) result=await client.from(LEGACY_TABLE).update(row(input)).eq("id",id).select(SELECT).single(); if(result.error||!result.data) throw new AppError(404,"Exhibition Match not found"); return mapGreeting(result.data); }
export async function deleteGreeting(id,client=getSupabaseAdminClient()) { let result=await client.from(TABLE).delete().eq("id",id).select("id, photo_storage_path, photo_storage_paths").single(); if(result.error||!result.data) result=await client.from(LEGACY_TABLE).delete().eq("id",id).select("id, photo_storage_path, photo_storage_paths").single(); if(result.error||!result.data) throw new AppError(404,"Exhibition Match not found"); const data=result.data; return {id:data.id,photoStoragePath:data.photo_storage_path,photoStoragePaths:data.photo_storage_paths || (data.photo_storage_path ? [data.photo_storage_path] : [])}; }
