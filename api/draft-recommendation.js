const GEMINI_MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = "You are an elite fantasy football draft consultant. Analyze the user's draft context payload and league rules. Provide a concise, 2-sentence actionable recommendation on who to target next based on roster needs, custom tier cliffs, and each target's survivalProbability. Explicitly warn when a preferred player has less than a 25% chance to survive until the user's next turn.";

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

    if (request.method !== "POST") {
        response.setHeader("Allow", "POST, OPTIONS");
        response.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (!process.env.GEMINI_API_KEY) {
        response.status(500).json({ error: "Gemini API key is not configured" });
        return;
    }

    const body = typeof request.body === "string"
        ? (() => {
            try {
                return JSON.parse(request.body);
            } catch {
                return null;
            }
        })()
        : request.body;
    const contextPayload = body?.contextPayload;
    if (!contextPayload || typeof contextPayload !== "object" || Array.isArray(contextPayload)) {
        response.status(400).json({ error: "contextPayload must be an object" });
        return;
    }

    try {
        const geminiUrl = `${GEMINI_MODEL_URL}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
        const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}\n\nContext Payload: ${JSON.stringify(contextPayload)}`,
                    }],
                }],
            }),
        });

        let data;
        try {
            data = await geminiResponse.json();
        } catch {
            response.status(502).json({ error: "Gemini returned an invalid response" });
            return;
        }

        if (!geminiResponse.ok) {
            const isRateLimit = geminiResponse.status === 429
                || data?.error?.status === "RESOURCE_EXHAUSTED";
            response.status(isRateLimit ? 429 : geminiResponse.status).json({
                error: isRateLimit
                    ? "Gemini usage limit reached. Try again after the quota resets."
                    : data?.error?.message || "Gemini request failed",
            });
            return;
        }

        const adviceText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!adviceText) {
            const blockReason = data?.promptFeedback?.blockReason;
            response.status(502).json({
                error: blockReason
                    ? `Gemini blocked the recommendation: ${blockReason}`
                    : "Gemini returned an empty recommendation",
            });
            return;
        }

        response.status(200).json({ recommendation: adviceText });
    } catch {
        response.status(502).json({ error: "Unable to generate a draft recommendation" });
    }
}
