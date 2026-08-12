const APP_ORIGIN = "https://2026-fantasy-rankings.vercel.app";
const DATA_URL = `${APP_ORIGIN}/data.js`;
const TEAM_PROJECTIONS_URL = `${APP_ORIGIN}/team-projections.js`;
const PLAYER_PROPS_URL = `${APP_ORIGIN}/api/bettingpros-player-futures`;
const TEAM_FUTURES_URL = `${APP_ORIGIN}/api/bettingpros-team-futures`;
const LIVE_SLEEPER_ADP_URL = `${APP_ORIGIN}/api/sleeper-adp`;
const LIVE_ESPN_ADP_URL = `${APP_ORIGIN}/api/espn-adp`;
const LIVE_SLEEPER_PLAYERS_URL = `${APP_ORIGIN}/api/sleeper-players`;
const ASSISTANT_ID = "ff-draft-assistant-root";
const STORAGE_KEY = "myCustomRankings";
const POSITIONS = ["QB", "RB", "WR", "TE"];
const APP_HOSTS = new Set(["2026-fantasy-rankings.vercel.app", "localhost", "127.0.0.1"]);

const isRankingsHost = (hostname) => (
  APP_HOSTS.has(hostname)
  || (hostname.endsWith(".vercel.app") && hostname.startsWith("2026-fantasy-rankings"))
);

const isAppPage = isRankingsHost(window.location.hostname);
const isSleeperDraft = /(^|\.)sleeper\.(com|app)$/.test(window.location.hostname)
  && /\/draft\/nfl\//.test(window.location.pathname);

if (typeof window.activeDraftAlertHtml === "undefined") {
  window.activeDraftAlertHtml = null;
}
if (!window.calculatedTeamGrades) {
  window.calculatedTeamGrades = {};
}
const expandedTeamSlots = new Set();

const assistantState = {
  players: [],
  customRankings: [],
  defaultPlayers: [],
  source: "Loading rankings",
  filters: [],
  search: "",
  panelView: "board",
  listScrollTop: 0,
  gradesScrollTop: 0,
  gradesRenderSignature: "",
  expanded: true,
  loading: true,
  error: "",
  draftedNames: new Set(),
  draftedKeys: new Set(),
  draftedPlayerIds: new Set(),
  draftPicksReady: false,
  draftPicksError: "",
  draftedCount: 0,
  lastLiveSleeperPicks: [],
  selectedPlayerId: "",
  position: { x: null, y: null },
  size: { width: null, height: null },
  isDragging: false,
  isResizing: false,
  teamProjections: [],
  teamFutures: {},
  bettingProps: {},
  lastRecommendationPickSignature: "",
  leagueSettings: null,
  sleeperDraftDetails: null,
  tierCliffAlert: "",
  mustDraftAlert: "",
  strategyAlertPickSignature: "",
  survivalByPlayerId: {},
  undraftedPlayers: null,
};

let aiModulesPromise = null;

const loadAiModules = () => {
  if (!aiModulesPromise) {
    aiModulesPromise = import(chrome.runtime.getURL("draftEngine.js")).then((draftEngine) => ({
      createMockLeagueSettingsFromDraft: draftEngine.createMockLeagueSettingsFromDraft,
      generateDraftContextPayload: draftEngine.generateDraftContextPayload,
      onPickUpdate: draftEngine.onPickUpdate,
    }));
  }
  return aiModulesPromise;
};

const normalize = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

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

