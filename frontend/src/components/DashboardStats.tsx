import { motion } from 'framer-motion';
import { Briefcase, Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Job } from '../types/job';
import { DashboardPreferences } from './DashboardSettings';

interface DashboardStatsProps {
  jobs: Job[];
  preferences: DashboardPreferences;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function DashboardStats({ jobs, preferences }: DashboardStatsProps) {
  // Calculate stats
  const totalApplications = jobs.length;
  const thisWeekApplications = jobs.filter(job => {
    const appliedDate = new Date(job.appliedAt || job.application_date || '');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return appliedDate >= oneWeekAgo;
  }).length;

  const interviewCount = jobs.filter(job =>
    job.status === 'Interviewing' || job.status === 'Interview Scheduled'
  ).length;

  const offerCount = jobs.filter(job =>
    job.status === 'Offer' || job.status === 'Offer Received'
  ).length;

  const rejectedCount = jobs.filter(job => job.status === 'Rejected').length;

  const pendingCount = jobs.filter(job => job.status === 'Applied').length;

  const responseRate = totalApplications > 0
    ? Math.round(((interviewCount + offerCount + rejectedCount) / totalApplications) * 100)
    : 0;

  const successRate = totalApplications > 0
    ? Math.round(((interviewCount + offerCount) / totalApplications) * 100)
    : 0;

  const allStats: (StatCard & { key: keyof DashboardPreferences })[] = [
    {
      key: 'showTotalApps',
      label: 'Total Applications',
      value: totalApplications,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${thisWeekApplications} this week`,
      changeType: 'neutral'
    },
    {
      key: 'showInterviews',
      label: 'Active Interviews',
      value: interviewCount,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: successRate > 0 ? `${successRate}% success rate` : undefined,
      changeType: 'positive'
    },
    {
      key: 'showOffers',
      label: 'Offers Received',
      value: offerCount,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      key: 'showResponseRate',
      label: 'Response Rate',
      value: `${responseRate}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: `${totalApplications - pendingCount} responded`,
      changeType: responseRate > 50 ? 'positive' : 'neutral'
    },
    {
      key: 'showPending',
      label: 'Awaiting Response',
      value: pendingCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      key: 'showRejected',
      label: 'Rejected',
      value: rejectedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const stats = allStats.filter(stat => preferences[stat.key]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs mt-2 ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
