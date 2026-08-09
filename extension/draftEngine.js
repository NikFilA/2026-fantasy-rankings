const CORE_POSITIONS = ["QB", "RB", "WR", "TE"];

const integerSetting = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
};

const repeatedSlots = (position, count) => Array.from({ length: count }, () => position);

const receptionPoints = (scoringType) => {
  const normalized = String(scoringType || "").toLowerCase();
  if (normalized === "ppr") return 1;
  if (normalized === "std" || normalized === "standard") return 0;
  return 0.5;
};

export const createMockLeagueSettingsFromDraft = (draft = {}) => {
  const settings = draft?.settings || {};
  const liveSlots = settings.slots || {};
  const slotValue = (position, fallback) => integerSetting(
    settings[`slots_${position.toLowerCase()}`]
      ?? liveSlots[position]
      ?? liveSlots[position.toLowerCase()],
    fallback,
  );
  const slots = {
    QB: slotValue("QB", 1),
    RB: slotValue("RB", 2),
    WR: slotValue("WR", 2),
    TE: slotValue("TE", 1),
    FLEX: slotValue("FLEX", 2),
    SUPER_FLEX: slotValue("SUPER_FLEX", 0),
  };
  const teams = integerSetting(settings.teams, 12) || 12;
  const rounds = integerSetting(settings.rounds, 15) || 15;
  const scoringType = String(draft?.metadata?.scoring_type || "half_ppr").toLowerCase();

  return {
    total_rosters: teams,
    draft_rounds: rounds,
    scoring_settings: { rec: receptionPoints(scoringType), pass_td: 4 },
    roster_positions: Object.entries(slots).flatMap(([position, count]) => (
      repeatedSlots(position, count)
    )),
    draft_settings: {
      teams,
      rounds,
      scoring_type: scoringType,
      slots_qb: slots.QB,
      slots_rb: slots.RB,
      slots_wr: slots.WR,
      slots_te: slots.TE,
      slots_flex: slots.FLEX,
      slots_super_flex: slots.SUPER_FLEX,
    },
  };
};

export const createDefaultMockLeagueSettings = () => createMockLeagueSettingsFromDraft();

const normalizeId = (value) => String(value ?? "").trim();

const FIRST_NAME_ALIASES = {
  kenneth: "kenny",
  kenny: "kenny",
  mitchell: "mitch",
  mitch: "mitch",
  cameron: "cam",
  cam: "cam",
  gabriel: "gabe",
  gabe: "gabe",
  christopher: "chris",
  chris: "chris",
};

