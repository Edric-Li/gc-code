import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { docsConfig, type DocItem } from '@/config/docs';

interface DocSidebarProps {
  className?: string;
}

export default function DocSidebar({ className = '' }: DocSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <nav className="h-full overflow-y-auto px-4 py-6">
        <div className="space-y-8">
          {docsConfig.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <DocNavItem key={item.href} item={item} currentPath={location.pathname} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

interface DocNavItemProps {
  item: DocItem;
  currentPath: string;
  level?: number;
}

function DocNavItem({ item, currentPath, level = 0 }: DocNavItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.items && item.items.length > 0;
  const isActive = currentPath === item.href;
  const isChildActive =
    hasChildren && item.items?.some((child) => currentPath.startsWith(child.href));

  const paddingLeft = level * 12;

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mr-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isOpen ? '收起' : '展开'}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
        <Link
          to={item.href}
          className={`
            flex-1 rounded-md px-3 py-2 text-sm transition-colors
            ${
              isActive
                ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                : isChildActive
                  ? 'font-medium text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }
          `}
          style={{ paddingLeft: hasChildren ? undefined : `${paddingLeft + 32}px` }}
        >
          {item.title}
        </Link>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.items?.map((child) => (
            <DocNavItem key={child.href} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
