const ROUND_STAGE_RANKS = new Map([
  ['round of 64', 1],
  ['round of 32', 2],
  ['round of 16', 3],
  ['quarter final', 4],
  ['quarterfinal', 4],
  ['semi final', 5],
  ['semifinal', 5],
  ['final', 6],
]);

const normalizeRoundName = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ');

export const roundStageRank = match => {
  const normalizedName = normalizeRoundName(match?.roundName);
  if (ROUND_STAGE_RANKS.has(normalizedName)) return ROUND_STAGE_RANKS.get(normalizedName);
  return Number.isFinite(Number(match?.roundNumber)) ? Number(match.roundNumber) : 0;
};

export function selectLatestScheduledRound(matches = []) {
  const scheduledMatches = matches.filter(match => match?.scheduledAt);
  if (!scheduledMatches.length) return [];

  const latestStage = Math.max(...scheduledMatches.map(roundStageRank));
  return scheduledMatches
    .filter(match => roundStageRank(match) === latestStage)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt));
}
