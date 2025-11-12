import { useState } from 'react';
import { Job } from '../types/job';
import { format, subDays, startOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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

  // Prepare data for Recharts
  const chartData = dateRange.map(d => ({
    date: d.dateStr,
    applications: d.count
  }));

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
        {/* Line Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={days > 30 ? Math.floor(days / 10) : days > 14 ? 3 : 1}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
