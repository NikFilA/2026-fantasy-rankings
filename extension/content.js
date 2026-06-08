const APP_ORIGIN = "https://2026-fantasy-rankings.vercel.app";
const DATA_URL = `${APP_ORIGIN}/data.js`;
const TEAM_PROJECTIONS_URL = `${APP_ORIGIN}/team-projections.js`;
const PLAYER_PROPS_URL = `${APP_ORIGIN}/api/bettingpros-player-futures`;
const TEAM_FUTURES_URL = `${APP_ORIGIN}/api/bettingpros-team-futures`;
const ASSISTANT_ID = "ff-draft-assistant-root";
const STORAGE_KEY = "myCustomRankings";
const POSITIONS = ["QB", "RB", "WR", "TE"];
const APP_HOSTS = new Set(["2026-fantasy-rankings.vercel.app", "localhost", "127.0.0.1"]);

const isRankingsHost = (hostname) => (
  APP_HOSTS.has(hostname)
  || (hostname.endsWith(".vercel.app") && hostname.startsWith("2026-fantasy-rankings"))
);

const isAppPage = isRankingsHost(window.location.hostname);
const isSleeperDraft = /(^|\.)sleeper\.com$/.test(window.location.hostname) && window.location.pathname.includes("/draft/");

const assistantState = {
  players: [],
  defaultPlayers: [],
  source: "Loading rankings",
  filters: [],
  search: "",
  expanded: true,
  loading: true,
  error: "",
  draftedNames: new Set(),
  draftedKeys: new Set(),
  visibleDraftedNames: new Set(),
  draftPicksReady: false,
  draftPicksLoading: false,
  draftPicksError: "",
  lastDraftPicksFetch: 0,
  draftedCount: 0,
  selectedPlayerId: "",
  position: { x: null, y: null },
  isDragging: false,
  teamProjections: [],
  teamFutures: {},
  bettingProps: {},
};

