const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];

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

const sanitizeObjectArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item !== null && item !== undefined).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.entries(item).map(([key, fieldValue]) => [
      key,
      fieldValue === null || fieldValue === undefined ? "" : fieldValue,
    ]));
  });
};

const sanitizeContextPayload = (payload) => {
  const sanitized = { ...payload };
  sanitized.user_current_roster = sanitizeObjectArray(payload?.user_current_roster);
  sanitized.topAvailablePlayers = sanitizeObjectArray(
    payload?.topAvailablePlayers ?? payload?.top_available_players,
  );
  sanitized.top_available_players = sanitized.topAvailablePlayers;
  sanitized.upcoming_user_picks = Array.isArray(payload?.upcoming_user_picks)
    ? payload.upcoming_user_picks.filter((pick) => pick !== null && pick !== undefined)
    : [];
  sanitized.userRoster = payload?.userRoster && typeof payload.userRoster === "object"
    ? payload.userRoster
    : {};
  sanitized.positional_needs = payload?.positional_needs && typeof payload.positional_needs === "object"
    ? payload.positional_needs
    : {};
  return sanitized;
};

const parseAdviceJson = (rawText) => {
  const clean = String(rawText || "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
};

const boardFallbackAdvice = (context) => ({
  is_quota_fallback: true,
  recommended_player: context?.topAvailablePlayers?.[0]?.name || "Best Available",
  tier: "Tier 1 (Board Rank)",
  reasoning: "Live draft board pick recommendation based on top available ADP.",
  turn_risk: "Low",
});

export default async function handler(request, response) {
  setCors(response);
  if (request.method === "OPTIONS") return response.status(200).end();
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const contextPayload = parseBody(request.body)?.contextPayload;
  if (!contextPayload || typeof contextPayload !== "object" || Array.isArray(contextPayload)) {
    return response.status(400).json({ error: "contextPayload must be an object" });
  }
  const sanitizedContext = sanitizeContextPayload(contextPayload);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[Gemini API Error]:", new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing on server"));
    return response.status(200).json(boardFallbackAdvice(sanitizedContext));
  }

  const generationRequest = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{
      role: "user",
      parts: [{ text: JSON.stringify(sanitizedContext) }],
    }],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
  const requestBody = JSON.stringify(generationRequest);
  const fallbackRequestBody = JSON.stringify({
    ...generationRequest,
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 500,
    },
  });

  for (let index = 0; index < GEMINI_MODELS.length; index += 1) {
    try {
      const model = GEMINI_MODELS[index];
      const googleUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      let googleResponse = await fetch(googleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      let usedSchemaFallback = false;
      let rawBody = await googleResponse.text();
      let data = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        // Preserve the raw Google response below for diagnosis.
      }

      if (!googleResponse.ok && googleResponse.status === 400
        && /schema|responsemime|response_mime|response_schema|invalid argument/i.test(rawBody)) {
        console.warn(`[gemini-advice] ${model} rejected structured output; retrying plain JSON generation.`);
        usedSchemaFallback = true;
        googleResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: fallbackRequestBody,
        });
        rawBody = await googleResponse.text();
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          data = null;
        }
      }

      if (!googleResponse.ok) {
        throw new Error(`${model} returned HTTP ${googleResponse.status}: ${data?.error?.message || rawBody || "Unknown Google error"}`);
      }

      const rawAdvice = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "").join("").trim();
      if (!rawAdvice) {
        throw new Error(`${model} returned no candidate text`);
      }
      const advice = parseAdviceJson(rawAdvice);
      if (!advice) {
        throw new Error(`${model} returned invalid JSON advice: ${rawAdvice}`);
      }
      const requiredFields = ["recommendedPlayer", "strategy", "turnRiskAnalysis", "rosterContext"];
      if (!requiredFields.every((field) => typeof advice?.[field] === "string" && advice[field].trim())) {
        throw new Error(`${model} omitted required advice fields`);
      }
      return response.status(200).json({
        analysis: advice,
        ...advice,
        model,
        usedSchemaFallback,
      });
    } catch (error) {
      console.error(`[Gemini API Error] ${GEMINI_MODELS[index]}:`, error);
    }
  }

  console.warn("[gemini-advice] All Gemini models failed; returning board-rank fallback advice.");
  return response.status(200).json(boardFallbackAdvice(sanitizedContext));
}
