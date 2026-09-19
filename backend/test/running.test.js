import assert from "node:assert/strict";
import test from "node:test";
import { activityFromRow, getRunningDashboard } from "../src/modules/running/running.service.js";

test("running import normalizes valid Excel activity values", () => {
  const activity = activityFromRow({ name:"  Aris Haryanto ", date:"2026-09-13T00:00:00+07:00", distance:"5.25", duration:String(30 / 1440) });
  assert.deepEqual({ runner_name:activity.runner_name, activity_date:activity.activity_date, distance_km:activity.distance_km, duration_seconds:activity.duration_seconds, pace_seconds_per_km:activity.pace_seconds_per_km }, { runner_name:"Aris Haryanto", activity_date:"2026-09-13", distance_km:5.25, duration_seconds:1800, pace_seconds_per_km:343 });
});

test("running import accepts Excel serial dates and rejects zero activities", () => {
  assert.equal(activityFromRow({ name:"Runner", date:"45908", distance:10, duration:3600 }).activity_date, "2025-09-08");
  assert.equal(activityFromRow({ name:"Runner", date:"2026-09-01", distance:0, duration:30 }), null);
});

test("running dashboard ranks total distance, fastest pace, and activity count", async () => {
  const activities = [{ runner_name:"Ari", activity_date:"2026-09-01", distance_km:10, duration_seconds:3600, pace_seconds_per_km:360 },{ runner_name:"Ari", activity_date:"2026-09-02", distance_km:5, duration_seconds:1500, pace_seconds_per_km:300 },{ runner_name:"Budi", activity_date:"2026-09-03", distance_km:12, duration_seconds:3960, pace_seconds_per_km:330 }];
  const client = { from: () => ({ select: () => ({ order: async () => ({ data:activities, error:null }) }) }) };
  const dashboard = await getRunningDashboard({}, client);
  assert.equal(dashboard.summary.totalKm, 27); assert.equal(dashboard.summary.runners, 2); assert.equal(dashboard.leaders.distance[0].name, "Ari"); assert.equal(dashboard.leaders.pace[0].name, "Ari"); assert.equal(dashboard.leaders.consistency[0].name, "Ari");
});