const normalize = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

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
  const match = window.location.pathname.match(/\/draft\/(?:nfl\/)?([^/?#]+)/);
  return match?.[1] || "";
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
  sleeperAdp: Number.isFinite(Number(player.sleeperAdp)) ? Number(player.sleeperAdp) : 999,
  sleeperPick: String(player.sleeperPick || ""),
  tierLabel: String(player.tierLabel || player.tier || ""),
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
  const text = await fetchText(DATA_URL);
  const players = parseScriptArray(text, "defaultPlayers").map(clonePlayer);
  assistantState.defaultPlayers = players;
  return players;
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
});

const loadOverlayPrefs = async () => {
  const prefs = await chrome.storage.local.get(["assistantFilter", "assistantFilters", "assistantExpanded", "assistantPosition"]);
  assistantState.filters = Array.isArray(prefs.assistantFilters)
    ? prefs.assistantFilters.filter((pos) => POSITIONS.includes(pos))
    : (POSITIONS.includes(prefs.assistantFilter) ? [prefs.assistantFilter] : []);
  assistantState.expanded = prefs.assistantExpanded !== false;
  assistantState.position = prefs.assistantPosition || { x: null, y: null };
};

const loadRankings = async ({ forceDefault = false } = {}) => {
  assistantState.loading = true;
  assistantState.error = "";
  renderAssistant();
  try {
    const cached = await chrome.storage.local.get(["assistantRankings"]);
    if (!forceDefault && Array.isArray(cached.assistantRankings?.players) && cached.assistantRankings.players.length) {
      assistantState.players = cached.assistantRankings.players.map(clonePlayer);
      assistantState.source = cached.assistantRankings.source || "Logged-in account rankings";
      assistantState.loading = false;
      renderAssistant();
      return;
    }
    const defaults = await fetchDefaultPlayers();
    assistantState.players = defaults;
    assistantState.source = "Using default rankings";
    assistantState.loading = false;
    assistantState.error = "Open the rankings site and click Refresh Rankings to use account rankings.";
    await chrome.storage.local.set({
      assistantRankings: { players: defaults, source: assistantState.source, exportedAt: new Date().toISOString() },
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

const setDraftedFromPayload = ({ names = [], keys = [], count = 0 } = {}) => {
  assistantState.draftedNames = new Set(names);
  assistantState.draftedKeys = new Set(keys);
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

const refreshSleeperDraftPicks = async () => {
  const draftId = sleeperDraftId();
  if (!draftId || assistantState.draftPicksLoading) {
    return;
  }
  assistantState.lastDraftPicksFetch = Date.now();
  assistantState.draftPicksLoading = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "FETCH_SLEEPER_DRAFT_PICKS", draftId });
    if (!response?.ok || !Array.isArray(response.picks)) {
      throw new Error(response?.error || "Sleeper picks unavailable.");
    }
    const draftedPlayers = response.picks
      .filter((pick) => pick?.player_id)
      .map(pickPlayer)
      .filter((player) => player.name);
    const names = draftedPlayers.map((player) => normalize(player.name));
    const keys = draftedPlayers.map(playerKey);
    const payload = {
      names,
      keys,
      count: draftedPlayers.length,
      source: "sleeper-api",
      updatedAt: new Date().toISOString(),
    };
    setDraftedFromPayload(payload);
    assistantState.draftPicksReady = true;
    assistantState.draftPicksError = "";
    await chrome.storage.local.set({ [sleeperDraftStorageKey()]: payload });
    renderAssistant();
  } catch (error) {
    assistantState.draftPicksError = error.message || "Sleeper picks unavailable.";
  } finally {
    assistantState.draftPicksLoading = false;
  }
};

const requestFastDraftRefresh = () => {
  if (!isSleeperDraft) {
    return;
  }
  const now = Date.now();
  if (now - assistantState.lastDraftPicksFetch < 650) {
    return;
  }
  refreshSleeperDraftPicks();
};

const sleeperBoardBottom = () => {
  const controlsTop = Array.from(document.body.querySelectorAll("div, span, button, input"))
    .map((node) => {
      const rect = node.getBoundingClientRect();
      const text = normalize(node.getAttribute("placeholder") || node.innerText || node.textContent || "");
      return { rect, text };
    })
    .filter(({ rect, text }) => (
      rect.top > window.innerHeight * 0.35
      && rect.top < window.innerHeight
      && (
        text.includes("findplayer")
        || text.includes("watchlist")
        || text.includes("showdrafted")
        || text.includes("rookiesonly")
        || text.includes("queue")
        || text.includes("roster")
        || text.includes("chat")
      )
    ))
    .map(({ rect }) => rect.top);
  if (controlsTop.length) {
    return Math.max(260, Math.min(...controlsTop) - 8);
  }
  return Math.min(window.innerHeight * 0.58, 640);
};

const sleeperDraftedNames = () => {
  const names = new Set();
  if (!assistantState.players.length) {
    return names;
  }
  const boardBottom = sleeperBoardBottom();
  const ignoredAncestor = (node) => Boolean(node.closest(`#${ASSISTANT_ID}, input, textarea`));
  const draftTileTexts = Array.from(document.body.querySelectorAll("div, span, button"))
    .filter((node) => !ignoredAncestor(node))
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      const rawText = (node.innerText || node.textContent || "").trim().toLowerCase();
      return rect.width >= 28
        && rect.height >= 12
        && rect.width <= 280
        && rect.height <= 92
        && rect.top >= 0
        && rect.top < boardBottom
        && rect.left >= 0
        && rect.left < window.innerWidth
        && /\b\d{1,2}\.\d{1,2}\b/.test(rawText)
        && !rawText.includes("projected pick")
        && !rawText.includes("find player")
        && !rawText.includes("watchlist")
        && !rawText.includes("show drafted");
    })
    .map((node) => normalize((node.innerText || node.textContent || "").trim()))
    .filter((text) => text.length >= 3 && text.length <= 160);
  assistantState.players.forEach((player) => {
    const aliases = playerAliases(player);
    const teams = teamAliases(player.team);
    const pos = normalize(player.pos);
    if (draftTileTexts.some((text) => (
      aliases.some((alias) => text.includes(alias))
      && text.includes(pos)
      && teams.some((team) => text.includes(team))
    ))) {
      names.add(normalize(player.name));
    }
  });
  return names;
};

const refreshDrafted = () => {
  if (!isSleeperDraft) {
    assistantState.draftedNames = new Set();
    assistantState.draftedKeys = new Set();
    assistantState.visibleDraftedNames = new Set();
    assistantState.draftedCount = 0;
    return;
  }
  const visibleDraftedNames = sleeperDraftedNames();
  assistantState.visibleDraftedNames = visibleDraftedNames;
  if (!assistantState.draftPicksReady) {
    assistantState.draftedNames = new Set(visibleDraftedNames);
    assistantState.draftedKeys = new Set();
    assistantState.draftedCount = visibleDraftedNames.size;
    return;
  }
  if (assistantState.draftedCount === 0) {
    visibleDraftedNames.forEach((name) => assistantState.draftedNames.add(name));
    assistantState.draftedCount = assistantState.draftedNames.size;
  }
};

const isPlayerDrafted = (player) => {
  const visibleDrafted = assistantState.visibleDraftedNames.has(normalize(player.name));
  if (assistantState.draftPicksReady) {
    return visibleDrafted
      || assistantState.draftedKeys.has(playerKey(player))
      || playerAliases(player).some((alias) => assistantState.draftedNames.has(alias));
  }
  return visibleDrafted || assistantState.draftedNames.has(normalize(player.name));
};

const visiblePlayers = () => {
  refreshDrafted();
  const search = normalize(assistantState.search);
  return assistantState.players
    .filter((player) => assistantState.filters.length === 0 || assistantState.filters.includes(player.pos))
    .filter((player) => !search || normalize(player.name).includes(search))
    .filter((player) => !isPlayerDrafted(player))
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

const overlayPositionStyle = () => {
  const { x, y } = assistantState.position || {};
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return `left:${Math.max(8, Math.min(x, window.innerWidth - 92))}px;top:${Math.max(8, Math.min(y, window.innerHeight - 48))}px;right:auto;`;
  }
  return "right:14px;top:86px;";
};

const styles = `
  :host { all: initial; color-scheme: dark; }
  .panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    z-index: 2147483647;
    width: min(360px, calc(100vw - 28px));
    max-height: min(720px, calc(100vh - 110px));
    overflow: hidden;
    border: 1px solid #29313a;
    border-radius: 8px;
    background: #0f1316;
    color: #eef2f6;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.54);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }
  .panel.collapsed {
    width: auto;
    min-width: 174px;
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
  .list {
    flex: 1 1 auto;
    min-height: 112px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }
  .row {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
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
    color: #facc15;
    font-size: 17px;
    font-weight: 950;
    text-align: center;
  }
  .name { overflow: hidden; }
  .name strong {
    display: flex;
    gap: 6px;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  .tag {
    border-radius: 999px;
    background: rgba(56, 189, 248, .12);
    color: #38bdf8;
    font-size: 10px;
    font-weight: 950;
    padding: 4px 7px;
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
  .collapsed .filters,
  .collapsed .status,
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
  const udVariance = Number.isFinite(player.udAdp) && player.udAdp !== 999 ? Math.round(player.udAdp - (index + 1)) : null;
  const sleeperVariance = Number.isFinite(player.sleeperAdp) && player.sleeperAdp !== 999 ? Math.round(player.sleeperAdp - (index + 1)) : null;
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
    { label: "Underdog", value: player.udPick || String(player.udAdp), className: rankClass(player.udAdp, assistantState.players.length) },
    { label: "UD Var", value: udVariance === null ? "N/A" : `${udVariance > 0 ? "+" : ""}${udVariance}`, className: varianceClass(udVariance) },
    { label: "Sleeper", value: player.sleeperPick || String(player.sleeperAdp || "N/A"), className: rankClass(player.sleeperAdp, assistantState.players.length) },
    { label: "Sleeper Var", value: sleeperVariance === null ? "N/A" : `${sleeperVariance > 0 ? "+" : ""}${sleeperVariance}`, className: varianceClass(sleeperVariance) },
    { label: "Team Wins", value: future ? formatWhole(future.line) : "N/A", sub: future ? `${future.overOdds || ""} / ${future.underOdds || ""}`.trim() : "", className: rankClass(winsRank?.rank, winsRank?.total), rank: winsRank },
    { label: `${player.pos} Share`, value: share === null ? "N/A" : `${share}%`, className: rankClass(shareRank?.rank, shareRank?.total), rank: shareRank },
    { label: "Clay Pass", value: formatWhole(projection?.offense?.passYds), sub: projection?.offense ? `${formatWhole(projection.offense.passAtt)} att / ${formatWhole(projection.offense.passTd)} TD` : "", className: rankClass(passRank?.rank, passRank?.total), rank: passRank },
    { label: "Clay Rush", value: formatWhole(projection?.offense?.rushYds), sub: projection?.offense ? `${formatWhole(projection.offense.rushAtt)} att / ${formatWhole(projection.offense.rushTd)} TD` : "", className: rankClass(rushRank?.rank, rushRank?.total), rank: rushRank },
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
        <span>
          <h3>${escapeHtml(player.name)}</h3>
          <small>${player.pos} / ${player.team} · <b class="tier-badge ${tierClass(tier)}">${escapeHtml(tier)}</b></small>
        </span>
        <button data-action="close-card">Close</button>
      </div>
      <div class="facts">
        ${facts.map(factHtml).join("")}
      </div>
    </div>
  `;
};

