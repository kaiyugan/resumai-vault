document.getElementById("importBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  const summaryEl = document.getElementById("summary");

  statusEl.className = "status";
  statusEl.innerText = "Extracting tab DOM content...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found");
    }

    // Execute content script injection
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const clone = document.body.cloneNode(true);
        ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'svg', 'form'].forEach(s => {
          clone.querySelectorAll(s).forEach(e => e.remove());
        });
        const text = clone.innerText || clone.textContent || "";
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        return {
          url: window.location.href,
          pageTitle: document.title,
          cleanText: lines.join("\n")
        };
      }
    });

    statusEl.innerText = "Sending extracted text to API gateway...";

    // Send payload to backend FastAPI API
    const response = await fetch("http://localhost:8090/api/v1/jobs/deconstruct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: "prof-1",
        title: result.pageTitle || "Target Job",
        company: "Target Company",
        raw_description: result.cleanText.substring(0, 4000)
      })
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    statusEl.className = "status success";
    statusEl.innerText = "✅ Job successfully imported & deconstructed!";

    summaryEl.innerHTML = `
      <strong>Role:</strong> ${data.title}<br>
      <strong>Company:</strong> ${data.company}<br>
      <strong>Skills Parsed:</strong> ${data.parsed_hard_skills.length} Hard, ${data.parsed_soft_skills.length} Soft<br>
      <strong>Responsibilities:</strong> ${data.parsed_responsibilities.length} Core Requirements
    `;
  } catch (err) {
    statusEl.className = "status error";
    statusEl.innerText = `❌ Extraction Failed: ${err.message}`;
  }
});
