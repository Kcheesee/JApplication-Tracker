// Content script to extract job details from job posting pages

function extractJobDetails() {
  const data = {
    company: '',
    position: '',
    location: '',
    description: '',
    salary: '',
    url: window.location.href,
    source: 'Job Board'
  };

  const hostname = window.location.hostname;

  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    data.source = 'LinkedIn';
    data.company = document.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name a, [data-test-id="company-name"]')?.textContent?.trim() || '';
    data.position = document.querySelector('.topcard__title, .job-details-jobs-unified-top-card__job-title h1, h1.t-24')?.textContent?.trim() || '';
    data.location = document.querySelector('.topcard__flavor--bullet, .job-details-jobs-unified-top-card__primary-description-without-tagline, .t-black--light span')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('.description__text, .jobs-description__content, .show-more-less-html__markup');
    data.description = descriptionEl?.textContent?.trim() || '';

    const salaryEl = document.querySelector('.salary, .mt5 .compensation__salary');
    data.salary = salaryEl?.textContent?.trim() || '';
  }

  // Indeed
  else if (hostname.includes('indeed.com')) {
    data.source = 'Indeed';
    data.company = document.querySelector('[data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader a, .css-1ioi40n')?.textContent?.trim() || '';
    data.position = document.querySelector('.jobsearch-JobInfoHeader-title, h1.icl-u-xs-mb--xs, h1.jobsearch-JobInfoHeader-title span')?.textContent?.trim() || '';
    data.location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle > div:nth-child(2), .css-6z8o9s')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
    data.description = descriptionEl?.textContent?.trim() || '';

    const salaryEl = document.querySelector('.salary-snippet, .icl-u-xs-mr--xs, .attribute_snippet');
    data.salary = salaryEl?.textContent?.trim() || '';
  }

  // Glassdoor
  else if (hostname.includes('glassdoor.com')) {
    data.source = 'Glassdoor';
    data.company = document.querySelector('[data-test="employerName"], .css-87uc0g, .e1tk4kwz4')?.textContent?.trim() || '';
    data.position = document.querySelector('[data-test="job-title"], .css-1j389vi, h1')?.textContent?.trim() || '';
    data.location = document.querySelector('[data-test="location"], .css-1v5elnn, .location')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('.desc, .jobDescriptionContent, [data-test="description"]');
    data.description = descriptionEl?.textContent?.trim() || '';

    const salaryEl = document.querySelector('[data-test="detailSalary"], .salaryRange');
    data.salary = salaryEl?.textContent?.trim() || '';
  }

  // ZipRecruiter
  else if (hostname.includes('ziprecruiter.com')) {
    data.source = 'ZipRecruiter';
    data.company = document.querySelector('.hiring_company_text a, .job_header_company_name, h2 a')?.textContent?.trim() || '';
    data.position = document.querySelector('.job_title, h1.job-title, h1')?.textContent?.trim() || '';
    data.location = document.querySelector('.job_location, .location, .hiring_location')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('.job_description, .jobDescriptionSection');
    data.description = descriptionEl?.textContent?.trim() || '';
  }

  // Lever
  else if (hostname.includes('lever.co')) {
    data.source = 'Lever';
    data.company = document.querySelector('.main-header-text-link, .company-name')?.textContent?.trim() || '';
    data.position = document.querySelector('.posting-headline h2, .title')?.textContent?.trim() || '';
    data.location = document.querySelector('.location, .posting-categories .location')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('.content .section-wrapper, .posting-description');
    data.description = descriptionEl?.textContent?.trim() || '';
  }

  // Greenhouse
  else if (hostname.includes('greenhouse.io')) {
    data.source = 'Greenhouse';
    data.company = document.querySelector('.company-name, header a')?.textContent?.trim() || '';
    data.position = document.querySelector('.app-title, h1.app-title')?.textContent?.trim() || '';
    data.location = document.querySelector('.location, .app-title + div')?.textContent?.trim() || '';

    const descriptionEl = document.querySelector('#content, .content');
    data.description = descriptionEl?.textContent?.trim() || '';
  }

  // Generic fallback
  if (!data.company) {
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    data.company = ogSiteName?.getAttribute('content') || '';
  }

  if (!data.position) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    data.position = ogTitle?.getAttribute('content') || document.title || '';
  }

  if (!data.description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    data.description = metaDesc?.getAttribute('content') || '';
  }

  // Truncate description to 1000 characters
  if (data.description && data.description.length > 1000) {
    data.description = data.description.substring(0, 1000) + '...';
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobDetails') {
    const jobData = extractJobDetails();
    sendResponse({ success: true, data: jobData });
  }
  return true;
});

// Auto-detect and show badge when on a job posting page
const jobData = extractJobDetails();
if (jobData.company && jobData.position) {
  chrome.runtime.sendMessage({
    action: 'jobDetected',
    data: jobData
  });
}