const normalizePlayerName = (value = "") => {
  const parts = String(value)
    .replace(/[.,'’\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["jr", "sr", "ii", "iii", "iv", "v"].includes(part.toLowerCase()));
  if (parts.length) parts[0] = FIRST_NAME_ALIASES[parts[0].toLowerCase()] || parts[0];
  return normalize(parts.join(" "));
};

const loadCustomRankings = async () => {
  const { userRankings } = await chrome.storage.local.get(["userRankings"]);
  assistantState.customRankings = Array.isArray(userRankings)
    ? userRankings.map((player, index) => ({
      ...player,
      player_id: String(player?.player_id || ""),
      custom_rank: Number(player?.custom_rank) || index + 1,
      position: String(player?.position || "").toUpperCase(),
    })).filter((player) => player.player_id)
      .sort((a, b) => a.custom_rank - b.custom_rank)
    : [];
};

const customRankingPlayers = () => {
  const assistantById = new Map(assistantState.players.map((player) => [String(player.id), player]));
  if (!assistantState.customRankings.length) {
    return assistantState.players.map((player, index) => ({
      player_id: String(player.id),
      name: player.name,
      position: player.pos,
      custom_rank: index + 1,
      tier: player.tierLabel || playerTier(player, index),
      sleeper_adp: player.sleeperAdp,
      sleeper_pick: player.sleeperPick,
      sleeper_var: player.sleeperVar,
      espn_var: player.espnVar,
      flock_var: player.flockVar,
    }));
  }
  return assistantState.customRankings.map((ranking) => {
    const player = assistantById.get(String(ranking.player_id));
    return {
      ...ranking,
      name: ranking.name || player?.name || "Unknown Player",
      position: ranking.position || player?.pos || "",
      sleeper_adp: Number.isFinite(Number(ranking.sleeper_adp ?? ranking.sleeperAdp))
        ? Number(ranking.sleeper_adp ?? ranking.sleeperAdp)
        : Number(player?.sleeperAdp),
      sleeper_pick: ranking.sleeper_pick ?? ranking.sleeperPick ?? player?.sleeperPick ?? "",
      sleeper_var: ranking.sleeper_var ?? ranking.sleeperVar ?? player?.sleeperVar ?? null,
      espn_var: ranking.espn_var ?? ranking.espnVar ?? player?.espnVar ?? null,
      flock_var: ranking.flock_var ?? ranking.flockVar ?? player?.flockVar ?? null,
    };
  });
};

const parseScriptArray = (source, variableName) => {
  const match = source.match(new RegExp(`(?:const|window\\.)\\s*${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) {
    return [];
  }
  return JSON.parse(match[1]);
};

const parseJson = (value) => {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
};

const playerKey = (player) => `${normalize(player.name)}|${marketTeam(player.team)}|${String(player.pos || "").toUpperCase()}`;

const sleeperDraftId = () => {
  const match = window.location.pathname.match(/\/draft\/[^/]+\/([0-9]+)/);
  return match ? match[1] : null;
};

const playerAliases = (player) => {
  const name = String(player.name || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ");
  const suffixes = new Set(["JR", "SR", "II", "III", "IV", "V"]);
  const withoutSuffix = parts.filter((part, index) => index === 0 || !suffixes.has(part.replace(/\./g, "").toUpperCase())).join(" ");
  const suffixlessParts = withoutSuffix.split(/\s+/).filter(Boolean);
  const suffixlessLast = suffixlessParts.slice(1).join(" ");
  const compactLast = normalize(suffixlessLast || last);
  const initial = normalize(first[0] || "");
  const truncatedAliases = compactLast.length >= 6
    ? [5, 6, 7, 8].map((length) => `${initial}${compactLast.slice(0, length)}`)
    : [];
  return [
    name,
    withoutSuffix,
    first && last ? `${first[0]}. ${last}` : "",
    first && suffixlessLast ? `${first[0]}. ${suffixlessLast}` : "",
    first && last ? `${first[0]} ${last}` : "",
    ...truncatedAliases,
  ].filter(Boolean).map(normalize);
};

const TEAM_ALIASES = {
  JAC: ["JAC", "JAX"],
  JAX: ["JAC", "JAX"],
  WAS: ["WAS", "WSH"],
  WSH: ["WAS", "WSH"],
};

const teamAliases = (team) => {
  const normalized = String(team || "").toUpperCase();
  return (TEAM_ALIASES[normalized] || [normalized]).map(normalize);
};

const clonePlayer = (player, index) => ({
  id: String(player.id || index + 1),
  name: String(player.name || "Unknown Player"),
  pos: String(player.pos || "WR").toUpperCase(),
  team: String(player.team || "FA").toUpperCase(),
  udAdp: Number.isFinite(Number(player.udAdp)) ? Number(player.udAdp) : 999,
  udPick: String(player.udPick || ""),
  sleeperAdp: (() => {
    const raw = player.sleeperPick || player.sleeperAdp;
    if (typeof raw === "string" && /^\d+\.\d{1,2}$/.test(raw.trim())) {
      const [round, pick] = raw.trim().split(".").map(Number);
      return ((round - 1) * 12) + pick;
    }
    return Number.isFinite(Number(raw)) ? Number(raw) : 999;
  })(),
  sleeperPick: String(player.sleeperPick || ""),
  sleeperVar: Number.isFinite(Number(player.sleeperVar ?? player.sleeper_var))
    ? Number(player.sleeperVar ?? player.sleeper_var)
    : null,
  espnAdp: Number.isFinite(Number(player.espnAdp ?? player.espn_adp))
    ? Number(player.espnAdp ?? player.espn_adp)
    : 999,
  espnPick: String(player.espnPick || player.espn_pick || ""),
  espnVar: Number.isFinite(Number(player.espnVar ?? player.espn_var))
    ? Number(player.espnVar ?? player.espn_var)
    : null,
  espnRank: Number.isFinite(Number(player.espnRank ?? player.espn_rank))
    ? Number(player.espnRank ?? player.espn_rank)
    : null,
  flockRank: Number.isFinite(Number(player.flockRank ?? player.flock_rank))
    ? Number(player.flockRank ?? player.flock_rank)
    : null,
  flockVar: Number.isFinite(Number(player.flockVar ?? player.flock_var))
    ? Number(player.flockVar ?? player.flock_var)
    : null,
  teamContext: String(player.teamContext ?? player.team_context ?? ""),
  teamWins: Number.isFinite(Number(player.teamWins ?? player.team_wins))
    ? Number(player.teamWins ?? player.team_wins)
    : null,
  targetShare: Number.isFinite(Number(player.targetShare ?? player.target_share ?? player.wrShare ?? player.wr_share ?? player.rbTargetShare ?? player.rb_target_share))
    ? Number(player.targetShare ?? player.target_share ?? player.wrShare ?? player.wr_share ?? player.rbTargetShare ?? player.rb_target_share)
    : null,
  passingYards: Number.isFinite(Number(player.passingYards ?? player.passing_yards ?? player.passYds))
    ? Number(player.passingYards ?? player.passing_yards ?? player.passYds)
    : null,
  rushingYards: Number.isFinite(Number(player.rushingYards ?? player.rushing_yards ?? player.rushYds))
    ? Number(player.rushingYards ?? player.rushing_yards ?? player.rushYds)
    : null,
  tierLabel: String(player.tierLabel || player.tier || ""),
  headshotUrl: String(
    player.headshotUrl
      || player.headshot_url
      || player.imageUrl
      || player.avatar
      || player.image
      || "",
  ),
});

const applySavedItems = (players, savedItems) => {
  if (!Array.isArray(savedItems) || savedItems.length === 0) {
    return players;
  }
  const byId = new Map(players.map((player) => [String(player.id), player]));
  const ordered = [];
  const used = new Set();
  let currentTierLabel = "";
  savedItems.forEach((item) => {
    if (item?.type === "tier") {
      currentTierLabel = String(item.label || "").trim();
      return;
    }
    const player = byId.get(String(item?.playerId || item?.id || ""));
    if (item?.type === "player" && player && !used.has(player.id)) {
      ordered.push({ ...player, tierLabel: currentTierLabel });
      used.add(player.id);
    }
  });
  return ordered.concat(players.filter((player) => !used.has(player.id)));
};

const applySavedOrder = (players, order) => {
  if (!Array.isArray(order) || order.length === 0) {
    return players;
  }
  const byId = new Map(players.map((player) => [String(player.id), player]));
  const ordered = order.map((id) => byId.get(String(id))).filter(Boolean);
  const used = new Set(ordered.map((player) => player.id));
  return ordered.concat(players.filter((player) => !used.has(player.id)));
};

const latestSavedRankingState = () => {
  const candidates = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}:`)) {
      const payload = parseJson(localStorage.getItem(key));
      if (payload?.items || payload?.order) {
        candidates.push({
          key,
          payload,
          updatedAt: Date.parse(payload.updatedAt || "") || 0,
          account: key.includes(":"),
        });
      }
    }
  }
  candidates.sort((a, b) => b.updatedAt - a.updatedAt || Number(b.account) - Number(a.account));
  return candidates[0] || null;
};

const exportedRankingsFromPage = async () => {
  const defaultPlayers = await fetchDefaultPlayers();
  const saved = latestSavedRankingState();
  const players = saved?.payload?.items
    ? applySavedItems(defaultPlayers, saved.payload.items)
    : applySavedOrder(defaultPlayers, saved?.payload?.order);
  return {
    players,
    source: saved?.account ? "Logged-in account rankings" : saved ? "Local rankings from board" : "Using default rankings",
    savedKey: saved?.key || "",
    exportedAt: new Date().toISOString(),
  };
};

const backgroundFetch = async (url, responseType = "text") => {
  if (isAppPage) {
    return null;
  }
  const response = await chrome.runtime.sendMessage({ type: "FETCH_APP_RESOURCE", url, responseType });
  if (!response?.ok) {
    throw new Error(response?.error || `${url} failed`);
  }
  return response.value;
};

const fetchText = async (url) => {
  const backgroundValue = await backgroundFetch(url, "text");
  if (backgroundValue !== null) {
    return backgroundValue;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }
  return response.text();
};

const fetchJson = async (url) => {
  const backgroundValue = await backgroundFetch(url, "json");
  if (backgroundValue !== null) {
    return backgroundValue;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }
  return response.json();
};

const fetchDefaultPlayers = async () => {
  if (assistantState.defaultPlayers.length) {
    return assistantState.defaultPlayers;
  }
  const liveUrl = `${DATA_URL}?_cb=${Date.now()}`;
  let text;
  try {
    const response = await fetch(liveUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`${liveUrl} failed: ${response.status}`);
    text = await response.text();
  } catch {
    text = await fetchText(liveUrl);
  }
  const basePlayers = parseScriptArray(text, "defaultPlayers").map(clonePlayer);
  const players = await mergeLiveWebsiteMarkets(basePlayers);
  assistantState.defaultPlayers = players;
  return players;
};

const fetchFreshWebsiteJson = async (url) => {
  const freshUrl = `${url}${url.includes("?") ? "&" : "?"}_cb=${Date.now()}`;
  try {
    const response = await fetch(freshUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`${freshUrl} failed: ${response.status}`);
    return response.json();
  } catch {
    return fetchJson(freshUrl);
  }
};

const liveMarketKey = (player) => `${normalizePlayerName(player?.name)}|${String(player?.pos || player?.position || "").toUpperCase()}`;

const mergeLiveWebsiteMarkets = async (basePlayers) => {
  const [sleeperResult, espnResult, playersResult] = await Promise.allSettled([
    fetchFreshWebsiteJson(LIVE_SLEEPER_ADP_URL),
    fetchFreshWebsiteJson(LIVE_ESPN_ADP_URL),
    fetchFreshWebsiteJson(LIVE_SLEEPER_PLAYERS_URL),
  ]);
  const sleeperRows = sleeperResult.status === "fulfilled"
    ? (sleeperResult.value?.players || sleeperResult.value || [])
    : [];
  const espnRows = espnResult.status === "fulfilled"
    ? (espnResult.value?.players || espnResult.value || [])
    : [];
  const livePlayerRows = playersResult.status === "fulfilled"
    ? (playersResult.value?.players || playersResult.value || [])
    : [];
  const sleeperByKey = new Map(sleeperRows.map((player) => [liveMarketKey(player), player]));
  const espnByKey = new Map(espnRows.map((player) => [liveMarketKey(player), player]));
  const playerByKey = new Map(livePlayerRows.map((player) => [liveMarketKey(player), player]));

  return basePlayers.map((basePlayer, index) => {
    const key = liveMarketKey(basePlayer);
    const sleeper = sleeperByKey.get(key);
    const espn = espnByKey.get(key);
    const livePlayer = playerByKey.get(key);
    return clonePlayer({
      ...basePlayer,
      sleeperAdp: Number.isFinite(Number(sleeper?.adp)) ? Number(sleeper.adp) : basePlayer.sleeperAdp,
      sleeperPick: sleeper?.pick || basePlayer.sleeperPick,
      espnAdp: Number.isFinite(Number(espn?.adp)) ? Number(espn.adp) : basePlayer.espnAdp,
      espnPick: espn?.pick || basePlayer.espnPick,
      espnRank: Number.isFinite(Number(espn?.pprRank)) ? Number(espn.pprRank) : basePlayer.espnRank,
      headshotUrl: livePlayer?.headshotUrl
        || livePlayer?.headshot_url
        || livePlayer?.imageUrl
        || livePlayer?.avatar
        || livePlayer?.image
        || basePlayer.headshotUrl,
    }, index);
  });
};

const mergeCachedOrderWithLivePlayers = (livePlayers, cachedPlayers) => {
  const liveById = new Map(livePlayers.map((player) => [String(player.id), player]));
  const liveByKey = new Map(livePlayers.map((player) => [playerKey(player), player]));
  const used = new Set();
  const ordered = [];
  (cachedPlayers || []).forEach((cachedPlayer) => {
    const livePlayer = liveById.get(String(cachedPlayer.id)) || liveByKey.get(playerKey(cachedPlayer));
    if (!livePlayer || used.has(livePlayer.id)) return;
    ordered.push({ ...livePlayer, tierLabel: cachedPlayer.tierLabel || livePlayer.tierLabel });
    used.add(livePlayer.id);
  });
  return ordered.concat(livePlayers.filter((player) => !used.has(player.id)));
};

const fetchTeamProjections = async () => {
  try {
    const text = await fetchText(TEAM_PROJECTIONS_URL);
    assistantState.teamProjections = parseScriptArray(text, "clayTeamProjections");
  } catch {
    assistantState.teamProjections = [];
  }
};

const loadMarketData = async () => {
  const [props, futures] = await Promise.allSettled([fetchJson(PLAYER_PROPS_URL), fetchJson(TEAM_FUTURES_URL)]);
  if (props.status === "fulfilled") {
    assistantState.bettingProps = Object.fromEntries((props.value.players || []).map((row) => [playerKey(row), row]));
  }
  if (futures.status === "fulfilled") {
    assistantState.teamFutures = Object.fromEntries((futures.value.teams || []).map((row) => [String(row.team).toUpperCase(), row]));
  }
};

const saveOverlayPrefs = () => chrome.storage.local.set({
  assistantFilters: assistantState.filters,
  assistantExpanded: assistantState.expanded,
  assistantPosition: assistantState.position,
  assistantSize: assistantState.size,
});

const loadOverlayPrefs = async () => {
  const prefs = await chrome.storage.local.get([
    "assistantFilter",
    "assistantFilters",
    "assistantExpanded",
    "assistantPosition",
    "assistantSize",
  ]);
  assistantState.filters = Array.isArray(prefs.assistantFilters)
    ? prefs.assistantFilters.filter((pos) => POSITIONS.includes(pos))
    : (POSITIONS.includes(prefs.assistantFilter) ? [prefs.assistantFilter] : []);
  assistantState.expanded = prefs.assistantExpanded !== false;
  assistantState.position = prefs.assistantPosition || { x: null, y: null };
  assistantState.size = prefs.assistantSize || { width: null, height: null };
};

const loadRankings = async ({ forceDefault = false } = {}) => {
  assistantState.loading = true;
  assistantState.error = "";
  renderAssistant();
  try {
    const [cached, livePlayers] = await Promise.all([
      chrome.storage.local.get(["assistantRankings"]),
      fetchDefaultPlayers(),
    ]);
    if (!forceDefault && Array.isArray(cached.assistantRankings?.players) && cached.assistantRankings.players.length) {
      assistantState.players = mergeCachedOrderWithLivePlayers(
        livePlayers,
        cached.assistantRankings.players.map(clonePlayer),
      );
      assistantState.source = cached.assistantRankings.source || "Logged-in account rankings";
      assistantState.loading = false;
      renderAssistant();
      return;
    }
    assistantState.players = livePlayers;
    assistantState.source = "Using default rankings";
    assistantState.loading = false;
    assistantState.error = "Open the rankings site and click Refresh Rankings to use account rankings.";
    await chrome.storage.local.set({
      assistantRankings: { players: livePlayers, source: assistantState.source, exportedAt: new Date().toISOString() },
    });
    renderAssistant();
  } catch (error) {
    assistantState.loading = false;
    assistantState.error = `Rankings unavailable: ${error.message || "unknown error"}`;
    renderAssistant();
  }
};

const syncRankingsFromBoardTab = async ({ silent = false } = {}) => {
  const tabs = await chrome.runtime.sendMessage({ type: "SYNC_RANKINGS_FROM_BOARD" });
  if (tabs?.ok && Array.isArray(tabs.rankings?.players)) {
    assistantState.players = tabs.rankings.players.map(clonePlayer);
    assistantState.source = tabs.rankings.source || "Logged-in account rankings";
    assistantState.error = "";
    assistantState.loading = false;
    renderAssistant();
    return true;
  }
  if (!silent) {
    assistantState.error = tabs?.error || "Open the rankings site, sign in, then refresh rankings.";
    renderAssistant();
  }
  return false;
};

const sleeperDraftStorageKey = () => `sleeperDrafted:${sleeperDraftId()}`;

const pickPlayerName = (pick) => {
  const metadata = pick?.metadata || {};
  const fullName = metadata.first_name || metadata.last_name
    ? `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim()
    : "";
  return metadata.player_name || fullName || pick?.player_name || "";
};

const pickPlayer = (pick) => ({
  name: pickPlayerName(pick),
  team: pick?.metadata?.team || pick?.team || "",
  pos: pick?.metadata?.position || pick?.position || "",
});

const setDraftedFromPayload = ({ names = [], keys = [], playerIds = [], count = 0 } = {}) => {
  assistantState.draftedNames = new Set(names);
  assistantState.draftedKeys = new Set(keys);
  assistantState.draftedPlayerIds = new Set(playerIds.map(String));
  assistantState.draftedCount = count || names.length || keys.length;
};

const loadStoredDraftPicks = async () => {
  const key = sleeperDraftStorageKey();
  if (!key.endsWith(":")) {
    const stored = await chrome.storage.local.get([key]);
    const updatedAt = Date.parse(stored[key]?.updatedAt || "");
    const isFreshApiPayload = stored[key]?.source === "sleeper-api" && Number.isFinite(updatedAt) && Date.now() - updatedAt < 120000;
    if (isFreshApiPayload) {
      setDraftedFromPayload(stored[key]);
      assistantState.draftPicksReady = true;
      renderAssistant();
    }
  }
};

const boundedFloatingPosition = (x, y, width, height) => ({
  x: Math.max(8, Math.min(x, Math.max(8, window.innerWidth - width - 8))),
  y: Math.max(8, Math.min(y, Math.max(8, window.innerHeight - height - 8))),
});

const bindSmoothPointerDrag = ({ element, handle, onStart, onStop }) => {
  let drag = null;
  let frame = 0;
  let latestPosition = null;

  const applyFrame = () => {
    frame = 0;
    if (!drag || !latestPosition) return;
    element.style.transform = `translate3d(${latestPosition.x - drag.startX}px, ${latestPosition.y - drag.startY}px, 0)`;
  };
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, a")) return;
    const rect = element.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: rect.left,
      startY: rect.top,
      width: rect.width,
      height: rect.height,
    };
    latestPosition = { x: rect.left, y: rect.top };
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.right = "auto";
    element.style.willChange = "transform";
    handle.setPointerCapture(event.pointerId);
    onStart?.();
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    latestPosition = boundedFloatingPosition(
      event.clientX - drag.offsetX,
      event.clientY - drag.offsetY,
      drag.width,
      drag.height,
    );
    if (!frame) frame = requestAnimationFrame(applyFrame);
  });
  const finish = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (frame) cancelAnimationFrame(frame);
    const finalPosition = latestPosition || { x: drag.startX, y: drag.startY };
    element.style.transform = "none";
    element.style.left = `${finalPosition.x}px`;
    element.style.top = `${finalPosition.y}px`;
    element.style.willChange = "auto";
    try {
      handle.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released if the browser canceled the drag.
    }
    drag = null;
    latestPosition = null;
    onStop?.(finalPosition);
  };
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
};

const aiRankingPlayers = () => customRankingPlayers();

const normalizedDraftPicks = (picks) => picks.map((pick) => ({
  player_id: String(pick?.player_id || ""),
  picked_by_user_id: String(pick?.picked_by_user_id || pick?.picked_by || ""),
  picked_by: String(pick?.picked_by || pick?.picked_by_user_id || ""),
  draft_slot: Number(pick?.draft_slot ?? pick?.metadata?.draft_slot) || null,
  round: Number(pick?.round) || 0,
  pick_no: Number(pick?.pick_no) || 0,
  position: String(pick?.metadata?.position || pick?.position || "").toUpperCase(),
  name: pickPlayerName(pick),
}));

const resolveStoredUserDraftSlot = (storedIdentity, draftDetails = {}, picks = []) => {
  const identity = String(storedIdentity || "").trim();
  if (!identity) return null;
  const draftOrder = draftDetails?.draft_order || {};
  const teamCount = Number(draftDetails?.settings?.teams) || Object.keys(draftOrder).length || 12;
  if (/^\d{1,2}$/.test(identity)) {
    const enteredSlot = Number(identity);
    if (enteredSlot >= 1 && enteredSlot <= teamCount) return enteredSlot;
  }

  const directSlot = Number(draftOrder[identity]);
  if (Number.isInteger(directSlot) && directSlot >= 1 && directSlot <= teamCount) return directSlot;

  const normalizedIdentity = normalize(identity);
  const participants = [
    ...(Array.isArray(draftDetails?.users) ? draftDetails.users : []),
    ...(Array.isArray(draftDetails?.participants) ? draftDetails.participants : []),
    ...(Array.isArray(draftDetails?.league_users) ? draftDetails.league_users : []),
  ];
  const matchedUser = participants.find((user) => {
    const values = [user?.user_id, user?.owner_id, user?.display_name, user?.username];
    return values.some((value) => String(value ?? "") === identity || normalize(value) === normalizedIdentity);
  });
  const matchedUserId = String(matchedUser?.user_id || matchedUser?.owner_id || identity);
  const participantSlot = Number(
    matchedUser?.draft_slot
    ?? matchedUser?.slot
    ?? draftOrder[matchedUserId],
  );
  if (Number.isInteger(participantSlot) && participantSlot >= 1 && participantSlot <= teamCount) {
    return participantSlot;
  }

  const matchedRoster = (draftDetails?.league_rosters || []).find((roster) => (
    String(roster?.owner_id || "") === matchedUserId
  ));
  const targetRosterId = String(matchedRoster?.roster_id || identity);
  const slotToRoster = draftDetails?.slot_to_roster_id || {};
  const rosterSlot = Number(Object.entries(slotToRoster)
    .find(([, rosterId]) => String(rosterId) === targetRosterId)?.[0]);
  if (Number.isInteger(rosterSlot) && rosterSlot >= 1 && rosterSlot <= teamCount) return rosterSlot;

  const ownerPick = picks.find((pick) => {
    const owner = String(pick?.picked_by || pick?.picked_by_user_id || "");
    const displayName = String(
      pick?.display_name
      || pick?.owner_display_name
      || pick?.metadata?.display_name
      || pick?.metadata?.owner_name
      || "",
    );
    return owner === identity
      || owner === matchedUserId
      || (normalizedIdentity && normalize(displayName) === normalizedIdentity);
  });
  const pickSlot = Number(ownerPick?.draft_slot ?? ownerPick?.metadata?.draft_slot);
  return Number.isInteger(pickSlot) && pickSlot >= 1 && pickSlot <= teamCount ? pickSlot : null;
};

const detectSleeperUserIdentity = () => {
  const keys = ["sleeper_user", "sleeperUser", "current_user", "user"];
  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const userId = parsed?.user_id || parsed?.userId || parsed?.id;
      if (userId) return String(userId);
    } catch {
      // Ignore unrelated or non-JSON Sleeper storage values.
    }
  }
  return "";
};

const pickSignature = (picks) => picks
  .map((pick) => `${pick?.pick_no || ""}:${pick?.player_id || ""}:${pick?.picked_by || pick?.picked_by_user_id || ""}`)
  .join("|") || "empty-draft";

const loadSleeperDraftContext = async () => {
  if (assistantState.leagueSettings && assistantState.sleeperDraftDetails) {
    return {
      leagueSettings: assistantState.leagueSettings,
      draftDetails: assistantState.sleeperDraftDetails,
    };
  }
  const response = await chrome.runtime.sendMessage({
    type: "FETCH_SLEEPER_DRAFT_CONTEXT",
    draftId: sleeperDraftId(),
  });
  if (!response?.ok || !response.draft) {
    throw new Error(response?.error || "Sleeper league settings unavailable.");
  }
  const modules = await loadAiModules();
  const liveDraftSettings = modules.createMockLeagueSettingsFromDraft(response.draft);
  assistantState.leagueSettings = response.league
    ? {
      ...response.league,
      total_rosters: liveDraftSettings.total_rosters,
      draft_rounds: liveDraftSettings.draft_rounds,
      draft_settings: liveDraftSettings.draft_settings,
    }
    : liveDraftSettings;
  assistantState.sleeperDraftDetails = {
    ...response.draft,
    league_users: Array.isArray(response.users) ? response.users : [],
    league_rosters: Array.isArray(response.rosters) ? response.rosters : [],
    settings: {
      ...response.draft.settings,
      teams: Number(response.draft?.settings?.teams)
        || Number(assistantState.leagueSettings.total_rosters)
        || 12,
    },
  };
  return {
    leagueSettings: assistantState.leagueSettings,
    draftDetails: assistantState.sleeperDraftDetails,
  };
};

const updateMainPanelUI = (availablePlayers, contextPayload, { updateAlerts = true, pickSignature: alertSignature = "" } = {}) => {
  const purgedAvailablePlayers = availablePlayers.filter(
    (player) => !assistantState.draftedPlayerIds.has(String(player.player_id))
      && !assistantState.draftedNames.has(normalizePlayerName(player.name)),
  );
  assistantState.undraftedPlayers = purgedAvailablePlayers;
  if (updateAlerts) {
    assistantState.tierCliffAlert = contextPayload.tierCliffAlert || "";
    assistantState.mustDraftAlert = contextPayload.mustDraftAlert || "";
    assistantState.strategyAlertPickSignature = alertSignature;
    const alertMarkup = [
      assistantState.mustDraftAlert
        ? `<div class="must-draft-alert">${escapeHtml(assistantState.mustDraftAlert)}</div>`
        : "",
      assistantState.tierCliffAlert
        ? `<div class="tier-cliff-alert">${escapeHtml(assistantState.tierCliffAlert)}</div>`
        : "",
    ].join("");
    if (alertMarkup) window.activeDraftAlertHtml = alertMarkup;
  }
  assistantState.survivalByPlayerId = Object.fromEntries(
    purgedAvailablePlayers.map((player) => [String(player.player_id), player.survivalProbability]),
  );
  updatePanelStateUI();
};

const refreshLocalDraftMetrics = async (rawPicks, { force = false } = {}) => {
  const signature = pickSignature(rawPicks);
  const officialPickChanged = signature !== assistantState.lastRecommendationPickSignature;
  if (!force && signature === assistantState.lastRecommendationPickSignature) return;
  if (officialPickChanged && assistantState.lastRecommendationPickSignature) {
    window.activeDraftAlertHtml = null;
  }
  assistantState.lastRecommendationPickSignature = signature;

  try {
    const [sleeperSettings, sleeperContext, modules] = await Promise.all([
      chrome.storage.local.get(["sleeperUserOrSlot", "sleeperUserId"]),
      loadSleeperDraftContext(),
      loadAiModules(),
    ]);
    const savedUserIdentity = String(
      sleeperSettings.sleeperUserOrSlot ?? sleeperSettings.sleeperUserId ?? "",
    ).trim();
    const storedUserIdentity = savedUserIdentity || detectSleeperUserIdentity();
    const normalizedPicks = normalizedDraftPicks(rawPicks).map((pick, index) => ({
      ...pick,
      pick_no: pick.pick_no || index + 1,
    }));
    const resolvedUserDraftSlot = resolveStoredUserDraftSlot(
      storedUserIdentity,
      sleeperContext.draftDetails,
      normalizedPicks,
    );
    const resolvedUserIdentity = resolvedUserDraftSlot
      ? String(resolvedUserDraftSlot)
      : storedUserIdentity;
    console.log("[DraftAssistant] Resolved User Draft Slot:", resolvedUserDraftSlot);

    const draftState = {
      picks: normalizedPicks,
      draftDetails: sleeperContext.draftDetails,
    };
    modules.onPickUpdate(
      draftState,
      aiRankingPlayers(),
      resolvedUserIdentity,
      sleeperContext.leagueSettings,
      {
        updateMainPanelUI: (availablePlayers, contextPayload) => updateMainPanelUI(
          availablePlayers,
          contextPayload,
          {
            updateAlerts: officialPickChanged || !assistantState.strategyAlertPickSignature,
            pickSignature: signature,
          },
        ),
      },
    );
  } catch (error) {
    console.warn("[DraftAssistant] Local draft metrics unavailable:", error);
  }
};

const fetchLiveSleeperPicks = async (draftId) => {
  const result = await chrome.runtime.sendMessage({
    type: "FETCH_SLEEPER_DRAFT_PICKS",
    draftId: String(draftId),
  });
  if (!result?.ok || !Array.isArray(result.picks)) {
    throw new Error(result?.error || "Background Sleeper picks response was invalid");
  }
  console.log("[DraftAssistant] Polled picks count:", result.picks.length);
  return result.picks;
};

const purgeDraftedIdsFromUi = (draftedIds, draftedNames = assistantState.draftedNames) => {
  const normalizedIds = new Set([...draftedIds].map(String));
  const normalizedNames = new Set([...draftedNames].map(normalizePlayerName));
  const currentUndrafted = customRankingPlayers();
  assistantState.undraftedPlayers = currentUndrafted.filter(
    (player) => !normalizedIds.has(String(player.player_id))
      && !normalizedNames.has(normalizePlayerName(player.name)),
  );
  assistantState.survivalByPlayerId = Object.fromEntries(
    Object.entries(assistantState.survivalByPlayerId)
      .filter(([playerId]) => !normalizedIds.has(String(playerId))),
  );
  updatePanelStateUI();
};

const applyDraftPicks = (livePicks, {
  source = "sleeper-api",
  triggerAdvice = false,
  manualAdvice = false,
  officialCount = null,
} = {}) => {
  const completedPicks = livePicks
    .filter((pick) => pick?.player_id && Number(pick?.pick_no) > 0)
    .map((pick) => ({ ...pick, player_id: String(pick.player_id) }))
    .sort((a, b) => Number(a.pick_no) - Number(b.pick_no));
  const completedIds = new Set(completedPicks.map((pick) => String(pick.player_id)));
  const draftedPlayers = completedPicks.map(pickPlayer).filter((player) => player.name);
  const names = draftedPlayers.map((player) => normalizePlayerName(player.name));
  const keys = draftedPlayers.map(playerKey);
  const payload = {
    names,
    keys,
    playerIds: [...completedIds],
    count: Number.isInteger(officialCount) ? officialCount : completedPicks.length,
    source,
    updatedAt: new Date().toISOString(),
  };
  assistantState.lastLiveSleeperPicks = completedPicks;
  calculateAllDraftGrades();
  setDraftedFromPayload(payload);
  assistantState.draftPicksReady = true;
  assistantState.draftPicksError = "";
  purgeDraftedIdsFromUi(completedIds, names);
  chrome.storage.local.set({ [sleeperDraftStorageKey()]: payload });
  if (triggerAdvice) refreshLocalDraftMetrics(completedPicks, { force: manualAdvice });
  return completedPicks;
};

const syncDraftPicks = async ({ manualAdvice = false } = {}) => {
  const draftId = sleeperDraftId();
  if (!draftId) throw new Error("Sleeper draft ID is missing from the URL");

  try {
    const apiPicks = await fetchLiveSleeperPicks(draftId);
    assistantState.lastLiveSleeperPicks = apiPicks;
    applyDraftPicks(apiPicks, {
      source: "sleeper-api",
      triggerAdvice: true,
      manualAdvice,
      officialCount: apiPicks.length,
    });
  } catch (error) {
    assistantState.draftPicksError = error?.message || "Sleeper picks unavailable";
    console.warn("[DraftAssistant] Sleeper API unavailable; preserving last official state:", assistantState.draftPicksError);
    updatePanelStateUI();
  }
};

const isPlayerDrafted = (player) => {
  return assistantState.draftedPlayerIds.has(String(player.id))
    || assistantState.draftedKeys.has(playerKey(player))
    || assistantState.draftedNames.has(normalizePlayerName(player.name))
    || playerAliases(player).some((alias) => assistantState.draftedNames.has(alias));
};

const visiblePlayers = () => {
  const search = normalize(assistantState.search);
  const liveUndraftedIds = Array.isArray(assistantState.undraftedPlayers)
    ? new Set(assistantState.undraftedPlayers.map((player) => String(player.player_id)))
    : null;
  return assistantState.players
    .filter((player) => !liveUndraftedIds || liveUndraftedIds.has(String(player.id)))
    .filter((player) => !isPlayerDrafted(player))
    .filter((player) => assistantState.filters.length === 0 || assistantState.filters.includes(player.pos))
    .filter((player) => !search || normalize(player.name).includes(search))
    .slice(0, 60);
};

const tierForIndex = (index) => {
  if (index < 5) return "Tier 1";
  if (index < 16) return "Tier 2";
  if (index < 36) return "Tier 3";
  if (index < 72) return "Tier 4";
  return "Tier 5";
};

const playerTier = (player, index) => player.tierLabel || tierForIndex(index);

const tierClass = (label) => {
  const tier = Number(String(label || "").match(/\d+/)?.[0] || 1);
  return `tier-${((Math.max(1, tier) - 1) % 8) + 1}`;
};

const marketTeam = (team) => {
  const normalized = String(team || "").toUpperCase();
  if (normalized === "JAX") return "JAC";
  if (normalized === "WAS") return "WSH";
  return normalized;
};

const rankClass = (rank, total = 32) => {
  if (!Number.isFinite(rank) || !Number.isFinite(total) || total <= 0) {
    return "rank-mid";
  }
  const percentile = rank / total;
  if (percentile <= 0.2) return "rank-elite";
  if (percentile <= 0.4) return "rank-good";
  if (percentile <= 0.6) return "rank-mid";
  if (percentile <= 0.8) return "rank-low";
  return "rank-bad";
};

const varianceClass = (value) => {
  if (!Number.isFinite(value) || value === 0) return "rank-mid";
  return value > 0 ? "rank-elite" : "rank-bad";
};

const rankAmong = (rows, targetKey, highWins = true) => {
  const validRows = rows.filter((row) => row.key && Number.isFinite(row.value));
  if (!validRows.some((row) => row.key === targetKey)) {
    return null;
  }
  const sorted = validRows.slice().sort((a, b) => highWins ? b.value - a.value : a.value - b.value);
  return { rank: sorted.findIndex((row) => row.key === targetKey) + 1, total: sorted.length };
};

const playerProps = (player) => assistantState.bettingProps[playerKey(player)]?.props || [];

const teamProjection = (team) => assistantState.teamProjections.find((row) => marketTeam(row.team) === marketTeam(team));

const teamFuture = (team) => (
  assistantState.teamFutures[String(team || "").toUpperCase()]
  || assistantState.teamFutures[marketTeam(team)]
);

const rankTeamFuture = (team) => rankAmong(
  Object.values(assistantState.teamFutures).map((row) => ({ key: marketTeam(row.team), value: Number(row.line) })),
  marketTeam(team),
);

const rankTeamProjection = (team, valueForTeam) => rankAmong(
  assistantState.teamProjections.map((row) => ({ key: marketTeam(row.team), value: Number(valueForTeam(row)) })),
  marketTeam(team),
);

const rankPropLine = (player, prop) => rankAmong(
  Object.values(assistantState.bettingProps)
    .filter((row) => String(row.pos || "").toUpperCase() === player.pos)
    .map((row) => ({
      key: playerKey(row),
      value: Number((row.props || []).find((item) => item.key === prop.key)?.line),
    })),
  playerKey(player),
);

const teamTargetShare = (projection, pos) => {
  const total = Number(projection?.offense?.targets);
  const value = Number(projection?.positions?.[pos]?.targets);
  return total > 0 && Number.isFinite(value) ? Math.round((value / total) * 100) : null;
};

const formatWhole = (value) => Number.isFinite(Number(value)) ? Math.round(Number(value)).toLocaleString() : "N/A";

const formatLine = (prop) => `${prop.label}: ${formatWhole(prop.line)}`;

const formatAdpWithPick = (adp, pick) => {
  const overall = Number.isFinite(Number(adp)) && Number(adp) !== 999 ? Math.round(Number(adp)) : null;
  const match = String(pick || "").match(/^(\d+)\.(\d{1,2})$/);
  const roundPick = match ? `${match[1]}.${match[2].padStart(2, "0")}` : "";
  if (overall !== null && roundPick) return `${overall} (${roundPick})`;
  if (overall !== null) return String(overall);
  return roundPick || "N/A";
};

const rankChip = (rank) => rank ? `<em class="rank-chip">${rank.rank}/${rank.total}</em>` : "";

const factHtml = ({ label, value, sub = "", className = "rank-mid", rank = null }) => `
  <span class="fact ${className}">
    ${rankChip(rank)}
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    ${sub ? `<small>${escapeHtml(sub)}</small>` : ""}
  </span>
`;

const selectedPlayer = () => assistantState.players.find((player) => player.id === assistantState.selectedPlayerId);

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const restoreActiveDraftAlerts = (shadowRoot = document.getElementById(ASSISTANT_ID)?.shadowRoot) => {
  if (!window.activeDraftAlertHtml || !shadowRoot) return;
  const alertHost = shadowRoot.querySelector("[data-role='strategy-alerts']");
  if (alertHost && alertHost.innerHTML !== window.activeDraftAlertHtml) {
    alertHost.innerHTML = window.activeDraftAlertHtml;
  }
};

const overlayPositionStyle = () => {
  const { x, y } = assistantState.position || {};
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return `left:${x}px;top:${y}px;right:auto;`;
  }
  return "right:14px;top:86px;";
};

const panelSizeStyle = () => {
  if (!assistantState.expanded) return "";
  const width = Number(assistantState.size?.width);
  const height = Number(assistantState.size?.height);
  return `${Number.isFinite(width) ? `width:${width}px;` : ""}${Number.isFinite(height) ? `height:${height}px;` : ""}`;
};

const styles = `
  :host { all: initial; color-scheme: dark; }
  #draft-assistant-panel {
    position: fixed !important;
    max-height: 80vh;
    min-width: 260px !important;
    min-height: 180px !important;
    resize: both !important;
    overflow: hidden;
  }
  .panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    z-index: 2147483647;
    width: min(360px, calc(100vw - 28px));
    height: min(720px, calc(100vh - 110px));
    min-width: 260px;
    min-height: 180px;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    overflow: hidden;
    resize: both !important;
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #0f1316;
    color: #eef2f6;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.54);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }
  .panel.collapsed {
    width: auto;
    height: auto;
    min-width: 174px;
    min-height: 0;
    overflow: hidden;
    resize: none;
  }
  .head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 6px;
    align-items: center;
    border-bottom: 1px solid #29313a;
    padding: 9px;
    cursor: move;
    touch-action: none;
    user-select: none;
  }
  .collapsed .head {
    border-bottom: 0;
  }
  .title { min-width: 0; }
  .title strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #facc15;
    font-size: 14px;
    font-weight: 950;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .title span {
    display: block;
    color: #96a1ad;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  button {
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #161b20;
    color: #eef2f6;
    cursor: pointer;
    font: 900 10px Inter, system-ui, sans-serif;
    letter-spacing: .05em;
    min-height: 28px;
    padding: 0 8px;
    text-transform: uppercase;
  }
  .toolbar,
  .filters {
    display: grid;
    gap: 6px;
    padding: 8px 9px 0;
  }
  .toolbar {
    grid-template-columns: 1fr auto;
  }
  .filters {
    grid-template-columns: repeat(5, 1fr);
    padding-bottom: 8px;
  }
  .filters button.active {
    border-color: #38bdf8;
    color: #38bdf8;
  }
  .view-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 8px 9px 0;
  }
  .view-tabs button.active {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, .12);
    color: #38bdf8;
  }
  .view-hidden { display: none !important; }
  .team-grades {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    padding: 8px 9px 10px;
  }
  .team-grade {
    margin-bottom: 7px;
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #14191e;
  }
  .team-grade summary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px;
    cursor: pointer;
    color: #eef2f6;
    font-size: 11px;
    font-weight: 900;
    list-style-position: inside;
  }
  .team-grade-list {
    margin: 0;
    padding: 0 9px 9px 25px;
    color: #b8c2cc;
    font-size: 10px;
    font-weight: 750;
    line-height: 1.45;
  }
  .team-grade-list li { margin-top: 5px; }
  .pick-grade-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #fff;
    font-size: 9px;
    font-weight: 950;
    line-height: 1;
    padding: 3px 6px;
  }
  input {
    width: 100%;
    min-height: 32px;
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #161b20;
    color: #eef2f6;
    font: 800 12px Inter, system-ui, sans-serif;
    padding: 0 10px;
    outline: none;
  }
  .status {
    border-top: 1px solid #20272e;
    color: #96a1ad;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .04em;
    padding: 7px 10px;
    text-transform: uppercase;
  }
  .status.error {
    color: #f87171;
  }
  .tier-cliff-alert {
    margin: 8px 9px 0;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(180, 83, 9, .36), rgba(127, 29, 29, .3));
    color: #fef3c7;
    box-shadow: 0 0 0 1px rgba(245, 158, 11, .12), 0 8px 24px rgba(0, 0, 0, .28);
    font-size: 12px;
    font-weight: 900;
    line-height: 1.35;
    padding: 9px 10px;
  }
  .must-draft-alert {
    margin: 8px 9px 0;
    border: 1px solid #fb7185;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(159, 18, 57, .45), rgba(127, 29, 29, .35));
    color: #ffe4e6;
    box-shadow: 0 0 18px rgba(244, 63, 94, .2);
    font-size: 12px;
    font-weight: 950;
    line-height: 1.35;
    padding: 9px 10px;
  }
  .survival-tag {
    flex: 0 0 auto;
    border: 1px solid;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 900;
    line-height: 1.25;
    padding: 3px 6px;
    white-space: nowrap;
  }
  .survival-high { border-color: #4ade80; background: rgba(20, 83, 45, .7); color: #bbf7d0; }
  .survival-mid { border-color: #fb923c; background: rgba(124, 45, 18, .7); color: #fed7aa; }
  .survival-low { border-color: #fb7185; background: rgba(136, 19, 55, .75); color: #ffe4e6; }
  .survival-na { border-color: #64748b; background: rgba(30, 41, 59, .75); color: #cbd5e1; }
  .list {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }
  .list:has(.grades-scroll-container) { overflow: hidden; }
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border-top: 1px solid #20272e;
    padding: 7px 9px;
    cursor: pointer;
  }
  .row:hover {
    background: rgba(56, 189, 248, .08);
  }
  .row.best {
    background: rgba(74, 222, 128, .12);
    outline: 1px solid rgba(74, 222, 128, .38);
    outline-offset: -1px;
  }
  .rank {
    flex: 0 0 38px;
    color: #facc15;
    font-size: 17px;
    font-weight: 950;
    text-align: center;
  }
  .player-avatar {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    margin-right: 8px;
    border-radius: 50%;
    object-fit: cover;
    background: #20272e;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: visible;
  }
  .name strong {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    overflow: visible;
    white-space: normal;
    font-size: 14px;
    font-weight: 950;
  }
  .tier-badge {
    flex: 0 0 auto;
    border: 1px solid rgba(250, 204, 21, .45);
    border-radius: 999px;
    background: rgba(250, 204, 21, .16);
    color: #facc15;
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .04em;
    padding: 3px 6px;
    text-transform: uppercase;
  }
  .tier-badge.tier-1 {
    border-color: rgba(239, 68, 68, .7);
    background: linear-gradient(90deg, rgba(239, 68, 68, .22), rgba(249, 115, 22, .2));
    color: #fb7185;
  }
  .tier-badge.tier-2 {
    border-color: rgba(245, 158, 11, .7);
    background: linear-gradient(90deg, rgba(245, 158, 11, .22), rgba(234, 179, 8, .18));
    color: #facc15;
  }
  .tier-badge.tier-3 {
    border-color: rgba(34, 197, 94, .7);
    background: linear-gradient(90deg, rgba(34, 197, 94, .2), rgba(20, 184, 166, .16));
    color: #4ade80;
  }
  .tier-badge.tier-4 {
    border-color: rgba(56, 189, 248, .68);
    background: linear-gradient(90deg, rgba(6, 182, 212, .2), rgba(59, 130, 246, .17));
    color: #38bdf8;
  }
  .tier-badge.tier-5 {
    border-color: rgba(168, 85, 247, .68);
    background: linear-gradient(90deg, rgba(139, 92, 246, .2), rgba(217, 70, 239, .16));
    color: #c084fc;
  }
  .tier-badge.tier-6 {
    border-color: rgba(236, 72, 153, .68);
    background: linear-gradient(90deg, rgba(236, 72, 153, .2), rgba(244, 63, 94, .16));
    color: #f472b6;
  }
  .tier-badge.tier-7 {
    border-color: rgba(148, 163, 184, .68);
    background: linear-gradient(90deg, rgba(100, 116, 139, .24), rgba(51, 65, 85, .22));
    color: #cbd5e1;
  }
  .tier-badge.tier-8 {
    border-color: rgba(132, 204, 22, .68);
    background: linear-gradient(90deg, rgba(132, 204, 22, .2), rgba(22, 163, 74, .16));
    color: #a3e635;
  }
  .name span {
    color: #96a1ad;
    font-size: 11px;
    font-weight: 850;
  }
  .empty {
    color: #96a1ad;
    font-size: 12px;
    font-weight: 800;
    padding: 18px 12px;
  }
  .card {
    position: absolute;
    z-index: 4;
    top: 126px;
    right: 8px;
    bottom: 8px;
    left: 8px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #12171b;
    box-shadow: 0 16px 42px rgba(0, 0, 0, .58);
    padding: 10px;
  }
  .card-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
  }
  .card-player {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .card h3 {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 19px;
  }
  .card small {
    display: block;
    color: #96a1ad;
    font-size: 11px;
    font-weight: 850;
    margin-top: 3px;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-top: 10px;
  }
  .fact {
    position: relative;
    overflow: hidden;
    border: 1px solid #29313a;
    border-radius: 8px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--rank-color, #96a1ad) 18%, transparent), rgba(23, 27, 31, .94) 58%),
      #171b1f;
    padding: 8px;
  }
  .fact.rank-elite { --rank-color: #4ade80; border-color: rgba(74, 222, 128, .48); }
  .fact.rank-good { --rank-color: #86efac; border-color: rgba(134, 239, 172, .44); }
  .fact.rank-mid { --rank-color: #facc15; border-color: rgba(250, 204, 21, .36); }
  .fact.rank-low { --rank-color: #fb923c; border-color: rgba(251, 146, 60, .44); }
  .fact.rank-bad { --rank-color: #f87171; border-color: rgba(248, 113, 113, .5); }
  .fact span {
    display: block;
    color: #96a1ad;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .fact strong {
    display: block;
    margin-top: 4px;
    font-size: 15px;
  }
  .fact small {
    display: block;
    color: #778390;
    font-size: 9px;
    font-weight: 850;
    margin-top: 3px;
  }
  .rank-chip {
    position: absolute;
    top: 7px;
    right: 7px;
    border: 1px solid color-mix(in srgb, var(--rank-color, #96a1ad) 70%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--rank-color, #96a1ad) 16%, rgba(17, 24, 29, .92));
    color: var(--rank-color, #96a1ad);
    font-size: 9px;
    font-style: normal;
    font-weight: 950;
    letter-spacing: .03em;
    min-width: 34px;
    padding: 2px 5px;
    text-align: center;
  }
  .collapsed .toolbar,
  .collapsed .view-tabs,
  .collapsed .team-grades,
  .collapsed .filters,
  .collapsed .status,
  .collapsed .tier-cliff-alert,
  .collapsed .must-draft-alert,
  .collapsed .list,
  .collapsed .card {
    display: none;
  }
`;

const cardHtml = () => {
  const player = selectedPlayer();
  if (!player) {
    return "";
  }
  const index = assistantState.players.findIndex((item) => item.id === player.id);
  const tier = playerTier(player, index);
  const projection = teamProjection(player.team);
  const future = teamFuture(player.team);
  const share = ["RB", "WR", "TE"].includes(player.pos) ? teamTargetShare(projection, player.pos) : null;
  const props = playerProps(player).slice(0, 3);
  const sleeperVariance = Number.isFinite(player.sleeperVar)
    ? player.sleeperVar
    : Number.isFinite(player.sleeperAdp) && player.sleeperAdp !== 999
      ? Math.round(player.sleeperAdp - (index + 1))
      : null;
  const espnVariance = Number.isFinite(player.espnVar)
    ? player.espnVar
    : Number.isFinite(player.espnAdp) && player.espnAdp !== 999
      ? Math.round(player.espnAdp - (index + 1))
      : null;
  const flockVariance = Number.isFinite(player.flockVar)
    ? player.flockVar
    : Number.isFinite(player.flockRank)
      ? Math.round(player.flockRank - (index + 1))
      : null;
  const teamWinsValue = Number.isFinite(player.teamWins) ? player.teamWins : future?.line;
  const shareValue = Number.isFinite(player.targetShare)
    ? (player.targetShare <= 1 ? Math.round(player.targetShare * 100) : Math.round(player.targetShare))
    : share;
  const passingYardsValue = Number.isFinite(player.passingYards) ? player.passingYards : projection?.offense?.passYds;
  const rushingYardsValue = Number.isFinite(player.rushingYards) ? player.rushingYards : projection?.offense?.rushYds;
  const winsRank = rankTeamFuture(player.team);
  const shareRank = rankTeamProjection(player.team, (row) => {
    const total = Number(row.offense?.targets);
    const value = Number(row.positions?.[player.pos]?.targets);
    return total > 0 && Number.isFinite(value) ? (value / total) * 100 : NaN;
  });
  const passRank = rankTeamProjection(player.team, (row) => row.offense?.passYds);
  const rushRank = rankTeamProjection(player.team, (row) => row.offense?.rushYds);
  const facts = [
    { label: "My Rank", value: String(index + 1), className: rankClass(index + 1, assistantState.players.length) },
    { label: "My Tier", value: tier, className: tierClass(tier) },
    { label: "Sleeper", value: formatAdpWithPick(player.sleeperAdp, player.sleeperPick), className: rankClass(player.sleeperAdp, assistantState.players.length) },
    { label: "Sleeper Var", value: sleeperVariance === null ? "N/A" : `${sleeperVariance > 0 ? "+" : ""}${sleeperVariance}`, className: varianceClass(sleeperVariance) },
    { label: "ESPN", value: formatAdpWithPick(player.espnAdp, player.espnPick), className: rankClass(player.espnAdp, assistantState.players.length) },
    { label: "ESPN Var", value: espnVariance === null ? "N/A" : `${espnVariance > 0 ? "+" : ""}${espnVariance}`, className: varianceClass(espnVariance) },
    ...(Number.isFinite(player.flockRank) ? [
      { label: "Flock Rank", value: String(Math.round(player.flockRank)), className: rankClass(player.flockRank, assistantState.players.length) },
      { label: "Flock Var", value: flockVariance === null ? "N/A" : `${flockVariance > 0 ? "+" : ""}${flockVariance}`, className: varianceClass(flockVariance) },
    ] : []),
    ...(player.teamContext ? [{ label: "Team Context", value: player.teamContext, className: "rank-mid" }] : []),
    { label: "Team Wins", value: formatWhole(teamWinsValue), sub: future ? `${future.overOdds || ""} / ${future.underOdds || ""}`.trim() : "", className: rankClass(winsRank?.rank, winsRank?.total), rank: winsRank },
    { label: player.pos === "RB" ? "RB Target Share" : `${player.pos} Share`, value: Number.isFinite(shareValue) ? `${shareValue}%` : "N/A", className: rankClass(shareRank?.rank, shareRank?.total), rank: shareRank },
    { label: "Passing Yards", value: formatWhole(passingYardsValue), sub: projection?.offense ? `${formatWhole(projection.offense.passAtt)} att / ${formatWhole(projection.offense.passTd)} TD` : "", className: rankClass(passRank?.rank, passRank?.total), rank: passRank },
    { label: "Rushing Yards", value: formatWhole(rushingYardsValue), sub: projection?.offense ? `${formatWhole(projection.offense.rushAtt)} att / ${formatWhole(projection.offense.rushTd)} TD` : "", className: rankClass(rushRank?.rank, rushRank?.total), rank: rushRank },
    ...props.map((prop) => {
      const propRank = rankPropLine(player, prop);
      return {
        label: prop.label,
        value: formatWhole(prop.line),
        sub: `${prop.overOdds || ""} / ${prop.underOdds || ""}`.trim(),
        className: rankClass(propRank?.rank, propRank?.total),
        rank: propRank,
      };
    }),
  ];
  return `
    <div class="card">
      <div class="card-head">
        <span class="card-player">
          ${player.headshotUrl ? `<img class="player-avatar" src="${escapeHtml(player.headshotUrl)}" alt="" onerror="this.style.display='none';">` : ""}
          <span>
            <h3>${escapeHtml(player.name)}</h3>
            <small>${player.pos} / ${player.team} · <b class="tier-badge ${tierClass(tier)}">${escapeHtml(tier)}</b></small>
          </span>
        </span>
        <button data-action="close-card">Close</button>
      </div>
      <div class="facts">
        ${facts.map(factHtml).join("")}
      </div>
    </div>
  `;
};

const survivalTagHtml = (playerId) => {
  const probability = assistantState.survivalByPlayerId[String(playerId)];
  if (!Number.isFinite(probability)) {
    return `<b class="survival-tag survival-na">—% Next Pick</b>`;
  }
  const className = probability > 60
    ? "survival-high"
    : probability >= 30 ? "survival-mid" : "survival-low";
  return `<b class="survival-tag ${className}">${probability}% Next Pick</b>`;
};

const playerListHtml = (players) => `
  ${!assistantState.error && players.length === 0 ? `<div class="empty">No available players detected.</div>` : ""}
  ${players.map((player, index) => `
    <div class="row ${index === 0 ? "best" : ""}" data-player="${escapeHtml(player.id)}">
      <span class="rank">${assistantState.players.findIndex((item) => item.id === player.id) + 1}</span>
      ${player.headshotUrl ? `<img class="player-avatar" src="${escapeHtml(player.headshotUrl)}" alt="" onerror="this.style.display='none';">` : ""}
      <span class="name">
        ${(() => {
          const tier = playerTier(player, assistantState.players.findIndex((item) => item.id === player.id));
          return `<strong>${escapeHtml(player.name)} <b class="tier-badge ${tierClass(tier)}">${escapeHtml(tier)}</b>${survivalTagHtml(player.id)}</strong>`;
        })()}
        <span>${player.pos} / ${player.team}</span>
      </span>
    </div>
  `).join("")}
`;

const formatGradeNumber = (value, digits = 1) => (
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "N/A"
);

const teamGradesHtml = () => {
  const teamGrades = window.calculatedTeamGrades || {};
  return `
    <div id="team-grades-list" class="team-grades grades-scroll-container" data-role="team-grades">
      ${Array.from({ length: DRAFT_TEAM_COUNT }, (_, index) => {
        const teamSlot = index + 1;
        const team = teamGrades[teamSlot] || { teamPicks: [], teamScore: null, teamLetterGrade: "N/A" };
        const picks = Array.isArray(team.teamPicks) ? team.teamPicks : [];
        if (!picks.length) {
          return `<details class="team-grade"><summary>Team ${teamSlot} | N/A - No picks yet</summary></details>`;
        }
        return `
          <details class="team-grade" data-team-slot="${teamSlot}" ${expandedTeamSlots.has(teamSlot) ? "open" : ""}>
            <summary>Team ${teamSlot} | Grade: ${escapeHtml(team.teamLetterGrade)} (${Math.round(team.teamScore)}/100) | ${picks.length} Picks</summary>
            <ol class="team-grade-list">
              ${picks.map((pick) => {
                const delta = Number(pick.delta);
                const shownDelta = Number.isFinite(delta) ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : "N/A";
                const color = pick.gradeColor || letterGradeFromPickScore(pick.pickScore).color;
                return `<li>Rd ${pick.round} (#${pick.pick_no}): ${escapeHtml(pick.player_name || pick.name)} - Grade: <span class="pick-grade-chip" style="background:${color}">${escapeHtml(pick.letterGrade)}</span> | ADP: ${formatGradeNumber(pick.marketADP)} | Rank: ${formatGradeNumber(pick.personalRank)} | Delta: ${shownDelta}</li>`;
              }).join("")}
            </ol>
          </details>
        `;
      }).join("")}
    </div>
  `;
};

const bindPlayerRows = (shadowRoot) => {
  shadowRoot.querySelectorAll("[data-player]").forEach((row) => {
    row.addEventListener("click", () => {
      assistantState.selectedPlayerId = row.dataset.player;
      renderAssistant();
    });
  });
};

const bindTeamGradeAccordions = (shadowRoot) => {
  const gradesScrollContainer = shadowRoot.querySelector(".grades-scroll-container");
  if (gradesScrollContainer) {
    gradesScrollContainer.scrollTop = assistantState.gradesScrollTop;
    gradesScrollContainer.addEventListener("scroll", () => {
      assistantState.gradesScrollTop = gradesScrollContainer.scrollTop;
    }, { passive: true });
  }
  shadowRoot.querySelectorAll("details.team-grade[data-team-slot]").forEach((drawer) => {
    drawer.addEventListener("toggle", () => {
      const teamSlot = Number(drawer.dataset.teamSlot);
      if (!Number.isInteger(teamSlot)) return;
      if (drawer.open) expandedTeamSlots.add(teamSlot);
      else expandedTeamSlots.delete(teamSlot);
    });
  });
};

const teamGradesRenderSignature = () => Object.values(window.calculatedTeamGrades || {})
  .flatMap((team) => team?.teamPicks || [])
  .map((pick) => `${pick.pick_no}:${pick.player_id}:${Number(pick.pickScore).toFixed(2)}`)
  .join("|");

const updateListUI = (shadowRoot = document.getElementById(ASSISTANT_ID)?.shadowRoot) => {
  const list = shadowRoot?.querySelector(".list");
  if (!list) return;
  const currentGradesContainer = list.querySelector(".grades-scroll-container");
  if (currentGradesContainer) assistantState.gradesScrollTop = currentGradesContainer.scrollTop;
  const nextGradesSignature = teamGradesRenderSignature();
  if (assistantState.panelView === "grades"
    && currentGradesContainer
    && assistantState.gradesRenderSignature === nextGradesSignature) {
    return;
  }
  assistantState.listScrollTop = list.scrollTop;
  list.innerHTML = assistantState.panelView === "grades"
    ? teamGradesHtml()
    : playerListHtml(visiblePlayers());
  list.scrollTop = assistantState.listScrollTop;
  if (assistantState.panelView === "grades") {
    assistantState.gradesRenderSignature = nextGradesSignature;
    const nextGradesContainer = list.querySelector(".grades-scroll-container");
    if (nextGradesContainer) {
      const lockedGradesScrollTop = assistantState.gradesScrollTop;
      nextGradesContainer.scrollTop = lockedGradesScrollTop;
      requestAnimationFrame(() => {
        if (nextGradesContainer.isConnected) nextGradesContainer.scrollTop = lockedGradesScrollTop;
      });
    }
  }
  if (assistantState.panelView === "board") bindPlayerRows(shadowRoot);
  else bindTeamGradeAccordions(shadowRoot);
};

const updatePanelStateUI = (shadowRoot = document.getElementById(ASSISTANT_ID)?.shadowRoot) => {
  if (!shadowRoot?.querySelector("#draft-assistant-panel")) {
    renderAssistant();
    return;
  }
  const players = visiblePlayers();
  const best = players[0];
  const subtitle = shadowRoot.querySelector("[data-role='best-player']");
  if (subtitle) {
    subtitle.textContent = assistantState.loading
      ? "Loading rankings"
      : best ? `Best: ${best.name}` : "No available players";
  }
  const status = shadowRoot.querySelector("[data-role='draft-status']");
  if (status) {
    status.classList.toggle("error", Boolean(assistantState.error));
    status.textContent = `${assistantState.error || assistantState.source} · [${assistantState.draftedCount}] DRAFTED DETECTED`;
  }
  const alertHost = shadowRoot.querySelector("[data-role='strategy-alerts']");
  if (alertHost) {
    const stickyAlertHtml = window.activeDraftAlertHtml || "";
    if (alertHost.innerHTML !== stickyAlertHtml) alertHost.innerHTML = stickyAlertHtml;
  }
  restoreActiveDraftAlerts(shadowRoot);
  updateListUI(shadowRoot);
};

const renderAssistant = () => {
  if (!isSleeperDraft) {
    return;
  }
  let root = document.getElementById(ASSISTANT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ASSISTANT_ID;
    root.className = "extension-ui-element";
    root.attachShadow({ mode: "open" });
    document.documentElement.appendChild(root);
  }
  const existingScrollContainer = root.shadowRoot.querySelector(".scrollable-list-container");
  if (existingScrollContainer) assistantState.listScrollTop = existingScrollContainer.scrollTop;
  const existingGradesContainer = root.shadowRoot.querySelector(".grades-scroll-container");
  if (existingGradesContainer) assistantState.gradesScrollTop = existingGradesContainer.scrollTop;
  const focusedSearch = root.shadowRoot.activeElement?.id === "draft-assistant-search";
  const priorSearchSelection = focusedSearch
    ? {
      start: root.shadowRoot.activeElement.selectionStart,
      end: root.shadowRoot.activeElement.selectionEnd,
    }
    : null;
  const players = visiblePlayers();
  const best = players[0];
  root.shadowRoot.innerHTML = `
    <style>${styles}</style>
    <section id="draft-assistant-panel" class="panel extension-ui-element ${assistantState.expanded ? "" : "collapsed"}" style="${overlayPositionStyle()}${panelSizeStyle()}">
      <div class="head draft-assistant-header" data-drag-handle>
        <span class="title">
          <strong>Draft Assistant</strong>
          <span data-role="best-player">${assistantState.loading ? "Loading rankings" : best ? `Best: ${escapeHtml(best.name)}` : "No available players"}</span>
        </span>
        <button data-action="refresh">Refresh</button>
        <button data-action="toggle">${assistantState.expanded ? "Hide" : "Show"}</button>
      </div>
      <div class="strategy-alerts" data-role="strategy-alerts">${window.activeDraftAlertHtml || ""}</div>
      <nav class="view-tabs" aria-label="Assistant view">
        <button data-view="board" class="${assistantState.panelView === "board" ? "active" : ""}">Board</button>
        <button data-view="grades" class="${assistantState.panelView === "grades" ? "active" : ""}">Team Grades</button>
      </nav>
      <div class="toolbar ${assistantState.panelView === "grades" ? "view-hidden" : ""}">
        <input id="draft-assistant-search" value="${escapeHtml(assistantState.search)}" placeholder="Search player">
        <button data-action="open-board">Board</button>
      </div>
      <div class="filters ${assistantState.panelView === "grades" ? "view-hidden" : ""}">
        <button data-filter="ALL" class="${assistantState.filters.length === 0 ? "active" : ""}">ALL</button>
        ${POSITIONS.map((pos) => `<button data-filter="${pos}" class="${assistantState.filters.includes(pos) ? "active" : ""}">${pos}</button>`).join("")}
      </div>
      <div class="status ${assistantState.error ? "error" : ""}" data-role="draft-status">
        ${escapeHtml(assistantState.error || assistantState.source)} · [${assistantState.draftedCount}] DRAFTED DETECTED
      </div>
      ${cardHtml()}
      <div class="list scrollable-list-container">
        ${assistantState.panelView === "grades" ? teamGradesHtml() : playerListHtml(players)}
      </div>
    </section>
  `;
  const nextScrollContainer = root.shadowRoot.querySelector(".scrollable-list-container");
  if (nextScrollContainer) nextScrollContainer.scrollTop = assistantState.listScrollTop;
  if (assistantState.panelView === "grades") {
    assistantState.gradesRenderSignature = teamGradesRenderSignature();
    const nextGradesContainer = root.shadowRoot.querySelector(".grades-scroll-container");
    if (nextGradesContainer) nextGradesContainer.scrollTop = assistantState.gradesScrollTop;
  }
  bindAssistant(root.shadowRoot);
  restoreActiveDraftAlerts(root.shadowRoot);
  if (focusedSearch) {
    const searchInput = root.shadowRoot.querySelector("#draft-assistant-search");
    searchInput?.focus({ preventScroll: true });
    searchInput?.setSelectionRange(priorSearchSelection.start, priorSearchSelection.end);
  }
  updateHeaderOverlayPositions();
};

const bindAssistantMouseDrag = (panel, handle) => {
  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, select, a")) return;
    const rect = panel.getBoundingClientRect();
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    const previousUserSelect = document.documentElement.style.userSelect;
    assistantState.isDragging = true;
    document.documentElement.style.setProperty("user-select", "none", "important");
    panel.style.left = `${startLeft}px`;
    panel.style.top = `${startTop}px`;
    panel.style.right = "auto";
    handle.style.cursor = "grabbing";

    const move = (moveEvent) => {
      const next = boundedFloatingPosition(
        startLeft + moveEvent.clientX - startMouseX,
        startTop + moveEvent.clientY - startMouseY,
        rect.width,
        rect.height,
      );
      panel.style.left = `${next.x}px`;
      panel.style.top = `${next.y}px`;
      assistantState.position = next;
    };
    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      document.documentElement.style.userSelect = previousUserSelect;
      handle.style.cursor = "move";
      assistantState.isDragging = false;
      saveOverlayPrefs();
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop, { once: true });
    event.preventDefault();
  });
};

const bindAssistant = (shadowRoot) => {
  const scrollContainer = shadowRoot.querySelector(".scrollable-list-container");
  scrollContainer?.addEventListener("scroll", () => {
    assistantState.listScrollTop = scrollContainer.scrollTop;
  }, { passive: true });
  shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      assistantState.panelView = button.dataset.view === "grades" ? "grades" : "board";
      assistantState.selectedPlayerId = "";
      renderAssistant();
      requestAnimationFrame(updateTeamHeaderGradeBadges);
    });
  });
  shadowRoot.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      if (filter === "ALL") {
        assistantState.filters = [];
      } else if (assistantState.filters.includes(filter)) {
        assistantState.filters = assistantState.filters.filter((pos) => pos !== filter);
      } else if (POSITIONS.includes(filter)) {
        assistantState.filters = assistantState.filters.concat(filter);
      }
      saveOverlayPrefs();
      renderAssistant();
    });
  });
  shadowRoot.querySelector("#draft-assistant-search")?.addEventListener("input", (event) => {
    assistantState.search = event.target.value;
    updateListUI(shadowRoot);
  });
  shadowRoot.querySelector("[data-action='toggle']")?.addEventListener("click", () => {
    assistantState.expanded = !assistantState.expanded;
    saveOverlayPrefs();
    renderAssistant();
  });
  shadowRoot.querySelector("[data-action='refresh']")?.addEventListener("click", () => {
    syncDraftPicks({ manualAdvice: true }).catch((error) => {
      console.error("[DraftAssistant] Fetch error:", error);
    });
  });
  shadowRoot.querySelector("[data-action='open-board']")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_BOARD" });
  });
  shadowRoot.querySelector("[data-action='close-card']")?.addEventListener("click", () => {
    assistantState.selectedPlayerId = "";
    renderAssistant();
  });
  bindPlayerRows(shadowRoot);
  bindTeamGradeAccordions(shadowRoot);
  const handle = shadowRoot.querySelector("[data-drag-handle]");
  const panel = shadowRoot.querySelector(".panel");
  if (handle && panel) {
    bindAssistantMouseDrag(panel, handle);

    panel.addEventListener("pointerdown", (event) => {
      if (!assistantState.expanded) return;
      const rect = panel.getBoundingClientRect();
      if (event.clientX >= rect.right - 22 && event.clientY >= rect.bottom - 22) {
        assistantState.listScrollTop = scrollContainer?.scrollTop || 0;
        assistantState.isResizing = true;
        window.addEventListener("pointerup", finishResize, { once: true });
      }
    });
    const finishResize = () => {
      if (!assistantState.isResizing) return;
      assistantState.isResizing = false;
      saveOverlayPrefs();
    };
    panel.addEventListener("pointerup", finishResize);
    panel.addEventListener("pointercancel", finishResize);

    const resizeObserver = new ResizeObserver(() => {
      if (!assistantState.expanded) return;
      const lockedScrollTop = assistantState.listScrollTop;
      const lockedGradesScrollTop = assistantState.gradesScrollTop;
      const rect = panel.getBoundingClientRect();
      const sizeChanged = Math.abs(Number(assistantState.size.width) - rect.width) > 1
        || Math.abs(Number(assistantState.size.height) - rect.height) > 1;
      if (sizeChanged) {
        assistantState.size = { width: rect.width, height: rect.height };
      }
      if (sizeChanged && !assistantState.isResizing) {
        saveOverlayPrefs();
      }
      if (scrollContainer && scrollContainer.scrollTop !== lockedScrollTop) {
        scrollContainer.scrollTop = lockedScrollTop;
      }
      const gradesScrollContainer = scrollContainer?.querySelector(".grades-scroll-container");
      if (gradesScrollContainer && gradesScrollContainer.scrollTop !== lockedGradesScrollTop) {
        gradesScrollContainer.scrollTop = lockedGradesScrollTop;
      }
    });
    resizeObserver.observe(panel);
  } else {
    if (assistantState.isDragging) {
      assistantState.isDragging = false;
    }
  }
};

