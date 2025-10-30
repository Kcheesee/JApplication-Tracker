import { motion } from 'framer-motion';
import { Job } from '../types/job';
import { Calendar, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  jobs: Job[];
  limit?: number;
}

export function RecentActivity({ jobs, limit = 5 }: RecentActivityProps) {
  // Sort by most recent activity
  const recentJobs = [...jobs]
    .sort((a, b) => {
      const dateA = new Date(a.lastActivity || a.updated_at || a.appliedAt || a.application_date || 0);
      const dateB = new Date(b.lastActivity || b.updated_at || b.appliedAt || b.application_date || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Interview Scheduled':
      case 'Interviewing':
        return { icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' };
      case 'Offer':
      case 'Offer Received':
        return { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'Rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'Applied':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: Briefcase, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getActivityDate = (job: Job) => {
    const date = new Date(job.lastActivity || job.updated_at || job.appliedAt || job.application_date || '');
    return date;
  };

  if (recentJobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

      <div className="space-y-4">
        {recentJobs.map((job, index) => {
          const statusInfo = getStatusIcon(job.status);
          const StatusIcon = statusInfo.icon;
          const activityDate = getActivityDate(job);
          const timeAgo = formatDistanceToNow(activityDate, { addSuffix: true });

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className={`${statusInfo.bg} ${statusInfo.color} p-2 rounded-lg flex-shrink-0`}>
                <StatusIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {job.company}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {job.role || job.position || 'Position not specified'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    job.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    job.status === 'Interviewing' || job.status === 'Interview Scheduled' ? 'bg-green-100 text-green-700' :
                    job.status === 'Offer' || job.status === 'Offer Received' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
