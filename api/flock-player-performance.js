export default async function handler(request, response) {
    const playerId = String(request.query.playerId || "");
    const year = String(request.query.year || "2025");

    if (!/^\d+$/.test(playerId) || !/^\d{4}$/.test(year)) {
        response.status(400).json({ error: "playerId and year are required" });
        return;
    }

    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=3600");

    try {
        const flockResponse = await fetch(`https://api.flockfantasy.com/players/card-stats/${playerId}/performance?year=${year}`, {
            headers: {
                "accept": "application/json",
                "user-agent": "Fantasy Draft Board"
            }
        });

        if (!flockResponse.ok) {
            response.status(flockResponse.status).json({ error: "Flock player performance request failed" });
            return;
        }

        const payload = await flockResponse.json();
        response.status(200).json(payload);
    } catch (error) {
        response.status(500).json({ error: "Unable to load Flock player performance" });
    }
}
