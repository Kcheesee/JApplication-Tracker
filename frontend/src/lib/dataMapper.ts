import { Job, JobStatus } from '../types/job';

// Backend Application type (from API)
interface BackendApplication {
  id: number;
  company: string;
  position: string;
  status: string;
  application_date?: string;
  application_source?: string;
  job_link?: string;
  job_description?: string;
  role_duties?: string;
  notes?: string;
  email_id?: string;
  interview_date?: string;
  interview_type?: string;
  interview_questions?: string;
  interview_notes?: string;
  company_research?: string;
  location?: string;
  work_mode?: string;
  salary_min?: number;
  salary_max?: number;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  benefits?: string;
  company_size?: string;
  industry?: string;
  application_deadline?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
  posting_url?: string;
  portal_url?: string;
}

// Map backend status to frontend status
function mapStatus(backendStatus: string): JobStatus {
  const statusMap: Record<string, JobStatus> = {
    "Applied": "Applied",
    "Interview Scheduled": "Interviewing",
    "Interviewing": "Interviewing",
    "Rejected": "Rejected",
    "Offer Received": "Offer",
    "Offer": "Offer",
    "Ghosted": "Ghosted",
    "Follow-up Needed": "Applied",
    "Other": "Applied"
  };
  return statusMap[backendStatus] || "Applied";
}

// Map frontend status to backend status
function mapStatusReverse(frontendStatus: JobStatus): string {
  const statusMap: Record<JobStatus, string> = {
    "Applied": "Applied",
    "Interviewing": "Interview Scheduled",
    "Rejected": "Rejected",
    "Offer": "Offer Received",
    "Ghosted": "Rejected",
    "Interview Scheduled": "Interview Scheduled",
    "Offer Received": "Offer Received",
    "Follow-up Needed": "Follow-up Needed",
    "Other": "Other"
  };
  return statusMap[frontendStatus] || "Applied";
}

// Construct Gmail deep link from email/thread ID
function constructGmailLink(emailId?: string): string {
  if (!emailId) return "";
  return `https://mail.google.com/mail/u/0/#inbox/${emailId}`;
}

// Extract resume info from notes
function extractResumeLabel(notes?: string): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/Resume:\s*([^\n]+)/i);
  return match ? match[1].trim() : undefined;
}

function extractResumeUrl(notes?: string): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/Resume URL:\s*(https?:\/\/[^\s]+)/i);
  return match ? match[1].trim() : undefined;
}

// Validate URL format
function isValidUrl(url?: string): boolean {
  if (!url) return false;
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Extract portal URL (prefer specific portal URLs over generic job links)
function extractPortalUrl(jobLink?: string, notes?: string): string | undefined {
  // Check notes first for portal URL
  if (notes) {
    const match = notes.match(/Portal:\s*(https?:\/\/[^\s]+)/i);
    if (match) {
      const url = match[1].trim();
      return isValidUrl(url) ? url : undefined;
    }
  }

  // Use job link as fallback if it's valid
  if (jobLink && isValidUrl(jobLink)) {
    return jobLink;
  }

  return undefined;
}

// Combine notes with resume info
function combineNotes(notes?: string, resumeLabel?: string, resumeUrl?: string): string {
  let combined = notes || "";

  if (resumeLabel) {
    combined += combined ? "\n\n" : "";
    combined += `Resume: ${resumeLabel}`;
  }

  if (resumeUrl) {
    combined += combined ? "\n" : "";
    combined += `Resume URL: ${resumeUrl}`;
  }

  return combined;
}

/**
 * Convert backend Application to frontend Job
 */
export function backendToFrontend(app: BackendApplication): Job {
  // Validate and clean job_link
  const validJobLink = isValidUrl(app.job_link) ? app.job_link : undefined;

  return {
    id: app.id.toString(),
    company: app.company,
    role: app.position,
    source: app.application_source || "Email",
    appliedAt: app.application_date || app.created_at || new Date().toISOString().split('T')[0],
    status: mapStatus(app.status),
    lastActivity: app.updated_at || app.created_at || new Date().toISOString(),
    emailLink: constructGmailLink(app.email_id),
    postingUrl: validJobLink,
    portalUrl: extractPortalUrl(validJobLink, app.notes),
    description: app.job_description || app.role_duties,
    notes: app.notes,
    resumeLabel: extractResumeLabel(app.notes),
    resumeUrl: extractResumeUrl(app.notes),
    // Keep additional backend fields
    position: app.position,
    application_date: app.application_date,
    application_source: app.application_source,
    interview_date: app.interview_date,
    interview_type: app.interview_type,
    interview_questions: app.interview_questions,
    interview_notes: app.interview_notes,
    company_research: app.company_research,
    location: app.location,
    work_mode: app.work_mode,
    salary_min: app.salary_min,
    salary_max: app.salary_max,
    recruiter_name: app.recruiter_name,
    recruiter_email: app.recruiter_email,
    recruiter_phone: app.recruiter_phone,
    benefits: app.benefits,
    company_size: app.company_size,
    industry: app.industry,
    application_deadline: app.application_deadline,
    job_link: validJobLink,
    created_at: app.created_at,
    updated_at: app.updated_at,
    user_id: app.user_id,
  };
}

/**
 * Convert frontend Job to backend Application format (for create/update)
 */
export function frontendToBackend(job: Partial<Job>): Partial<BackendApplication> {
  return {
    company: job.company,
    position: job.role || job.position,
    status: job.status ? mapStatusReverse(job.status) : "Applied",
    application_source: job.source || job.application_source,
    application_date: job.appliedAt || job.application_date,
    job_link: job.postingUrl || job.portalUrl || job.job_link,
    job_description: job.description,
    notes: combineNotes(job.notes, job.resumeLabel, job.resumeUrl),
    interview_date: job.interview_date,
    interview_type: job.interview_type,
    location: job.location,
    work_mode: job.work_mode,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    recruiter_name: job.recruiter_name,
    recruiter_email: job.recruiter_email,
    recruiter_phone: job.recruiter_phone,
    benefits: job.benefits,
    company_size: job.company_size,
    industry: job.industry,
    application_deadline: job.application_deadline,
  };
}

/**
 * Convert list of backend applications to frontend jobs
 */
export function backendListToFrontend(apps: BackendApplication[]): Job[] {
  return apps.map(backendToFrontend);
}
