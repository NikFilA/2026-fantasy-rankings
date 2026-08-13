const ESPN_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/3?view=kona_player_info";
const POSITION_BY_ID = { 1: "QB", 2: "RB", 3: "WR", 4: "TE" };
const TEAM_BY_ID = {
    1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET",
    9: "GB", 10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN",
    17: "NE", 18: "NO", 19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC",
    25: "SF", 26: "SEA", 27: "TB", 28: "WSH", 29: "CAR", 30: "JAC", 33: "BAL", 34: "HOU",
};

const getDraftPickString = (rank, leagueSize = 12) => {
    const pick = Math.max(1, Math.round(Number(rank)));
    return `${Math.ceil(pick / leagueSize)}.${String(((pick - 1) % leagueSize) + 1).padStart(2, "0")}`;
};

const setCorsHeaders = (response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
};

export default async function handler(request, response) {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") {
        response.status(200).end();
        return;
    }
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    try {
        const filter = {
            players: {
                filterSlotIds: { value: [0, 2, 4, 6, 16, 17, 23] },
                limit: 500,
                offset: 0,
                sortDraftRanks: { sortPriority: 1, sortAsc: true, value: "PPR" },
                filterRanksForScoringPeriodIds: { value: [1] },
                filterRanksForRankTypes: { value: ["PPR"] },
                filterRanksForSlotIds: { value: [0, 2, 4, 6, 16, 17] },
            },
        };
        const espnResponse = await fetch(ESPN_URL, {
            headers: { accept: "application/json", "x-fantasy-filter": JSON.stringify(filter) },
        });
        if (!espnResponse.ok) {
            response.status(espnResponse.status).json({ error: "ESPN ADP request failed" });
            return;
        }
        const payload = await espnResponse.json();
        const players = (payload.players || []).map((entry) => {
            const player = entry.player || {};
            const adp = Number(player.ownership?.averageDraftPosition);
            const pos = POSITION_BY_ID[player.defaultPositionId] || "";
            return {
                id: String(player.id || entry.id || ""),
                name: player.fullName || `${player.firstName || ""} ${player.lastName || ""}`.trim(),
                team: TEAM_BY_ID[player.proTeamId] || "",
                pos,
                adp,
                pick: "",
                pprRank: Number(player.draftRanksByRankType?.PPR?.rank),
                updatedAt: player.ownership?.date ? new Date(player.ownership.date).toISOString() : null,
            };
        }).filter((player) => player.id && player.name && player.team && player.pos && Number.isFinite(player.adp) && player.adp > 0)
            .sort((a, b) => a.adp - b.adp || a.name.localeCompare(b.name))
            .map((player, index) => ({
                ...player,
                rank: index + 1,
                espnRank: index + 1,
                pick: getDraftPickString(index + 1),
            }));
        response.status(200).json({ source: ESPN_URL, updatedAt: new Date().toISOString(), players });
    } catch (error) {
        response.status(500).json({ error: "Unable to load ESPN ADP" });
    }
}
