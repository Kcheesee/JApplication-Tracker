import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Job } from '../types/job';
import { format } from 'date-fns';

interface CalendarIntegrationProps {
  job: Job;
}

export function CalendarIntegration({ job }: CalendarIntegrationProps) {
  const generateGoogleCalendarUrl = () => {
    if (!job.interview_date) return null;

    const interviewDate = new Date(job.interview_date);

    // Format date for Google Calendar (yyyyMMddTHHmmss)
    const startTime = format(interviewDate, "yyyyMMdd'T'HHmmss");

    // Default to 1-hour interview
    const endDate = new Date(interviewDate);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = format(endDate, "yyyyMMdd'T'HHmmss");

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Interview: ${job.role || job.position || 'Position'} at ${job.company}`,
      dates: `${startTime}/${endTime}`,
      details: [
        `Company: ${job.company}`,
        `Position: ${job.role || job.position || 'N/A'}`,
        job.interview_type ? `Type: ${job.interview_type}` : '',
        job.recruiter_name ? `Recruiter: ${job.recruiter_name}` : '',
        job.recruiter_email ? `Contact: ${job.recruiter_email}` : '',
        job.job_link ? `Job Posting: ${job.job_link}` : '',
        job.notes ? `\nNotes:\n${job.notes}` : '',
      ].filter(Boolean).join('\n'),
      location: job.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICalFile = () => {
    if (!job.interview_date) return;

    const interviewDate = new Date(job.interview_date);
    const startTime = format(interviewDate, "yyyyMMdd'T'HHmmss");

    const endDate = new Date(interviewDate);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = format(endDate, "yyyyMMdd'T'HHmmss");

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Job Application Tracker//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:Interview: ${job.role || job.position || 'Position'} at ${job.company}`,
      `DESCRIPTION:${[
        `Company: ${job.company}`,
        `Position: ${job.role || job.position || 'N/A'}`,
        job.interview_type ? `Type: ${job.interview_type}` : '',
        job.recruiter_name ? `Recruiter: ${job.recruiter_name}` : '',
        job.recruiter_email ? `Contact: ${job.recruiter_email}` : '',
      ].filter(Boolean).join('\\n')}`,
      job.location ? `LOCATION:${job.location}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(line => line && !line.endsWith(':')).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-${job.company.replace(/\s+/g, '-')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const googleCalendarUrl = generateGoogleCalendarUrl();

  if (!job.interview_date) {
    return (
      <div className="text-sm text-gray-500 italic">
        Add an interview date to enable calendar integration
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>Quick add to your calendar</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Google Calendar */}
        {googleCalendarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(googleCalendarUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              <path fill="#EA4335" d="M5 10h14v2H5z"/>
              <path fill="#FBBC04" d="M5 14h14v2H5z"/>
              <path fill="#34A853" d="M5 18h14v2H5z"/>
            </svg>
            Google Calendar
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        {/* Outlook/Apple Calendar */}
        <Button
          variant="outline"
          size="sm"
          onClick={generateICalFile}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Outlook / Apple Calendar
        </Button>
      </div>

      <div className="text-xs text-gray-500">
        Interview: {format(new Date(job.interview_date), 'PPpp')}
        {job.interview_type && ` • ${job.interview_type}`}
      </div>
    </div>
  );
}
