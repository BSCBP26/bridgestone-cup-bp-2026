import assert from "node:assert/strict";
import test from "node:test";
import { calculateR2Usage, calculateSupabaseMediaUsage } from "../src/modules/storage-usage/storage-usage.service.js";

test("Supabase media usage sums paginated folder object sizes", async () => {
  const pages = new Map([
    ["gallery:0", Array.from({ length:100 }, () => ({ metadata:{ size:1024 } }))],
    ["gallery:100", [{ metadata:{ size:2048 } }]],
  ]);
  const client = { storage:{ from:() => ({ list:async(folder,{offset}) => ({ data:pages.get(`${folder}:${offset}`) || [], error:null }) }) } };
  const usage = await calculateSupabaseMediaUsage(client);
  assert.equal(usage.usedBytes, 104448);
  assert.equal(usage.limitBytes, 500 * 1024 * 1024);
  assert.equal(usage.status, "safe");
});

test("R2 usage sums every paginated object", async () => {
  const client = { listObjects:async token => token ? { sizes:[30], nextToken:null } : { sizes:[10,20], nextToken:"next" } };
  const usage = await calculateR2Usage(client);
  assert.equal(usage.usedBytes, 60);
  assert.equal(usage.limitBytes, 10 * 1024 * 1024 * 1024);
});