const boardPlayerLookup = () => {
  const rankings = customRankingPlayers();
  const byId = new Map();
  const byName = new Map();
  rankings.forEach((player, index) => {
    const enriched = { ...player, custom_rank: Number(player.custom_rank) || index + 1 };
    byId.set(String(enriched.player_id), enriched);
    playerAliases(enriched).forEach((alias) => byName.set(alias, enriched));
    byName.set(normalizePlayerName(enriched.name), enriched);
  });
  return { byId, byName };
};

const DRAFT_TEAM_COUNT = 12;
const calculateAllDraftGrades = () => {
  const { byId, byName } = boardPlayerLookup();
  const trackedPicks = Array.isArray(assistantState.lastLiveSleeperPicks)
    ? assistantState.lastLiveSleeperPicks
    : [];
  const recognizedPicks = [];
  const playerGradeMap = Object.create(null);
  const playerGradeAliasMap = new Map();
  trackedPicks.forEach((rawPick, index) => {
    const pick = rawPick || {};
    const sequence = index + 1;
    const pickNumber = Number(pick.pick_no) || sequence;
    const round = Math.ceil(pickNumber / 12);
    const remainder = pickNumber % 12;
    const slotInRound = remainder === 0 ? 12 : remainder;
    const isOddRound = round % 2 === 1;
    const teamSlot = isOddRound ? slotInRound : 13 - slotInRound;
    const playerId = String(pick.player_id || "");
    const trackedName = pickPlayerName(pick);
    const player = byId.get(playerId)
      || byName.get(normalizePlayerName(trackedName))
      || byName.get(normalize(trackedName))
      || {
        player_id: playerId || `pick-${pickNumber}`,
        name: trackedName || `Player ${playerId}`,
        position: String(pick.metadata?.position || pick.position || "").toUpperCase(),
        custom_rank: null,
        sleeper_adp: pick.metadata?.adp ?? null,
      };
    const recognizedPick = {
      ...player,
      player_id: playerId || `pick-${pickNumber}`,
      player_name: trackedName || player.name,
      pick_no: pickNumber,
      round,
      teamSlot,
    };
    const grade = calculatePickGrade(recognizedPick);
    recognizedPick.playerADP = grade.playerADP;
    recognizedPick.marketADP = grade.marketADP;
    recognizedPick.personalRank = grade.personalRank;
    recognizedPick.compositeTarget = grade.compositeTarget;
    recognizedPick.valueDelta = grade.delta;
    recognizedPick.delta = grade.delta;
    recognizedPick.pickScore = grade.pickScore;
    recognizedPick.letterGrade = grade.grade;
    recognizedPick.gradeColor = grade.color;
    const gradeEntry = {
      letterGrade: grade.grade,
      pickScore: grade.pickScore,
      delta: grade.delta,
      playerADP: grade.playerADP,
      marketADP: grade.marketADP,
      personalRank: grade.personalRank,
      playerName: recognizedPick.player_name || recognizedPick.name,
    };
    const normalizedPlayerName = normalizePlayerName(gradeEntry.playerName);
    if (normalizedPlayerName) playerGradeMap[normalizedPlayerName] = gradeEntry;
    playerAliases({ name: gradeEntry.playerName }).forEach((alias) => {
      if (alias) playerGradeAliasMap.set(alias, gradeEntry);
    });
    Object.assign(pick, {
      calculatedRound: round,
      teamSlot,
      playerADP: grade.playerADP,
      marketADP: grade.marketADP,
      personalRank: grade.personalRank,
      compositeTarget: grade.compositeTarget,
      valueDelta: grade.delta,
      delta: grade.delta,
      pickScore: grade.pickScore,
      letterGrade: grade.grade,
      gradeColor: grade.color,
    });
    recognizedPicks.push(recognizedPick);
  });
  const calculatedTeamGrades = {};
  for (let teamSlot = 1; teamSlot <= DRAFT_TEAM_COUNT; teamSlot += 1) {
    const teamPicks = recognizedPicks.filter((pick) => pick.teamSlot === teamSlot);
    const weighted = teamPicks.length ? calculateWeightedTeamGrade(teamPicks) : null;
    calculatedTeamGrades[teamSlot] = {
      teamSlot,
      teamPicks,
      teamScore: weighted?.teamScore ?? null,
      teamLetterGrade: weighted?.grade ?? "N/A",
      color: weighted?.color ?? "#64748b",
    };
  }
  const aggregatedPickCount = Object.values(calculatedTeamGrades)
    .reduce((total, team) => total + team.teamPicks.length, 0);
  if (aggregatedPickCount !== recognizedPicks.length) {
    console.error("[DraftAssistant] Team-grade aggregation mismatch:", {
      recognizedPicks: recognizedPicks.length,
      aggregatedPicks: aggregatedPickCount,
    });
  }
  window.calculatedTeamGrades = calculatedTeamGrades;
  window.playerGradeMap = playerGradeMap;
  window.playerGradeAliasMap = playerGradeAliasMap;
  updateTeamHeaderGradeBadges();
  return recognizedPicks;
};