const renderAssistant = () => {
  if (!isSleeperDraft) {
    return;
  }
  let root = document.getElementById(ASSISTANT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ASSISTANT_ID;
    root.attachShadow({ mode: "open" });
    document.documentElement.appendChild(root);
  }
  const previousList = root.shadowRoot.querySelector(".list");
  const previousScrollTop = previousList?.scrollTop || 0;
  const players = visiblePlayers();
  const best = players[0];
  root.shadowRoot.innerHTML = `
    <style>${styles}</style>
    <section class="panel ${assistantState.expanded ? "" : "collapsed"}" style="${overlayPositionStyle()}">
      <div class="head" data-drag-handle>
        <span class="title">
          <strong>Draft Assistant</strong>
          <span>${assistantState.loading ? "Loading rankings" : best ? `Best: ${escapeHtml(best.name)}` : "No available players"}</span>
        </span>
        <button data-action="refresh">Refresh</button>
        <button data-action="toggle">${assistantState.expanded ? "Hide" : "Show"}</button>
      </div>
      <div class="toolbar">
        <input value="${escapeHtml(assistantState.search)}" placeholder="Search player">
        <button data-action="open-board">Board</button>
      </div>
      <div class="filters">
        <button data-filter="ALL" class="${assistantState.filters.length === 0 ? "active" : ""}">ALL</button>
        ${POSITIONS.map((pos) => `<button data-filter="${pos}" class="${assistantState.filters.includes(pos) ? "active" : ""}">${pos}</button>`).join("")}
      </div>
      <div class="status ${assistantState.error ? "error" : ""}">
        ${escapeHtml(assistantState.error || assistantState.source)} · ${assistantState.draftedCount} drafted detected${assistantState.draftPicksReady ? "" : " · visible fallback"}
      </div>
      ${cardHtml()}
      <div class="list">
        ${!assistantState.error && players.length === 0 ? `<div class="empty">No available players detected.</div>` : ""}
        ${players.map((player, index) => `
          <div class="row ${index === 0 ? "best" : ""}" data-player="${escapeHtml(player.id)}">
            <span class="rank">${assistantState.players.findIndex((item) => item.id === player.id) + 1}</span>
            <span class="name">
              ${(() => {
                const tier = playerTier(player, assistantState.players.findIndex((item) => item.id === player.id));
                return `<strong>${escapeHtml(player.name)} <b class="tier-badge ${tierClass(tier)}">${escapeHtml(tier)}</b></strong>`;
              })()}
              <span>${player.pos} / ${player.team}</span>
            </span>
            <span class="tag">${index === 0 ? "BEST" : escapeHtml(player.udPick || "")}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
  const nextList = root.shadowRoot.querySelector(".list");
  if (nextList) {
    nextList.scrollTop = previousScrollTop;
  }
  bindAssistant(root.shadowRoot);
};

