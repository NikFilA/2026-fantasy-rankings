const BETTINGPROS_API_BASE = "https://api.bettingpros.com/v3";
const BETTINGPROS_SOURCE_URL = "https://www.bettingpros.com/nfl/odds/team-futures/over-under-wins/";
const BETTINGPROS_API_KEY = process.env.BETTINGPROS_API_KEY || "CHi8Hy5CEE4khd46XNYL23dCFX96oUdw6qOt1Dnh";
const SEASON = "2026";
const WIN_TOTAL_MARKET_ID = 123;

const normalizeTeam = (team = "") => {
    const normalized = String(team || "").toUpperCase();
    return ({ JAX: "JAC", JAC: "JAC", WAS: "WSH", WSH: "WSH" })[normalized] || normalized;
};

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

const readWinTotalOffer = (offer) => {
    const team = offer?.participants?.[0]?.team || {};
    const selections = Array.isArray(offer?.selections) ? offer.selections : [];
    const over = selections.find((selection) => selection.selection === "over");
    const under = selections.find((selection) => selection.selection === "under");
    const overLine = bestLine(over);
    const underLine = bestLine(under);
    const line = Number(overLine?.line ?? underLine?.line);
    if (!Number.isFinite(line) || !team.abbreviation) {
        return null;
    }
    return {
        team: normalizeTeam(team.abbreviation),
        name: `${team.city || ""} ${offer?.participants?.[0]?.name || ""}`.trim(),
        marketId: WIN_TOTAL_MARKET_ID,
        key: "wins",
        label: "Season Wins",
        line,
        overCost: Number.isFinite(Number(overLine?.cost)) ? Number(overLine.cost) : null,
        underCost: Number.isFinite(Number(underLine?.cost)) ? Number(underLine.cost) : null,
        updated: overLine?.updated || underLine?.updated || null,
        bookId: overLine?.bookId ?? underLine?.bookId ?? null,
    };
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
        const teams = [];
        let page = 1;
        let totalPages = 1;
        do {
            const payload = await bettingProsFetch(`/offers?market_id=${WIN_TOTAL_MARKET_ID}&sport=NFL&season=${SEASON}&limit=10&page=${page}`);
            totalPages = Number(payload?._pagination?.total_pages) || 1;
            (payload?.offers || []).forEach((offer) => {
                const team = readWinTotalOffer(offer);
                if (team) {
                    teams.push(team);
                }
            });
            page += 1;
        } while (page <= totalPages);

        response.status(200).json({
            source: BETTINGPROS_SOURCE_URL,
            updatedAt: new Date().toISOString(),
            teams: teams.sort((a, b) => a.team.localeCompare(b.team)),
        });
    } catch (error) {
        response.status(500).json({ error: "Unable to load BettingPros team futures" });
    }
}
