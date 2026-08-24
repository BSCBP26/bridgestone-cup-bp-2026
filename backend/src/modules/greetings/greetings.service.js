import { getSupabaseAdminClient } from "../../config/supabase.js";
import { mediaPublicUrl } from "../../config/media-storage.js";
import { AppError } from "../../shared/app-error.js";

const SELECT = "id, name, role_id, role_en, message_id, message_en, photo_storage_path, sort_order, status, created_at, updated_at";
const mapGreeting = item => ({ id:item.id, name:item.name, roleId:item.role_id, roleEn:item.role_en, messageId:item.message_id, messageEn:item.message_en, photoStoragePath:item.photo_storage_path, photoUrl:mediaPublicUrl(item.photo_storage_path), sortOrder:item.sort_order, status:item.status, createdAt:item.created_at, updatedAt:item.updated_at });
const row = (input, adminId) => ({ name:input.name, role_id:input.roleId, role_en:input.roleEn || null, message_id:input.messageId, message_en:input.messageEn || null, photo_storage_path:input.photoStoragePath || null, sort_order:input.sortOrder ?? 0, status:input.status || "draft", ...(adminId ? {created_by:adminId} : {}) });

export async function listGreetings({includeUnpublished=false}={}, client=getSupabaseAdminClient()) {
  let query=client.from("greetings").select(SELECT).order("sort_order").order("created_at");
  if (!includeUnpublished) query=query.eq("status","published");
  const {data,error}=await query;
  if(error) throw new AppError(502,"Greetings could not be loaded");
  return data.map(mapGreeting);
}
export async function createGreeting(input,adminId,client=getSupabaseAdminClient()) { const {data,error}=await client.from("greetings").insert(row(input,adminId)).select(SELECT).single(); if(error) throw new AppError(422,"Greeting could not be created"); return mapGreeting(data); }
export async function updateGreeting(id,input,client=getSupabaseAdminClient()) { const {data,error}=await client.from("greetings").update(row(input)).eq("id",id).select(SELECT).single(); if(error||!data) throw new AppError(404,"Greeting not found"); return mapGreeting(data); }
export async function deleteGreeting(id,client=getSupabaseAdminClient()) { const {data,error}=await client.from("greetings").delete().eq("id",id).select("id, photo_storage_path").single(); if(error||!data) throw new AppError(404,"Greeting not found"); return {id:data.id,photoStoragePath:data.photo_storage_path}; }
