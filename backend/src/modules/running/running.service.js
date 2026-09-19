import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";

const REQUIRED_HEADERS = ["name", "date", "distance", "duration"];
const MAX_IMPORT_BYTES = 900_000;

function xmlUnescape(value = "") {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function unzipEntries(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const payloadStart = offset + 30 + nameLength + extraLength;
    const payload = buffer.subarray(payloadStart, payloadStart + compressedSize);
    entries.set(name, method === 0 ? payload : method === 8 ? inflateRawSync(payload) : null);
    offset = payloadStart + compressedSize;
  }
  return entries;
}

function cellColumn(reference = "") { return reference.match(/[A-Z]+/)?.[0] || ""; }
function textFromNode(node = "") { return xmlUnescape(node.replace(/<[^>]+>/g, "")); }

function readXlsxRows(base64) {
  if (typeof base64 !== "string" || !base64) throw new AppError(422, "Excel file is required");
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > MAX_IMPORT_BYTES) throw new AppError(422, "Excel file must be smaller than 900 KB");
  const entries = unzipEntries(buffer);
  const sheet = entries.get("xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheet) throw new AppError(422, "The Excel file must have a first worksheet");
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") || "";
  const sharedStrings = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => textFromNode(match[1]));
  const rows = [];
  for (const rowMatch of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1]; const content = cellMatch[2];
      const reference = attributes.match(/r="([^"]+)"/)?.[1];
      const type = attributes.match(/t="([^"]+)"/)?.[1];
      const raw = content.match(/<v>([\s\S]*?)<\/v>/)?.[1] || content.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "";
      row[cellColumn(reference)] = type === "s" ? sharedStrings[Number(raw)] : xmlUnescape(raw);
    }
    rows.push(row);
  }
  if (rows.length < 2) throw new AppError(422, "The Excel file has no activity rows");
  const headers = Object.fromEntries(Object.entries(rows[0]).map(([column, value]) => [String(value).trim().toLowerCase(), column]));
  if (REQUIRED_HEADERS.some(header => !headers[header])) throw new AppError(422, "Excel must include Name, Date, Distance, and Duration columns");
  return rows.slice(1).map((row, index) => ({ rowNumber: index + 2, name: row[headers.name], date: row[headers.date], distance: row[headers.distance], duration: row[headers.duration] }));
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const serial = Number(text);
  if (!Number.isFinite(serial) || serial < 1 || serial > 100000) return "";
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000).toISOString().slice(0, 10);
}

export function activityFromRow(row) {
  const runnerName = String(row.name || "").trim().replace(/\s+/g, " ");
  const activityDate = normalizeDate(row.date);
  const distanceKm = Number(row.distance);
  const rawDuration = Number(row.duration);
  const durationSeconds = rawDuration > 0 && rawDuration < 1 ? Math.round(rawDuration * 86400) : Math.round(rawDuration);
  if (runnerName.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(activityDate) || !Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 200 || !Number.isInteger(durationSeconds) || durationSeconds <= 0 || durationSeconds > 172800) return null;
  const roundedDistance = Math.round(distanceKm * 1000) / 1000;
  const sourceHash = createHash("sha256").update(`${runnerName.toLowerCase()}|${activityDate}|${roundedDistance}|${durationSeconds}`).digest("hex");
  return { runner_name: runnerName, activity_date: activityDate, distance_km: roundedDistance, duration_seconds: durationSeconds, pace_seconds_per_km: Math.round(durationSeconds / roundedDistance), source_hash: sourceHash };
}

export async function importRunningWorkbook(fileBase64, client = getSupabaseAdminClient()) {
  const parsedRows = readXlsxRows(fileBase64); const valid = parsedRows.map(activityFromRow).filter(Boolean);
  if (!valid.length) throw new AppError(422, "No valid running activity was found in this Excel file");
  const unique = [...new Map(valid.map(activity => [activity.source_hash, activity])).values()];
  const { data: inserted, error } = await client.from("running_activities").upsert(unique, { onConflict: "source_hash", ignoreDuplicates: true }).select("id");
  if (error) throw new AppError(502, "Running activities could not be imported");
  return { received: parsedRows.length, valid: valid.length, skipped: parsedRows.length - valid.length, duplicateRows: valid.length - unique.length, added: inserted?.length || 0 };
}

export async function getRunningDashboard(query = {}, client = getSupabaseAdminClient()) {
  const name = typeof query.name === "string" ? query.name.trim().slice(0, 100) : "";
  let request = client.from("running_activities").select("runner_name, activity_date, distance_km, duration_seconds, pace_seconds_per_km").order("activity_date", { ascending: false });
  if (name) request = request.ilike("runner_name", `%${name.replace(/[%,]/g, "")}%`);
  const { data, error } = await request;
  if (error) throw new AppError(502, "Running dashboard could not be loaded");
  const runners = new Map();
  const daily = new Map();
  for (const activity of data) {
    const key = activity.runner_name.toLocaleLowerCase("id-ID");
    const runner = runners.get(key) || { name: activity.runner_name, totalKm: 0, activities: 0, fastestPaceSeconds: Infinity, totalDurationSeconds: 0 };
    runner.totalKm += Number(activity.distance_km); runner.totalDurationSeconds += Number(activity.duration_seconds); runner.activities += 1;
    runner.fastestPaceSeconds = Math.min(runner.fastestPaceSeconds, Number(activity.pace_seconds_per_km)); runners.set(key, runner);
    const day = daily.get(activity.activity_date) || { date: activity.activity_date, totalKm: 0, totalDurationSeconds: 0, activities: 0 };
    day.totalKm += Number(activity.distance_km); day.totalDurationSeconds += Number(activity.duration_seconds); day.activities += 1; daily.set(activity.activity_date, day);
  }
  const rows = [...runners.values()].map(row => ({ ...row, totalKm: Number(row.totalKm.toFixed(2)), averagePaceSeconds: Math.round(row.totalDurationSeconds / row.totalKm) }));
  const byKm = [...rows].sort((a, b) => b.totalKm - a.totalKm || a.name.localeCompare(b.name));
  const byPace = [...rows].sort((a, b) => a.fastestPaceSeconds - b.fastestPaceSeconds || a.name.localeCompare(b.name));
  const byActivities = [...rows].sort((a, b) => b.activities - a.activities || a.name.localeCompare(b.name));
  const dailyActivity = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)).map(day => ({ ...day, totalKm: Number(day.totalKm.toFixed(2)), averagePaceSeconds: Math.round(day.totalDurationSeconds / day.totalKm) }));
  return { summary: { totalKm: Number(rows.reduce((sum, row) => sum + row.totalKm, 0).toFixed(2)), runners: rows.length, activities: data.length }, leaders: { distance: byKm.slice(0, 3), pace: byPace.slice(0, 3), consistency: byActivities.slice(0, 3) }, daily: dailyActivity, runners: byKm };
}
