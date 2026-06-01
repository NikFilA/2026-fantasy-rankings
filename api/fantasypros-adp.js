const FANTASYPROS_ADP_URL = "https://www.fantasypros.com/nfl/adp/best-ball-overall.php";

const decodeHtml = (value = "") => String(value)
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripTags = (value = "") => decodeHtml(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

const pickLabel = (adp) => {
    const pick = Math.max(1, Math.round(Number(adp)));
    const round = Math.floor((pick - 1) / 12) + 1;
    const slot = ((pick - 1) % 12) + 1;
    return `${round}.${slot}`;
};

const parseFantasyProsAdp = (html) => {
    const rows = [];
    const tableMatch = String(html).match(/<table[^>]*id=["']data["'][\s\S]*?<\/table>/i);
    const tableHtml = tableMatch ? tableMatch[0] : String(html);
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    rowMatches.forEach((rowHtml) => {
        const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
        if (cells.length < 9) {
            return;
        }
        const playerCell = cells[1];
        const nameMatch = playerCell.match(/fp-player-name=["']([^"']+)["']/i)
            || playerCell.match(/class=["'][^"']*player-name[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
        const smalls = [...playerCell.matchAll(/<small[^>]*>([\s\S]*?)<\/small>/gi)].map((match) => stripTags(match[1]));
        const name = stripTags(nameMatch?.[1] || "");
        const teamCell = cells.length >= 10 ? cells[2] : smalls[0] || "";
        const posCell = cells.length >= 10 ? cells[3] : cells[2];
        const underdogCell = cells.length >= 10 ? cells[6] : cells[5];
        const team = stripTags(teamCell).replace(/\s*\([^)]*\).*/, "").trim().toUpperCase();
        const pos = stripTags(posCell).replace(/\d+$/, "").toUpperCase();
        const underdog = Number(stripTags(underdogCell));

        if (!name || !team || !pos || !Number.isFinite(underdog)) {
            return;
        }

        rows.push({
            name,
            team,
            pos,
            underdogAdp: underdog,
            underdogPick: pickLabel(underdog),
        });
    });

    return rows;
};

export default async function handler(request, response) {
    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");

    try {
        const fantasyProsResponse = await fetch(FANTASYPROS_ADP_URL, {
            headers: {
                "accept": "text/html,application/xhtml+xml",
                "user-agent": "Fantasy Football Rankings ADP Sync",
            },
        });

        if (!fantasyProsResponse.ok) {
            response.status(fantasyProsResponse.status).json({ error: "FantasyPros ADP request failed" });
            return;
        }

        const html = await fantasyProsResponse.text();
        response.status(200).json({
            source: FANTASYPROS_ADP_URL,
            updatedAt: new Date().toISOString(),
            players: parseFantasyProsAdp(html),
        });
    } catch (error) {
        response.status(500).json({ error: "Unable to load FantasyPros ADP" });
    }
}
