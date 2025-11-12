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
import { ExternalLink, Mail, Calendar, MapPin, DollarSign, Briefcase, FileText, Search, Building, TrendingUp, Users, Code, Lightbulb, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

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

interface CompanyResearch {
  overview: string;
  recent_news: string[];
  culture: {
    work_environment: string;
    values: string;
    benefits: string[];
  };
  tech_stack: string[];
  interview_tips: {
    talking_points: string[];
    questions_to_ask: string[];
  };
  quick_facts: {
    employee_count: string;
    glassdoor_rating: string;
    funding: string;
    notable_clients: string[];
  };
}

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

  // Company research state
  const [researchLoading, setResearchLoading] = useState(false);
  const [companyResearch, setCompanyResearch] = useState<CompanyResearch | null>(null);

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

  const handleResearchCompany = async () => {
    setResearchLoading(true);
    try {
      const response = await apiClient.post(`/api/applications/${job.id}/research-company`);

      if (response.data.success) {
        setCompanyResearch(response.data.research);
        toast.success('Company research completed!');
      } else {
        toast.error(response.data.error || 'Failed to research company');
      }
    } catch (error: any) {
      console.error('Error researching company:', error);
      toast.error(error.response?.data?.detail || 'Failed to research company');
    } finally {
      setResearchLoading(false);
    }
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

            {/* Company Research - AI-Powered */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Research
                </h4>
                <Button
                  size="sm"
                  onClick={handleResearchCompany}
                  disabled={researchLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {researchLoading ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Research Company
                    </>
                  )}
                </Button>
              </div>

              {!companyResearch ? (
                <div className="text-sm text-gray-600 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg text-center">
                  <Building className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                  <p className="font-medium mb-1">Get AI-Powered Company Insights</p>
                  <p className="text-xs mb-3">
                    Click "Research Company" to get comprehensive interview prep including company overview, culture, recent news, and interview tips.
                  </p>
                  <p className="text-xs text-purple-600">
                    ⚡ Powered by your preferred LLM
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Company Overview */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                      <h5 className="font-semibold text-blue-900">Overview</h5>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{companyResearch.overview}</p>
                  </div>

                  {/* Recent News */}
                  {companyResearch.recent_news && companyResearch.recent_news.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        <h5 className="font-semibold text-green-900">Recent News & Developments</h5>
                      </div>
                      <ul className="space-y-1">
                        {companyResearch.recent_news.map((news, idx) => (
                          <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{news}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Culture & Values */}
                  {companyResearch.culture && (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                        <h5 className="font-semibold text-amber-900">Culture & Values</h5>
                      </div>
                      <div className="space-y-2 text-sm text-amber-800">
                        {companyResearch.culture.work_environment && (
                          <p><span className="font-medium">Environment:</span> {companyResearch.culture.work_environment}</p>
                        )}
                        {companyResearch.culture.values && (
                          <p><span className="font-medium">Values:</span> {companyResearch.culture.values}</p>
                        )}
                        {companyResearch.culture.benefits && companyResearch.culture.benefits.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Benefits:</p>
                            <div className="flex flex-wrap gap-2">
                              {companyResearch.culture.benefits.map((benefit, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {companyResearch.tech_stack && companyResearch.tech_stack.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Code className="h-5 w-5 text-slate-600 mt-0.5" />
                        <h5 className="font-semibold text-slate-900">Tech Stack</h5>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {companyResearch.tech_stack.map((tech, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-slate-100 text-slate-800 font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Tips */}
                  {companyResearch.interview_tips && (
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
                        <h5 className="font-semibold text-purple-900">Interview Preparation Tips</h5>
                      </div>
                      <div className="space-y-3">
                        {companyResearch.interview_tips.talking_points && companyResearch.interview_tips.talking_points.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-800 mb-1">Key Talking Points:</p>
                            <ul className="space-y-1">
                              {companyResearch.interview_tips.talking_points.map((point, idx) => (
                                <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">✓</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {companyResearch.interview_tips.questions_to_ask && companyResearch.interview_tips.questions_to_ask.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-800 mb-1">Questions to Ask:</p>
                            <ul className="space-y-1">
                              {companyResearch.interview_tips.questions_to_ask.map((question, idx) => (
                                <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">?</span>
                                  <span>{question}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Facts */}
                  {companyResearch.quick_facts && (
                    <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Star className="h-5 w-5 text-rose-600 mt-0.5" />
                        <h5 className="font-semibold text-rose-900">Quick Facts</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {companyResearch.quick_facts.employee_count && (
                          <div>
                            <p className="text-rose-600 font-medium">Employees</p>
                            <p className="text-rose-800">{companyResearch.quick_facts.employee_count}</p>
                          </div>
                        )}
                        {companyResearch.quick_facts.glassdoor_rating && (
                          <div>
                            <p className="text-rose-600 font-medium">Glassdoor</p>
                            <p className="text-rose-800">{companyResearch.quick_facts.glassdoor_rating}</p>
                          </div>
                        )}
                        {companyResearch.quick_facts.funding && (
                          <div>
                            <p className="text-rose-600 font-medium">Funding</p>
                            <p className="text-rose-800">{companyResearch.quick_facts.funding}</p>
                          </div>
                        )}
                        {companyResearch.quick_facts.notable_clients && companyResearch.quick_facts.notable_clients.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-rose-600 font-medium mb-1">Notable Clients</p>
                            <div className="flex flex-wrap gap-1">
                              {companyResearch.quick_facts.notable_clients.map((client, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-800">
                                  {client}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
