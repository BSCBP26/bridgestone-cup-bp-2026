import { createHash, createHmac } from "node:crypto";
import { env } from "./env.js";
import { AppError } from "../shared/app-error.js";

const sha256 = value => createHash("sha256").update(value).digest("hex");
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
const encodeKey = key => key.split("/").map(encodeURIComponent).join("/");

export function createR2Client(config, fetchImpl = fetch, now = () => new Date()) {
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

  async function request(method, key, body = Buffer.alloc(0), contentType, query = "") {
    const timestamp = now().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = timestamp.slice(0, 8);
    const host = `${config.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = key
      ? `/${encodeURIComponent(config.bucket)}/${encodeKey(key)}`
      : `/${encodeURIComponent(config.bucket)}`;
    const canonicalQuery = query;
    const payloadHash = sha256(body);
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${date}/auto/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", timestamp, scope, sha256(canonicalRequest)].join("\n");
    const dateKey = hmac(`AWS4${config.secretAccessKey}`, date);
    const regionKey = hmac(dateKey, "auto");
    const serviceKey = hmac(regionKey, "s3");
    const signingKey = hmac(serviceKey, "aws4_request");
    const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
    const headers = {
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
    };
    if (contentType) headers["content-type"] = contentType;
    const response = await fetchImpl(`${endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`, {
      method,
      headers,
      ...(method === "PUT" ? { body } : {}),
    });
    if (!response.ok) {
      const operation = method === "PUT" ? "upload" : method === "DELETE" ? "deletion" : "download";
      throw new AppError(response.status === 404 ? 404 : 502, `R2 ${operation} failed`);
    }
    return response;
  }

  return {
    putObject: (key, body, contentType) => request("PUT", key, body, contentType),
    deleteObject: key => request("DELETE", key),
    getObject: key => request("GET", key),
    async listObjects(continuationToken = "") {
      const parameters = new URLSearchParams();
      if (continuationToken) parameters.set("continuation-token", continuationToken);
      parameters.set("list-type", "2");
      parameters.set("max-keys", "1000");
      const response = await request("GET", "", Buffer.alloc(0), undefined, parameters.toString());
      const xml = await response.text();
      const sizes = [...xml.matchAll(/<Size>(\d+)<\/Size>/g)].map(match => Number(match[1]));
      const nextToken = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1] || null;
      return { sizes, nextToken };
    },
  };
}

let r2Client;
export function getR2Client() {
  if (!env.r2Configured) throw new AppError(503, "Cloudflare R2 is not configured");
  r2Client ??= createR2Client({
    accountId: env.r2AccountId,
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
    bucket: env.r2Bucket,
  });
  return r2Client;
}
