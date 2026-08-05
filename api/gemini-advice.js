const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const SYSTEM_INSTRUCTION = `You are an elite, high-stakes Fantasy Football Game Theorist. Evaluate the user's live board, custom tiers, roster construction, league limits, positional scarcity, opponent demand, ADP, and turn-survival probabilities. Apply game theory: prioritize scarce positions and high snipe risk over attractive players likely to survive the turn, while recognizing coherent builds such as Hero-RB, Zero-RB, Robust-RB, or WR-WR starts.

Return exactly 3 short, punchy, high-impact HTML bullet lines. Use the supplied numbers explicitly; never invent a metric. The three lines must cover:
1. Recommended Target & Tier.
2. Turn Risk / positional drop-off, including the most decision-relevant survival percentage.
3. Roster Synergy & Draft Strategy, tied to the user's current construction.

Return only safe HTML with exactly this structure and no Markdown or code fences:
<div><strong>🎯 RECOMMENDED: Player Name (POS - Tier N)</strong></div>
<div>• <strong>Turn Risk / Drop-off:</strong> concise metric-driven risk</div>
<div>• <strong>Roster Synergy / Strategy:</strong> concise construction advice</div>`;

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
    console.error("[gemini-advice] GEMINI_API_KEY is missing on server");
    return response.status(500).json({ error: "GEMINI_API_KEY is missing on server" });
  }

  const contextPayload = parseBody(request.body)?.contextPayload;
  if (!contextPayload || typeof contextPayload !== "object" || Array.isArray(contextPayload)) {
    return response.status(400).json({ error: "contextPayload must be an object" });
  }

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{
      role: "user",
      parts: [{ text: JSON.stringify(contextPayload) }],
    }],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 300,
    },
  });

  try {
    for (let index = 0; index < GEMINI_MODELS.length; index += 1) {
      const model = GEMINI_MODELS[index];
      const googleUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
      let googleResponse;
      try {
        googleResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });
      } catch (error) {
        console.error(`[gemini-advice] Network failure calling ${model}:`, error);
        return response.status(500).json({
          error: "Gemini API call failed",
          details: error?.message || "Network request to Gemini failed",
        });
      }

      const rawBody = await googleResponse.text();
      let data = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        // Preserve the raw Google response below for diagnosis.
      }

      if (!googleResponse.ok) {
        console.error(`[gemini-advice] ${model} returned ${googleResponse.status}:`, rawBody);
        const errorMessage = String(data?.error?.message || rawBody || "");
        const modelNotFound = googleResponse.status === 404
          || /model.+not found|not found.+model|not supported for generatecontent/i.test(errorMessage);
        const hasFallback = index < GEMINI_MODELS.length - 1;
        if (modelNotFound && hasFallback) {
          console.warn(`[gemini-advice] Falling back from ${model} to ${GEMINI_MODELS[index + 1]}`);
          continue;
        }
        return response.status(500).json({
          error: "Gemini API call failed",
          details: rawBody || `Google returned HTTP ${googleResponse.status}`,
          model,
          upstreamStatus: googleResponse.status,
        });
      }

      const adviceHtml = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "").join("").trim();
      if (!adviceHtml) {
        console.error(`[gemini-advice] ${model} returned no candidate text:`, rawBody);
        return response.status(500).json({
          error: "Gemini API call failed",
          details: rawBody || "Gemini returned an empty response",
          model,
        });
      }
      return response.status(200).json({
        analysis: adviceHtml,
        adviceHtml,
        recommendation: adviceHtml,
        model,
      });
    }
    return response.status(500).json({
      error: "Gemini API call failed",
      details: "No compatible Gemini model was available",
    });
  } catch (error) {
    console.error("[gemini-advice] Unexpected handler failure:", error);
    return response.status(500).json({
      error: "Gemini API call failed",
      details: error?.message || "Unexpected Gemini server error",
    });
  }
}
