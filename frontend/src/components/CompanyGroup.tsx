import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, FileText, Calendar, MapPin, Briefcase } from 'lucide-react';
import { CompanyGroup as CompanyGroupType } from '../lib/grouping';
import { Job, JobStatus } from '../types/job';
import { format } from 'date-fns';

interface CompanyGroupProps {
  group: CompanyGroupType;
  onJobClick: (job: Job) => void;
  isDefaultExpanded?: boolean;
}

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-700',
  Interviewing: 'bg-yellow-100 text-yellow-700',
  'Interview Scheduled': 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
  Offer: 'bg-green-100 text-green-700',
  'Offer Received': 'bg-green-100 text-green-700',
  Ghosted: 'bg-gray-100 text-gray-700',
  'Follow-up Needed': 'bg-orange-100 text-orange-700',
  Other: 'bg-purple-100 text-purple-700',
};

const statusBadgeColors: Record<JobStatus, string> = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Interviewing': 'bg-green-100 text-green-800',
  'Offer': 'bg-purple-100 text-purple-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Ghosted': 'bg-gray-100 text-gray-800',
  'Interview Scheduled': 'bg-green-100 text-green-800',
  'Offer Received': 'bg-purple-100 text-purple-800',
  'Follow-up Needed': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800',
};

export function CompanyGroup({ group, onJobClick, isDefaultExpanded = false }: CompanyGroupProps) {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);

  // Get non-zero status counts for display
  const activeStatuses = Object.entries(group.statusCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Company Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
          )}

          {/* Company Icon */}
          <Building2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />

          {/* Company Name */}
          <h3 className="font-semibold text-gray-900 text-left">
            {group.company}
          </h3>

          {/* Application Count Badge */}
          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex-shrink-0">
            {group.count} {group.count === 1 ? 'application' : 'applications'}
          </span>

          {/* Research Indicator */}
          {group.hasResearch && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex-shrink-0"
              title="Company research available"
            >
              <FileText className="h-3 w-3" />
              Research
            </span>
          )}
        </div>

        {/* Status Summary Pills */}
        <div className="flex items-center gap-2 ml-4">
          {activeStatuses.slice(0, 3).map(([status, count]) => (
            <span
              key={status}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {status}: {count}
            </span>
          ))}
          {activeStatuses.length > 3 && (
            <span className="text-xs text-gray-500">
              +{activeStatuses.length - 3} more
            </span>
          )}
        </div>
      </button>

      {/* Expanded Job List */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4 space-y-3">
            {group.jobs.map(job => (
              <div
                key={job.id}
                onClick={() => onJobClick(job)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900 truncate">
                        {job.position || job.role || 'Position Not Specified'}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.application_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Applied {format(new Date(job.application_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    statusBadgeColors[job.status] || 'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
