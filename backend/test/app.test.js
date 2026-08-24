import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app, createApp } from "../src/app.js";
import { clearBrackets } from "../src/modules/brackets/brackets.repository.js";

let baseUrl;
let server;

before(async () => {
  const allowBracketAdmin = (request, _response, next) => {
    request.admin = { role: "super_admin", is_active: true };
    next();
  };
  server = createApp({ bracketAuthentication: allowBracketAdmin }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/health reports that the API is running", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "ok");
  assert.equal(body.data.database.status, "not_configured");
  assert.equal(typeof body.data.timestamp, "string");
});

test("GET /api/config exposes only browser-safe Supabase configuration", async () => {
  const response = await fetch(`${baseUrl}/api/config`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(Object.hasOwn(body.data, "supabaseUrl"), true);
  assert.equal(Object.hasOwn(body.data, "supabasePublishableKey"), true);
  assert.equal(Object.hasOwn(body.data, "supabaseSecretKey"), false);
});

test("GET /api/admin/me requires a Bearer token", async () => {
  const response = await fetch(`${baseUrl}/api/admin/me`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, "A valid Bearer token is required");
});

test("storage usage endpoint requires an admin session", async () => {
  const response = await fetch(`${baseUrl}/api/admin/storage-usage`);
  assert.equal(response.status, 401);
});

test("admin bracket mutations require authentication in the production app", async () => {
  const protectedServer = app.listen(0);
  await new Promise((resolve) => protectedServer.once("listening", resolve));
  const address = protectedServer.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/tournaments/badminton-bp-2026/bracket/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: [{ id: "a", name: "A" }, { id: "b", name: "B" }] }),
  });
  await new Promise((resolve, reject) => protectedServer.close((error) => error ? reject(error) : resolve()));
  assert.equal(response.status, 401);
});

test("admin gallery and media endpoints require authentication", async () => {
  const protectedServer = app.listen(0);
  await new Promise((resolve) => protectedServer.once("listening", resolve));
  const address = protectedServer.address();
  const protectedBase = `http://127.0.0.1:${address.port}`;
  const [galleryResponse, mediaResponse] = await Promise.all([
    fetch(`${protectedBase}/api/admin/gallery`),
    fetch(`${protectedBase}/api/admin/media/images`, { method: "POST", headers: { "Content-Type": "image/png" }, body: Buffer.from("test") }),
  ]);
  await new Promise((resolve, reject) => protectedServer.close((error) => error ? reject(error) : resolve()));
  assert.equal(galleryResponse.status, 401);
  assert.equal(mediaResponse.status, 401);
});

test("admin greetings require authentication", async () => {
  const protectedServer = app.listen(0);
  await new Promise((resolve) => protectedServer.once("listening", resolve));
  const address = protectedServer.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/greetings`);
  await new Promise((resolve, reject) => protectedServer.close((error) => error ? reject(error) : resolve()));
  assert.equal(response.status, 401);
});

test("admin support messages require authentication", async () => {
  const protectedServer = app.listen(0);
  await new Promise((resolve) => protectedServer.once("listening", resolve));
  const address = protectedServer.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/support`);
  await new Promise((resolve, reject) => protectedServer.close((error) => error ? reject(error) : resolve()));
  assert.equal(response.status, 401);
});

test("admin announcements require authentication", async () => {
  const protectedServer=app.listen(0);await new Promise(resolve=>protectedServer.once("listening",resolve));const address=protectedServer.address();const response=await fetch(`http://127.0.0.1:${address.port}/api/admin/announcements`);await new Promise((resolve,reject)=>protectedServer.close(error=>error?reject(error):resolve()));assert.equal(response.status,401);
});

test("admin standings updates require authentication", async () => {
  const protectedServer=app.listen(0);await new Promise(resolve=>protectedServer.once("listening",resolve));const address=protectedServer.address();const response=await fetch(`http://127.0.0.1:${address.port}/api/admin/tournaments/futsal-bp-2026/standings`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({groups:[]})});await new Promise((resolve,reject)=>protectedServer.close(error=>error?reject(error):resolve()));assert.equal(response.status,401);
});


test("an unknown route returns the standard error response", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    success: false,
    message: "Route GET /api/unknown not found",
  });
});

test("CORS rejects an origin outside the allowlist", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://example.com" },
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
  assert.equal(body.message, "Origin is not allowed by CORS");
});

