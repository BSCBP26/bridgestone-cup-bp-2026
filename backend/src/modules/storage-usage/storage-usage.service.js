import { getR2Client } from "../../config/r2.js";
import { getSupabaseAdminClient } from "../../config/supabase.js";

const SUPABASE_LIMIT_BYTES = 500 * 1024 * 1024;
const R2_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
const MEDIA_BUCKET = "event-media";
const MEDIA_FOLDERS = ["gallery", "greetings", "support"];
const PAGE_SIZE = 100;

const usageResult = (usedBytes, limitBytes) => ({
  usedBytes,
  limitBytes,
  remainingBytes: Math.max(0, limitBytes - usedBytes),
  percentage: Number(Math.min(100, usedBytes / limitBytes * 100).toFixed(2)),
  status: usedBytes / limitBytes >= 0.9 ? "critical" : usedBytes / limitBytes >= 0.75 ? "warning" : "safe",
});

export async function calculateSupabaseMediaUsage(client = getSupabaseAdminClient()) {
  let usedBytes = 0;
  const bucket = client.storage.from(MEDIA_BUCKET);
  for (const folder of MEDIA_FOLDERS) {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await bucket.list(folder, { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw new Error("Supabase storage usage could not be loaded");
      for (const item of data || []) usedBytes += Number(item.metadata?.size || 0);
      if (!data || data.length < PAGE_SIZE) break;
    }
  }
  return usageResult(usedBytes, SUPABASE_LIMIT_BYTES);
}

export async function calculateR2Usage(client = getR2Client()) {
  let usedBytes = 0;
  let continuationToken = "";
  do {
    const page = await client.listObjects(continuationToken);
    usedBytes += page.sizes.reduce((total, size) => total + size, 0);
    continuationToken = page.nextToken || "";
  } while (continuationToken);
  return usageResult(usedBytes, R2_LIMIT_BYTES);
}

export async function getStorageUsage(dependencies = {}) {
  const [supabase, r2] = await Promise.all([
    calculateSupabaseMediaUsage(dependencies.supabaseClient),
    calculateR2Usage(dependencies.r2Client),
  ]);
  return { supabase, r2, checkedAt: new Date().toISOString() };
}
