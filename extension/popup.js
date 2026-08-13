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

const sendActiveTabMessage = async (message) => {
  const tab = await activeTab();
  if (!tab?.id) return { ok: false, error: "No active draft tab." };
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "Draft assistant did not respond." });
    });
  });
};

const loadAISettings = async () => {
  await chrome.storage.local.remove("openAIApiKey");
  const settings = await chrome.storage.local.get(["sleeperUserOrSlot", "sleeperUserId"]);
  const saved = String(settings.sleeperUserOrSlot ?? settings.sleeperUserId ?? "").trim();
  const slot = /^([1-9]|1[0-2])$/.test(saved) ? saved : "";
  document.getElementById("sleeperSlotSelect").value = slot;
  document.getElementById("sleeperUserIdInput").value = slot ? "" : saved;
};

const assistantButton = document.getElementById("openAssistant");
let assistantVisible = false;

const updateAssistantButton = (visible) => {
  assistantVisible = Boolean(visible);
  assistantButton.textContent = assistantVisible ? "Close Assistant" : "Show Assistant";
  assistantButton.dataset.visible = String(assistantVisible);
};

const refreshAssistantState = async () => {
  const result = await sendActiveTabMessage({ type: "GET_ASSISTANT_STATE" });
  updateAssistantButton(Boolean(result.ok && result.visible));
};

assistantButton.addEventListener("click", async () => {
  const tab = await activeTab();
  const result = assistantVisible
    ? await sendActiveTabMessage({ type: "CLOSE_ASSISTANT" })
    : await sendRuntimeMessage({ type: "OPEN_ASSISTANT", tabId: tab?.id });
  if (result.ok) {
    updateAssistantButton(Boolean(result.visible));
    statusNode.textContent = assistantVisible
      ? "Assistant shown on this draft tab."
      : "Assistant closed on this draft tab.";
  } else {
    statusNode.textContent = result.error;
  }
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
  const selectedSlot = document.getElementById("sleeperSlotSelect").value;
  const rawUserId = document.getElementById("sleeperUserIdInput").value.trim();
  const sleeperUserOrSlot = selectedSlot ? Number(selectedSlot) : rawUserId;
  await chrome.storage.local.set({ sleeperUserOrSlot });
  await chrome.storage.local.remove("sleeperUserId");
  const update = await sendActiveTabMessage({
    type: "UPDATE_SLEEPER_USER_OR_SLOT",
    sleeperUserOrSlot,
  });
  statusNode.textContent = sleeperUserOrSlot
    ? update.ok
      ? "Sleeper slot setting saved and applied to the active draft."
      : "Setting saved. Open or refresh a Sleeper draft to apply it."
    : "Auto-detect enabled. Add a user ID if Sleeper cannot identify your slot.";
});

loadAISettings();
refreshAssistantState();
