import { Job } from '../types/job';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CalendarIntegration } from './CalendarIntegration';
import { StatusTimeline } from './StatusTimeline';
import { ExternalLink, Mail, Calendar, MapPin, DollarSign, Briefcase, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onEdit: (job: Job) => void;
  onUpdateDescription: (jobId: string, description: string) => Promise<void>;
  onUpdateNotes?: (jobId: string, notes: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Interviewing': 'bg-green-100 text-green-800',
  'Offer': 'bg-purple-100 text-purple-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Ghosted': 'bg-gray-100 text-gray-800',
};

export function JobDetailsDialog({
  open,
  onOpenChange,
  job,
  onEdit,
  onUpdateDescription,
  onUpdateNotes,
}: JobDetailsDialogProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!job) return null;

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      await onUpdateDescription(job.id, descriptionValue);
      setEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditingDescription = () => {
    setDescriptionValue(job.description || '');
    setEditingDescription(true);
  };

  const handleSaveNotes = async () => {
    if (!onUpdateNotes) return;
    setSaving(true);
    try {
      await onUpdateNotes(job.id, notesValue);
      setEditingNotes(false);
    } catch (error) {
      console.error('Error updating notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditingNotes = () => {
    setNotesValue(job.notes || '');
    setEditingNotes(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {job.role}
              </DialogTitle>
              <p className="text-lg text-gray-600 mt-1">{job.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}>
                {job.status}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(job)}
              >
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="interview">Interview Prep</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* URLs Section */}
            <div className="flex flex-wrap gap-2">
              {job.postingUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(job.postingUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Job Posting
                </Button>
              )}
              {job.portalUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(job.portalUrl, '_blank')}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Application Portal
                </Button>
              )}
              {job.emailLink && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(job.emailLink, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Open Email
                </Button>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Applied</p>
                  <p className="text-sm font-medium">
                    {job.appliedAt ? format(new Date(job.appliedAt), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Last Activity</p>
                  <p className="text-sm font-medium">
                    {job.lastActivity ? format(new Date(job.lastActivity), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {job.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{job.location}</p>
                  </div>
                </div>
              )}

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Salary Range</p>
                    <p className="text-sm font-medium">
                      ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {job.source && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="text-sm font-medium">{job.source}</p>
                  </div>
                </div>
              )}

              {job.work_mode && (
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Work Mode</p>
                    <p className="text-sm font-medium">{job.work_mode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Interview Info */}
            {job.interview_date && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Interview Scheduled</p>
                    <p className="text-sm text-green-700 mt-1">
                      {format(new Date(job.interview_date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                    {job.interview_type && (
                      <p className="text-xs text-green-600 mt-1">Type: {job.interview_type}</p>
                    )}
                  </div>
                </div>
                <CalendarIntegration job={job} />
              </div>
            )}

            {/* Recruiter Info */}
            {(job.recruiter_name || job.recruiter_email || job.recruiter_phone) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recruiter Contact</h4>
                <div className="space-y-1 text-sm">
                  {job.recruiter_name && <p><span className="text-gray-500">Name:</span> {job.recruiter_name}</p>}
                  {job.recruiter_email && <p><span className="text-gray-500">Email:</span> {job.recruiter_email}</p>}
                  {job.recruiter_phone && <p><span className="text-gray-500">Phone:</span> {job.recruiter_phone}</p>}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Job Description</h4>
                {!editingDescription && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEditingDescription}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {editingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    rows={8}
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Add job description..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveDescription}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
                  {job.description || 'No description added yet.'}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Notes</h4>
                {!editingNotes && onUpdateNotes && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEditingNotes}
                  >
                    {job.notes ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    rows={6}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this application..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingNotes(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  {job.notes || 'No notes added yet.'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <StatusTimeline applicationId={job.id} />
          </TabsContent>

          <TabsContent value="interview" className="space-y-4">
            {/* Interview Questions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Interview Questions</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {job.interview_questions || 'No interview questions added yet. Add common questions you expect or questions you were asked.'}
              </div>
            </div>

            {/* Interview Notes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Interview Notes</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-green-50 border border-green-200 rounded-lg">
                {job.interview_notes || 'No interview notes yet. Add notes from your interviews here.'}
              </div>
            </div>

            {/* Company Research */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Company Research</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-purple-50 border border-purple-200 rounded-lg">
                {job.company_research || 'No company research added yet. Add notes about the company, culture, products, recent news, etc.'}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => onEdit(job)}
                className="w-full"
              >
                Edit Interview Prep Info
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="resume" className="space-y-4">
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              {job.resume_version || job.resume_url || job.resume_file_name ? (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-indigo-600 mx-auto" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {job.resume_version || 'Resume'}
                    </h4>
                    {job.resume_file_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        {job.resume_file_name}
                      </p>
                    )}
                    {job.resume_url && (
                      <Button
                        onClick={() => window.open(job.resume_url, '_blank')}
                        className="mt-3"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Resume
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    No resume information added for this application
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(job)}
                    className="mt-3"
                  >
                    Add Resume Info
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {(job.benefits || job.company_size || job.industry) && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Additional Information</h4>
                {job.benefits && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Benefits</p>
                    <p className="text-sm text-gray-700">{job.benefits}</p>
                  </div>
                )}
                {job.company_size && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company Size</p>
                    <p className="text-sm text-gray-700">{job.company_size}</p>
                  </div>
                )}
                {job.industry && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Industry</p>
                    <p className="text-sm text-gray-700">{job.industry}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
