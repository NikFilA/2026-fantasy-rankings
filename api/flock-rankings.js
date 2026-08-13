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
        const flockResponse = await fetch("https://api.flockfantasy.com/rankings?format=YEAR&pickType=general", {
            headers: {
                "accept": "application/json",
                "user-agent": "Mozilla/5.0 Fantasy Draft Board"
            }
        });

        if (!flockResponse.ok) {
            response.status(flockResponse.status).json({ error: "Flock request failed" });
            return;
        }

        const payload = await flockResponse.json();
        const rows = Array.isArray(payload)
            ? payload
            : (payload && Array.isArray(payload.data) ? payload.data : []);
        const rankedRows = rows
            .map((player, sourceIndex) => ({
                player,
                sourceIndex,
                rawRank: Number(player.overallAverageRank ?? player.averageRank ?? player.rawFlockRank)
            }))
            .sort((left, right) => {
                const leftHasRank = Number.isFinite(left.rawRank);
                const rightHasRank = Number.isFinite(right.rawRank);
                if (leftHasRank && rightHasRank && left.rawRank !== right.rawRank) {
                    return left.rawRank - right.rawRank;
                }
                if (leftHasRank !== rightHasRank) return leftHasRank ? -1 : 1;
                return left.sourceIndex - right.sourceIndex;
            })
            .map(({ player, rawRank }, index) => ({
                ...player,
                rawFlockRank: Number.isFinite(rawRank) ? rawRank : null,
                flockRank: index + 1,
                listRank: index + 1
            }));

        response.status(200).json(Array.isArray(payload)
            ? rankedRows
            : { ...payload, data: rankedRows });
    } catch (error) {
        response.status(500).json({ error: "Unable to load Flock rankings" });
    }
}
