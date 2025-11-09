/**
 * 图表颜色配置
 */
export interface ChartColor {
  bg: string; // Tailwind CSS 背景色类名
  fill: string; // SVG fill 十六进制颜色值
}

/**
 * 饼图颜色方案
 */
export const CHART_COLORS: ChartColor[] = [
  { bg: 'bg-blue-500', fill: '#3b82f6' },
  { bg: 'bg-green-500', fill: '#22c55e' },
  { bg: 'bg-purple-500', fill: '#a855f7' },
  { bg: 'bg-amber-500', fill: '#f59e0b' },
  { bg: 'bg-red-500', fill: '#ef4444' },
  { bg: 'bg-indigo-500', fill: '#6366f1' },
  { bg: 'bg-pink-500', fill: '#ec4899' },
  { bg: 'bg-teal-500', fill: '#14b8a6' },
];

/**
 * 饼图 SVG 配置
 */
export const PIE_CHART_CONFIG = {
  radius: 80,
  centerX: 100,
  centerY: 100,
  innerRadius: 45,
} as const;
