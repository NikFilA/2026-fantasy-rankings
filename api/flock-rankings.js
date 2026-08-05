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
        response.status(200).json(payload);
    } catch (error) {
        response.status(500).json({ error: "Unable to load Flock rankings" });
    }
}
