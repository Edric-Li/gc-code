import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export default function TableOfContents({ className = '' }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 提取文档内容区的标题
    const contentElement = document.querySelector('.doc-content');
    if (!contentElement) return;

    const headings = contentElement.querySelectorAll('h2, h3');
    const tocItems: TocItem[] = Array.from(headings).map((heading) => ({
      id: heading.id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1)),
    }));

    setToc(tocItems);

    // 监听滚动，高亮当前章节
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  if (toc.length === 0) return null;

  return (
    <aside className={`${className}`}>
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-6">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">本页目录</h4>
        <nav>
          <ul className="space-y-2 text-sm">
            {toc.map((item) => (
              <li
                key={item.id}
                style={{
                  paddingLeft: item.level === 3 ? '1rem' : undefined,
                }}
              >
                <a
                  href={`#${item.id}`}
                  className={`
                    block border-l-2 py-1 pl-3 transition-colors
                    ${
                      activeId === item.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-100'
                    }
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
