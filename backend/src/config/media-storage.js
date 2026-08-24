import { env } from "./env.js";
import { getR2Client } from "./r2.js";
import { getSupabaseAdminClient } from "./supabase.js";

const SUPABASE_BUCKET = "event-media";
export const R2_PREFIX = "r2/";

const encodePath = path => path.split("/").map(encodeURIComponent).join("/");

export function mediaPublicUrl(storagePath) {
  if (!storagePath) return null;
  if (storagePath.startsWith(R2_PREFIX)) {
    if (env.publicApiBaseUrl) return `${env.publicApiBaseUrl}/media/${encodePath(storagePath.slice(R2_PREFIX.length))}`;
    return env.r2PublicBaseUrl ? `${env.r2PublicBaseUrl}/${encodePath(storagePath.slice(R2_PREFIX.length))}` : null;
  }
  return `${env.supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodePath(storagePath)}`;
}

export function createSupabaseMediaStorage(client = getSupabaseAdminClient()) {
  return {
    provider: "supabase",
    prefix: "",
    async upload(key, body, contentType) {
      const { error } = await client.storage.from(SUPABASE_BUCKET).upload(key, body, { contentType, upsert: false });
      if (error) throw error;
    },
    async delete(key) {
      const { error } = await client.storage.from(SUPABASE_BUCKET).remove([key]);
      if (error) throw error;
    },
  };
}

export function createR2MediaStorage(client = getR2Client()) {
  return {
    provider: "r2",
    prefix: R2_PREFIX,
    upload: (key, body, contentType) => client.putObject(key, body, contentType),
    delete: key => client.deleteObject(key),
  };
}

export function getActiveMediaStorage() {
  return env.mediaStorageProvider === "r2" ? createR2MediaStorage() : createSupabaseMediaStorage();
}

export function getMediaStorageForPath(storagePath) {
  return storagePath.startsWith(R2_PREFIX) ? createR2MediaStorage() : createSupabaseMediaStorage();
}