test("GET /api/sports returns all six public sports", async () => {
  const response = await fetch(`${baseUrl}/api/sports`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.meta.total, 6);
  assert.deepEqual(body.data.map((sport) => sport.slug), [
    "badminton",
    "futsal",
    "chess",
    "table-tennis",
    "football",
    "fishing",
  ]);
});

test("GET /api/sports/:slug returns one sport", async () => {
  const response = await fetch(`${baseUrl}/api/sports/badminton`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.participantType, "pair");
  assert.equal(body.data.participantLimit, 16);
});

test("GET /api/sports/:slug/tournaments returns that sport's tournaments", async () => {
  const response = await fetch(`${baseUrl}/api/sports/futsal/tournaments`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.meta.sport, "futsal");
  assert.equal(body.meta.total, 1);
  assert.equal(body.data[0].id, "futsal-bp-2026");
});

test("GET /api/tournaments/:id returns tournament details", async () => {
  const response = await fetch(`${baseUrl}/api/tournaments/badminton-bp-2026`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.format, "single_elimination");
  assert.equal(body.data.timezone, "Asia/Jakarta");
});

test("GET competition format exposes whether a group stage is enabled", async () => {
  const response = await fetch(`${baseUrl}/api/tournaments/futsal-bp-2026/competition-format`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.format, "group_and_single_elimination");
  assert.equal(body.data.usesGroupStage, true);
});

test("Fishing does not expose the playoff competition format switch", async () => {
  const response = await fetch(`${baseUrl}/api/tournaments/fishing-bp-2026/competition-format`);
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.message, "Fishing competition format is managed through ranking");
});

test("missing sports and tournaments use the standard 404 response", async () => {
  const [sportResponse, tournamentResponse] = await Promise.all([
    fetch(`${baseUrl}/api/sports/unknown`),
    fetch(`${baseUrl}/api/tournaments/unknown`),
  ]);
  const [sportBody, tournamentBody] = await Promise.all([
    sportResponse.json(),
    tournamentResponse.json(),
  ]);

  assert.equal(sportResponse.status, 404);
  assert.equal(sportBody.message, "Sport not found");
  assert.equal(tournamentResponse.status, 404);
  assert.equal(tournamentBody.message, "Tournament not found");
});

test("POST bracket preview creates a dynamic bracket without persisting it", async () => {
  const participants = Array.from({ length: 10 }, (_, index) => ({
    id: `pair-${index + 1}`,
    name: `Test Pair ${index + 1}`,
  }));
  const response = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.meta.persisted, false);
  assert.equal(body.data.bracket.participantCount, 10);
  assert.equal(body.data.bracket.bracketSize, 16);
  assert.equal(body.data.bracket.byeCount, 6);
});

test("bracket preview rejects invalid participant input", async () => {
  const response = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: [{ id: "only-one", name: "Only One" }] }),
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.message, "Participant count must be between 2 and 16");
});