const bindAssistant = (shadowRoot) => {
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
  shadowRoot.querySelector("input")?.addEventListener("input", (event) => {
    assistantState.search = event.target.value;
    renderAssistant();
  });
  shadowRoot.querySelector("[data-action='toggle']")?.addEventListener("click", () => {
    assistantState.expanded = !assistantState.expanded;
    saveOverlayPrefs();
    renderAssistant();
  });
  shadowRoot.querySelector("[data-action='refresh']")?.addEventListener("click", () => {
    syncRankingsFromBoardTab();
  });
  shadowRoot.querySelector("[data-action='open-board']")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_BOARD" });
  });
  shadowRoot.querySelector("[data-action='close-card']")?.addEventListener("click", () => {
    assistantState.selectedPlayerId = "";
    renderAssistant();
  });
  shadowRoot.querySelectorAll("[data-player]").forEach((row) => {
    row.addEventListener("click", () => {
      assistantState.selectedPlayerId = row.dataset.player;
      renderAssistant();
    });
  });
  const handle = shadowRoot.querySelector("[data-drag-handle]");
  const panel = shadowRoot.querySelector(".panel");
  let drag = null;
  handle?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    assistantState.isDragging = true;
    handle.setPointerCapture(event.pointerId);
  });
  handle?.addEventListener("pointermove", (event) => {
    if (!drag) {
      return;
    }
    assistantState.position = {
      x: Math.max(8, Math.min(event.clientX - drag.dx, window.innerWidth - panel.offsetWidth - 8)),
      y: Math.max(8, Math.min(event.clientY - drag.dy, window.innerHeight - 48)),
    };
    panel.style.left = `${assistantState.position.x}px`;
    panel.style.top = `${assistantState.position.y}px`;
    panel.style.right = "auto";
  });
  const stopDrag = () => {
    if (drag) {
      drag = null;
      assistantState.isDragging = false;
      saveOverlayPrefs();
    }
  };
  handle?.addEventListener("pointerup", stopDrag);
  handle?.addEventListener("pointercancel", stopDrag);
};

