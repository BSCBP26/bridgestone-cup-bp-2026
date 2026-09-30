// The final and third-place results are the source of all four podium positions.
export function getFutsalFinalRanking(bracket) {
  const placing = match => {
    if (match?.status !== 'completed') return ['MENUNGGU HASIL', 'MENUNGGU HASIL'];
    const homeWon = match.winnerParticipantId === match.homeParticipant?.id;
    return homeWon
      ? [match.homeParticipant?.name, match.awayParticipant?.name]
      : [match.awayParticipant?.name, match.homeParticipant?.name];
  };
  return [...placing(bracket?.rounds?.at(-1)?.matches?.[0]), ...placing(bracket?.thirdPlaceMatch)];
}