test("a saved bracket accepts scores and advances the champion", async () => {
  clearBrackets();
  const participants = Array.from({ length: 4 }, (_, index) => ({
    id: `saved-pair-${index + 1}`,
    name: `Saved Pair ${index + 1}`,
  }));
  const createResponse = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  assert.equal(createResponse.status, 201);

  const duplicateResponse = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  assert.equal(duplicateResponse.status, 409);

  for (const [matchId, homeScore, awayScore] of [
    ["r1-m1", 21, 12],
    ["r1-m2", 18, 21],
  ]) {
    const response = await fetch(
      `${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/${matchId}/result`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore, awayScore }),
      },
    );
    assert.equal(response.status, 200);
  }

  const beforeFinalResponse = await fetch(`${baseUrl}/api/tournaments/badminton-bp-2026/bracket`);
  const beforeFinal = await beforeFinalResponse.json();
  const finalMatch = beforeFinal.data.rounds[1].matches[0];
  const thirdPlaceMatch = beforeFinal.data.thirdPlaceMatch;
  assert.equal(finalMatch.status, "scheduled");
  assert.equal(finalMatch.homeParticipant.id, "saved-pair-1");
  assert.equal(finalMatch.awayParticipant.id, "saved-pair-4");
  assert.equal(thirdPlaceMatch.status, "scheduled");
  assert.equal(thirdPlaceMatch.homeParticipant.id, "saved-pair-2");
  assert.equal(thirdPlaceMatch.awayParticipant.id, "saved-pair-3");

  const thirdPlaceResponse = await fetch(
    `${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/third-place/result`,
    { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({homeScore:21,awayScore:18}) },
  );
  assert.equal(thirdPlaceResponse.status, 200);

  const finalResponse = await fetch(
    `${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/r2-m1/result`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeScore: 15, awayScore: 21 }),
    },
  );
  const finalBody = await finalResponse.json();

  assert.equal(finalResponse.status, 200);
  assert.equal(finalBody.data.bracket.status, "completed");
  assert.equal(finalBody.data.bracket.championParticipantId, "saved-pair-4");

  const correctionResponse = await fetch(
    `${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/r1-m2/result`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeScore: 21, awayScore: 18 }),
    },
  );
  const correctionBody = await correctionResponse.json();
  const correctedFinal = correctionBody.data.bracket.rounds[1].matches[0];

  assert.equal(correctionResponse.status, 200);
  assert.equal(correctionBody.data.bracket.status, "active");
  assert.equal(correctionBody.data.bracket.championParticipantId, null);
  assert.equal(correctionBody.data.bracket.thirdPlaceParticipantId, null);
  assert.equal(correctedFinal.homeParticipant.id, "saved-pair-1");
  assert.equal(correctedFinal.awayParticipant.id, "saved-pair-3");
  assert.equal(correctedFinal.status, "scheduled");
  assert.equal(correctedFinal.homeScore, null);
  assert.equal(correctedFinal.winnerParticipantId, null);
  assert.equal(correctionBody.data.bracket.thirdPlaceMatch.awayParticipant.id, "saved-pair-4");
  assert.equal(correctionBody.data.bracket.thirdPlaceMatch.homeScore, null);
});

test("single-elimination score submission rejects a draw", async () => {
  clearBrackets();
  const participants = [
    { id: "player-1", name: "Test Player 1" },
    { id: "player-2", name: "Test Player 2" },
  ];
  await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });

  const response = await fetch(
    `${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/matches/r1-m1/result`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeScore: 10, awayScore: 10 }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.message, "Single-elimination matches cannot end in a draw");
});

test("Table Tennis semifinal losers advance to a third-place match", async () => {
  clearBrackets();
  const participants = Array.from({ length: 4 }, (_, index) => ({ id:`tt-${index + 1}`, name:`TT Player ${index + 1}` }));
  const created = await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/bracket`, {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({participants}),
  });
  assert.equal(created.status, 201);

  for (const [matchId, homeScore, awayScore] of [["r1-m1",3,1],["r1-m2",2,3]]) {
    const response = await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/matches/${matchId}/result`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({homeScore,awayScore}),
    });
    assert.equal(response.status, 200);
  }

  const bracketResponse = await fetch(`${baseUrl}/api/tournaments/table-tennis-bp-2026/bracket`);
  const bracket = (await bracketResponse.json()).data;
  assert.equal(bracket.thirdPlaceMatch.status, "scheduled");
  assert.equal(bracket.thirdPlaceMatch.homeParticipant.id, "tt-2");
  assert.equal(bracket.thirdPlaceMatch.awayParticipant.id, "tt-3");

  const bronzeResponse = await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/matches/third-place/result`, {
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({homeScore:3,awayScore:2}),
  });
  const bronzeBracket = (await bronzeResponse.json()).data.bracket;
  assert.equal(bronzeResponse.status, 200);
  assert.equal(bronzeBracket.thirdPlaceParticipantId, "tt-2");
  assert.equal(bronzeBracket.status, "active");

  const finalResponse = await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/matches/r2-m1/result`, {
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({homeScore:3,awayScore:1}),
  });
  const completedBracket = (await finalResponse.json()).data.bracket;
  assert.equal(completedBracket.championParticipantId, "tt-1");
  assert.equal(completedBracket.status, "completed");

  const correctionResponse = await fetch(`${baseUrl}/api/admin/tournaments/table-tennis-bp-2026/matches/r1-m1/result`, {
    method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({homeScore:1,awayScore:3}),
  });
  const correctedBracket = (await correctionResponse.json()).data.bracket;
  assert.equal(correctedBracket.status, "active");
  assert.equal(correctedBracket.championParticipantId, null);
  assert.equal(correctedBracket.thirdPlaceParticipantId, null);
  assert.equal(correctedBracket.thirdPlaceMatch.homeParticipant.id, "tt-1");
  assert.equal(correctedBracket.thirdPlaceMatch.homeScore, null);
});

