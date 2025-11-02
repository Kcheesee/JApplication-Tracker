import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../api/client';
import { Loader2 } from 'lucide-react';

interface StatusHistoryEntry {
  id: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  changed_at: string;
}

interface StatusTimelineProps {
  applicationId: string;
}

const statusIcons: Record<string, any> = {
  'Applied': Calendar,
  'Interviewing': Clock,
  'Interview Scheduled': Clock,
  'Offer': CheckCircle2,
  'Offer Received': CheckCircle2,
  'Rejected': XCircle,
  'Ghosted': XCircle,
  'Follow-up Needed': Clock,
};

const statusColors: Record<string, string> = {
  'Applied': 'bg-blue-500',
  'Interviewing': 'bg-yellow-500',
  'Interview Scheduled': 'bg-yellow-500',
  'Offer': 'bg-green-500',
  'Offer Received': 'bg-green-500',
  'Rejected': 'bg-red-500',
  'Ghosted': 'bg-gray-500',
  'Follow-up Needed': 'bg-orange-500',
};

export function StatusTimeline({ applicationId }: StatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [applicationId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/applications/${applicationId}/history`);
      setHistory(response.data.history || []);
    } catch (err: any) {
      console.error('Error loading status history:', err);
      setError('Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 text-center py-4">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No status history available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
        Status Timeline
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline entries */}
        <div className="space-y-6">
          {history.map((entry, index) => {
            const Icon = statusIcons[entry.new_status] || Calendar;
            const isLatest = index === history.length - 1;

            return (
              <div key={entry.id} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                    statusColors[entry.new_status] || 'bg-gray-500'
                  } ${isLatest ? 'ring-4 ring-indigo-100' : ''}`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.old_status ? (
                          <>
                            {entry.old_status} → <span className="text-indigo-600">{entry.new_status}</span>
                          </>
                        ) : (
                          <span className="text-indigo-600">{entry.new_status}</span>
                        )}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(entry.changed_at), 'MMM d, yyyy')}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{history.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status Changes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.max(
                0,
                Math.floor(
                  (new Date().getTime() - new Date(history[0].changed_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Days Since Applied</p>
          </div>
        </div>
      </div>
    </div>
  );
}