const observeDraftPage = () => {
  let queued = false;
  const schedule = () => {
    if (queued) {
      return;
    }
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (assistantState.isDragging) {
        return;
      }
      renderAssistant();
    });
  };
  const fastSchedule = () => {
    schedule();
    requestFastDraftRefresh();
  };
  const observer = new MutationObserver(fastSchedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(schedule, 900);
  setInterval(refreshSleeperDraftPicks, 900);
  window.addEventListener("focus", refreshSleeperDraftPicks);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshSleeperDraftPicks();
    }
  });
};

const initSleeperAssistant = async () => {
  await loadOverlayPrefs();
  renderAssistant();
  await loadStoredDraftPicks();
  await loadRankings();
  await syncRankingsFromBoardTab({ silent: true });
  refreshSleeperDraftPicks();
  fetchTeamProjections().then(renderAssistant);
  loadMarketData().then(renderAssistant);
  observeDraftPage();
};

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
    return true;
  }
  if (message?.type === "SHOW_ASSISTANT") {
    assistantState.expanded = true;
    saveOverlayPrefs();
    renderAssistant();
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "REFRESH_ASSISTANT_RANKINGS") {
    syncRankingsFromBoardTab().then((ok) => sendResponse({ ok }));
    return true;
  }
  return false;
});

if (isSleeperDraft) {
  initSleeperAssistant();
}
