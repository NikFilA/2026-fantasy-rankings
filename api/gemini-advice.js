const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_INSTRUCTION = `You are an elite Fantasy Football Draft Strategist. Evaluate the draft board, roster limits, and turn survival probabilities. Apply Game Theory: prioritize position needs and high snipe risk (low survival %) over high-survival players who can wait until the return turn. Return exactly 3 concise bullet points with HTML formatting (🎯 RECOMMENDED, • Strategy, • Turn Risk / Context).

Return only safe HTML with exactly this structure and no Markdown or code fences:
<div><strong>🎯 RECOMMENDED: Player Name (POS - Tier N)</strong></div>
<div>• <strong>Strategy:</strong> concise reason</div>
<div>• <strong>Turn Risk / Context:</strong> concise survival, opponent, and roster context</div>`;

const setCors = (response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
};

const parseBody = (body) => {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export default async function handler(request, response) {
  setCors(response);
  if (request.method === "OPTIONS") return response.status(200).end();
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return response.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  const contextPayload = parseBody(request.body)?.contextPayload;
  if (!contextPayload || typeof contextPayload !== "object" || Array.isArray(contextPayload)) {
    return response.status(400).json({ error: "contextPayload must be an object" });
  }

  try {
    const geminiResponse = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{
            role: "user",
            parts: [{ text: JSON.stringify(contextPayload) }],
          }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 300,
          },
        }),
      },
    );
    const data = await geminiResponse.json().catch(() => null);
    if (!geminiResponse.ok) {
      const limited = geminiResponse.status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED";
      return response.status(limited ? 429 : 502).json({
        error: limited
          ? "Gemini usage limit reached. Local draft advice remains available."
          : data?.error?.message || "Gemini request failed",
      });
    }
    const adviceHtml = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "").join("").trim();
    if (!adviceHtml) {
      return response.status(502).json({ error: "Gemini returned empty advice" });
    }
    return response.status(200).json({ adviceHtml, recommendation: adviceHtml });
  } catch (error) {
    console.error("[gemini-advice] Gemini request failed", error);
    return response.status(502).json({ error: "Unable to generate Gemini draft advice" });
  }
}
