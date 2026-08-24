import assert from "node:assert/strict";
import test from "node:test";
import serverless from "serverless-http";
import express from "express";

test("Netlify adapter base64-encodes image responses without corrupting bytes", async () => {
  const original = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x00, 0x80]);
  const app = express();
  app.get("/image.png", (_request, response) => {
    response.type("image/png").send(original);
  });
  const handler = serverless(app, { binary: ["image/jpeg", "image/png", "image/webp"] });

  const result = await handler({
    httpMethod: "GET",
    path: "/image.png",
    headers: {},
    requestContext: {},
  }, {});

  assert.equal(result.statusCode, 200);
  assert.equal(result.isBase64Encoded, true);
  assert.deepEqual(Buffer.from(result.body, "base64"), original);
});