function teamGradeBadgeColor(letterGrade) {
  if (String(letterGrade).startsWith("A")) return "#16a34a";
  if (String(letterGrade).startsWith("B")) return "#2563eb";
  if (String(letterGrade).startsWith("C")) return "#ca8a04";
  return "#dc2626";
}

function sleeperTeamHeaderElements() {
  const allAvatars = Array.from(document.querySelectorAll(
    '.draftboard-header [class*="avatar"], .team-avatar, [class*="team-header"] [class*="avatar"], .avatar',
  )).filter((element) => !element.closest(".extension-ui-element"));

  const visibleAvatars = allAvatars.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0
      && rect.height > 0
      && rect.top >= -50
      && rect.bottom <= window.innerHeight + 50;
  });

  const leafAvatars = visibleAvatars.filter((candidate, index, all) => (
    !all.some((other, otherIndex) => otherIndex !== index && candidate.contains(other))
  ));
  const uniqueByColumn = [];
  leafAvatars
    .sort((left, right) => left.getBoundingClientRect().left - right.getBoundingClientRect().left)
    .forEach((candidate) => {
      const candidateLeft = candidate.getBoundingClientRect().left;
      const duplicate = uniqueByColumn.some((existing) => (
        Math.abs(existing.getBoundingClientRect().left - candidateLeft) < 3
      ));
      if (!duplicate) uniqueByColumn.push(candidate);
    });

  return uniqueByColumn.length >= DRAFT_TEAM_COUNT
    ? uniqueByColumn.slice(0, DRAFT_TEAM_COUNT)
    : [];
}

