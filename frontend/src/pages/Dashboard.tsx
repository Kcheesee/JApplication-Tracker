import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/DashboardStats';
import { StatusBreakdown } from '../components/StatusBreakdown';
import { RecentActivity } from '../components/RecentActivity';
import { ApplicationTimeline } from '../components/ApplicationTimeline';
import { GoalTracker } from '../components/GoalTracker';
import { NetworkTracker } from '../components/NetworkTracker';
import { SalaryComparison } from '../components/SalaryComparison';
import { DashboardSettings, DashboardPreferences, DEFAULT_PREFERENCES } from '../components/DashboardSettings';
import { ExportMenu } from '../components/ExportMenu';
import { Job } from '../types/job';
import apiClient from '../api/client';
import { backendToFrontend } from '../lib/dataMapper';
import { TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'dashboard_preferences';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSavePreferences = (newPrefs: DashboardPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/applications?limit=500');
      const mappedJobs = response.data.map(backendToFrontend);
      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGmailSync = async () => {
    setSyncing(true);
    try {
      const response = await apiClient.post('/api/sync/gmail');
      toast.success(
        `Gmail sync complete! New: ${response.data.new_applications}, Updated: ${response.data.updated_applications}`,
        { duration: 5000 }
      );
      await fetchJobs();
    } catch (error: any) {
      console.error('Error syncing Gmail:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to sync Gmail. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track your job search progress and insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGmailSync}
            disabled={syncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </Button>
          <ExportMenu jobs={jobs} />
          <DashboardSettings preferences={preferences} onSave={handleSavePreferences} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <DashboardStats jobs={jobs} preferences={preferences} />

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        {preferences.showStatusBreakdown && <StatusBreakdown jobs={jobs} />}

        {/* Recent Activity */}
        {preferences.showRecentActivity && <RecentActivity jobs={jobs} limit={6} />}
      </div>

      {/* Timeline Chart */}
      {preferences.showTimeline && <ApplicationTimeline jobs={jobs} days={30} />}

      {/* Goal Tracker and Salary Comparison Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalTracker jobs={jobs} />
        <SalaryComparison jobs={jobs} />
      </div>

      {/* Network Tracker */}
      <NetworkTracker />
    </div>
  );
}
