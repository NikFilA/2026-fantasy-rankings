const BETTINGPROS_API_BASE = "https://api.bettingpros.com/v3";
const BETTINGPROS_SOURCE_URL = "https://www.bettingpros.com/nfl/odds/player-futures/";
const BETTINGPROS_API_KEY = process.env.BETTINGPROS_API_KEY || "CHi8Hy5CEE4khd46XNYL23dCFX96oUdw6qOt1Dnh";
const SEASON = "2026";

const FANTASY_MARKETS = [
    { id: 300, key: "passYds", label: "Pass Yds", positions: ["QB"], order: 10 },
    { id: 304, key: "passTd", label: "Pass TD", positions: ["QB"], order: 20 },
    { id: 301, key: "rushYds", label: "Rush Yds", positions: ["QB", "RB"], order: 30 },
    { id: 305, key: "rushTd", label: "Rush TD", positions: ["QB", "RB"], order: 40 },
    { id: 330, key: "rec", label: "Receptions", positions: ["RB", "WR", "TE"], order: 50 },
    { id: 302, key: "recYds", label: "Rec Yds", positions: ["RB", "WR", "TE"], order: 60 },
    { id: 306, key: "recTd", label: "Rec TD", positions: ["RB", "WR", "TE"], order: 70 },
];

const marketById = new Map(FANTASY_MARKETS.map((market) => [market.id, market]));

const normalizeName = (name = "") => String(name)
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, "");

const normalizeTeam = (team = "") => {
    const normalized = String(team || "").toUpperCase();
    return ({ JAX: "JAC", JAC: "JAC", WAS: "WSH", WSH: "WSH" })[normalized] || normalized;
};

const playerKey = (name, team, pos) => `${normalizeName(name)}|${normalizeTeam(team)}|${String(pos || "").toUpperCase()}`;

const bestLine = (selection, preferredBookId = 0) => {
    const books = Array.isArray(selection?.books) ? selection.books : [];
    const preferred = books.find((book) => Number(book.id) === preferredBookId);
    const preferredLine = preferred?.lines?.find((line) => line?.active && !line?.is_off);
    if (preferredLine) {
        return { ...preferredLine, bookId: preferredBookId };
    }
    const activeLines = books.flatMap((book) => (book.lines || [])
        .filter((line) => line?.active && !line?.is_off)
        .map((line) => ({ ...line, bookId: book.id })));
    return activeLines.find((line) => line.best) || activeLines[0] || null;
};

const readOfferProp = (offer, market) => {
    const participant = offer?.participants?.[0];
    const player = participant?.player || {};
    const position = String(player.position || "").toUpperCase();
    if (!market.positions.includes(position)) {
        return null;
    }

    const selections = Array.isArray(offer?.selections) ? offer.selections : [];
    const over = selections.find((selection) => selection.selection === "over");
    const under = selections.find((selection) => selection.selection === "under");
    const overLine = bestLine(over);
    const underLine = bestLine(under);
    const line = Number(overLine?.line ?? underLine?.line);
    if (!Number.isFinite(line)) {
        return null;
    }

    return {
        marketId: market.id,
        key: market.key,
        label: market.label,
        order: market.order,
        line,
        overCost: Number.isFinite(Number(overLine?.cost)) ? Number(overLine.cost) : null,
        underCost: Number.isFinite(Number(underLine?.cost)) ? Number(underLine.cost) : null,
        updated: overLine?.updated || underLine?.updated || null,
        bookId: overLine?.bookId ?? underLine?.bookId ?? null,
        player: {
            id: String(offer.player_id || participant?.id || ""),
            name: participant?.name || `${player.first_name || ""} ${player.last_name || ""}`.trim(),
            team: normalizeTeam(player.team),
            pos: position,
            slug: player.slug || "",
        },
    };
};

const bettingProsFetch = async (path) => {
    const response = await fetch(`${BETTINGPROS_API_BASE}${path}`, {
        headers: {
            "accept": "application/json",
            "x-api-key": BETTINGPROS_API_KEY,
        },
    });
    if (!response.ok) {
        throw new Error(`BettingPros request failed: ${response.status}`);
    }
    return response.json();
};

const fetchMarketOffers = async (market) => {
    const props = [];
    let page = 1;
    let totalPages = 1;
    do {
        const payload = await bettingProsFetch(`/offers?market_id=${market.id}&sport=NFL&season=${SEASON}&limit=10&page=${page}`);
        totalPages = Number(payload?._pagination?.total_pages) || 1;
        (payload?.offers || []).forEach((offer) => {
            const prop = readOfferProp(offer, market);
            if (prop) {
                props.push(prop);
            }
        });
        page += 1;
    } while (page <= totalPages);
    return props;
};

const setCorsHeaders = (response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(request, response) {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
    }
    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

    try {
        const results = await Promise.allSettled(FANTASY_MARKETS.map(fetchMarketOffers));
        const props = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
        const players = new Map();
        props.forEach((prop) => {
            const key = playerKey(prop.player.name, prop.player.team, prop.player.pos);
            if (!players.has(key)) {
                players.set(key, { ...prop.player, key, props: [] });
            }
            players.get(key).props.push({
                marketId: prop.marketId,
                key: prop.key,
                label: prop.label,
                order: prop.order,
                line: prop.line,
                overCost: prop.overCost,
                underCost: prop.underCost,
                updated: prop.updated,
                bookId: prop.bookId,
            });
        });

        response.status(200).json({
            source: BETTINGPROS_SOURCE_URL,
            updatedAt: new Date().toISOString(),
            players: Array.from(players.values()).map((player) => ({
                ...player,
                props: player.props.sort((a, b) => a.order - b.order),
            })),
        });
    } catch (error) {
        response.status(500).json({ error: "Unable to load BettingPros player futures" });
    }
}