function removeNestedTeamHeaderBadges() {
  document.querySelectorAll(".team-header-grade-badge").forEach((badge) => {
    if (badge.closest("#extension-header-overlay-container")) return;
    const formerHeader = badge.parentElement;
    badge.remove();
    formerHeader?.style.removeProperty("position");
    formerHeader?.style.removeProperty("overflow");
  });
}

function headerGradeOverlayContainer() {
  let container = document.getElementById("extension-header-overlay-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "extension-header-overlay-container";
    container.className = "extension-ui-element";
    container.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(container);
  }
  return container;
}

function updateTeamHeaderGradeBadges() {
  if (!isSleeperDraft || !document.body) return;
  removeNestedTeamHeaderBadges();
  const container = headerGradeOverlayContainer();
  container.replaceChildren();
  const headers = sleeperTeamHeaderElements();
  if (headers.length !== DRAFT_TEAM_COUNT) {
    console.warn("[DraftAssistant] Expected exactly 12 Sleeper team headers; found:", headers.length);
    return;
  }

  headers.forEach((avatarEl, index) => {
    const teamSlot = index + 1;
    const team = window.calculatedTeamGrades?.[teamSlot];
    const hasPicks = Array.isArray(team?.teamPicks) && team.teamPicks.length > 0;
    if (!hasPicks) return;

    const rect = avatarEl.getBoundingClientRect();
    const badge = document.createElement("span");
    badge.className = "team-header-grade-badge";
    badge.dataset.teamGradeSlot = String(teamSlot);
    container.appendChild(badge);
    badge.textContent = team.teamLetterGrade;
    badge.title = `Team ${teamSlot}: ${team.teamLetterGrade} (${Math.round(team.teamScore)}/100) · ${team.teamPicks.length} picks`;
    badge.style.cssText = [
      "position:absolute",
      `top:${rect.top + window.scrollY - 2}px`,
      `left:${rect.right + window.scrollX - 14}px`,
      "border-radius:50%",
      "width:22px",
      "height:22px",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "font-weight:bold",
      "font-size:11px",
      "font-family:system-ui,sans-serif",
      "line-height:1",
      "color:#fff",
      `background:${teamGradeBadgeColor(team.teamLetterGrade)}`,
      "border:2px solid #0f172a",
      "box-sizing:border-box",
      "z-index:999",
      "pointer-events:auto",
    ].join(";");
  });

}

