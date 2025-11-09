/**
 * 格式化数字显示
 * @param num 要格式化的数字
 * @returns 格式化后的字符串（如 1.5M, 1.2K, 1,234）
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}
