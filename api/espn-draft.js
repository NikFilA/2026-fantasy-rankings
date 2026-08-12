const ESPN_LEAGUE_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues";

const setCorsHeaders = (response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
};

export default async function handler(request, response) {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") {
        response.status(200).end();
        return;
    }
    if (request.method !== "GET") {
        response.status(405).json({ error: "Method not allowed" });
        return;
    }

    const leagueId = String(request.query?.leagueId || "").trim();
    if (!/^\d+$/.test(leagueId)) {
        response.status(400).json({ error: "A valid ESPN League ID is required." });
        return;
    }

    const url = `${ESPN_LEAGUE_BASE}/${encodeURIComponent(leagueId)}?view=mDraftDetail`;
    response.setHeader("Cache-Control", "no-store, max-age=0");
    try {
        const espnResponse = await fetch(url, {
            headers: { accept: "application/json" },
        });
        const body = await espnResponse.text();
        if (!espnResponse.ok) {
            response.status(espnResponse.status).json({
                error: espnResponse.status === 401 || espnResponse.status === 403
                    ? "ESPN league is private or requires authentication."
                    : "ESPN draft request failed.",
                details: body.slice(0, 500),
            });
            return;
        }
        response.status(200).json(JSON.parse(body));
    } catch (error) {
        console.error("[ESPN Draft API Error]", error);
        response.status(500).json({ error: "Unable to load ESPN draft." });
    }
}