let headerOverlayAnimationFrame = 0;
let headerOverlayWatchdog = 0;
function updateHeaderOverlayPositions() {
  cancelAnimationFrame(headerOverlayAnimationFrame);
  headerOverlayAnimationFrame = requestAnimationFrame(() => {
    headerOverlayAnimationFrame = 0;
    updateTeamHeaderGradeBadges();
  });
}
function ensureHeaderOverlayWatchdog() {
  updateHeaderOverlayPositions();
  if (!headerOverlayWatchdog) {
    headerOverlayWatchdog = window.setInterval(updateHeaderOverlayPositions, 500);
  }
}
const overallAdpForPickGrade = (player) => {
  const roundPick = player?.sleeper_pick ?? player?.sleeperPick;
  if (typeof roundPick === "string" && /^\d+\.\d{1,2}$/.test(roundPick.trim())) {
    const [round, pick] = roundPick.trim().split(".").map(Number);
    return ((round - 1) * 12) + pick;
  }
  const raw = player?.sleeper_adp;
  if (typeof raw === "string" && /^\d+\.\d{1,2}$/.test(raw.trim())) {
    const [round, pick] = raw.trim().split(".").map(Number);
    return ((round - 1) * 12) + pick;
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0 && numeric < 500) return numeric;
  return null;
};

