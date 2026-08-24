import assert from "node:assert/strict";
import test from "node:test";
import { getPublicR2Media } from "../src/modules/media/public-media.controller.js";

test("public R2 media rejects an invalid object key before storage access", async () => {
  let nextError;
  await getPublicR2Media(
    { params: { folder: "gallery", filename: "../secret.txt" } },
    {},
    error => { nextError = error; },
  );
  assert.equal(nextError.statusCode, 404);
});
