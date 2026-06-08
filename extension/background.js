const APP_URL = "https://2026-fantasy-rankings.vercel.app/?extension=1";
const APP_TAB_PATTERNS = [
  "https://2026-fantasy-rankings.vercel.app/*",
  "https://*.vercel.app/*",
  "http://localhost:3000/*",
  "http://127.0.0.1:3000/*",
];

const sendTabMessage = (tabId, message) => new Promise((resolve) => {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      resolve({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }
    resolve(response || { ok: false, error: "No response from tab." });
  });
});

const isSupportedDraftTab = (url = "") => {
  try {
    const parsed = new URL(url);
    return /(^|\.)sleeper\.com$/.test(parsed.hostname) && parsed.pathname.includes("/draft/");
  } catch {
    return false;
  }
};

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const ensureAssistantOnTab = async (tabId) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const target = tab?.id === tabId ? tab : await chrome.tabs.get(tabId);
  if (!target?.id || !isSupportedDraftTab(target.url || "")) {
    return { ok: false, error: "Open a Sleeper draft tab, then click Toggle Assistant." };
  }

  const existing = await sendTabMessage(target.id, { type: "SHOW_ASSISTANT" });
  if (existing?.ok) {
    return existing;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      files: ["content.js"],
    });
    await wait(250);
    const injected = await sendTabMessage(target.id, { type: "SHOW_ASSISTANT" });
    return injected?.ok ? injected : { ok: false, error: injected?.error || "Assistant injected, but did not respond yet. Refresh the draft tab and try again." };
  } catch (error) {
    return { ok: false, error: error.message || "Could not inject the assistant on this draft tab." };
  }
};

const findRankingsTabs = async () => {
  const all = await Promise.all(APP_TAB_PATTERNS.map((url) => chrome.tabs.query({ url })));
  return all.flat().filter((tab, index, tabs) => {
    if (!tab.id || tabs.findIndex((item) => item.id === tab.id) !== index) {
      return false;
    }
    try {
      const url = new URL(tab.url || "");
      return (
        url.hostname === "localhost"
        || url.hostname === "127.0.0.1"
        || url.hostname === "2026-fantasy-rankings.vercel.app"
        || (url.hostname.endsWith(".vercel.app") && url.hostname.startsWith("2026-fantasy-rankings"))
      );
    } catch {
      return false;
    }
  });
};

const fetchAppResource = async (url, responseType) => {
  if (!url.startsWith("https://2026-fantasy-rankings.vercel.app/")) {
    return { ok: false, error: "Unsupported resource URL." };
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, error: `${response.status} ${response.statusText}` };
    }
    const value = responseType === "json" ? await response.json() : await response.text();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error.message || "Fetch failed." };
  }
};

const fetchSleeperDraftPicks = async (draftId) => {
  const id = String(draftId || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return { ok: false, error: "Invalid Sleeper draft id." };
  }
  try {
    const response = await fetch(`https://api.sleeper.app/v1/draft/${id}/picks`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: `${response.status} ${response.statusText}` };
    }
    return { ok: true, picks: await response.json() };
  } catch (error) {
    return { ok: false, error: error.message || "Sleeper picks fetch failed." };
  }
};

const syncRankingsFromBoard = async () => {
  const tabs = await findRankingsTabs();
  for (const tab of tabs) {
    let result = await sendTabMessage(tab.id, { type: "EXPORT_RANKINGS" });
    if (!result?.ok) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        await wait(250);
        result = await sendTabMessage(tab.id, { type: "EXPORT_RANKINGS" });
      } catch {
        result = { ok: false };
      }
    }
    if (result?.ok && Array.isArray(result.rankings?.players) && result.rankings.players.length) {
      await chrome.storage.local.set({ assistantRankings: result.rankings });
      return { ok: true, rankings: result.rankings };
    }
  }
  return { ok: false, error: "Open the rankings site, sign in, then click Refresh Rankings." };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OPEN_BOARD") {
    chrome.tabs.create({ url: APP_URL }, () => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "SYNC_RANKINGS_FROM_BOARD") {
    syncRankingsFromBoard().then(sendResponse);
    return true;
  }

  if (message?.type === "FETCH_APP_RESOURCE") {
    fetchAppResource(message.url || "", message.responseType || "text").then(sendResponse);
    return true;
  }

  if (message?.type === "FETCH_SLEEPER_DRAFT_PICKS") {
    fetchSleeperDraftPicks(message.draftId).then(sendResponse);
    return true;
  }

  if (message?.type === "OPEN_ASSISTANT") {
    const tabId = sender.tab?.id || message.tabId;
    if (!tabId) {
      sendResponse({ ok: false, error: "Open a Sleeper draft tab, then click Toggle Assistant." });
      return true;
    }
    ensureAssistantOnTab(tabId).then(sendResponse);
    return true;
  }

  return false;
});
