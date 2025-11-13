import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showTotal?: boolean;
  total?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showTotal = true,
  total = 0,
  pageSize = 20,
  className,
}: PaginationProps) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // 最多显示7个页码

    if (totalPages <= maxVisible) {
      // 如果总页数小于等于最大可见数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // 显示当前页前后的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // 总是显示最后一页
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 计算显示范围
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* 统计信息 */}
      {showTotal && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          显示 <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> 到{' '}
          <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> 条，共{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {total.toLocaleString()}
          </span>{' '}
          条记录
        </div>
      )}

      {/* 分页按钮 */}
      <div className="flex items-center gap-1">
        {/* 第一页 */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg border transition-colors',
            'text-gray-700 dark:text-gray-300',
            'border-gray-300 dark:border-gray-600',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
          title="第一页"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* 上一页 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg border transition-colors',
            'text-gray-700 dark:text-gray-300',
            'border-gray-300 dark:border-gray-600',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 页码 */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9 text-gray-500 dark:text-gray-400"
              >
                •••
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-lg border transition-colors',
                  'text-sm font-medium',
                  currentPage === page
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* 移动端：当前页显示 */}
        <div className="sm:hidden flex items-center justify-center min-w-[5rem] h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* 下一页 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg border transition-colors',
            'text-gray-700 dark:text-gray-300',
            'border-gray-300 dark:border-gray-600',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 最后一页 */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg border transition-colors',
            'text-gray-700 dark:text-gray-300',
            'border-gray-300 dark:border-gray-600',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
          title="最后一页"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
