import { env } from "../src/config/env.js";
import { getR2Client } from "../src/config/r2.js";
import { getSupabaseAdminClient } from "../src/config/supabase.js";

const SOURCE_BUCKET = "event-media";
const R2_PREFIX = "r2/";
const execute = process.argv.includes("--execute");
const keepGoing = process.argv.includes("--keep-going");
const limitArgument = process.argv.find(argument => argument.startsWith("--limit="));
const limit = limitArgument ? Number.parseInt(limitArgument.split("=")[1], 10) : Number.POSITIVE_INFINITY;

if (!Number.isInteger(limit) && limit !== Number.POSITIVE_INFINITY || limit < 1) {
  throw new Error("--limit must be a positive integer");
}

const contentTypes = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

function contentTypeFor(path, blobType) {
  if (contentTypes.has(path.split(".").pop()?.toLowerCase())) {
    return blobType || contentTypes.get(path.split(".").pop().toLowerCase());
  }
  throw new Error(`Unsupported Gallery file extension: ${path}`);
}

const supabase = getSupabaseAdminClient();
const { data, error } = await supabase
  .from("gallery_items")
  .select("id, storage_path, status")
  .eq("media_type", "photo")
  .order("created_at", { ascending: true });

if (error) throw new Error("Gallery migration inventory could not be loaded");

const candidates = (data || [])
  .filter(item => item.storage_path && !item.storage_path.startsWith(R2_PREFIX))
  .slice(0, limit);

console.log(JSON.stringify({
  mode: execute ? "execute" : "dry-run",
  totalGalleryRecords: data?.length || 0,
  candidates: candidates.length,
  alreadyOnR2: (data || []).filter(item => item.storage_path?.startsWith(R2_PREFIX)).length,
}, null, 2));

if (!execute) {
  console.log("Dry run only. Add --execute after the R2 environment variables are configured.");
  process.exit(0);
}

if (!env.r2Configured) {
  throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL.");
}

const r2 = getR2Client();
let migrated = 0;
let failed = 0;

for (const [index, item] of candidates.entries()) {
  const sourcePath = item.storage_path;
  try {
    const { data: blob, error: downloadError } = await supabase.storage.from(SOURCE_BUCKET).download(sourcePath);
    if (downloadError || !blob) throw new Error("source download failed");

    const buffer = Buffer.from(await blob.arrayBuffer());
    if (!buffer.length) throw new Error("source file is empty");

    await r2.putObject(sourcePath, buffer, contentTypeFor(sourcePath, blob.type));
    const targetPath = `${R2_PREFIX}${sourcePath}`;
    const { data: updated, error: updateError } = await supabase
      .from("gallery_items")
      .update({ storage_path: targetPath })
      .eq("id", item.id)
      .eq("storage_path", sourcePath)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      await r2.deleteObject(sourcePath).catch(() => {});
      throw new Error("metadata update failed");
    }

    migrated += 1;
    console.log(`[${index + 1}/${candidates.length}] migrated ${item.id}`);
  } catch (migrationError) {
    failed += 1;
    console.error(`[${index + 1}/${candidates.length}] failed ${item.id}: ${migrationError.message}`);
    if (!keepGoing) break;
  }
}

console.log(JSON.stringify({ migrated, failed, sourceFilesDeleted: 0 }, null, 2));
if (failed) process.exitCode = 1;
