const API_BASE = 'http://localhost:8000';

let currentJobData = null;

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status-message');
  statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 3000);
  }
}

// Show extracted data
function displayExtractedData(data) {
  const extractedDiv = document.getElementById('extracted-data');
  extractedDiv.innerHTML = `
    <div class="extracted-info">
      <h3>Extracted Information</h3>
      ${data.company ? `<div class="info-item"><span class="info-label">Company:</span> <span class="info-value">${data.company}</span></div>` : ''}
      ${data.position ? `<div class="info-item"><span class="info-label">Position:</span> <span class="info-value">${data.position}</span></div>` : ''}
      ${data.location ? `<div class="info-item"><span class="info-label">Location:</span> <span class="info-value">${data.location}</span></div>` : ''}
      ${data.salary ? `<div class="info-item"><span class="info-label">Salary:</span> <span class="info-value">${data.salary}</span></div>` : ''}
      ${data.source ? `<div class="info-item"><span class="info-label">Source:</span> <span class="info-value">${data.source}</span></div>` : ''}
    </div>
  `;
}

// Populate form with extracted data
function populateForm(data) {
  document.getElementById('company').value = data.company || '';
  document.getElementById('position').value = data.position || '';
  document.getElementById('location').value = data.location || '';
  document.getElementById('source').value = data.source || 'Other';

  let notes = '';
  if (data.url) notes += `URL: ${data.url}\n\n`;
  if (data.salary) notes += `Salary: ${data.salary}\n\n`;
  if (data.description && data.description.length < 500) {
    notes += `Description: ${data.description}`;
  }

  document.getElementById('notes').value = notes;
}

// Extract job details from current tab
async function extractJobDetails() {
  showStatus('Extracting job details...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractJobDetails'
    });

    if (response && response.success) {
      currentJobData = response.data;
      displayExtractedData(currentJobData);
      populateForm(currentJobData);
      showStatus('Job details extracted successfully!', 'success');
    } else {
      showStatus('Could not extract job details from this page.', 'error');
    }
  } catch (error) {
    console.error('Error extracting job details:', error);
    showStatus('Failed to extract job details. Make sure you are on a job posting page.', 'error');
  }
}

// Save job application
async function saveJobApplication(e) {
  e.preventDefault();

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const jobData = {
    company: document.getElementById('company').value,
    position: document.getElementById('position').value,
    location: document.getElementById('location').value,
    source: document.getElementById('source').value,
    notes: document.getElementById('notes').value,
    job_link: tab.url,
    status: 'Applied',
    application_date: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${API_BASE}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      throw new Error('Failed to save application');
    }

    showStatus('Application saved successfully!', 'success');

    // Reset form after 1 second
    setTimeout(() => {
      document.getElementById('job-form').reset();
      document.getElementById('extracted-data').innerHTML = '';
      extractJobDetails(); // Re-extract in case user wants to add another
    }, 1000);

  } catch (error) {
    console.error('Error saving application:', error);
    showStatus('Failed to save application. Make sure the tracker is running on localhost:8000.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Application';
  }
}

// Event listeners
document.getElementById('job-form').addEventListener('submit', saveJobApplication);
document.getElementById('extract-btn').addEventListener('click', extractJobDetails);

// Auto-extract on popup open
window.addEventListener('DOMContentLoaded', () => {
  extractJobDetails();
});
