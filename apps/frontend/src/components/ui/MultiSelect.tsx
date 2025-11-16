import { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Separator from '@radix-ui/react-separator';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = '请选择...',
  emptyText = '暂无选项',
  searchPlaceholder = '搜索...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // 已选项
  const selectedOptions = useMemo(() => {
    return options.filter((option) => value.includes(option.value));
  }, [options, value]);

  // 切换选中状态
  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  // 移除单个选中项
  const removeOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // 全选
  const selectAll = () => {
    onChange(filteredOptions.map((option) => option.value));
  };

  // 清空
  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-700 px-3 py-2.5 text-sm',
            'hover:border-blue-500 dark:hover:border-blue-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            className
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1.5 overflow-hidden">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => removeOption(option.value, e)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-gray-200 dark:border-gray-700',
            'bg-white dark:bg-gray-800 shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            'max-h-[300px] overflow-hidden'
          )}
        >
          <div className="flex flex-col">
            {/* 搜索框 */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full rounded-md border border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-700 pl-8 pr-3 py-1.5 text-sm',
                    'text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            {filteredOptions.length > 0 && (
              <>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    已选 {value.length} 项
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      全选
                    </button>
                    {value.length > 0 && (
                      <>
                        <Separator.Root
                          orientation="vertical"
                          className="h-3 w-px bg-gray-300 dark:bg-gray-600"
                        />
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-xs font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          清空
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 选项列表 */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors',
                        isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <Checkbox.Root
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(option.value)}
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          'border-gray-300 dark:border-gray-600',
                          'data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-500',
                          'data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        )}
                      >
                        <Checkbox.Indicator>
                          <Check className="h-3 w-3 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="flex-1 text-sm text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
