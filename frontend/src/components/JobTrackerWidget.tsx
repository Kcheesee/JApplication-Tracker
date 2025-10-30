import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, RefreshCw, Mail, FileSpreadsheet, Inbox } from 'lucide-react';
import { Job, JobStatus } from '../types/job';
import { QuickStartCard } from './QuickStartCard';
import { JobTable } from './JobTable';
import { AddJobDialog } from './AddJobDialog';
import { JobDetailsDialog } from './JobDetailsDialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { filterJobsUtil } from '../lib/filterJobs';
import apiClient from '../api/client';
import { backendListToFrontend, frontendToBackend } from '../lib/dataMapper';
import toast from 'react-hot-toast';

interface JobTrackerWidgetProps {
  compact?: boolean;
}

export function JobTrackerWidget({ compact = false }: JobTrackerWidgetProps) {
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Connection states
  const [gmailConnected, setGmailConnected] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadJobs();
    checkConnections();
  }, []);

  // Apply filters whenever jobs, search, or filter changes
  useEffect(() => {
    const filtered = filterJobsUtil(jobs, searchQuery, statusFilter);
    setFilteredJobs(filtered);
  }, [jobs, searchQuery, statusFilter]);

  // Load jobs from backend
  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/applications');
      const frontendJobs = backendListToFrontend(response.data);
      setJobs(frontendJobs);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load applications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if services are connected
  const checkConnections = async () => {
    try {
      const response = await apiClient.get('/api/settings');
      setGmailConnected(response.data.has_google_credentials || false);
      setSheetsConnected(response.data.spreadsheet_id ? true : false);
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  // Gmail sync
  const handleGmailSync = async () => {
    setSyncing(true);
    try {
      const response = await apiClient.post('/api/sync/gmail');
      toast.success(
        `Synced! New: ${response.data.new_applications}, Updated: ${response.data.updated_applications}`
      );
      await loadJobs();
    } catch (error: any) {
      console.error('Error syncing Gmail:', error);
      toast.error(error.response?.data?.detail || 'Gmail sync failed. Check your settings.');
    } finally {
      setSyncing(false);
    }
  };

  // Connect Gmail (placeholder)
  const handleConnectGmail = async () => {
    toast('Gmail connection: Please configure Google credentials in Settings', {
      icon: 'ℹ️',
    });
    // In production, this would trigger Google OAuth flow
  };

  // Connect Sheets (placeholder)
  const handleConnectSheets = async () => {
    toast('Sheets connection: Please add Spreadsheet ID in Settings', {
      icon: 'ℹ️',
    });
  };

  // Add/Edit job
  const handleSaveJob = async (jobData: Partial<Job>) => {
    try {
      const backendData = frontendToBackend(jobData);

      if (editingJob) {
        // Update existing
        await apiClient.put(`/api/applications/${editingJob.id}`, backendData);
        toast.success('Application updated!');
      } else {
        // Create new
        await apiClient.post('/api/applications', backendData);
        toast.success('Application added!');
      }

      await loadJobs();
      setEditingJob(null);
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.detail || 'Failed to save application');
      throw error;
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      await apiClient.delete(`/api/applications/${jobId}`);
      toast.success('Application deleted');
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete application');
    }
  };

  // Update status
  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const backendData = frontendToBackend({ ...job, status: newStatus });
      await apiClient.put(`/api/applications/${jobId}`, backendData);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      toast.success('Status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Mark as interviewing
  const handleMarkInterviewing = async (jobId: string) => {
    await handleStatusChange(jobId, 'Interviewing');
  };

  // Open job details
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setDetailsDialogOpen(true);
  };

  // Edit job from details dialog
  const handleEditFromDetails = (job: Job) => {
    setDetailsDialogOpen(false);
    setEditingJob(job);
    setAddDialogOpen(true);
  };

  // Update job description
  const handleUpdateDescription = async (jobId: string, description: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const backendData = frontendToBackend({ ...job, description });
      await apiClient.put(`/api/applications/${jobId}`, backendData);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, description } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, description });
      }
      toast.success('Description updated!');
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
      throw error;
    }
  };

  // Update job notes
  const handleUpdateNotes = async (jobId: string, notes: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const backendData = frontendToBackend({ ...job, notes });
      await apiClient.put(`/api/applications/${jobId}`, backendData);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, notes } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, notes });
      }
      toast.success('Notes updated!');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
      throw error;
    }
  };

  // Open add dialog
  const handleAddNew = () => {
    setEditingJob(null);
    setAddDialogOpen(true);
  };

  // Quick start needed?
  const showQuickStart = jobs.length === 0 && !loading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={compact ? 'w-full max-w-md mx-auto' : 'w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6'}
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Quick Start Cards */}
        {showQuickStart && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickStartCard
                title="Connect Gmail"
                description="Automatically scan your inbox for job applications"
                icon={Mail}
                action="Connect Gmail"
                onClick={handleConnectGmail}
                isConnected={gmailConnected}
                variant={gmailConnected ? 'success' : 'default'}
              />
              <QuickStartCard
                title="Connect Google Sheets"
                description="Export and sync your applications to a spreadsheet"
                icon={FileSpreadsheet}
                action="Connect Sheets"
                onClick={handleConnectSheets}
                isConnected={sheetsConnected}
                variant={sheetsConnected ? 'success' : 'default'}
              />
              <QuickStartCard
                title="Scan Inbox"
                description="Find job applications from your recent emails"
                icon={Inbox}
                action="Scan Now"
                onClick={handleGmailSync}
                disabled={!gmailConnected || syncing}
                variant="warning"
              />
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search company, role, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as JobStatus | "All")}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Interviewing">Interviewing</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Ghosted">Ghosted</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>

          <Button
            onClick={handleGmailSync}
            disabled={syncing || !gmailConnected}
            variant="outline"
            className="w-full sm:w-auto"
            title={gmailConnected ? "Sync from Gmail" : "Connect Gmail first"}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading applications...</p>
          </div>
        )}

        {/* Jobs Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <JobTable
              jobs={filteredJobs}
              onJobClick={handleJobClick}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteJob}
              onMarkInterviewing={handleMarkInterviewing}
            />
          </motion.div>
        )}

        {/* Results count */}
        {!loading && jobs.length > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Showing {filteredJobs.length} of {jobs.length} applications
          </p>
        )}
      </div>

      {/* Dialogs */}
      <AddJobDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveJob}
        editingJob={editingJob}
      />

      <JobDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        job={selectedJob}
        onEdit={handleEditFromDetails}
        onUpdateDescription={handleUpdateDescription}
        onUpdateNotes={handleUpdateNotes}
      />
    </motion.div>
  );
}
