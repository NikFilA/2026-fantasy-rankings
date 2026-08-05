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
    response.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");

    try {
        const sleeperResponse = await fetch("https://api.sleeper.app/v1/players/nfl", {
            headers: {
                "accept": "application/json",
                "user-agent": "Fantasy Draft Board"
            }
        });

        if (!sleeperResponse.ok) {
            response.status(sleeperResponse.status).json({ error: "Sleeper players request failed" });
            return;
        }

        const payload = await sleeperResponse.json();
        const players = Object.values(payload)
            .filter((player) => player && ["QB", "RB", "WR", "TE"].includes(player.position))
            .map((player) => ({
                id: player.player_id,
                name: player.full_name || `${player.first_name || ""} ${player.last_name || ""}`.trim(),
                pos: player.position,
                team: player.team
            }))
            .filter((player) => player.id && player.name && player.pos && player.team);

        response.status(200).json(players);
    } catch (error) {
        response.status(500).json({ error: "Unable to load Sleeper players" });
    }
}
