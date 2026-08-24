import assert from "node:assert/strict";
import test from "node:test";
import { buildSupportLeaderboard } from "../src/modules/support/support.service.js";

test("support leaderboard normalizes teams, counts cards, and returns the top three", () => {
  const result = buildSupportLeaderboard([{teamName:"Production Team"},{teamName:" production   team "},{teamName:"QA Team"},{teamName:"Maintenance Team"},{teamName:"Engineering Team"}]);
  assert.deepEqual(result, [{team:"PRODUCTION TEAM",count:2,rank:1},{team:"ENGINEERING TEAM",count:1,rank:2},{team:"MAINTENANCE TEAM",count:1,rank:3}]);
});
