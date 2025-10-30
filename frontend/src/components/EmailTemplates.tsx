import { useState } from 'react';
import { Mail, Copy, Check, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Job } from '../types/job';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'thank-you' | 'acceptance' | 'decline' | 'inquiry' | 'other';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Post-Application Follow-up',
    subject: 'Following up on my application for {position}',
    body: `Hi {recruiter_name},

I hope this email finds you well. I wanted to follow up on my application for the {position} role at {company}, which I submitted on {applied_date}.

I remain very interested in this opportunity and would welcome the chance to discuss how my background and skills could contribute to your team.

Is there any additional information I can provide to support my application?

Thank you for your time and consideration.

Best regards,
[Your Name]`,
    category: 'follow-up'
  },
  {
    id: '2',
    name: 'Thank You After Interview',
    subject: 'Thank you for the opportunity',
    body: `Dear {recruiter_name},

Thank you for taking the time to speak with me yesterday about the {position} role at {company}. I enjoyed learning more about the team and the exciting projects you're working on.

Our conversation reinforced my enthusiasm for this opportunity. I'm particularly excited about [specific aspect discussed in interview].

Please don't hesitate to reach out if you need any additional information from me.

I look forward to hearing from you about next steps.

Best regards,
[Your Name]`,
    category: 'thank-you'
  },
  {
    id: '3',
    name: 'Offer Acceptance',
    subject: 'Acceptance of offer for {position}',
    body: `Dear {recruiter_name},

I am delighted to formally accept the offer for the {position} role at {company}!

I'm excited to join the team and contribute to [company's mission/project]. As discussed, I understand my start date will be [start date] at a salary of [salary details].

Please let me know what next steps I should take and if there are any documents you need from me.

Thank you for this wonderful opportunity. I look forward to working with you and the team!

Best regards,
[Your Name]`,
    category: 'acceptance'
  },
  {
    id: '4',
    name: 'Status Inquiry',
    subject: 'Checking in: {position} application',
    body: `Hi {recruiter_name},

I hope you're doing well. I wanted to reach out regarding my application for the {position} position at {company}.

I remain very interested in this role and would appreciate any update you might have on the hiring timeline or next steps in the process.

Thank you for your time, and I look forward to hearing from you.

Best regards,
[Your Name]`,
    category: 'inquiry'
  },
  {
    id: '5',
    name: 'Polite Decline',
    subject: 'Re: {position} opportunity',
    body: `Dear {recruiter_name},

Thank you so much for considering me for the {position} role at {company} and for the time you've invested in the interview process.

After careful consideration, I've decided to pursue another opportunity that aligns more closely with my current career goals.

I have great respect for {company} and the work you're doing. I hope we might have the opportunity to work together in the future.

Thank you again for your time and understanding.

Best regards,
[Your Name]`,
    category: 'decline'
  }
];

interface EmailTemplatesProps {
  job?: Job | null;
}

export function EmailTemplates({ job }: EmailTemplatesProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('email_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const replaceVariables = (text: string): string => {
    if (!job) return text;

    return text
      .replace(/{company}/g, job.company || '[Company]')
      .replace(/{position}/g, job.role || job.position || '[Position]')
      .replace(/{recruiter_name}/g, job.recruiter_name || '[Recruiter Name]')
      .replace(/{applied_date}/g, job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : '[Applied Date]');
  };

  const handleCopy = (template: EmailTemplate) => {
    const subject = replaceVariables(template.subject);
    const body = replaceVariables(template.body);
    const fullText = `Subject: ${subject}\n\n${body}`;

    navigator.clipboard.writeText(fullText);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    let updatedTemplates;
    if (editingTemplate.id.startsWith('new-')) {
      updatedTemplates = [...templates, { ...editingTemplate, id: Date.now().toString() }];
    } else {
      updatedTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    }

    setTemplates(updatedTemplates);
    localStorage.setItem('email_templates', JSON.stringify(updatedTemplates));
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('email_templates', JSON.stringify(updatedTemplates));
  };

  const handleAddNew = () => {
    setEditingTemplate({
      id: `new-${Date.now()}`,
      name: '',
      subject: '',
      body: '',
      category: 'other'
    });
    setIsEditing(true);
  };

  const categories = {
    'follow-up': 'Follow-up',
    'thank-you': 'Thank You',
    'acceptance': 'Acceptance',
    'decline': 'Decline',
    'inquiry': 'Inquiry',
    'other': 'Other'
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        Email Templates
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </DialogTitle>
              <Button
                size="sm"
                onClick={handleAddNew}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </div>
          </DialogHeader>

          {isEditing && editingTemplate ? (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="e.g., Post-Interview Thank You"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(categories).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="Use {company}, {position}, {recruiter_name}, {applied_date}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body
                </label>
                <Textarea
                  rows={12}
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  placeholder="Use {company}, {position}, {recruiter_name}, {applied_date}"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {job && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    <strong>Context:</strong> {job.company} - {job.role || job.position || 'Position'}
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    Variables will be automatically filled in when you copy
                  </p>
                </div>
              )}

              {Object.entries(categories).map(([categoryKey, categoryLabel]) => {
                const categoryTemplates = templates.filter(t => t.category === categoryKey);
                if (categoryTemplates.length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{categoryLabel}</h3>
                    <div className="space-y-3">
                      {categoryTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setIsEditing(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCopy(template)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                              >
                                {copiedId === template.id ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="text-gray-600 font-medium">Subject: </span>
                              <span className="text-gray-900">{replaceVariables(template.subject)}</span>
                            </div>
                            <div>
                              <p className="text-gray-700 whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                {replaceVariables(template.body)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
