// Service Worker - Background logic

importScripts("agent.js")

// Declare ReasoningAgent assuming it's defined in agent.js
const ReasoningAgent = window.ReasoningAgent

// Initialize agent
const agent = new ReasoningAgent()

// Declare chrome assuming it's part of the global window object in this context
const chrome = window.chrome

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.query && request.mode === "auto") {
    agent
      .reason(request.query)
      .then((result) => {
        sendResponse(result)
      })
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true // Keep channel open for async response
  }
})

console.log("[Gaurav] Background worker initialized")
