import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// 初始化主题：从 localStorage 读取或使用系统偏好
function getInitialTheme(): Theme {
  // 先检查 localStorage
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    return stored as Theme;
  }

  // 如果没有存储，使用系统偏好
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return systemTheme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Store preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
