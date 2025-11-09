import { Code2 } from 'lucide-react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600">
        <Code2 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-white">GC Code</span>
    </div>
  );
}
