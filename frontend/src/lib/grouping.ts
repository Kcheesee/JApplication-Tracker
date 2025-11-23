import { Job, JobStatus } from '../types/job';

export interface CompanyGroup {
  company: string;
  jobs: Job[];
  count: number;
  statusCounts: Record<JobStatus, number>;
  mostRecentActivity: string;
  hasResearch: boolean;
}

/**
 * Group jobs by company name (case-insensitive)
 */
export function groupJobsByCompany(jobs: Job[]): CompanyGroup[] {
  const groupMap = new Map<string, Job[]>();

  // Group jobs by company (case-insensitive)
  jobs.forEach(job => {
    const companyKey = job.company.toLowerCase();
    if (!groupMap.has(companyKey)) {
      groupMap.set(companyKey, []);
    }
    groupMap.get(companyKey)!.push(job);
  });

  // Convert to CompanyGroup array with aggregated data
  const groups: CompanyGroup[] = Array.from(groupMap.entries()).map(([_, companyJobs]) => {
    // Use the company name from the most recent job (preserves capitalization)
    const sortedByActivity = [...companyJobs].sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    // Calculate status counts
    const statusCounts: Record<JobStatus, number> = {
      Applied: 0,
      Interviewing: 0,
      Rejected: 0,
      Offer: 0,
      Ghosted: 0,
      'Interview Scheduled': 0,
      'Offer Received': 0,
      'Follow-up Needed': 0,
      Other: 0,
    };

    companyJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    // Check if any job has research
    const hasResearch = companyJobs.some(job => job.company_research);

    return {
      company: sortedByActivity[0].company, // Use most recent capitalization
      jobs: sortedByActivity, // Already sorted by activity
      count: companyJobs.length,
      statusCounts,
      mostRecentActivity: sortedByActivity[0].lastActivity,
      hasResearch,
    };
  });

  // Sort groups by most recent activity
  return groups.sort((a, b) =>
    new Date(b.mostRecentActivity).getTime() - new Date(a.mostRecentActivity).getTime()
  );
}

/**
 * Get the dominant status for a company group (status with most jobs)
 */
export function getDominantStatus(group: CompanyGroup): JobStatus {
  let maxCount = 0;
  let dominantStatus: JobStatus = 'Applied';

  Object.entries(group.statusCounts).forEach(([status, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantStatus = status as JobStatus;
    }
  });

  return dominantStatus;
}
