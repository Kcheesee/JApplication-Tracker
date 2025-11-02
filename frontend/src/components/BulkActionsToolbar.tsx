import { Trash2, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { JobStatus } from '../types/job';
import { useState } from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkUpdateStatus: (status: JobStatus) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onBulkUpdateStatus,
  onBulkDelete,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [statusValue, setStatusValue] = useState<JobStatus | ''>('');

  const handleStatusUpdate = async () => {
    if (!statusValue) return;

    setLoading(true);
    try {
      await onBulkUpdateStatus(statusValue);
      setStatusValue('');
    } catch (error) {
      console.error('Error in bulk status update:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} application(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      await onBulkDelete();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-medium text-indigo-900">
          {selectedCount} selected
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-indigo-600 hover:text-indigo-700"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={statusValue} onValueChange={(value) => setStatusValue(value as JobStatus)}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white">
            <SelectValue placeholder="Change status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Interviewing">Interviewing</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Ghosted">Ghosted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={handleStatusUpdate}
          disabled={!statusValue || loading}
          className="whitespace-nowrap"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : null}
          Update
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="whitespace-nowrap"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
