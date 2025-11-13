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

/**
 * 格式化货币显示
 * @param amount 金额（数字或字符串）
 * @returns 格式化后的货币字符串（如 $1.23, $0.00）
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '$0.0000';
  }
  return `$${num.toFixed(4)}`;
}
