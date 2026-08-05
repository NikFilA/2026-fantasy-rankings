const SLEEPER_PROJECTIONS_URL = "https://api.sleeper.com/projections/nfl/2026";
const POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

const pickLabel = (adp) => {
    const pick = Math.max(1, Math.round(Number(adp)));
    const round = Math.floor((pick - 1) / 12) + 1;
    const slot = ((pick - 1) % 12) + 1;
    return `${round}.${String(slot).padStart(2, "0")}`;
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
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");

    try {
        const url = new URL(SLEEPER_PROJECTIONS_URL);
        url.searchParams.set("season_type", "regular");
        url.searchParams.set("order_by", "adp_ppr");
        ["QB", "RB", "WR", "TE"].forEach((position) => url.searchParams.append("position[]", position));

        const sleeperResponse = await fetch(url, {
            headers: {
                accept: "application/json",
                "user-agent": "Fantasy Football Rankings ADP Sync",
            },
        });

        if (!sleeperResponse.ok) {
            response.status(sleeperResponse.status).json({ error: "Sleeper ADP request failed" });
            return;
        }

        const payload = await sleeperResponse.json();
        const players = (Array.isArray(payload) ? payload : [])
            .map((row) => {
                const position = String(row.player?.position || "").toUpperCase();
                const adp = Number(row.stats?.adp_ppr);
                return {
                    id: String(row.player_id || ""),
                    name: `${row.player?.first_name || ""} ${row.player?.last_name || ""}`.trim(),
                    team: String(row.player?.team || row.team || "").toUpperCase(),
                    pos: position,
                    adp,
                    pick: pickLabel(adp),
                    updatedAt: row.last_modified || row.updated_at || null,
                };
            })
            .filter((player) => player.id && player.name && POSITIONS.has(player.pos) && Number.isFinite(player.adp) && player.adp < 999);

        response.status(200).json({
            source: SLEEPER_PROJECTIONS_URL,
            updatedAt: new Date().toISOString(),
            players,
        });
    } catch (error) {
        response.status(500).json({ error: "Unable to load Sleeper ADP" });
    }
}
