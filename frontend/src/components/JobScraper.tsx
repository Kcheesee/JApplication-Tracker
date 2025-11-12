import { useState } from 'react';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface JobScraperProps {
  onDataExtracted: (data: any) => void;
}

export function JobScraper({ onDataExtracted }: JobScraperProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!url.trim()) {
      toast.error('Please enter a job posting URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/applications/parse-url', {
        url: url.trim()
      });

      if (response.data.success) {
        const extracted = response.data.data;

        // Map to our form format
        const mappedData = {
          company: extracted.company || '',
          role: extracted.position || '',
          postingUrl: extracted.source_url || url,
          location: extracted.location || '',
          description: extracted.description || '',
          notes: [
            extracted.requirements?.length > 0 ? `Requirements: ${extracted.requirements.join(', ')}` : '',
            extracted.tech_stack?.length > 0 ? `Tech Stack: ${extracted.tech_stack.join(', ')}` : '',
            extracted.benefits?.length > 0 ? `Benefits: ${extracted.benefits.join(', ')}` : '',
            extracted.remote_policy ? `Remote: ${extracted.remote_policy}` : '',
            extracted.employment_type ? `Type: ${extracted.employment_type}` : '',
            extracted.experience_level ? `Level: ${extracted.experience_level}` : ''
          ].filter(Boolean).join('\n'),
          salary_min: extracted.salary_min || null,
          salary_max: extracted.salary_max || null,
        };

        onDataExtracted(mappedData);
        toast.success('Job details extracted successfully! 🎉');
        setUrl(''); // Clear input
      } else {
        toast.error(response.data.error || 'Failed to extract job details');
      }
    } catch (error: any) {
      console.error('Error parsing URL:', error);
      toast.error(
        error.response?.data?.detail || 'Failed to parse job URL. Please try again or fill manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleParse();
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">AI-Powered Quick Add</h3>
        </div>
        <p className="text-sm text-indigo-700 mb-4">
          Paste a job posting URL and let AI automatically extract all the details for you!
        </p>

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://linkedin.com/jobs/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleParse}
            disabled={loading || !url.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-indigo-600">
          <div className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span>Works with LinkedIn, Indeed, Greenhouse, and more</span>
          </div>
        </div>
      </div>
    </div>
  );
}
