import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { Job } from '../types/job';

interface SalaryComparisonProps {
  jobs: Job[];
}

export function SalaryComparison({ jobs }: SalaryComparisonProps) {
  // Filter jobs with salary data
  const jobsWithSalary = jobs.filter(job => job.salary_min || job.salary_max);

  if (jobsWithSalary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Salary Comparison
        </h3>
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No salary data available yet</p>
          <p className="text-sm mt-1">Add salary info to your applications to see comparisons</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const salaries = jobsWithSalary.map(job => ({
    company: job.company,
    min: job.salary_min || 0,
    max: job.salary_max || job.salary_min || 0,
    avg: ((job.salary_min || 0) + (job.salary_max || job.salary_min || 0)) / 2,
  })).sort((a, b) => b.avg - a.avg);

  const allAvgs = salaries.map(s => s.avg);
  const avgSalary = allAvgs.reduce((sum, val) => sum + val, 0) / allAvgs.length;
  const maxSalary = Math.max(...salaries.map(s => s.max));
  const minSalary = Math.min(...salaries.map(s => s.min).filter(v => v > 0));

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Salary Comparison
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Average</p>
          <p className="text-lg font-bold text-green-900">{formatSalary(avgSalary)}</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Highest</p>
          <p className="text-lg font-bold text-blue-900">{formatSalary(maxSalary)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">Lowest</p>
          <p className="text-lg font-bold text-gray-900">{formatSalary(minSalary)}</p>
        </div>
      </div>

      {/* Salary Bars */}
      <div className="space-y-3">
        {salaries.map((salary, index) => {
          const percentage = (salary.avg / maxSalary) * 100;
          const isTopPay = salary.avg === Math.max(...allAvgs);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isTopPay ? 'text-green-700' : 'text-gray-700'}`}>
                  {salary.company}
                  {isTopPay && ' 👑'}
                </span>
                <span className="text-gray-600">
                  {formatSalary(salary.min)}
                  {salary.max !== salary.min && ` - ${formatSalary(salary.max)}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    isTopPay ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        Comparing {jobsWithSalary.length} job{jobsWithSalary.length !== 1 ? 's' : ''} with salary data
      </div>
    </div>
  );
}
