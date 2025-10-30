import { Job } from '../types/job';
import { format } from 'date-fns';

export function exportToCSV(jobs: Job[], filename = 'job-applications.csv') {
  // Define CSV headers
  const headers = [
    'Company',
    'Position',
    'Status',
    'Applied Date',
    'Last Activity',
    'Source',
    'Location',
    'Work Mode',
    'Salary Min',
    'Salary Max',
    'Salary Currency',
    'Interview Date',
    'Interview Type',
    'Recruiter Name',
    'Recruiter Email',
    'Recruiter Phone',
    'Job Link',
    'Portal URL',
    'Resume Version',
    'Notes',
    'Next Steps',
    'Industry',
    'Company Size',
  ];

  // Convert jobs to CSV rows
  const rows = jobs.map(job => [
    job.company || '',
    job.role || job.position || '',
    job.status || '',
    job.appliedAt ? format(new Date(job.appliedAt), 'yyyy-MM-dd') : '',
    job.lastActivity ? format(new Date(job.lastActivity), 'yyyy-MM-dd') : '',
    job.source || job.application_source || '',
    job.location || '',
    job.work_mode || '',
    job.salary_min || '',
    job.salary_max || '',
    job.salary_currency || 'USD',
    job.interview_date ? format(new Date(job.interview_date), 'yyyy-MM-dd HH:mm') : '',
    job.interview_type || '',
    job.recruiter_name || '',
    job.recruiter_email || '',
    job.recruiter_phone || '',
    job.postingUrl || job.job_link || '',
    job.portalUrl || '',
    job.resume_version || '',
    job.notes ? `"${job.notes.replace(/"/g, '""')}"` : '', // Escape quotes
    job.next_steps ? `"${job.next_steps.replace(/"/g, '""')}"` : '',
    job.industry || '',
    job.company_size || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(jobs: Job[], filename = 'job-applications.json') {
  const jsonContent = JSON.stringify(jobs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePDFReport(jobs: Job[]): string {
  // Generate HTML content for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Job Application Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
    .stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 30px 0; }
    .stat-card { background: #F3F4F6; padding: 20px; border-radius: 8px; flex: 1; min-width: 200px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1F2937; }
    .stat-label { color: #6B7280; font-size: 14px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { background: #4F46E5; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    tr:hover { background: #F9FAFB; }
    .status-applied { color: #2563EB; font-weight: 500; }
    .status-interviewing { color: #059669; font-weight: 500; }
    .status-offer { color: #7C3AED; font-weight: 500; }
    .status-rejected { color: #DC2626; font-weight: 500; }
    .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Job Application Report</h1>
  <p>Generated on ${format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</p>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${jobs.length}</div>
      <div class="stat-label">Total Applications</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${jobs.filter(j => j.status === 'Interviewing' || j.status === 'Interview Scheduled').length}</div>
      <div class="stat-label">Active Interviews</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${jobs.filter(j => j.status === 'Offer' || j.status === 'Offer Received').length}</div>
      <div class="stat-label">Offers Received</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${jobs.filter(j => j.status === 'Rejected').length}</div>
      <div class="stat-label">Rejected</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Company</th>
        <th>Position</th>
        <th>Status</th>
        <th>Applied Date</th>
        <th>Location</th>
      </tr>
    </thead>
    <tbody>
      ${jobs.map(job => `
        <tr>
          <td><strong>${job.company}</strong></td>
          <td>${job.role || job.position || 'N/A'}</td>
          <td class="status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</td>
          <td>${job.appliedAt ? format(new Date(job.appliedAt), 'MM/dd/yyyy') : 'N/A'}</td>
          <td>${job.location || 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Generated by Job Application Tracker
  </div>
</body>
</html>
  `;

  return html;
}

export function printPDFReport(jobs: Job[]) {
  const html = generatePDFReport(jobs);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