const normalizePlayerName = (value) => {
  const parts = String(value ?? "")
    .replace(/[.,'’\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["jr", "sr", "ii", "iii", "iv", "v"].includes(part.toLowerCase()));
  if (parts.length) parts[0] = FIRST_NAME_ALIASES[parts[0].toLowerCase()] || parts[0];
  return parts.join("").toLowerCase().replace(/[^a-z0-9]/g, "");
};

const normalizePosition = (value) => String(value ?? "").trim().toUpperCase();

export const resolveUserDraftSlot = (draftDetails = {}, currentUserId = "", rawPicks = []) => {
  const userId = normalizeId(currentUserId);
  const draftOrder = draftDetails?.draft_order || {};
  const teamCount = Number(draftDetails?.settings?.teams) || Object.keys(draftOrder).length;
  const directSlot = Number(draftOrder[userId]);
  if (Number.isInteger(directSlot) && directSlot >= 1 && directSlot <= teamCount) return directSlot;

  const pickedSlot = (Array.isArray(rawPicks) ? rawPicks : [])
    .map((pick) => ({
      owner: normalizeId(pick?.picked_by_user_id ?? pick?.picked_by),
      slot: Number(pick?.draft_slot ?? pick?.metadata?.draft_slot),
    }))
    .find((pick) => pick.owner === userId && Number.isInteger(pick.slot));
  if (pickedSlot?.slot >= 1 && pickedSlot.slot <= teamCount) return pickedSlot.slot;

  const slotToRoster = draftDetails?.slot_to_roster_id || {};
  const rosterSlot = Number(Object.entries(slotToRoster)
    .find(([, rosterId]) => normalizeId(rosterId) === userId)?.[0]);
  if (Number.isInteger(rosterSlot) && rosterSlot >= 1 && rosterSlot <= teamCount) return rosterSlot;

  const enteredSlot = Number(userId);
  if (Number.isInteger(enteredSlot) && enteredSlot >= 1 && enteredSlot <= teamCount) return enteredSlot;
  return null;
};

export const parseSleeperOverallAdp = (value, teams = 12) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const roundPick = raw.match(/^(\d+)\.(\d{1,2})$/);
  if (roundPick) {
    const round = Number(roundPick[1]);
    const pick = Number(roundPick[2]);
    if (round > 0 && pick > 0 && pick <= teams) return ((round - 1) * teams) + pick;
  }
  const overall = Number(raw);
  return Number.isFinite(overall) && overall > 0 ? overall : null;
};

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

const leagueFormatSummary = (slotCounts, scoringSettings, highWrDemand, superflex, teamCount) => {
  const parts = [
    ...(teamCount ? [`${teamCount}-team`] : []),
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

export function isUserOnTheClock(rawPicks = [], draftDetails = {}, currentUserId = "") {
  if (draftDetails?.isUserOnTheClock === true) return true;

  const picks = Array.isArray(rawPicks) ? rawPicks : [];
  const draftOrder = draftDetails?.draft_order || {};
  const userSlot = resolveUserDraftSlot(draftDetails, currentUserId, picks);
  const teamCount = Number(draftDetails?.settings?.teams)
    || Object.keys(draftOrder).length;
  if (!Number.isFinite(userSlot) || userSlot < 1 || teamCount < 1) return false;

  const nextPickNumber = picks.length + 1;
  const totalRounds = Number(draftDetails?.settings?.rounds) || 0;
  if (totalRounds && nextPickNumber > teamCount * totalRounds) return false;

  const nextRound = Math.floor((nextPickNumber - 1) / teamCount) + 1;
  const pickOffset = (nextPickNumber - 1) % teamCount;
  const isSnakeRound = String(draftDetails?.type || "").toLowerCase() === "snake"
    && nextRound % 2 === 0;
  const nextDraftSlot = isSnakeRound ? teamCount - pickOffset : pickOffset + 1;
  return nextDraftSlot === userSlot;
}

export const nextUserPickDistance = (rawPicks = [], draftDetails = {}, currentUserId = "") => {
  const picks = Array.isArray(rawPicks) ? rawPicks : [];
  const draftOrder = draftDetails?.draft_order || {};
  const userSlot = resolveUserDraftSlot(draftDetails, currentUserId, picks);
  const teamCount = Number(draftDetails?.settings?.teams) || Object.keys(draftOrder).length;
  if (!Number.isFinite(userSlot) || userSlot < 1 || teamCount < 1) return null;

  const completedPicks = picks.filter((pick) => (
    normalizeId(pick?.player_id) && Number(pick?.pick_no) > 0
  ));
  const nextPickNumber = completedPicks.length + 1;
  const totalRounds = Number(draftDetails?.settings?.rounds) || 100;
  const isSnake = String(draftDetails?.type || "").toLowerCase() === "snake";
  const finalPick = teamCount * totalRounds;

  for (let pickNumber = nextPickNumber; pickNumber <= finalPick; pickNumber += 1) {
    const round = Math.floor((pickNumber - 1) / teamCount) + 1;
    const offset = (pickNumber - 1) % teamCount;
    const slot = isSnake && round % 2 === 0 ? teamCount - offset : offset + 1;
    if (slot === userSlot) return pickNumber - nextPickNumber;
  }
  return null;
};

export const draftSlotAtPick = (pickNumber, teamCount, draftType) => {
  const round = Math.floor((pickNumber - 1) / teamCount) + 1;
  const offset = (pickNumber - 1) % teamCount;
  return String(draftType || "").toLowerCase() === "snake" && round % 2 === 0
    ? teamCount - offset
    : offset + 1;
};

export const nextUserTurn = (rawPicks = [], draftDetails = {}, currentUserId = "") => {
  const picks = Array.isArray(rawPicks) ? rawPicks : [];
  const draftOrder = draftDetails?.draft_order || {};
  const userSlot = resolveUserDraftSlot(draftDetails, currentUserId, picks);
  const teamCount = Number(draftDetails?.settings?.teams) || Object.keys(draftOrder).length;
  if (!Number.isFinite(userSlot) || userSlot < 1 || teamCount < 1) return null;
  const currentPickNumber = picks.length + 1;
  const totalRounds = Number(draftDetails?.settings?.rounds) || 100;
  const finalPick = teamCount * totalRounds;
  const currentSlot = draftSlotAtPick(currentPickNumber, teamCount, draftDetails?.type);
  const searchStart = currentSlot === userSlot ? currentPickNumber + 1 : currentPickNumber;
  for (let pickNumber = searchStart; pickNumber <= finalPick; pickNumber += 1) {
    if (draftSlotAtPick(pickNumber, teamCount, draftDetails?.type) === userSlot) {
      return {
        currentPickNumber,
        nextPickNumber: pickNumber,
        picksUntilTurn: pickNumber - currentPickNumber,
      };
    }
  }
  return null;
};

export const upcomingUserPickNumbers = (rawPicks = [], draftDetails = {}, currentUserId = "") => {
  const picks = Array.isArray(rawPicks) ? rawPicks : [];
  const teamCount = Number(draftDetails?.settings?.teams)
    || Object.keys(draftDetails?.draft_order || {}).length;
  const rounds = Number(draftDetails?.settings?.rounds) || 0;
  const userSlot = resolveUserDraftSlot(draftDetails, currentUserId, picks);
  if (!userSlot || !teamCount || !rounds) return [];
  const currentPick = picks.filter((pick) => normalizeId(pick?.player_id)).length + 1;
  const result = [];
  for (let pickNumber = currentPick; pickNumber <= teamCount * rounds; pickNumber += 1) {
    if (draftSlotAtPick(pickNumber, teamCount, draftDetails?.type) === userSlot) {
      result.push(pickNumber);
    }
  }
  return result;
};

export const normalCdf = (value) => {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t)
    + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return (1 + erf) / 2;
};

const POSITION_SIGMA_FALLBACK = { QB: 12, RB: 18, WR: 18, TE: 20 };

const positionalAdpSigmas = (availableRankings) => {
  const valuesByPosition = new Map();
  availableRankings.forEach((player) => {
    const position = normalizePosition(player?.position);
    const adp = parseSleeperOverallAdp(player?.sleeper_adp ?? player?.sleeperAdp);
    if (!CORE_POSITIONS.includes(position) || !Number.isFinite(adp) || adp <= 0 || adp >= 999) return;
    if (!valuesByPosition.has(position)) valuesByPosition.set(position, []);
    valuesByPosition.get(position).push(adp);
  });
  return Object.fromEntries(CORE_POSITIONS.map((position) => {
    const values = valuesByPosition.get(position) || [];
    if (values.length < 2) return [position, POSITION_SIGMA_FALLBACK[position]];
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
    return [position, Math.min(POSITION_SIGMA_FALLBACK[position], Math.max(6, Math.sqrt(variance)))];
  }));
};

const opponentNeedAnalysis = (picks, rankingsById, draftDetails, slotCounts, turn, currentUserId) => {
  if (!turn || turn.nextPickNumber <= turn.currentPickNumber) {
    return { needRates: {}, opponentCounts: {}, opponentSlots: [] };
  }
  const orderBySlot = new Map(Object.entries(draftDetails?.draft_order || {})
    .map(([userId, slot]) => [Number(slot), normalizeId(userId)]));
  const userDraftSlot = resolveUserDraftSlot(draftDetails, currentUserId, picks);
  const rosterCounts = new Map();
  picks.forEach((pick) => {
    const userId = normalizeId(pick?.picked_by_user_id ?? pick?.picked_by);
    const rankedPlayer = rankingsById.get(normalizeId(pick?.player_id));
    const position = normalizePosition(pick?.position || rankedPlayer?.position);
    if (!userId || !CORE_POSITIONS.includes(position)) return;
    if (!rosterCounts.has(userId)) {
      rosterCounts.set(userId, Object.fromEntries(CORE_POSITIONS.map((pos) => [pos, 0])));
    }
    rosterCounts.get(userId)[position] += 1;
  });
  const opponents = [];
  for (let pickNumber = turn.currentPickNumber; pickNumber < turn.nextPickNumber; pickNumber += 1) {
    const slot = draftSlotAtPick(
      pickNumber,
      Number(draftDetails?.settings?.teams) || orderBySlot.size,
      draftDetails?.type,
    );
    const userId = orderBySlot.get(slot);
    if (userId && slot !== userDraftSlot && userId !== normalizeId(currentUserId)) {
      opponents.push({ userId, slot });
    }
  }
  const uniqueOpponents = [...new Map(opponents.map((opponent) => [opponent.userId, opponent])).values()];
  if (!uniqueOpponents.length) return { needRates: {}, opponentCounts: {}, opponentSlots: [] };
  const opponentCounts = {};
  const needRates = Object.fromEntries(CORE_POSITIONS.map((position) => {
    const required = slotCounts[position] || 0;
    if (!required) {
      opponentCounts[position] = { need: 0, filled: uniqueOpponents.length, total: uniqueOpponents.length };
      return [position, 0];
    }
    const stillNeed = uniqueOpponents.filter(({ userId }) => (
      (rosterCounts.get(userId)?.[position] || 0) < required
    )).length;
    opponentCounts[position] = {
      need: stillNeed,
      filled: uniqueOpponents.length - stillNeed,
      total: uniqueOpponents.length,
    };
    return [position, stillNeed / uniqueOpponents.length];
  }));
  return {
    needRates,
    opponentCounts,
    opponentSlots: uniqueOpponents.map(({ slot }) => slot).sort((a, b) => a - b),
  };
};

const localRosterContext = (rosterCounts, slotCounts, superflex) => {
  const filled = CORE_POSITIONS
    .filter((position) => rosterCounts[position] > 0)
    .map((position) => `${rosterCounts[position]} ${position}`)
    .join(" / ");
  const open = CORE_POSITIONS.filter((position) => (
    (rosterCounts[position] || 0) < (slotCounts[position] || 0)
  ));
  if (superflex && (rosterCounts.QB || 0) < 2 && !open.includes("QB")) open.unshift("QB");
  const flexCapacity = slotCounts.FLEX || 0;
  const flexEligible = (rosterCounts.RB || 0) + (rosterCounts.WR || 0) + (rosterCounts.TE || 0);
  const primaryFilled = (slotCounts.RB || 0) + (slotCounts.WR || 0) + (slotCounts.TE || 0);
  const openFlex = Math.max(0, flexCapacity - Math.max(0, flexEligible - primaryFilled));
  const priorities = [...open, ...(openFlex > 0 ? [`${openFlex} FLEX`] : [])];
  const filledSummary = filled ? `${filled} filled` : "No positions filled yet";
  return `${filledSummary}; ${priorities.length ? `${priorities.join("/")} remain open priorities` : "starting requirements are covered"}.`;
};

const buildLocalDraftAdvice = (
  availablePlayers,
  opponentCounts,
  opponentSlots,
  rosterCounts,
  slotCounts,
  superflex,
) => {
  const player = availablePlayers[0];
  if (!player) return null;
  const position = normalizePosition(player.position);
  const tier = String(player.tier ?? "—").replace(/^tier\s*/i, "").trim() || "—";
  const tierRemaining = Number(player.players_remaining_in_tier) || 0;
  const variances = [player.sleeper_var, player.sleeperVar, player.espn_var, player.espnVar, player.flock_var, player.flockVar]
    .map(Number).filter(Number.isFinite);
  const playerVar = variances.length ? Math.max(...variances) : null;
  const availableVars = availablePlayers.flatMap((candidate) => (
    [candidate.sleeper_var, candidate.sleeperVar, candidate.espn_var, candidate.espnVar, candidate.flock_var, candidate.flockVar]
      .map(Number).filter(Number.isFinite)
  ));
  const bestVar = availableVars.length ? Math.max(...availableVars) : null;
  let strategy = `Highest-ranked available player on your board (#${player.user_rank}).`;
  if (tierRemaining === 1) strategy = `Last Tier ${tier} ${position} available.`;
  else if (tierRemaining === 2) strategy = `Only 2 Tier ${tier} ${position}s remain.`;
  else if (playerVar !== null && playerVar === bestVar && playerVar > 0) strategy = `Highest pure VAR value available (+${playerVar}).`;

  const survival = Number(player.survivalProbability);
  const opponent = opponentCounts[position] || { need: 0, filled: 0, total: 0 };
  const slots = opponentSlots.length ? `Teams in slots ${opponentSlots.join(", ")}` : "No rival teams";
  let risk = `${Number.isFinite(survival) ? `${survival}% chance to return` : "Return odds unavailable"}.`;
  if (opponent.total) {
    if (opponent.need === 0) risk += ` ${slots} have filled their ${position} starters, lowering snipe risk.`;
    else if (survival < 40 || (survival < 65 && opponent.need / opponent.total >= 0.5)) risk += ` ${opponent.need} of ${opponent.total} teams before you still need ${position}; draft now if he is your target.`;
    else if (opponent.need / opponent.total >= 0.5) risk += ` ${opponent.need} of ${opponent.total} teams picking before you still need ${position}, but the ADP model favors a return.`;
    else risk += ` ${opponent.filled} of ${opponent.total} teams before you have filled ${position}, so risk is moderate.`;
  }
  return {
    player_id: player.player_id,
    name: player.name,
    position,
    tier,
    strategy,
    turn_risk: risk,
    roster_context: localRosterContext(rosterCounts, slotCounts, superflex),
  };
};

const tierKey = (player) => `${normalizePosition(player?.position)}|${String(player?.tier ?? "").trim()}`;

const remainingTierCounts = (availableRankings) => availableRankings.reduce((counts, player) => {
  const key = tierKey(player);
  counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}, new Map());

const findUrgentTierCliff = (
  availableRankings,
  allRankings,
  picksUntilUserTurn,
  slotCounts,
  userRosterCounts,
) => {
  if (picksUntilUserTurn === null || picksUntilUserTurn > 8) return "";
  const tierCounts = remainingTierCounts(availableRankings);
  const originalTierCounts = remainingTierCounts(allRankings);
  const activeByPosition = new Map();
  availableRankings.forEach((player) => {
    const position = normalizePosition(player?.position);
    if (CORE_POSITIONS.includes(position) && !activeByPosition.has(position)) {
      activeByPosition.set(position, player);
    }
  });
  const cliffs = [...activeByPosition.entries()]
    .map(([position, player]) => ({
      position,
      tier: String(player?.tier ?? "").replace(/^tier\s*/i, "").trim() || "Unranked",
      remaining: tierCounts.get(tierKey(player)) || 0,
      original: originalTierCounts.get(tierKey(player)) || 0,
      required: slotCounts[position] || 0,
      rostered: userRosterCounts[position] || 0,
      rank: Number(player?.custom_rank) || Number.MAX_SAFE_INTEGER,
    }))
    .filter((cliff) => (
      cliff.remaining > 0
      && cliff.remaining <= 2
      && cliff.original > cliff.remaining
      && cliff.required > 0
      && cliff.rostered < cliff.required
    ))
    .sort((a, b) => a.remaining - b.remaining || a.rank - b.rank);
  if (!cliffs.length) return "";
  const cliff = cliffs[0];
  const noun = cliff.remaining === 1 ? "player" : "players";
  return `⚠️ Tier Cliff: Only ${cliff.remaining} ${noun} left in your Tier ${cliff.tier} ${cliff.position}s!`;
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
  const picks = Array.isArray(draftState?.picks)
    ? draftState.picks.filter((pick) => (
      normalizeId(pick?.player_id)
      && Number.isFinite(Number(pick?.pick_no))
      && Number(pick.pick_no) > 0
    ))
    : [];
  const rankings = Array.isArray(userRankings)
    ? userRankings.map((player, index) => ({
      ...player,
      custom_rank: Number(player?.custom_rank) || index + 1,
    })).sort((a, b) => a.custom_rank - b.custom_rank)
    : [];
  const takenPlayerIds = new Set(picks.map((pick) => normalizeId(pick?.player_id)).filter(Boolean));
  const takenPlayerNames = new Set(picks.map((pick) => normalizePlayerName(
    pick?.name
      || pick?.player_name
      || pick?.metadata?.player_name
      || `${pick?.metadata?.first_name || ""} ${pick?.metadata?.last_name || ""}`,
  )).filter(Boolean));
  const availableRankings = rankings.filter(
    (player) => !takenPlayerIds.has(normalizeId(player?.player_id))
      && !takenPlayerNames.has(normalizePlayerName(player?.name)),
  );

  const rankingsById = new Map(
    rankings.map((player) => [normalizeId(player?.player_id), player]),
  );
  const normalizedCurrentUserId = normalizeId(currentUserId);
  const userDraftSlot = resolveUserDraftSlot(
    draftState?.draftDetails || {},
    currentUserId,
    picks,
  );
  const userPicks = picks
    .filter((pick) => {
      const pickedBy = normalizeId(pick?.picked_by_user_id ?? pick?.picked_by);
      const pickSlot = Number(pick?.draft_slot ?? pick?.metadata?.draft_slot);
      return (normalizedCurrentUserId && pickedBy === normalizedCurrentUserId)
        || (userDraftSlot && pickSlot === userDraftSlot);
    })
    .map((pick) => ({
      ...pick,
      round: numericRound(pick?.round),
      position: normalizePosition(
        rankingsById.get(normalizeId(pick?.player_id))?.position
        || pick?.position
        || pick?.metadata?.position,
      ),
      name: rankingsById.get(normalizeId(pick?.player_id))?.name
        || pick?.name
        || pick?.metadata?.player_name
        || `${pick?.metadata?.first_name || ""} ${pick?.metadata?.last_name || ""}`.trim(),
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
  const teamCount = Number(leagueSettings?.total_rosters) || 0;
  const draftRounds = Number(leagueSettings?.draft_rounds) || 0;
  const leagueRules = { highWrDemand, superflex };
  const strategy = activeStrategy(userPicks);
  const currentRound = Math.max(1, ...picks.map((pick) => numericRound(pick?.round)));
  const turn = nextUserTurn(picks, draftState?.draftDetails || {}, currentUserId) || {
    currentPickNumber: picks.length + 1,
    nextPickNumber: picks.length + 1,
    picksUntilTurn: 0,
  };
  const picksUntilUserTurn = turn.nextPickNumber - turn.currentPickNumber;
  const tierCounts = remainingTierCounts(availableRankings);
  const tierCliffAlert = findUrgentTierCliff(
    availableRankings,
    rankings,
    picksUntilUserTurn,
    slotCounts,
    userRosterCounts,
  );
  const adpSigmas = positionalAdpSigmas(availableRankings);
  const opponentAnalysis = opponentNeedAnalysis(
    picks,
    rankingsById,
    draftState?.draftDetails || {},
    slotCounts,
    turn,
    currentUserId,
  );
  const needRates = opponentAnalysis.needRates;
  const undraftedPlayers = availableRankings.map((player) => {
    const position = normalizePosition(player.position);
    const sleeperAdp = parseSleeperOverallAdp(player?.sleeper_adp ?? player?.sleeperAdp);
    const sigma = adpSigmas[position] || POSITION_SIGMA_FALLBACK[position] || 24;
    const hasAdp = Number.isFinite(sleeperAdp) && sleeperAdp > 0 && sleeperAdp < 999;
    const effectiveAdp = hasAdp
      ? sleeperAdp
      : Number(player.custom_rank) || rankings.indexOf(player) + 1;
    const baseSurvival = 1 - normalCdf((turn.nextPickNumber - effectiveAdp) / sigma);
    const needRate = needRates[position];
    const filledStarterShare = Number.isFinite(needRate) ? 1 - needRate : 0;
    const adjustedSurvival = baseSurvival === null
      ? null
      : baseSurvival + ((1 - baseSurvival) * filledStarterShare * 0.35);
    return {
      player_id: player.player_id,
      name: player.name,
      position: player.position,
      user_rank: Number(player.custom_rank) || rankings.indexOf(player) + 1,
      user_tier: player.tier,
      tier: player.tier,
      sleeper_var: player.sleeper_var ?? player.sleeperVar ?? null,
      espn_var: player.espn_var ?? player.espnVar ?? null,
      flock_var: player.flock_var ?? player.flockVar ?? null,
      sleeper_adp: hasAdp ? sleeperAdp : null,
      survival_adp_source: hasAdp ? "sleeper" : "custom_rank_fallback",
      positional_adp_sigma: sigma,
      opponent_position_need_rate: Number.isFinite(needRate)
        ? Math.round(needRate * 100)
        : null,
      players_remaining_in_tier: tierCounts.get(tierKey(player)) || 0,
      survivalProbability: Math.max(0, Math.min(100, Math.round(adjustedSurvival * 100))),
    };
  });
  const topAvailableTargets = undraftedPlayers.slice(0, 3);
  const localDraftAdvice = buildLocalDraftAdvice(
    undraftedPlayers,
    opponentAnalysis.opponentCounts,
    opponentAnalysis.opponentSlots,
    userRosterCounts,
    slotCounts,
    superflex,
  );
  const upcomingPicks = upcomingUserPickNumbers(
    picks,
    draftState?.draftDetails || {},
    currentUserId,
  );
  const userCurrentRoster = userPicks.map((pick) => ({
    player_id: normalizeId(pick.player_id),
    name: pick.name || "Unknown Player",
    position: pick.position,
    round: pick.round,
    overall_pick: Number(pick.pick_no) || null,
  }));
  const positionalNeeds = Object.fromEntries(CORE_POSITIONS.map((position) => [
    position,
    Math.max(0, (slotCounts[position] || 0) - (userRosterCounts[position] || 0)),
  ]));
  const aiAdvicePayload = {
    userRoster: { ...userRosterCounts },
    user_current_roster: userCurrentRoster,
    currentPick: turn.currentPickNumber,
    nextPick: turn.nextPickNumber,
    current_overall_pick: turn.currentPickNumber,
    user_next_pick: turn.nextPickNumber,
    picks_until_user_turn: picksUntilUserTurn,
    user_draft_slot: userDraftSlot,
    upcoming_user_picks: upcomingPicks,
    positional_needs: positionalNeeds,
    starter_slots: {
      QB: slotCounts.QB || 0,
      RB: slotCounts.RB || 0,
      WR: slotCounts.WR || 0,
      TE: slotCounts.TE || 0,
      FLEX: slotCounts.FLEX || 0,
      SUPER_FLEX: slotCounts.SUPER_FLEX || 0,
    },
    league_format: leagueFormatSummary(
      slotCounts,
      leagueSettings?.scoring_settings || {},
      highWrDemand,
      superflex,
      teamCount,
    ),
    topAvailablePlayers: undraftedPlayers.slice(0, 10).map((player) => ({
      name: player.name,
      pos: normalizePosition(player.position),
      tier: player.tier,
      user_rank: player.user_rank,
      survivalPct: player.survivalProbability,
      adp: player.sleeper_adp,
      players_remaining_in_tier: player.players_remaining_in_tier,
    })),
  };
  const mustDraftTarget = topAvailableTargets.find((player) => (
    player.survivalProbability !== null
    && player.survivalProbability < 25
    && player.user_rank <= Math.max(12, teamCount)
  ));

  return {
    current_round: currentRound,
    league_format_summary: leagueFormatSummary(
      slotCounts,
      leagueSettings?.scoring_settings || {},
      highWrDemand,
      superflex,
      teamCount,
    ),
    league_size: teamCount,
    draft_rounds: draftRounds,
    starter_slots: {
      QB: slotCounts.QB || 0,
      RB: slotCounts.RB || 0,
      WR: slotCounts.WR || 0,
      TE: slotCounts.TE || 0,
      FLEX: slotCounts.FLEX || 0,
      SUPER_FLEX: slotCounts.SUPER_FLEX || 0,
    },
    user_roster_counts: userRosterCounts,
    user_current_roster: userCurrentRoster,
    user_draft_slot: userDraftSlot,
    positional_needs: positionalNeeds,
    active_strategy: strategy,
    undraftedPlayers,
    top_available_targets: topAvailableTargets,
    local_draft_advice: localDraftAdvice,
    ai_advice_payload: aiAdvicePayload,
    next_pick_number: turn?.nextPickNumber ?? null,
    picksUntilTurn: turn?.picksUntilTurn ?? null,
    picks_until_user_turn: picksUntilUserTurn,
    tierCliffAlert,
    mustDraftAlert: mustDraftTarget
      ? `🚨 Must Draft: ${mustDraftTarget.name} has only a ${mustDraftTarget.survivalProbability}% chance to make it back.`
      : "",
    tier_cliff_warning: findTierCliff(availableRankings),
    strategic_guidance: strategyGuidance(strategy, userRosterCounts, leagueRules),
  };
}

export function onPickUpdate(
  draftState = {},
  userRankings = [],
  currentUserId = "",
  leagueSettings = {},
  { updateMainPanelUI, updateAdviceBubbleUI } = {},
) {
  const contextPayload = generateDraftContextPayload(
    draftState,
    userRankings,
    currentUserId,
    leagueSettings,
  );
  const availablePlayers = contextPayload.undraftedPlayers;
  updateMainPanelUI?.(availablePlayers, contextPayload);
  updateAdviceBubbleUI?.(
    availablePlayers,
    contextPayload.user_roster_counts,
    draftState,
    contextPayload,
  );
  return contextPayload;
}
