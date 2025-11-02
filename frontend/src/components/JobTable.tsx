import { motion } from 'framer-motion';
import { ExternalLink, Mail, Briefcase, Trash2, CheckSquare, Square } from 'lucide-react';
import { Job, JobStatus } from '../types/job';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { format } from 'date-fns';

interface JobTableProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onDelete: (jobId: string) => void;
  onMarkInterviewing: (jobId: string) => void;
  selectedJobs?: Set<string>;
  onToggleSelect?: (jobId: string) => void;
  onToggleSelectAll?: () => void;
}

const statusColors: Record<JobStatus, string> = {
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

export function JobTable({
  jobs,
  onJobClick,
  onStatusChange,
  onDelete,
  onMarkInterviewing,
  selectedJobs = new Set(),
  onToggleSelect,
  onToggleSelectAll,
}: JobTableProps) {
  const bulkSelectEnabled = onToggleSelect && onToggleSelectAll;
  const allSelected = bulkSelectEnabled && jobs.length > 0 && jobs.every(job => selectedJobs.has(job.id));

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">No applications yet</h3>
        <p className="text-xs text-gray-500">
          Add your first application or sync from Gmail
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {bulkSelectEnabled && (
              <th className="px-3 py-2 w-12">
                <button
                  onClick={onToggleSelectAll}
                  className="flex items-center justify-center w-full hover:text-indigo-600"
                  title={allSelected ? "Deselect all" : "Select all"}
                >
                  {allSelected ? (
                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </th>
            )}
            <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied
            </th>
            <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Activity
            </th>
            <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job, index) => {
            const isSelected = selectedJobs.has(job.id);

            return (
              <motion.tr
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
              >
                {bulkSelectEnabled && (
                  <td className="px-3 py-3 w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(job.id);
                      }}
                      className="flex items-center justify-center w-full hover:text-indigo-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                )}
                <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                <div className="text-xs sm:text-sm font-medium text-gray-900">
                  {job.company}
                </div>
                {job.location && (
                  <div className="text-xs text-gray-500 hidden sm:block">{job.location}</div>
                )}
              </td>
              <td className="px-2 sm:px-3 py-3">
                <button
                  onClick={() => onJobClick(job)}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-900 font-medium text-left"
                >
                  {job.role || <span className="text-gray-400 italic">Not specified</span>}
                </button>
                {job.work_mode && (
                  <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {job.work_mode}
                  </span>
                )}
              </td>
              <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                <Select
                  value={job.status}
                  onValueChange={(value) => onStatusChange(job.id, value as JobStatus)}
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8">
                    <SelectValue>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {job.status}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Ghosted">Ghosted</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                {job.appliedAt ? format(new Date(job.appliedAt), 'MMM d, yyyy') : 'N/A'}
              </td>
              <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                {job.lastActivity ? format(new Date(job.lastActivity), 'MMM d') : 'N/A'}
              </td>
              <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-1">
                  {job.emailLink && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(job.emailLink, '_blank')}
                      title="Open email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {(job.portalUrl || job.postingUrl) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(job.portalUrl || job.postingUrl, '_blank')}
                      title="Open portal"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {job.status !== 'Interviewing' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMarkInterviewing(job.id)}
                      title="Mark as interviewing"
                    >
                      <Briefcase className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(job.id)}
                    title="Delete"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