const letterGradeFromPickScore = (score) => {
  if (score >= 93) return { grade: "A+", color: "#16a34a" };
  if (score >= 88) return { grade: "A", color: "#22c55e" };
  if (score >= 83) return { grade: "B+", color: "#2563eb" };
  if (score >= 78) return { grade: "B", color: "#3b82f6" };
  if (score >= 73) return { grade: "C+", color: "#ca8a04" };
  if (score >= 68) return { grade: "C", color: "#eab308" };
  if (score >= 60) return { grade: "D", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
};

const calculatePickGrade = (pick) => {
  const pickSpot = Number(pick.pick_no);
  const parsedMarketADP = overallAdpForPickGrade(pick);
  const parsedPersonalRank = Number(pick.custom_rank);
  const marketADP = Number.isFinite(parsedMarketADP) && parsedMarketADP > 0
    ? parsedMarketADP
    : Number.isFinite(parsedPersonalRank) && parsedPersonalRank > 0 ? parsedPersonalRank : pickSpot;
  const personalRank = Number.isFinite(parsedPersonalRank) && parsedPersonalRank > 0
    ? parsedPersonalRank
    : marketADP;
  const compositeTarget = (0.6 * personalRank) + (0.4 * marketADP);
  const delta = pickSpot - compositeTarget;
  const round = Math.ceil(pickSpot / DRAFT_TEAM_COUNT);
  let capitalMultiplier = 1;
  if (round === 1) capitalMultiplier = 4.5;
  else if (round === 2) capitalMultiplier = 3.8;
  else if (round === 3) capitalMultiplier = 3;
  else if (round <= 6) capitalMultiplier = 2;
  else if (round <= 10) capitalMultiplier = 1.2;
  else capitalMultiplier = 0.8;
  const rawScore = 80 + (delta * capitalMultiplier);
  const pickScore = Math.min(100, Math.max(40, rawScore));
  return {
    playerADP: marketADP,
    marketADP,
    personalRank,
    compositeTarget,
    pickSpot,
    delta,
    round,
    capitalMultiplier,
    pickScore,
    ...letterGradeFromPickScore(pickScore),
  };
};

const calculateWeightedTeamGrade = (teamPicks) => {
  if (!teamPicks.length) {
    const pickScore = 80;
    return { teamScore: pickScore, totalWeight: 0, ...letterGradeFromPickScore(pickScore) };
  }
  const weighted = teamPicks.reduce((totals, pick) => {
    const pickScore = Number.isFinite(Number(pick.pickScore))
      ? Number(pick.pickScore)
      : calculatePickGrade(pick).pickScore;
    const round = Number(pick.round) || 1;
    const weight = 1 / Math.sqrt(Math.max(1, round));
    return {
      score: totals.score + pickScore * weight,
      weight: totals.weight + weight,
    };
  }, { score: 0, weight: 0 });
  const teamScore = weighted.weight ? weighted.score / weighted.weight : 80;
  return {
    teamScore,
    totalWeight: weighted.weight,
    ...letterGradeFromPickScore(teamScore),
  };
};

const observeDraftPage = () => {
  ensureHeaderOverlayWatchdog();
  setInterval(async () => {
    try {
      await syncDraftPicks();
    } catch (e) {
      assistantState.draftPicksError = e.message || "Sleeper picks unavailable.";
      console.error("[DraftAssistant] Fetch error:", e);
    }
  }, 1750);
  window.addEventListener("focus", () => {
    syncDraftPicks().catch((error) => console.error("[DraftAssistant] Fetch error:", error));
  });
  window.addEventListener("resize", () => {
    renderAssistant();
    updateHeaderOverlayPositions();
  });
  window.addEventListener("scroll", updateHeaderOverlayPositions, { passive: true, capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncDraftPicks().catch((error) => console.error("[DraftAssistant] Fetch error:", error));
    }
  });
};

