import { motion } from 'framer-motion';
import { Job } from '../types/job';
import { format, subDays, startOfDay } from 'date-fns';

interface ApplicationTimelineProps {
  jobs: Job[];
  days?: number;
}

export function ApplicationTimeline({ jobs, days = 30 }: ApplicationTimelineProps) {
  // Get applications by day for the last N days
  const today = startOfDay(new Date());
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - 1 - i);
    return {
      date,
      dateStr: format(date, 'MMM dd'),
      count: 0,
    };
  });

  // Count applications per day
  jobs.forEach(job => {
    const appliedDate = startOfDay(new Date(job.appliedAt || job.application_date || ''));
    const dayIndex = dateRange.findIndex(d => d.date.getTime() === appliedDate.getTime());
    if (dayIndex !== -1) {
      dateRange[dayIndex].count++;
    }
  });

  const maxCount = Math.max(...dateRange.map(d => d.count), 1);

  // Show only every N days on x-axis for readability
  const showEveryNDays = days > 14 ? 7 : days > 7 ? 3 : 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Activity ({days} days)</h3>

      <div className="space-y-2">
        {/* Chart */}
        <div className="flex items-end justify-between gap-1 h-48">
          {dateRange.map((day, index) => {
            const heightPercentage = (day.count / maxCount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors relative group"
                  style={{ minHeight: day.count > 0 ? '4px' : '0' }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {day.count} app{day.count !== 1 ? 's' : ''}
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t">
          {dateRange.map((day, index) => (
            <div key={index} className="flex-1 text-center">
              {index % showEveryNDays === 0 ? (
                <span className="text-xs text-gray-500 transform -rotate-45 inline-block origin-top-right">
                  {day.dateStr}
                </span>
              ) : (
                <span className="text-xs text-transparent">.</span>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {dateRange.reduce((sum, day) => sum + day.count, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Applications</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {(dateRange.reduce((sum, day) => sum + day.count, 0) / days).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Avg per Day</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {Math.max(...dateRange.map(d => d.count))}
            </p>
            <p className="text-xs text-gray-500">Peak Day</p>
          </div>
        </div>
      </div>
    </div>
  );
}
