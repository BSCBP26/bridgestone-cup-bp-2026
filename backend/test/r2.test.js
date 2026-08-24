import assert from "node:assert/strict";
import test from "node:test";
import { createR2Client } from "../src/config/r2.js";

test("R2 client signs and sends S3-compatible PUT and DELETE requests", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200 };
  };
  const client = createR2Client({
    accountId: "account123",
    accessKeyId: "access123",
    secretAccessKey: "secret123",
    bucket: "event-media",
  }, fetchImpl, () => new Date("2026-08-11T08:00:00.000Z"));

  await client.putObject("gallery/test image.jpg", Buffer.from("image"), "image/jpeg");
  await client.deleteObject("gallery/test image.jpg");
  const downloaded = await client.getObject("gallery/test image.jpg");

  assert.equal(requests[0].url, "https://account123.r2.cloudflarestorage.com/event-media/gallery/test%20image.jpg");
  assert.equal(requests[0].options.method, "PUT");
  assert.equal(requests[0].options.headers["content-type"], "image/jpeg");
  assert.match(requests[0].options.headers.authorization, /^AWS4-HMAC-SHA256 Credential=access123\/20260811\/auto\/s3\/aws4_request/);
  assert.equal(requests[0].options.headers["x-amz-date"], "20260811T080000Z");
  assert.equal(requests[1].options.method, "DELETE");
  assert.equal("body" in requests[1].options, false);
  assert.equal(requests[2].options.method, "GET");
  assert.equal(downloaded.status, 200);
});

test("R2 client returns a safe backend error when an operation fails", async () => {
  const client = createR2Client({
    accountId: "account123",
    accessKeyId: "access123",
    secretAccessKey: "secret123",
    bucket: "event-media",
  }, async () => ({ ok: false, status: 403 }), () => new Date("2026-08-11T08:00:00.000Z"));
  await assert.rejects(() => client.deleteObject("gallery/image.jpg"), error => error.statusCode === 502 && !error.message.includes("secret123"));
});

test("R2 client lists object sizes and continuation tokens", async () => {
  const requests = [];
  const client = createR2Client({
    accountId: "account123",
    accessKeyId: "access123",
    secretAccessKey: "secret123",
    bucket: "event-media",
  }, async (url, options) => {
    requests.push({ url, options });
    return new Response("<ListBucketResult><Contents><Key>a.png</Key><Size>120</Size></Contents><NextContinuationToken>page-2</NextContinuationToken></ListBucketResult>", { status:200 });
  }, () => new Date("2026-08-12T07:00:00.000Z"));
  const result = await client.listObjects();
  assert.deepEqual(result, { sizes:[120], nextToken:"page-2" });
  assert.match(requests[0].url, /list-type=2&max-keys=1000/);
});

test("R2 pagination signs continuation token in canonical query order", async () => {
  const requests = [];
  const client = createR2Client({ accountId:"account123", accessKeyId:"access123", secretAccessKey:"secret123", bucket:"event-media" }, async (url, options) => {
    requests.push({ url, options });
    return new Response("<ListBucketResult></ListBucketResult>", { status:200 });
  }, () => new Date("2026-08-12T07:00:00.000Z"));
  await client.listObjects("page 2");
  assert.match(requests[0].url, /\?continuation-token=page\+2&list-type=2&max-keys=1000$/);
});