test("match schedule stores an ISO date-time and venue", async () => {
  clearBrackets();
  const participants = [
    { id: "schedule-1", name: "Schedule Team 1" },
    { id: "schedule-2", name: "Schedule Team 2" },
  ];
  await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });

  const response = await fetch(
    `${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/r1-m1/schedule`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: "2026-12-12T16:45:00+07:00",
        venue: "Cafetaria",
      }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.match.scheduledAt, "2026-12-12T16:45:00+07:00");
  assert.equal(body.data.match.venue, "Cafetaria");

  const listResponse = await fetch(
    `${baseUrl}/api/tournaments/badminton-bp-2026/matches?scheduledOnly=true`,
  );
  const listBody = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(listBody.meta.total, 1);
  assert.equal(listBody.data[0].id, "r1-m1");
  assert.equal(listBody.data[0].venue, "Cafetaria");
});

test("match listing validates public filters", async () => {
  clearBrackets();
  const participants = [
    { id: "filter-1", name: "Filter Team 1" },
    { id: "filter-2", name: "Filter Team 2" },
  ];
  await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  const response = await fetch(
    `${baseUrl}/api/tournaments/badminton-bp-2026/matches?status=unknown`,
  );
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.message, "status must be pending, scheduled, completed, or bye");
});

test("bracket regeneration requires confirmation and resets old results", async () => {
  clearBrackets();
  const originalParticipants = Array.from({ length: 4 }, (_, index) => ({
    id: `original-${index + 1}`,
    name: `Original Team ${index + 1}`,
  }));
  await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: originalParticipants }),
  });
  await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/matches/r1-m1/result`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeScore: 21, awayScore: 10 }),
  });

  const replacementParticipants = originalParticipants.slice(0, 3);
  const deniedResponse = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: replacementParticipants }),
  });
  assert.equal(deniedResponse.status, 422);

  const response = await fetch(`${baseUrl}/api/admin/tournaments/badminton-bp-2026/bracket`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: replacementParticipants, confirmReplace: true }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.participantCount, 3);
  assert.equal(body.data.bracketSize, 4);
  assert.equal(body.data.byeCount, 1);
  assert.equal(body.data.championParticipantId, null);
  assert.equal(
    body.data.rounds.flatMap((round) => round.matches).some((match) => match.status === "completed"),
    false,
  );
});

test("an admin can persist an empty bracket and add participants again", async () => {
  clearBrackets();
  const participants = Array.from({ length: 4 }, (_, index) => ({
    id: `futsal-${index + 1}`,
    name: `Futsal Team ${index + 1}`,
  }));
  await fetch(`${baseUrl}/api/admin/tournaments/futsal-bp-2026/bracket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  await fetch(`${baseUrl}/api/admin/tournaments/futsal-bp-2026/top-scorers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topScorers: [{ name:"Player One", team:"Futsal Team 1", goals:3 }] }),
  });

  const clearResponse = await fetch(`${baseUrl}/api/admin/tournaments/futsal-bp-2026/bracket`, {
    method: "DELETE",
  });
  const cleared = await clearResponse.json();
  assert.equal(clearResponse.status, 200);
  assert.equal(cleared.data.status, "empty");
  assert.equal(cleared.data.participantCount, 0);
  assert.deepEqual(cleared.data.participants, []);
  assert.deepEqual(cleared.data.rounds, []);

  const publicResponse = await fetch(`${baseUrl}/api/tournaments/futsal-bp-2026/bracket`);
  const publicBracket = await publicResponse.json();
  assert.equal(publicResponse.status, 200);
  assert.equal(publicBracket.data.participantCount, 0);

  const matchesResponse = await fetch(`${baseUrl}/api/tournaments/futsal-bp-2026/matches`);
  const matches = await matchesResponse.json();
  assert.equal(matchesResponse.status, 200);
  assert.deepEqual(matches.data, []);

  const scorersResponse = await fetch(`${baseUrl}/api/tournaments/futsal-bp-2026/top-scorers`);
  const scorers = await scorersResponse.json();
  assert.equal(scorersResponse.status, 200);
  assert.equal(scorers.data[0].name, "Player One");

  const refillResponse = await fetch(`${baseUrl}/api/admin/tournaments/futsal-bp-2026/bracket`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants:participants.slice(0, 2), confirmReplace:true }),
  });
  const refilled = await refillResponse.json();
  assert.equal(refillResponse.status, 200);
  assert.equal(refilled.data.participantCount, 2);
});
