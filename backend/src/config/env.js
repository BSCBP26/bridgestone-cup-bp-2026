const DEFAULT_PORT = 3000;

function parsePort(value) {
  if (value === undefined || value === "") return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseOrigins(value) {
  if (!value) return [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
}

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
const supabaseSecretKey = (
  process.env.SUPABASE_SECRET_KEY?.trim()
  || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  || ""
);

const mediaStorageProvider = (process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() || "supabase");
if (!['supabase', 'r2'].includes(mediaStorageProvider)) {
  throw new Error("MEDIA_STORAGE_PROVIDER must be either supabase or r2");
}
const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
const r2Bucket = process.env.R2_BUCKET?.trim() ?? "";
const r2PublicBaseUrl = (process.env.R2_PUBLIC_BASE_URL?.trim() ?? "").replace(/\/$/, "");
const publicApiBaseUrl = (process.env.PUBLIC_API_BASE_URL?.trim() ?? "").replace(/\/$/, "");

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  supabaseUrl,
  supabasePublishableKey,
  supabaseSecretKey,
  supabaseConfigured: Boolean(supabaseUrl && supabaseSecretKey),
  mediaStorageProvider,
  r2AccountId,
  r2AccessKeyId,
  r2SecretAccessKey,
  r2Bucket,
  r2PublicBaseUrl,
  publicApiBaseUrl,
  r2Configured: Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2Bucket && r2PublicBaseUrl),
});
