// Content Script: Extracts DOM content from active job posting tab
function extractJobPostingDOM() {
  const clone = document.body.cloneNode(true);

  // Remove non-content tags
  const stripSelectors = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'svg', 'form', 'iframe'];
  stripSelectors.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove());
  });

  const rawText = clone.innerText || clone.textContent || "";
  const lines = rawText.split("\n").map(l => l.strip ? l.strip() : l.trim()).filter(l => l.length > 0);

  return {
    url: window.location.href,
    pageTitle: document.title,
    cleanText: lines.join("\n")
  };
}

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_DOM") {
    const data = extractJobPostingDOM();
    sendResponse(data);
  }
  return true;
});
