import assert from "node:assert/strict";
import { test } from "node:test";
import { clearTournamentFormatOverrides } from "../src/modules/tournaments/tournaments.repository.js";
import { getCompetitionFormat, updateCompetitionFormat } from "../src/modules/tournaments/tournaments.service.js";

test("admin can switch a non-fishing tournament between direct playoff and group playoff", async () => {
  clearTournamentFormatOverrides();
  let result = await updateCompetitionFormat("badminton-bp-2026", "group_and_single_elimination");
  assert.equal(result.usesGroupStage, true);
  assert.equal((await getCompetitionFormat("badminton-bp-2026")).format, "group_and_single_elimination");
  result = await updateCompetitionFormat("badminton-bp-2026", "single_elimination");
  assert.equal(result.usesGroupStage, false);
  clearTournamentFormatOverrides();
});

test("competition format validation rejects unsupported values and Fishing", async () => {
  await assert.rejects(() => updateCompetitionFormat("football-bp-2026", "ranking"), /format must be/);
  await assert.rejects(() => updateCompetitionFormat("fishing-bp-2026", "single_elimination"), /cannot be changed/);
});
