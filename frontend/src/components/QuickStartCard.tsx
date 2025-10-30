import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface QuickStartCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning';
  isConnected?: boolean;
}

export function QuickStartCard({
  title,
  description,
  icon: Icon,
  action,
  onClick,
  disabled = false,
  variant = 'default',
  isConnected = false,
}: QuickStartCardProps) {
  const variants = {
    default: 'border-gray-200 bg-white hover:border-indigo-300',
    success: 'border-green-200 bg-green-50 hover:border-green-300',
    warning: 'border-yellow-200 bg-yellow-50 hover:border-yellow-300',
  };

  const iconVariants = {
    default: 'text-indigo-600 bg-indigo-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative rounded-lg border-2 p-4 transition-all hover:shadow-md',
        variants[variant]
      )}
    >
      {isConnected && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg p-2', iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {description}
          </p>

          <Button
            size="sm"
            onClick={onClick}
            disabled={disabled || isConnected}
            variant={isConnected ? 'outline' : 'default'}
            className="w-full"
          >
            {isConnected ? 'Connected' : action}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