const initSleeperAssistant = async () => {
  const activeDraftId = sleeperDraftId();
  console.log("[DraftAssistant] Active Draft ID:", activeDraftId);
  if (!activeDraftId) {
    console.error("[DraftAssistant] Active Draft ID could not be parsed from URL:", window.location.href);
  }
  ensureHeaderOverlayWatchdog();
  syncDraftPicks().catch((error) => console.error("[DraftAssistant] Fetch error:", error));
  await loadOverlayPrefs();
  await loadCustomRankings();
  renderAssistant();
  updateHeaderOverlayPositions();
  await loadStoredDraftPicks();
  await loadRankings();
  try {
    await syncRankingsFromBoardTab({ silent: true });
  } catch (error) {
    console.error("[DraftAssistant] Rankings sync error (draft polling continues):", error);
  }
  assistantState.lastRecommendationPickSignature = "";
  syncDraftPicks().catch((error) => console.error("[DraftAssistant] Fetch error:", error));
  fetchTeamProjections().then(renderAssistant);
  loadMarketData().then(renderAssistant);
  observeDraftPage();
};

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.userRankings) return;
  loadCustomRankings().then(() => {
    assistantState.lastRecommendationPickSignature = "";
    syncDraftPicks().catch((error) => console.error("[DraftAssistant] Fetch error:", error));
    renderAssistant();
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXPORT_RANKINGS") {
    exportedRankingsFromPage()
      .then((rankings) => sendResponse({ ok: true, rankings }))
      .catch((error) => sendResponse({ ok: false, error: error.message || "Could not export rankings." }));
    return true;
  }
  if (message?.type === "TOGGLE_ASSISTANT") {
    assistantState.expanded = !assistantState.expanded;
    saveOverlayPrefs();
    renderAssistant();
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === "SHOW_ASSISTANT") {
    assistantState.expanded = true;
    saveOverlayPrefs();
    renderAssistant();
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === "REFRESH_ASSISTANT_RANKINGS") {
    syncRankingsFromBoardTab()
      .then((ok) => sendResponse({ ok }))
      .catch((error) => sendResponse({ ok: false, error: error.message || "Refresh failed." }));
    return true;
  }
  if (message?.type === "UPDATE_SLEEPER_USER_OR_SLOT") {
    assistantState.lastRecommendationPickSignature = "";
    syncDraftPicks()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message || "Slot update failed." }));
    return true;
  }
  return false;
});

if (isSleeperDraft) {
  initSleeperAssistant();
}
