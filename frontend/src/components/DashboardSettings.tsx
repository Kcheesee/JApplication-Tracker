import { useState } from 'react';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export interface DashboardPreferences {
  showTotalApps: boolean;
  showInterviews: boolean;
  showOffers: boolean;
  showResponseRate: boolean;
  showPending: boolean;
  showRejected: boolean;
  showStatusBreakdown: boolean;
  showRecentActivity: boolean;
  showTimeline: boolean;
}

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  showTotalApps: true,
  showInterviews: true,
  showOffers: true,
  showResponseRate: true,
  showPending: true,
  showRejected: true,
  showStatusBreakdown: true,
  showRecentActivity: true,
  showTimeline: true,
};

interface DashboardSettingsProps {
  preferences: DashboardPreferences;
  onSave: (preferences: DashboardPreferences) => void;
}

export function DashboardSettings({ preferences, onSave }: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleToggle = (key: keyof DashboardPreferences) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(localPrefs);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_PREFERENCES);
  };

  const widgets = [
    { key: 'showTotalApps' as const, label: 'Total Applications', description: 'Overall count and weekly stats' },
    { key: 'showInterviews' as const, label: 'Active Interviews', description: 'Interview count and success rate' },
    { key: 'showOffers' as const, label: 'Offers Received', description: 'Total offers you\'ve received' },
    { key: 'showResponseRate' as const, label: 'Response Rate', description: 'Percentage of companies that responded' },
    { key: 'showPending' as const, label: 'Awaiting Response', description: 'Applications still pending' },
    { key: 'showRejected' as const, label: 'Rejected Applications', description: 'Track rejections (can be hidden for positivity!)' },
    { key: 'showStatusBreakdown' as const, label: 'Status Breakdown Chart', description: 'Visual breakdown by status' },
    { key: 'showRecentActivity' as const, label: 'Recent Activity Feed', description: 'Latest updates on your applications' },
    { key: 'showTimeline' as const, label: 'Application Timeline', description: '30-day activity chart' },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Customize
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customize Dashboard
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Choose which stats and charts to display on your dashboard. Hide anything you don't want to see!
            </p>

            <div className="space-y-3">
              {widgets.map((widget) => (
                <div
                  key={widget.key}
                  className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all ${
                    localPrefs[widget.key]
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {localPrefs[widget.key] ? (
                        <Eye className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <h4 className={`font-medium ${
                        localPrefs[widget.key] ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {widget.label}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-6">
                      {widget.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(widget.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      localPrefs[widget.key]
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {localPrefs[widget.key] ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Reset to Default
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
