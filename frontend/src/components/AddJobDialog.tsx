import { useState, useEffect } from 'react';
import { Job, JobStatus } from '../types/job';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { JobScraper } from './JobScraper';
import { Separator } from './ui/separator';

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (job: Partial<Job>) => Promise<void>;
  editingJob?: Job | null;
}

export function AddJobDialog({
  open,
  onOpenChange,
  onSave,
  editingJob,
}: AddJobDialogProps) {
  const [formData, setFormData] = useState<Partial<Job>>({
    company: '',
    role: '',
    source: 'Email',
    status: 'Applied',
    appliedAt: new Date().toISOString().split('T')[0],
    postingUrl: '',
    portalUrl: '',
    description: '',
    notes: '',
    resume_version: '',
    resume_url: '',
    resume_file_name: '',
    interview_questions: '',
    interview_notes: '',
    company_research: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setFormData(editingJob);
    } else {
      setFormData({
        company: '',
        role: '',
        source: 'Email',
        status: 'Applied',
        appliedAt: new Date().toISOString().split('T')[0],
        postingUrl: '',
        portalUrl: '',
        description: '',
        notes: '',
        resume_version: '',
        resume_url: '',
        resume_file_name: '',
        interview_questions: '',
        interview_notes: '',
        company_research: '',
      });
    }
  }, [editingJob, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Job, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJobExtracted = (jobData: Partial<Job>) => {
    setFormData(prev => ({ ...prev, ...jobData }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingJob ? 'Edit Application' : 'Add Application'}
          </DialogTitle>
          <DialogDescription>
            {editingJob
              ? 'Update the details of your job application'
              : 'Add a new job application to track'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingJob && (
            <>
              <JobScraper onJobExtracted={handleJobExtracted} />
              <Separator className="my-4" />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <Input
                required
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="e.g., Google"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Input
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value as JobStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Interviewing">Interviewing</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Ghosted">Ghosted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleChange('source', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Indeed">Indeed</SelectItem>
                  <SelectItem value="Company Website">Company Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Recruiter">Recruiter</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applied Date
              </label>
              <Input
                type="date"
                value={formData.appliedAt}
                onChange={(e) => handleChange('appliedAt', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Posting URL
            </label>
            <Input
              type="url"
              value={formData.postingUrl || ''}
              onChange={(e) => handleChange('postingUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Portal URL
            </label>
            <Input
              type="url"
              value={formData.portalUrl || ''}
              onChange={(e) => handleChange('portalUrl', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Direct link to check application status (Greenhouse, Lever, etc.)
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Resume Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Version/Label
                </label>
                <Input
                  value={formData.resume_version || ''}
                  onChange={(e) => handleChange('resume_version', e.target.value)}
                  placeholder="e.g., Software Engineer V2"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  File Name
                </label>
                <Input
                  value={formData.resume_file_name || ''}
                  onChange={(e) => handleChange('resume_file_name', e.target.value)}
                  placeholder="e.g., John_Doe_Resume.pdf"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Resume URL/Link
              </label>
              <Input
                type="url"
                value={formData.resume_url || ''}
                onChange={(e) => handleChange('resume_url', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to Google Drive, Dropbox, or wherever you store your resume
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Paste job description or key details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <Textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any notes about this application..."
            />
          </div>

          {/* Interview Prep Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Interview Preparation</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Questions
              </label>
              <Textarea
                rows={3}
                value={formData.interview_questions || ''}
                onChange={(e) => handleChange('interview_questions', e.target.value)}
                placeholder="Common interview questions, questions you expect, or questions you were asked..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Notes
              </label>
              <Textarea
                rows={3}
                value={formData.interview_notes || ''}
                onChange={(e) => handleChange('interview_notes', e.target.value)}
                placeholder="Notes from your interviews, impressions, key points discussed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Research
              </label>
              <Textarea
                rows={3}
                value={formData.company_research || ''}
                onChange={(e) => handleChange('company_research', e.target.value)}
                placeholder="Research about the company, culture, products, recent news, key facts..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingJob ? 'Update' : 'Add Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
