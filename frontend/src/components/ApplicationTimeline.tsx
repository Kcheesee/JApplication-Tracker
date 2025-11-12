import { useState } from 'react';
import { motion } from 'framer-motion';
import { Job } from '../types/job';
import { format, subDays, startOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ApplicationTimelineProps {
  jobs: Job[];
  days?: number;
}

export function ApplicationTimeline({ jobs, days: initialDays = 30 }: ApplicationTimelineProps) {
  const [days, setDays] = useState(initialDays);
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
  const countsWithData = dateRange.filter(d => d.count > 0).map(d => d.count);
  const minCount = countsWithData.length > 0 ? Math.min(...countsWithData) : 0;

  // Calculate variance to determine if we need baseline adjustment
  const variance = maxCount - minCount;

  // Use a baseline that creates better visual contrast
  // If variance is low (all bars similar height), use a more aggressive baseline
  let baseline = 0;
  if (maxCount > 1 && variance < 5) {
    // Low variance: subtract most of the minimum to create contrast
    // For example: 15,16,17,18,19 → subtract 14 → 1,2,3,4,5 (much better contrast!)
    baseline = Math.floor(minCount * 0.9);
  } else if (maxCount > 5 && variance >= 5) {
    // Normal variance: use 30% baseline
    baseline = Math.ceil(maxCount * 0.3);
  }

  const effectiveMax = Math.max(maxCount - baseline, 1); // Prevent division by zero

  // Debug logging
  console.log('Timeline Debug:', {
    maxCount,
    minCount,
    variance,
    baseline,
    effectiveMax,
    totalApplications: dateRange.reduce((sum, d) => sum + d.count, 0),
    daysWithData: countsWithData.length
  });

  // Show only every N days on x-axis for readability
  const showEveryNDays = days > 14 ? 7 : days > 7 ? 3 : 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Application Activity</h3>
        <Select value={days.toString()} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {/* Chart */}
        <div className="flex items-end justify-between gap-1 h-48">
          {dateRange.map((day, index) => {
            // Calculate height with baseline subtraction for better visual contrast
            const adjustedCount = Math.max(day.count - baseline, 0);
            let heightPercentage = effectiveMax > 0 ? (adjustedCount / effectiveMax) * 100 : 0;

            // Ensure bars with data are visible: minimum 2% height for visibility
            // But still maintain relative differences between bars
            if (day.count > 0 && heightPercentage < 2) {
              heightPercentage = 2;
            }

            // Debug first few bars
            if (index < 3 || day.count > 0) {
              console.log(`Day ${index} (${day.dateStr}):`, {
                count: day.count,
                adjustedCount,
                heightPercentage,
                minHeight: day.count > 0 ? '8px' : '0'
              });
            }

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  style={{ minHeight: day.count > 0 ? '8px' : '0' }}
                  className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors relative group"
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
