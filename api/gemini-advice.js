const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

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

export default async function handler(request, response) {
  setCors(response);
  if (request.method === "OPTIONS") return response.status(200).end();
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[Gemini API Error]:", new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing on server"));
    return response.status(500).json({ error: "Gemini call failed: API key is missing on server" });
  }

  const contextPayload = parseBody(request.body)?.contextPayload;
  if (!contextPayload || typeof contextPayload !== "object" || Array.isArray(contextPayload)) {
    return response.status(400).json({ error: "contextPayload must be an object" });
  }
  const sanitizedContext = sanitizeContextPayload(contextPayload);

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

  try {
    let quotaExhausted = false;
    for (let index = 0; index < GEMINI_MODELS.length; index += 1) {
      const model = GEMINI_MODELS[index];
      const googleUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      let googleResponse;
      let usedSchemaFallback = false;
      try {
        googleResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });
      } catch (error) {
        console.error("[Gemini API Error]:", error);
        return response.status(500).json({
          error: `Gemini call failed: ${error?.message || "Network request to Gemini failed"}`,
          details: error?.message || "Network request to Gemini failed",
        });
      }

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
        try {
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
        } catch (error) {
          console.error("[Gemini API Error]:", error);
          return response.status(500).json({ error: `Gemini call failed: ${error.message}` });
        }
      }

      if (!googleResponse.ok) {
        console.error(`[gemini-advice] ${model} returned ${googleResponse.status}:`, rawBody);
        if (googleResponse.status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
          quotaExhausted = true;
          console.warn(`[gemini-advice] ${model} quota exhausted; trying the next model.`);
          continue;
        }
        const errorMessage = String(data?.error?.message || rawBody || "");
        const modelNotFound = googleResponse.status === 404
          || /model.+not found|not found.+model|not supported for generatecontent/i.test(errorMessage);
        const hasFallback = index < GEMINI_MODELS.length - 1;
        if (modelNotFound && hasFallback) {
          console.warn(`[gemini-advice] Falling back from ${model} to ${GEMINI_MODELS[index + 1]}`);
          continue;
        }
        const upstreamError = data?.error?.message || `Google returned HTTP ${googleResponse.status}`;
        console.error("[Gemini API Error]:", new Error(upstreamError), rawBody);
        return response.status(500).json({
          error: `Gemini call failed: ${upstreamError}`,
          details: rawBody || `Google returned HTTP ${googleResponse.status}`,
          model,
          upstreamStatus: googleResponse.status,
        });
      }

      const rawAdvice = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "").join("").trim();
      if (!rawAdvice) {
        console.error("[Gemini API Error]:", new Error(`${model} returned no candidate text`), rawBody);
        return response.status(500).json({
          error: "Gemini call failed: Gemini returned an empty response",
          details: rawBody || "Gemini returned an empty response",
          model,
        });
      }
      const advice = parseAdviceJson(rawAdvice);
      if (!advice) {
        console.error(`[gemini-advice] ${model} returned invalid structured advice:`, rawAdvice);
        return response.status(500).json({
          error: "Gemini call failed: model returned invalid JSON advice",
          details: rawAdvice,
          model,
        });
      }
      const requiredFields = ["recommendedPlayer", "strategy", "turnRiskAnalysis", "rosterContext"];
      if (!requiredFields.every((field) => typeof advice?.[field] === "string" && advice[field].trim())) {
        console.error("[Gemini API Error]:", new Error(`${model} omitted required advice fields`), rawAdvice);
        return response.status(500).json({
          error: "Gemini call failed: response omitted required advice fields",
          details: rawAdvice,
          model,
        });
      }
      return response.status(200).json({
        analysis: advice,
        ...advice,
        model,
        usedSchemaFallback,
      });
    }
    if (quotaExhausted) {
      const topPlayer = sanitizedContext.topAvailablePlayers?.[0];
      return response.status(200).json({
        is_quota_fallback: true,
        recommended_player: topPlayer?.name || "Best Available",
        tier: "Tier 1 (Fallback)",
        reasoning: "Gemini API rate limit reached (429). Displaying top projected player based on ADP until rate limit window resets (~60s).",
        turn_risk: "Low",
      });
    }
    return response.status(500).json({
      error: "Gemini call failed: no compatible Gemini model was available",
      details: "No compatible Gemini model was available",
    });
  } catch (error) {
    console.error("[Gemini API Error]:", error);
    return response.status(500).json({
      error: `Gemini call failed: ${error?.message || "Unexpected Gemini server error"}`,
      details: error?.message || "Unexpected Gemini server error",
    });
  }
}
