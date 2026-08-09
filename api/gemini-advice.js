const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const SYSTEM_INSTRUCTION = `You are an expert fantasy football draft assistant and an elite, high-stakes Fantasy Football Game Theorist. Do NOT return generic placeholder text. Provide specific, tailored advice comparing the top recommended player to the user's turn odds and team needs. Evaluate the user's live board, custom tiers, roster construction, league limits, positional scarcity, opponent demand, ADP, and turn-survival probabilities. Apply game theory: prioritize scarce positions and high snipe risk over attractive players likely to survive the turn, while recognizing coherent builds such as Hero-RB, Zero-RB, Robust-RB, or WR-WR starts.

The context includes topAvailablePlayers (the user's top 10 undrafted players), user_current_roster, current_overall_pick, user_next_pick, picks_until_user_turn, positional_needs, starter_slots, and upcoming_user_picks. Base every recommendation on these live fields. Explicitly use the roster and turn-distance fields in your reasoning. Never output placeholders such as "recalculating", "unavailable", "# -", or invented values.

Return only a JSON object matching the required schema. recommendedPlayer must name one player from topAvailablePlayers. strategy must be a detailed 2-3 sentence rationale tied to tier, survival odds, and build. turnRiskAnalysis must be a detailed 1-2 sentence explanation of likely positional/player movement before user_next_pick. rosterContext must state the user's current positional focus and roster construction. Never return Markdown, HTML, generic advice, or unsupported claims.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    recommendedPlayer: { type: "STRING" },
    strategy: { type: "STRING" },
    turnRiskAnalysis: { type: "STRING" },
    rosterContext: { type: "STRING" },
  },
  required: ["recommendedPlayer", "strategy", "turnRiskAnalysis", "rosterContext"],
};

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
      maxOutputTokens: 500,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
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

      const rawAdvice = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "").join("").trim();
      if (!rawAdvice) {
        console.error(`[gemini-advice] ${model} returned no candidate text:`, rawBody);
        return response.status(500).json({
          error: "Gemini API call failed",
          details: rawBody || "Gemini returned an empty response",
          model,
        });
      }
      let advice;
      try {
        advice = JSON.parse(rawAdvice.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
      } catch (error) {
        console.error(`[gemini-advice] ${model} returned invalid structured advice:`, rawAdvice);
        return response.status(500).json({
          error: "Gemini returned invalid structured advice",
          details: rawAdvice,
          model,
        });
      }
      const requiredFields = ["recommendedPlayer", "strategy", "turnRiskAnalysis", "rosterContext"];
      if (!requiredFields.every((field) => typeof advice?.[field] === "string" && advice[field].trim())) {
        console.error(`[gemini-advice] ${model} omitted required advice fields:`, rawAdvice);
        return response.status(500).json({
          error: "Gemini response omitted required advice fields",
          details: rawAdvice,
          model,
        });
      }
      return response.status(200).json({
        analysis: advice,
        ...advice,
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
