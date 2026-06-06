const statusNode = document.getElementById("status");
const textNode = document.getElementById("draftText");

const activeTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
};

document.getElementById("openAssistant").addEventListener("click", async () => {
  const tab = await activeTab();
  chrome.runtime.sendMessage({ type: "OPEN_ASSISTANT", tabId: tab?.id });
  statusNode.textContent = "Opened the draft board.";
});

document.getElementById("copyDraftText").addEventListener("click", async () => {
  const tab = await activeTab();
  if (!tab?.id) {
    statusNode.textContent = "No active draft tab found.";
    return;
  }
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_DRAFT_TEXT" });
    textNode.value = result?.text || "";
    if (!textNode.value) {
      statusNode.textContent = "No visible draft text found on this page.";
      return;
    }
    await navigator.clipboard.writeText(textNode.value);
    statusNode.textContent = "Draft text copied. Paste it into the board draft input.";
  } catch (error) {
    statusNode.textContent = "Open this popup on a supported draft page, then try again.";
  }
});
