import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Link as LinkIcon, Code, Copy, Check } from 'lucide-react';
import { Job, JobStatus } from '../types/job';

interface JobScraperProps {
  onJobExtracted: (jobData: Partial<Job>) => void;
}

export function JobScraper({ onJobExtracted }: JobScraperProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const extractJobFromUrl = async () => {
    if (!url.trim()) return;

    setLoading(true);

    try {
      // Try to extract from URL patterns
      const jobData = await scrapeJobDetails(url);
      onJobExtracted(jobData);
    } catch (error) {
      console.error('Error extracting job details:', error);
      alert('Could not automatically extract job details. Please fill in manually.');
    } finally {
      setLoading(false);
      setUrl('');
    }
  };

  const bookmarkletCode = `javascript:(function(){
    const data = {
      company: '',
      position: '',
      location: '',
      description: '',
      salary: '',
      url: window.location.href
    };

    /* LinkedIn */
    if (window.location.hostname.includes('linkedin.com')) {
      data.company = document.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
      data.position = document.querySelector('.topcard__title, .job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || '';
      data.location = document.querySelector('.topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || '';
      data.description = document.querySelector('.description__text, .jobs-description__content')?.textContent?.trim() || '';
      const salaryEl = document.querySelector('.salary, .mt5 .compensation__salary');
      data.salary = salaryEl?.textContent?.trim() || '';
    }

    /* Indeed */
    else if (window.location.hostname.includes('indeed.com')) {
      data.company = document.querySelector('[data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader a')?.textContent?.trim() || '';
      data.position = document.querySelector('.jobsearch-JobInfoHeader-title, h1.icl-u-xs-mb--xs')?.textContent?.trim() || '';
      data.location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle > div:nth-child(2)')?.textContent?.trim() || '';
      data.description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || '';
      const salaryEl = document.querySelector('.salary-snippet, .icl-u-xs-mr--xs');
      data.salary = salaryEl?.textContent?.trim() || '';
    }

    /* Glassdoor */
    else if (window.location.hostname.includes('glassdoor.com')) {
      data.company = document.querySelector('[data-test="employerName"]')?.textContent?.trim() || '';
      data.position = document.querySelector('[data-test="job-title"]')?.textContent?.trim() || '';
      data.location = document.querySelector('[data-test="location"]')?.textContent?.trim() || '';
      data.description = document.querySelector('.desc')?.textContent?.trim() || '';
      const salaryEl = document.querySelector('[data-test="detailSalary"]');
      data.salary = salaryEl?.textContent?.trim() || '';
    }

    /* ZipRecruiter */
    else if (window.location.hostname.includes('ziprecruiter.com')) {
      data.company = document.querySelector('.hiring_company_text a, .job_header_company_name')?.textContent?.trim() || '';
      data.position = document.querySelector('.job_title, h1.job-title')?.textContent?.trim() || '';
      data.location = document.querySelector('.job_location, .location')?.textContent?.trim() || '';
      data.description = document.querySelector('.job_description, .jobDescriptionSection')?.textContent?.trim() || '';
    }

    /* Generic fallback */
    if (!data.company) {
      data.company = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    }
    if (!data.position) {
      data.position = document.querySelector('meta[property="og:title"], title')?.textContent?.trim() || document.title;
    }
    if (!data.description) {
      data.description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    }

    /* Open Job Tracker with extracted data */
    const trackerUrl = window.location.origin + '/applications';
    const params = new URLSearchParams({
      scraped: 'true',
      company: data.company,
      position: data.position,
      location: data.location,
      description: data.description.substring(0, 500),
      salary: data.salary,
      jobUrl: data.url
    });

    window.open(trackerUrl + '?' + params.toString(), '_blank');
  })();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* URL Extraction */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-gray-500" />
          <Label>Extract from Job Posting URL</Label>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste job posting URL (LinkedIn, Indeed, Glassdoor, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && extractJobFromUrl()}
          />
          <Button
            onClick={extractJobFromUrl}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              'Extract'
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Supports: LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more
        </p>
      </div>

      {/* Bookmarklet */}
      <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-indigo-600" />
          <h4 className="font-semibold text-sm">One-Click Bookmarklet</h4>
        </div>
        <p className="text-sm text-gray-600">
          Drag this button to your bookmarks bar, then click it when viewing any job posting to instantly extract details:
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={bookmarkletCode}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm"
            onClick={(e) => e.preventDefault()}
          >
            <LinkIcon className="h-4 w-4" />
            Quick Add Job
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={copyBookmarklet}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Bookmarklet Code
              </>
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How to use:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Drag the "Quick Add Job" button above to your bookmarks bar</li>
            <li>Or copy the code and create a new bookmark manually</li>
            <li>Navigate to any job posting (LinkedIn, Indeed, etc.)</li>
            <li>Click the bookmark to extract job details automatically</li>
            <li>Review and save the extracted information</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Helper function to scrape job details from URL
async function scrapeJobDetails(url: string): Promise<Partial<Job>> {
  // This would ideally use a backend scraping service
  // For now, we'll extract what we can from the URL

  const jobData: Partial<Job> = {
    job_link: url,
    status: 'Applied' as JobStatus,
    appliedAt: new Date().toISOString(),
    application_date: new Date().toISOString(),
  };

  // Extract source from URL
  if (url.includes('linkedin.com')) {
    jobData.source = 'LinkedIn';
  } else if (url.includes('indeed.com')) {
    jobData.source = 'Indeed';
  } else if (url.includes('glassdoor.com')) {
    jobData.source = 'Glassdoor';
  } else if (url.includes('ziprecruiter.com')) {
    jobData.source = 'ZipRecruiter';
  } else if (url.includes('greenhouse.io')) {
    jobData.source = 'Greenhouse';
  } else if (url.includes('lever.co')) {
    jobData.source = 'Lever';
  } else {
    jobData.source = 'Job Board';
  }

  // Note: Real scraping would require a backend service to avoid CORS
  // For now, users should use the bookmarklet for full extraction

  return jobData;
}
