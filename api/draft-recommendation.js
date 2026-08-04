const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = "You are an elite fantasy football draft consultant. Analyze the user's draft context payload and league rules. Provide a concise, 2-sentence actionable recommendation on who to target next based on roster needs and tier cliffs.";

const setCorsHeaders = (response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

    if (!process.env.OPENAI_API_KEY) {
        response.status(500).json({ error: "OpenAI API key is not configured" });
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
        const openAIResponse = await fetch(OPENAI_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: JSON.stringify(contextPayload) },
                ],
            }),
        });

        const data = await openAIResponse.json();
        if (!openAIResponse.ok) {
            response.status(openAIResponse.status).json({
                error: data?.error?.message || "OpenAI request failed",
            });
            return;
        }

        const recommendation = data?.choices?.[0]?.message?.content?.trim();
        if (!recommendation) {
            response.status(502).json({ error: "OpenAI returned an empty recommendation" });
            return;
        }

        response.status(200).json({ recommendation });
    } catch (error) {
        response.status(502).json({ error: "Unable to generate a draft recommendation" });
    }
}
