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
    const playerId = String(request.query.playerId || "");

    if (!/^\d+$/.test(playerId)) {
        response.status(400).json({ error: "playerId is required" });
        return;
    }

    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=3600");

    try {
        const flockResponse = await fetch(`https://api.flockfantasy.com/players/card-stats/${playerId}/yearly`, {
            headers: {
                "accept": "application/json",
                "user-agent": "Fantasy Draft Board"
            }
        });

        if (!flockResponse.ok) {
            response.status(flockResponse.status).json({ error: "Flock yearly stats request failed" });
            return;
        }

        const payload = await flockResponse.json();
        response.status(200).json(payload);
    } catch (error) {
        response.status(500).json({ error: "Unable to load Flock yearly stats" });
    }
}
