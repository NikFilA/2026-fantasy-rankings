const CORE_POSITIONS = ["QB", "RB", "WR", "TE"];

const normalizeId = (value) => String(value ?? "").trim();

const normalizePosition = (value) => String(value ?? "").trim().toUpperCase();

const numericRound = (value) => {
  const round = Number(value);
  return Number.isFinite(round) && round > 0 ? Math.floor(round) : 0;
};

const countSlots = (rosterPositions = []) => rosterPositions.reduce((counts, slot) => {
  const position = normalizePosition(slot);
  if (position) {
    counts[position] = (counts[position] || 0) + 1;
  }
  return counts;
}, {});

const pprLabel = (receptionPoints) => {
  const points = Number(receptionPoints);
  if (points >= 1) return "Full PPR";
  if (points > 0) return "Half PPR";
  return "Standard";
};

const passingTdLabel = (passingTdPoints) => (
  Number(passingTdPoints) >= 6 ? "6-pt pass TD" : "4-pt pass TD"
);

const leagueFormatSummary = (slotCounts, scoringSettings, highWrDemand, superflex) => {
  const parts = [
    pprLabel(scoringSettings.rec),
    passingTdLabel(scoringSettings.pass_td),
  ];
  const starterShape = [];
  if (slotCounts.WR) starterShape.push(`${slotCounts.WR} WR`);
  if (slotCounts.FLEX) starterShape.push(`${slotCounts.FLEX} FLEX`);
  if (superflex) starterShape.push("Superflex");
  if (starterShape.length) parts.push(starterShape.join(" + "));

  const notes = [];
  if (highWrDemand) notes.push("High WR starter demand");
  return `${parts.join(", ")}${notes.length ? ` (${notes.join(", ")})` : ""}`;
};

const activeStrategy = (userPicks) => {
  const earlyRbs = userPicks.filter((pick) => pick.position === "RB" && pick.round <= 3);
  const rbsInFirstTwo = earlyRbs.filter((pick) => pick.round <= 2).length;
  const rbsInRoundThree = earlyRbs.filter((pick) => pick.round === 3).length;

  if (earlyRbs.length >= 2) return "ROBUST_RB";
  if (rbsInFirstTwo === 1 && rbsInRoundThree === 0) return "HERO_RB";
  if (earlyRbs.length === 0) return "ZERO_RB";
  return "BALANCED";
};

const strategyGuidance = (strategy, rosterCounts, leagueRules) => {
  if (strategy === "HERO_RB") {
    return leagueRules.highWrDemand
      ? "Anchor RB locked in. Pivot heavily to WR."
      : "Anchor RB locked in. Prioritize WR and elite onesie positions."
  }
  if (strategy === "ZERO_RB") {
    return "Keep building WR strength, but attack an RB tier before it dries up."
  }
  if (strategy === "ROBUST_RB") {
    return "RB foundation is built. Shift priority to WR and avoid unnecessary RB depth."
  }
  if (leagueRules.superflex && rosterCounts.QB === 0) {
    return "Superflex increases quarterback demand. Prioritize a starting QB."
  }
  return "Stay flexible and take the best value before the next tier cliff."
};

const findTierCliff = (availableRankings) => {
  const positionsByRank = [...new Set(
    availableRankings.map((player) => normalizePosition(player.position)),
  )].filter((position) => CORE_POSITIONS.includes(position));

  for (const position of positionsByRank) {
    const positionPlayers = availableRankings.filter(
      (player) => normalizePosition(player.position) === position,
    );
    if (positionPlayers.length < 2) continue;

    const topTier = String(positionPlayers[0].tier ?? "").trim();
    const topTierPlayers = positionPlayers.filter(
      (player) => String(player.tier ?? "").trim() === topTier,
    );
    const hasLowerTier = positionPlayers.some(
      (player) => String(player.tier ?? "").trim() !== topTier,
    );
    if (!hasLowerTier || topTierPlayers.length > 2) continue;

    const names = topTierPlayers.map((player) => player.name).filter(Boolean).join(", ");
    const playerWord = topTierPlayers.length === 1 ? "player" : "players";
    const tierName = topTier.replace(/^tier\s*/i, "") || "unknown";
    return `${position} Tier ${tierName} has only ${topTierPlayers.length} ${playerWord} remaining${names ? ` (${names})` : ""}`;
  }
  return "";
};

/**
 * Build the compact, deterministic context sent to a draft-assistant AI.
 *
 * @param {{picks?: Array<{player_id: string, picked_by_user_id: string, round: number}>}} draftState
 * @param {Array<{player_id: string, name: string, position: string, tier: string|number}>} userRankings
 * @param {string} currentUserId
 * @param {{scoring_settings?: object, roster_positions?: string[]}} leagueSettings
 * @returns {{
 *   current_round: number,
 *   league_format_summary: string,
 *   user_roster_counts: {QB: number, RB: number, WR: number, TE: number},
 *   active_strategy: string,
 *   top_available_targets: Array<object>,
 *   tier_cliff_warning: string,
 *   strategic_guidance: string
 * }}
 */
export function generateDraftContextPayload(
  draftState = {},
  userRankings = [],
  currentUserId = "",
  leagueSettings = {},
) {
  const picks = Array.isArray(draftState?.picks) ? draftState.picks : [];
  const rankings = Array.isArray(userRankings) ? userRankings : [];
  const takenPlayerIds = new Set(picks.map((pick) => normalizeId(pick?.player_id)).filter(Boolean));
  const availableRankings = rankings.filter(
    (player) => !takenPlayerIds.has(normalizeId(player?.player_id)),
  );

  const rankingsById = new Map(
    rankings.map((player) => [normalizeId(player?.player_id), player]),
  );
  const normalizedCurrentUserId = normalizeId(currentUserId);
  const userPicks = picks
    .filter((pick) => normalizeId(pick?.picked_by_user_id) === normalizedCurrentUserId)
    .map((pick) => ({
      ...pick,
      round: numericRound(pick?.round),
      position: normalizePosition(rankingsById.get(normalizeId(pick?.player_id))?.position),
    }))
    .filter((pick) => pick.round > 0);

  const userRosterCounts = Object.fromEntries(CORE_POSITIONS.map((position) => [position, 0]));
  userPicks.forEach((pick) => {
    if (Object.hasOwn(userRosterCounts, pick.position)) {
      userRosterCounts[pick.position] += 1;
    }
  });

  const slotCounts = countSlots(leagueSettings?.roster_positions);
  const highWrDemand = (slotCounts.WR || 0) + (slotCounts.FLEX || 0) >= 4;
  const superflex = (slotCounts.SUPER_FLEX || 0) > 0 || (slotCounts.QB || 0) >= 2;
  const leagueRules = { highWrDemand, superflex };
  const strategy = activeStrategy(userPicks);
  const currentRound = Math.max(1, ...picks.map((pick) => numericRound(pick?.round)));

  return {
    current_round: currentRound,
    league_format_summary: leagueFormatSummary(
      slotCounts,
      leagueSettings?.scoring_settings || {},
      highWrDemand,
      superflex,
    ),
    user_roster_counts: userRosterCounts,
    active_strategy: strategy,
    top_available_targets: availableRankings.slice(0, 3).map((player) => ({
      player_id: player.player_id,
      name: player.name,
      position: player.position,
      tier: player.tier,
    })),
    tier_cliff_warning: findTierCliff(availableRankings),
    strategic_guidance: strategyGuidance(strategy, userRosterCounts, leagueRules),
  };
}
