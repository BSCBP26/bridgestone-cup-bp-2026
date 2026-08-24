import assert from "node:assert/strict";
import test from "node:test";
import { deleteImage, uploadImage } from "../src/modules/media/media.service.js";

function fakeStorage(provider = "supabase") {
  const calls = { upload: [], delete: [] };
  return {
    provider,
    prefix: provider === "r2" ? "r2/" : "",
    calls,
    async upload(path, buffer, mimeType) { calls.upload.push({ path, buffer, mimeType }); },
    async delete(path) { calls.delete.push(path); },
  };
}

test("image upload accepts supported content and generates a Supabase gallery path", async () => {
  const storage = fakeStorage();
  const result = await uploadImage(Buffer.from("image"), "image/webp", storage);
  assert.match(result.storagePath, /^gallery\/[a-f0-9-]+\.webp$/);
  assert.equal(result.mimeType, "image/webp");
  assert.equal(result.provider, "supabase");
  assert.equal(storage.calls.upload[0].mimeType, "image/webp");
});

test("R2 uploads are namespaced so legacy Supabase paths keep working", async () => {
  const storage = fakeStorage("r2");
  const result = await uploadImage(Buffer.from("image"), "image/jpeg", storage, "greetings");
  assert.match(result.storagePath, /^r2\/greetings\/[a-f0-9-]+\.jpg$/);
  assert.equal(result.provider, "r2");
  assert.match(storage.calls.upload[0].path, /^greetings\/[a-f0-9-]+\.jpg$/);
});

test("image upload rejects unsupported MIME types", async () => {
  await assert.rejects(() => uploadImage(Buffer.from("file"), "image/gif", fakeStorage()), error => error.statusCode === 415);
});

test("image deletion accepts generated Supabase and R2 paths only", async () => {
  const supabase = fakeStorage();
  await deleteImage("gallery/123e4567-e89b-12d3-a456-426614174000.jpg", supabase);
  assert.deepEqual(supabase.calls.delete, ["gallery/123e4567-e89b-12d3-a456-426614174000.jpg"]);

  const r2 = fakeStorage("r2");
  await deleteImage("r2/support/123e4567-e89b-12d3-a456-426614174000.webp", r2);
  assert.deepEqual(r2.calls.delete, ["support/123e4567-e89b-12d3-a456-426614174000.webp"]);
  await assert.rejects(() => deleteImage("../private.txt", supabase), error => error.statusCode === 422);
});
