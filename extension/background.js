// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Tracker extension installed')
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Open popup when triggered from content script
    chrome.action.openPopup()
  }
})

// Listen for web requests to store auth token
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes('/api/auth/login') && details.statusCode === 200) {
      // Extract and store token from response (if available)
      // This is a simplified version - actual implementation may vary
    }
  },
  { urls: ['http://localhost:8000/api/auth/login'] }
)
