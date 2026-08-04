const statusNode = document.getElementById("status");

const activeTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
};

const sendRuntimeMessage = (message) => new Promise((resolve) => {
  chrome.runtime.sendMessage(message, (response) => {
    resolve(response || { ok: false, error: chrome.runtime.lastError?.message || "No response." });
  });
});

const loadAISettings = async () => {
  await chrome.storage.local.remove("openAIApiKey");
  const settings = await chrome.storage.local.get(["sleeperUserId"]);
  document.getElementById("sleeperUserId").value = settings.sleeperUserId || "";
};

document.getElementById("openAssistant").addEventListener("click", async () => {
  const tab = await activeTab();
  const result = await sendRuntimeMessage({ type: "OPEN_ASSISTANT", tabId: tab?.id });
  statusNode.textContent = result.ok ? "Assistant shown on this draft tab." : result.error;
});

document.getElementById("refreshRankings").addEventListener("click", async () => {
  statusNode.textContent = "Refreshing rankings...";
  const result = await sendRuntimeMessage({ type: "SYNC_RANKINGS_FROM_BOARD" });
  statusNode.textContent = result.ok
    ? `${result.rankings.source || "Rankings synced"} · ${result.rankings.players.length} players`
    : result.error;
});

document.getElementById("openBoard").addEventListener("click", async () => {
  await sendRuntimeMessage({ type: "OPEN_BOARD" });
  statusNode.textContent = "Opened the full board.";
});

document.getElementById("saveAISettings").addEventListener("click", async () => {
  const sleeperUserId = document.getElementById("sleeperUserId").value.trim();
  await chrome.storage.local.set({ sleeperUserId });
  statusNode.textContent = sleeperUserId
    ? "Sleeper settings saved. AI advice will refresh after the next pick."
    : "A Sleeper user ID is required for roster-aware AI advice.";
});

loadAISettings();
