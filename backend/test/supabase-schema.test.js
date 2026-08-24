import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260808012000_initial_schema.sql", import.meta.url);
const seedUrl = new URL("../supabase/seed.sql", import.meta.url);
const expectedTables = [
  "sports",
  "tournaments",
  "admin_profiles",
  "teams",
  "participants",
  "tournament_entries",
  "matches",
  "standings",
  "announcements",
  "gallery_items",
];

test("initial Supabase migration defines all planned tables with RLS", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  for (const table of expectedTables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security;`));
  }
  assert.match(migration, /references auth\.users\(id\)/);
  assert.match(migration, /grant all on[\s\S]+to service_role;/);
  assert.doesNotMatch(migration, /SUPABASE_SERVICE_ROLE_KEY|eyJ[A-Za-z0-9_-]+\./);
});

test("Supabase seed contains exactly the six approved sports and tournaments", async () => {
  const seed = await readFile(seedUrl, "utf8");
  const sportIds = [...seed.matchAll(/'sport-(badminton|futsal|chess|table-tennis|football|fishing)'/g)]
    .map(match => match[1]);
  const tournamentIds = [...seed.matchAll(/'(badminton|futsal|chess|table-tennis|football|fishing)-bp-2026'/g)]
    .map(match => match[1]);

  assert.deepEqual([...new Set(sportIds)].sort(), [
    "badminton", "chess", "fishing", "football", "futsal", "table-tennis",
  ]);
  assert.deepEqual([...new Set(tournamentIds)].sort(), [
    "badminton", "chess", "fishing", "football", "futsal", "table-tennis",
  ]);
});
