import assert from "node:assert/strict";
import test from "node:test";
import { generateSingleEliminationBracket } from "../src/modules/brackets/bracket-generator.js";

function participants(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Test Team ${index + 1}`,
  }));
}

test("8 participants create an 8-slot bracket without byes", () => {
  const bracket = generateSingleEliminationBracket(participants(8));

  assert.equal(bracket.bracketSize, 8);
  assert.equal(bracket.byeCount, 0);
  assert.deepEqual(bracket.rounds.map((round) => round.matches.length), [4, 2, 1]);
  assert.equal(bracket.rounds[0].matches.every((match) => match.status === "scheduled"), true);
});

test("10 participants create a 16-slot bracket with 6 byes", () => {
  const bracket = generateSingleEliminationBracket(participants(10));
  const firstRound = bracket.rounds[0].matches;

  assert.equal(bracket.bracketSize, 16);
  assert.equal(bracket.byeCount, 6);
  assert.deepEqual(bracket.rounds.map((round) => round.matches.length), [8, 4, 2, 1]);
  assert.equal(firstRound.filter((match) => match.status === "bye").length, 6);
  assert.equal(firstRound.filter((match) => match.status === "scheduled").length, 2);
  assert.equal(firstRound.every((match) => match.nextMatchId), true);
});

test("bye winners are placed into their next matches", () => {
  const bracket = generateSingleEliminationBracket(participants(5));
  const byeMatches = bracket.rounds[0].matches.filter((match) => match.status === "bye");
  const nextRound = bracket.rounds[1].matches;

  assert.equal(bracket.byeCount, 3);
  for (const match of byeMatches) {
    const target = nextRound.find((candidate) => candidate.id === match.nextMatchId);
    assert.equal(target[`${match.nextMatchSlot}Participant`].id, match.winnerParticipantId);
  }
});
