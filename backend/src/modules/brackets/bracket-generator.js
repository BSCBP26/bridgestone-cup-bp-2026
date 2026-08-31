const ROUND_NAMES = Object.freeze({
  2: ["Final"],
  4: ["Semi Final", "Final"],
  8: ["Quarter Final", "Semi Final", "Final"],
  16: ["Round of 16", "Quarter Final", "Semi Final", "Final"],
  32: ["Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Final"],
  64: ["Round of 64", "Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Final"],
});

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(value));
}

function createMatch(roundNumber, position, roundName) {
  return {
    id: `r${roundNumber}-m${position}`,
    roundNumber,
    roundName,
    position,
    homeParticipant: null,
    awayParticipant: null,
    homeScore: null,
    awayScore: null,
    scheduledAt: null,
    venue: null,
    winnerParticipantId: null,
    status: "pending",
    nextMatchId: null,
    nextMatchSlot: null,
  };
}

function setNextMatch(match, nextRound) {
  const nextPosition = Math.ceil(match.position / 2);
  match.nextMatchId = nextRound[nextPosition - 1].id;
  match.nextMatchSlot = match.position % 2 === 1 ? "home" : "away";
}

function advanceBye(match, nextRound) {
  const participant = match.homeParticipant ?? match.awayParticipant;
  match.winnerParticipantId = participant.id;
  match.status = "bye";

  if (!nextRound) return;
  const nextMatch = nextRound[Math.ceil(match.position / 2) - 1];
  nextMatch[`${match.nextMatchSlot}Participant`] = participant;
}

function connect(match, nextMatch, slot) {
  match.nextMatchId = nextMatch.id;
  match.nextMatchSlot = slot;
}

function generateFootballTenTeamBracket(participants) {
  const rounds = [
    { number: 1, name: "Babak Pendahuluan", matches: Array.from({ length: 4 }, (_, index) => createMatch(1, index + 1, "Babak Pendahuluan")) },
    { number: 2, name: "Quarter Final", matches: Array.from({ length: 2 }, (_, index) => createMatch(2, index + 1, "Quarter Final")) },
    { number: 3, name: "Semi Final", matches: Array.from({ length: 2 }, (_, index) => createMatch(3, index + 1, "Semi Final")) },
    { number: 4, name: "Final", matches: [createMatch(4, 1, "Final")] },
  ];
  const [preliminary, quarterFinal, semiFinal, final] = rounds.map(round => round.matches);

  // Dua tim pertama mendapat bye. Empat pemenang babak pendahuluan
  // mengisi jalur seperti format 10 tim pada rancangan Football.
  quarterFinal[0].homeParticipant = participants[0];
  quarterFinal[1].homeParticipant = participants[1];
  [[2, 3], [4, 5], [6, 7], [8, 9]].forEach(([homeIndex, awayIndex], index) => {
    preliminary[index].homeParticipant = participants[homeIndex];
    preliminary[index].awayParticipant = participants[awayIndex];
    preliminary[index].status = "scheduled";
  });

  connect(preliminary[0], semiFinal[0], "home");
  connect(preliminary[1], quarterFinal[0], "away");
  connect(preliminary[2], semiFinal[1], "home");
  connect(preliminary[3], quarterFinal[1], "away");
  connect(quarterFinal[0], semiFinal[0], "away");
  connect(quarterFinal[1], semiFinal[1], "away");
  connect(semiFinal[0], final[0], "home");
  connect(semiFinal[1], final[0], "away");

  return {
    format: "single_elimination",
    status: "active",
    participantCount: participants.length,
    participants,
    bracketSize: 10,
    byeCount: 2,
    championParticipantId: null,
    rounds,
  };
}

export function generateSingleEliminationBracket(participants, options = {}) {
  if (options.footballTenTeam === true && participants.length === 10) {
    return generateFootballTenTeamBracket(participants);
  }

  const bracketSize = nextPowerOfTwo(participants.length);
  const roundNames = ROUND_NAMES[bracketSize];
  const rounds = roundNames.map((name, roundIndex) => ({
    number: roundIndex + 1,
    name,
    matches: Array.from(
      { length: bracketSize / (2 ** (roundIndex + 1)) },
      (_, matchIndex) => createMatch(roundIndex + 1, matchIndex + 1, name),
    ),
  }));

  for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex += 1) {
    for (const match of rounds[roundIndex].matches) {
      setNextMatch(match, rounds[roundIndex + 1].matches);
    }
  }

  const firstRound = rounds[0].matches;
  const byeCount = bracketSize - participants.length;
  let participantIndex = 0;

  for (let index = 0; index < firstRound.length; index += 1) {
    const match = firstRound[index];
    match.homeParticipant = participants[participantIndex++];

    if (index >= byeCount) {
      match.awayParticipant = participants[participantIndex++];
      match.status = "scheduled";
    } else {
      advanceBye(match, rounds[1]?.matches);
    }
  }

  for (const round of rounds.slice(1)) {
    for (const match of round.matches) {
      if (match.homeParticipant && match.awayParticipant) match.status = "scheduled";
    }
  }

  return {
    format: "single_elimination",
    status: "active",
    participantCount: participants.length,
    participants,
    bracketSize,
    byeCount,
    championParticipantId: null,
    rounds,
  };
}
