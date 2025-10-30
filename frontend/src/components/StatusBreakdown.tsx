import { motion } from 'framer-motion';
import { Job } from '../types/job';

interface StatusBreakdownProps {
  jobs: Job[];
}

const statusColors: Record<string, { color: string; bg: string }> = {
  'Applied': { color: 'text-blue-600', bg: 'bg-blue-500' },
  'Interviewing': { color: 'text-green-600', bg: 'bg-green-500' },
  'Interview Scheduled': { color: 'text-green-600', bg: 'bg-green-500' },
  'Offer': { color: 'text-purple-600', bg: 'bg-purple-500' },
  'Offer Received': { color: 'text-purple-600', bg: 'bg-purple-500' },
  'Rejected': { color: 'text-red-600', bg: 'bg-red-500' },
  'Ghosted': { color: 'text-gray-600', bg: 'bg-gray-500' },
  'Follow-up Needed': { color: 'text-yellow-600', bg: 'bg-yellow-500' },
  'Other': { color: 'text-gray-600', bg: 'bg-gray-400' },
};

export function StatusBreakdown({ jobs }: StatusBreakdownProps) {
  // Group jobs by status
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = jobs.length;
  const statuses = Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
        <div className="text-center py-8 text-gray-500">
          No applications yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>

      <div className="space-y-4">
        {statuses.map((item, index) => (
          <motion.div
            key={item.status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{item.status}</span>
              <span className="text-gray-600">
                {item.count} ({Math.round(item.percentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`h-full rounded-full ${statusColors[item.status]?.bg || 'bg-gray-400'}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
