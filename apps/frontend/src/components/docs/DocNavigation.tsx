import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DocItem } from '@/config/docs';

interface DocNavigationProps {
  prev: DocItem | null;
  next: DocItem | null;
}

export default function DocNavigation({ prev, next }: DocNavigationProps) {
  if (!prev && !next) return null;

  return (
    <div className="mt-12 grid gap-4 border-t border-gray-200 pt-8 dark:border-gray-800 sm:grid-cols-2">
      {prev ? (
        <Link
          to={prev.href}
          className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">上一页</div>
            <div className="mt-1 truncate font-medium text-gray-900 dark:text-gray-100">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next && (
        <Link
          to={next.href}
          className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 sm:justify-self-end"
        >
          <div className="min-w-0 flex-1 text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">下一页</div>
            <div className="mt-1 truncate font-medium text-gray-900 dark:text-gray-100">
              {next.title}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
        </Link>
      )}
    </div>
  );
}
