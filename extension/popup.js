const API_URL = 'http://localhost:8000'

// Get auth token from storage
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token)
    })
  })
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status')
  statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`
  setTimeout(() => {
    statusDiv.innerHTML = ''
  }, 3000)
}

// Show loading
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none'
}

// Check if user is logged in
async function checkAuth() {
  const token = await getToken()
  if (!token) {
    document.getElementById('loginSection').style.display = 'block'
    document.getElementById('captureSection').style.display = 'none'
    return false
  }

  document.getElementById('loginSection').style.display = 'none'
  document.getElementById('captureSection').style.display = 'block'
  return true
}

// Open dashboard
document.getElementById('openDashboard').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: 'http://localhost:3000' })
})

// Go to login
document.getElementById('loginBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/login' })
})

// Capture job from current page
document.getElementById('captureBtn').addEventListener('click', async () => {
  showLoading(true)

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractJobInfo
    })

    const jobData = results[0].result

    // Parse with AI
    const token = await getToken()
    const response = await fetch(`${API_URL}/api/sync/parse-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        job_text: jobData.text,
        job_url: jobData.url
      })
    })

    if (!response.ok) {
      throw new Error('Failed to parse job posting')
    }

    const data = await response.json()
    const parsed = data.data

    // Pre-fill form
    document.getElementById('company').value = parsed.company || ''
    document.getElementById('position').value = parsed.position || ''
    document.getElementById('location').value = parsed.location || ''

    // Show form
    document.getElementById('form').style.display = 'block'
    document.getElementById('captureBtn').style.display = 'none'

  } catch (error) {
    showStatus('Failed to capture job: ' + error.message, 'error')
  } finally {
    showLoading(false)
  }
})

// Function to extract job info from page
function extractJobInfo() {
  return {
    text: document.body.innerText.substring(0, 5000),
    url: window.location.href
  }
}

// Save application
document.getElementById('saveBtn').addEventListener('click', async () => {
  showLoading(true)

  try {
    const token = await getToken()
    const payload = {
      company: document.getElementById('company').value,
      position: document.getElementById('position').value,
      status: document.getElementById('status').value,
      location: document.getElementById('location').value,
      application_date: new Date().toISOString().split('T')[0],
      job_link: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].url
    }

    const response = await fetch(`${API_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to save application')
    }

    showStatus('Application saved successfully!', 'success')

    // Reset form
    document.getElementById('form').style.display = 'none'
    document.getElementById('captureBtn').style.display = 'block'
    document.getElementById('company').value = ''
    document.getElementById('position').value = ''
    document.getElementById('location').value = ''

  } catch (error) {
    showStatus('Failed to save: ' + error.message, 'error')
  } finally {
    showLoading(false)
  }
})

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('form').style.display = 'none'
  document.getElementById('captureBtn').style.display = 'block'
})

// Initialize
checkAuth()
