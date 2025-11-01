import { useState } from 'react';
import { Target, Flame, Trophy, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Job } from '../types/job';
import { motion } from 'framer-motion';

interface GoalTrackerProps {
  jobs: Job[];
}

interface Goals {
  weeklyTarget: number;
  monthlyTarget: number;
}

const DEFAULT_GOALS: Goals = {
  weeklyTarget: 5,
  monthlyTarget: 20,
};

export function GoalTracker({ jobs }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goals>(() => {
    const saved = localStorage.getItem('application_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editGoals, setEditGoals] = useState(goals);

  const handleSave = () => {
    setGoals(editGoals);
    localStorage.setItem('application_goals', JSON.stringify(editGoals));
    setIsEditing(false);
  };

  // Calculate this week's applications
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekApps = jobs.filter(job => {
    const appliedDate = new Date(job.appliedAt || job.application_date || '');
    return appliedDate >= thisWeekStart;
  }).length;

  // Calculate this month's applications
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthApps = jobs.filter(job => {
    const appliedDate = new Date(job.appliedAt || job.application_date || '');
    return appliedDate >= thisMonthStart;
  }).length;

  // Calculate streak (consecutive days with at least 1 application)
  const calculateStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const hasApplication = jobs.some(job => {
        const appliedDate = new Date(job.appliedAt || job.application_date || '');
        appliedDate.setHours(0, 0, 0, 0);
        return appliedDate.getTime() === currentDate.getTime();
      });

      if (!hasApplication) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const streak = calculateStreak();
  const weeklyProgress = (thisWeekApps / goals.weeklyTarget) * 100;
  const monthlyProgress = (thisMonthApps / goals.monthlyTarget) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Your Goals
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Target
            </label>
            <Input
              type="number"
              value={editGoals.weeklyTarget}
              onChange={(e) => setEditGoals({ ...editGoals, weeklyTarget: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Target
            </label>
            <Input
              type="number"
              value={editGoals.monthlyTarget}
              onChange={(e) => setEditGoals({ ...editGoals, monthlyTarget: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">Save</Button>
            <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">This Week</span>
              <span className="text-sm font-bold text-gray-900">
                {thisWeekApps} / {goals.weeklyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  weeklyProgress >= 100 ? 'bg-green-500' :
                  weeklyProgress >= 75 ? 'bg-blue-500' :
                  weeklyProgress >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {weeklyProgress >= 100 ? '🎉 Goal achieved!' :
               `${(goals.weeklyTarget - thisWeekApps)} more to reach your weekly goal`}
            </p>
          </div>

          {/* Monthly Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">This Month</span>
              <span className="text-sm font-bold text-gray-900">
                {thisMonthApps} / {goals.monthlyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  monthlyProgress >= 100 ? 'bg-green-500' :
                  monthlyProgress >= 75 ? 'bg-blue-500' :
                  monthlyProgress >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthlyProgress >= 100 ? '🏆 Monthly goal crushed!' :
               `${(goals.monthlyTarget - thisMonthApps)} more to reach your monthly goal`}
            </p>
          </div>

          {/* Streak */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Current Streak</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{streak} days</span>
            </div>
            {streak >= 7 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Wow! You're on fire! Keep it up!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
