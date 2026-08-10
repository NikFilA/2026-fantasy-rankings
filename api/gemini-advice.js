const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];

const SYSTEM_INSTRUCTION = `You are a High-Stakes Fantasy Football Draft Analyst. Produce specific, decisive advice using only the supplied live draft context.

Evaluate all four dimensions before recommending a player:
1. Roster Construction: compare positions already drafted in user_current_roster/userRoster against starter_slots and positional_needs. Identify filled starters, open starters, and the current build archetype.
2. Tier Breakdown: inspect the custom tier and players_remaining_in_tier data for RB, WR, and TE. Highlight meaningful tier drops likely to occur before user_next_pick.
3. Turn Risk: use current_overall_pick, user_next_pick, picks_until_user_turn, survivalPct/survivalProbability, and opponent needs to explain which targets are likely to be sniped before the return turn. Never invent a percentage or pick count.
4. Value vs Need: compare the recommended player against higher-ranked available players and explicitly explain why this player creates more draft leverage for the current roster—or state clearly when pure board value should win.

The context includes topAvailablePlayers (the user's top 10 undrafted players), user_current_roster, current_overall_pick, user_next_pick, picks_until_user_turn, positional_needs, starter_slots, and upcoming_user_picks. recommended_player must name a player from topAvailablePlayers. Return only one JSON object matching the required schema, with no Markdown or HTML. reasoning should be a detailed but concise 2-4 sentence analysis of roster balance, positional scarcity, alternatives, and draft leverage. turn_risk must begin with High, Medium, or Low and include the exact supplied picks-until-turn value. roster_context must summarize the build and open priorities. Never return placeholders such as "recalculating", "unavailable", or "# -".`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    recommended_player: { type: "STRING" },
    tier: { type: "STRING" },
    reasoning: { type: "STRING" },
    turn_risk: { type: "STRING" },
    roster_context: { type: "STRING" },
  },
  required: ["recommended_player", "tier", "reasoning", "turn_risk", "roster_context"],
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
  reasoning: "[Fallback View] Displaying top projected board value. Full AI strategic analysis will resume once API quota resets. Live draft board pick recommendation is based on top available ADP.",
  turn_risk: "Low",
  roster_context: "Live roster and board tracking remain active while AI quota resets.",
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
      const requiredFields = ["recommended_player", "tier", "reasoning", "turn_risk", "roster_context"];
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
