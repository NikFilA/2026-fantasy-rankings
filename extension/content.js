const BUTTON_ID = "ff-draft-assistant-button";

const visibleDraftText = () => {
  const main = document.querySelector("[role='main']") || document.body;
  return (main?.innerText || document.body.innerText || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const injectButton = () => {
  if (document.getElementById(BUTTON_ID)) {
    return;
  }
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "Draft Board";
  Object.assign(button.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    border: "1px solid #38bdf8",
    borderRadius: "8px",
    background: "#111416",
    color: "#eef2f6",
    cursor: "pointer",
    font: "800 12px Inter, system-ui, sans-serif",
    letterSpacing: "0.06em",
    padding: "10px 12px",
    textTransform: "uppercase",
    boxShadow: "0 14px 34px rgba(0, 0, 0, 0.42)",
  });
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_ASSISTANT" });
  });
  document.documentElement.appendChild(button);
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXTRACT_DRAFT_TEXT") {
    sendResponse({ text: visibleDraftText(), url: window.location.href, title: document.title });
    return true;
  }
  return false;
});

injectButton();
