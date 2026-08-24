import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260808031000_content_management.sql", import.meta.url);

test("content migration creates protected greeting and support tables", async () => {
  const migration = (await readFile(migrationUrl, "utf8")).toLowerCase();
  for (const table of ["greetings", "support_messages"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /grant all on public\.greetings, public\.support_messages to service_role/);
  assert.match(migration, /revoke all on public\.greetings, public\.support_messages from anon, authenticated/);
});

test("support leaderboard migration adds a required indexed team field", async () => {
  const migrationUrl = new URL("../supabase/migrations/20260808153500_support_team_leaderboard.sql", import.meta.url);
  const migration = (await readFile(migrationUrl, "utf8")).toLowerCase();
  assert.match(migration, /add column team_name text/);
  assert.match(migration, /alter column team_name set not null/);
  assert.match(migration, /support_messages_team_leaderboard_idx/);
});

test("content migration provisions a limited public event-media bucket", async () => {
  const migration = (await readFile(migrationUrl, "utf8")).toLowerCase();
  assert.match(migration, /'event-media'/);
  assert.match(migration, /8388608/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
});

test("bracket snapshot migration creates protected persistent bracket storage", async () => {
  const snapshotUrl = new URL("../supabase/migrations/20260808151000_bracket_snapshots.sql", import.meta.url);
  const migration = (await readFile(snapshotUrl, "utf8")).toLowerCase();
  assert.match(migration, /create table public\.bracket_snapshots\s*\(/);
  assert.match(migration, /tournament_id text primary key references public\.tournaments/);
  assert.match(migration, /bracket jsonb not null/);
  assert.match(migration, /alter table public\.bracket_snapshots enable row level security/);
  assert.match(migration, /revoke all on public\.bracket_snapshots from anon, authenticated/);
  assert.match(migration, /grant all on public\.bracket_snapshots to service_role/);
});
