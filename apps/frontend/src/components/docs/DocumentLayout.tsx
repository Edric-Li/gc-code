import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';
import DocSidebar from './DocSidebar';
import TableOfContents from './TableOfContents';

interface DocumentLayoutProps {
  children: ReactNode;
}

export default function DocumentLayout({ children }: DocumentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 移动端菜单按钮 - 移到外层 */}
      <div className="px-4 pt-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="打开菜单"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          菜单
        </button>
      </div>

      {/* 左侧导航栏 - 移动端抽屉式，桌面端固定显示 */}
      <DocSidebar
        className={`
          fixed top-16 bottom-0 z-30 w-[280px] transform transition-transform
          ${sidebarOpen ? 'left-0 translate-x-0' : 'left-0 -translate-x-full'}
          lg:translate-x-0
          lg:left-[max(0px,calc((100vw-1280px)/2))]
        `}
      />

      {/* 主内容区 - 添加左边距为菜单预留空间 */}
      <div className="mx-auto w-full max-w-7xl lg:pl-[280px]">
        <main className="min-h-screen w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              {/* 文档内容 */}
              <article className="doc-content mx-auto min-w-0 max-w-5xl">{children}</article>
            </div>
          </div>
        </main>
      </div>

      {/* 右侧目录 - 固定定位，仅桌面端显示 */}
      <TableOfContents className="fixed top-16 right-8 hidden w-[240px] xl:block" />
    </div>
  );
}
