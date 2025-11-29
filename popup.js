document.getElementById("queryInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("searchBtn").click()
  }
})

document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("queryInput").value.trim()

  if (!query) {
    showStatus("Please enter a search query", "error")
    return
  }

  showStatus("Searching...", "loading")

  window.chrome.runtime.sendMessage({ query, mode: "auto" }, (response) => {
    if (window.chrome.runtime.lastError) {
      showStatus("Error: " + window.chrome.runtime.lastError.message, "error")
      return
    }

    if (response && response.best_match) {
      displayResult(response)
    } else {
      showStatus("No results found", "error")
    }
  })
})

function displayResult(result) {
  const resultDiv = document.getElementById("result")
  const statusDiv = document.getElementById("status")

  statusDiv.innerHTML = ""

  document.getElementById("plannerDecision").textContent = result.planner_decision || "unknown"
  document.getElementById("bestMatch").textContent = result.best_match.text || "No match"
  document.getElementById("scoreDisplay").textContent = (result.best_match.score || 0).toFixed(2)
  document.getElementById("sourceDisplay").textContent = result.best_match.source || "local"

  const traceContent = document.getElementById("traceContent")
  traceContent.innerHTML = `
    <div class="trace-item">
      <span class="trace-label">Reasoning:</span>
      <span class="trace-value">${escapeHtml(result.trace.reasoning)}</span>
    </div>
    <div class="trace-item">
      <span class="trace-label">Semantic Scores:</span>
      <span class="trace-value">${JSON.stringify(result.trace.semantic_top_k_scores, null, 2)}</span>
    </div>
    <div class="trace-item">
      <span class="trace-label">Keyword Scores:</span>
      <span class="trace-value">${JSON.stringify(result.trace.keyword_top_k_scores, null, 2)}</span>
    </div>
    <div class="trace-item">
      <span class="trace-label">Latency:</span>
      <span class="trace-value">${result.trace.latency_ms}ms</span>
    </div>
    <div class="trace-item">
      <span class="trace-label">Used Fallback:</span>
      <span class="trace-value">${result.used_fallback_tool ? "Yes" : "No"}</span>
    </div>
  `

  document.getElementById("traceToggle").style.display = "block"
  resultDiv.classList.add("show")
}

document.getElementById("traceToggle").addEventListener("click", () => {
  const tracePanel = document.getElementById("tracePanel")
  tracePanel.classList.toggle("show")
  document.getElementById("traceToggle").textContent = tracePanel.classList.contains("show")
    ? "Hide Trace"
    : "Show Trace"
})

function showStatus(message, type) {
  const statusDiv = document.getElementById("status")

  if (type === "loading") {
    statusDiv.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        ${message}
      </div>
    `
  } else if (type === "error") {
    statusDiv.innerHTML = `<div class="error">${escapeHtml(message)}</div>`
  } else {
    statusDiv.innerHTML = `<div class="success">${escapeHtml(message)}</div>`
  }

  document.getElementById("result").classList.remove("show")
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
