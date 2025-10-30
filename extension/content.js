// Content script for detecting job postings
console.log('Job Tracker extension loaded')

// Detect if current page is a job posting
function isJobPosting() {
  const url = window.location.href
  const jobKeywords = ['job', 'career', 'position', 'hiring', 'apply']

  return jobKeywords.some(keyword => url.toLowerCase().includes(keyword))
}

// Add a floating button for quick capture
if (isJobPosting()) {
  const button = document.createElement('div')
  button.id = 'job-tracker-float-btn'
  button.innerHTML = `
    <style>
      #job-tracker-float-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        background: #4F46E5;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      #job-tracker-float-btn:hover {
        background: #4338CA;
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      }
    </style>
    Track This Job
  `

  button.addEventListener('click', () => {
    // Open extension popup
    chrome.runtime.sendMessage({ action: 'openPopup' })
  })

  document.body.appendChild(button)
}
