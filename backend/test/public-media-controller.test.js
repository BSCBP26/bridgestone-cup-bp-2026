import assert from "node:assert/strict";
import test from "node:test";
import { getDownloadDisposition, getPublicR2Media, normalizeMediaRange } from "../src/modules/media/public-media.controller.js";

test("public R2 media rejects an invalid object key before storage access", async () => {
  let nextError;
  await getPublicR2Media(
    { params: { folder: "gallery", filename: "../secret.txt" } },
    {},
    error => { nextError = error; },
  );
  assert.equal(nextError.statusCode, 404);
});

test("public R2 media creates a safe attachment filename for download requests", () => {
  const request = { query: { download: "1", name: "Foto Bridgestone 01.jpg" } };
  assert.equal(
    getDownloadDisposition(request, "gallery/123e4567-e89b-12d3-a456-426614174000.jpg"),
    'attachment; filename="Foto-Bridgestone-01.jpg"',
  );
});

test("public R2 media stays inline without the download flag", () => {
  assert.equal(
    getDownloadDisposition({ query: {} }, "gallery/123e4567-e89b-12d3-a456-426614174000.jpg"),
    null,
  );
});

test("video streaming limits open-ended range requests to Netlify-safe chunks", () => {
  assert.equal(normalizeMediaRange("bytes=0-", "gallery/video.webm"), "bytes=0-2097151");
  assert.equal(normalizeMediaRange("bytes=5000000-", "gallery/video.webm"), "bytes=5000000-7097151");
  assert.equal(normalizeMediaRange("bytes=0-999", "gallery/video.webm"), "bytes=0-999");
});

test("video streaming requests an initial chunk when the browser omits Range", () => {
  assert.equal(normalizeMediaRange(undefined, "gallery/video.webm"), "bytes=0-2097151");
  assert.equal(normalizeMediaRange(undefined, "gallery/photo.jpg"), null);
});
