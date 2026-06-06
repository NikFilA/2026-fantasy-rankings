const APP_URL = "https://2026-fantasy-rankings.vercel.app/?extension=1";

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "OPEN_ASSISTANT") {
    return false;
  }

  const tabId = sender.tab?.id || message.tabId;
  if (chrome.sidePanel?.open && tabId) {
    chrome.sidePanel.open({ tabId }).then(() => sendResponse({ ok: true })).catch(() => {
      chrome.tabs.create({ url: APP_URL }, () => sendResponse({ ok: true }));
    });
    return true;
  }

  chrome.tabs.create({ url: APP_URL }, () => sendResponse({ ok: true }));
  return true;
});
