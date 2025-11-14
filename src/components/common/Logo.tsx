import { Code2 } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', logo: 'h-4 w-4', text: 'text-lg' },
    md: { icon: 'h-8 w-8', logo: 'h-5 w-5', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', logo: 'h-6 w-6', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex ${sizes.icon} items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600`}
      >
        <Code2 className={`${sizes.logo} text-white`} />
      </div>
      <span className={`${sizes.text} font-bold text-gray-900 dark:text-white`}>GC Code</span>
    </div>
  );
}
