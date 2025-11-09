import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warning' | 'success' | 'error';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig = {
  info: {
    icon: Info,
    className:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100',
    iconClassName: 'text-blue-500 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-100',
    iconClassName: 'text-yellow-500 dark:text-yellow-400',
  },
  success: {
    icon: CheckCircle,
    className:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-100',
    iconClassName: 'text-green-500 dark:text-green-400',
  },
  error: {
    icon: AlertCircle,
    className:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
    iconClassName: 'text-red-500 dark:text-red-400',
  },
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={`my-6 flex gap-3 rounded-lg border p-4 ${config.className}`} role="alert">
      <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconClassName}`} />
      <div className="flex-1">
        {title && <div className="mb-1 font-semibold">{title}</div>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
