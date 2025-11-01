export type JobStatus = "Applied" | "Interviewing" | "Offer" | "Rejected" | "Ghosted" | "Interview Scheduled" | "Offer Received" | "Follow-up Needed" | "Other";

export type Job = {
  id: string;
  company: string;
  role: string;
  source: string;
  appliedAt: string;
  status: JobStatus;
  lastActivity: string;
  emailLink: string;
  postingUrl?: string;
  portalUrl?: string;   // single, primary
  description?: string;
  notes?: string;
  resumeLabel?: string; // Legacy - deprecated
  resumeUrl?: string; // Legacy - deprecated
  resume_version?: string; // New: version/label like "Software Engineer V2"
  resume_url?: string; // New: link to resume file
  resume_file_name?: string; // New: original file name
  // Additional fields from our backend
  position?: string; // Alias for role
  application_date?: string; // Backend format
  application_source?: string; // Backend format
  interview_date?: string;
  interview_type?: string;
  location?: string;
  work_mode?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  next_steps?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  benefits?: string;
  company_size?: string;
  industry?: string;
  application_deadline?: string;
  job_link?: string; // Backend format
  interview_questions?: string;
  interview_notes?: string;
  company_research?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
}
