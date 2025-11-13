import { apiKeyApi } from '@/services/apiKeyApi';

/**
 * 检查 API Key 名称是否可用的响应
 */
export interface CheckNameResult {
  available: boolean;
  message?: string;
}

/**
 * 检查 API Key 名称是否可用（用户自己的 API Key）
 * @param name API Key 名称
 * @returns 名称可用性结果
 */
export async function checkMyApiKeyNameAvailable(name: string): Promise<CheckNameResult> {
  try {
    const result = await apiKeyApi.checkMyNameAvailable(name);
    return result;
  } catch (error) {
    console.error('检查名称可用性失败:', error);
    // 失败时假设可用，由后端最终验证
    return { available: true };
  }
}

/**
 * 检查 API Key 名称是否可用（管理员为其他用户检查）
 * @param userId 用户 ID
 * @param name API Key 名称
 * @returns 名称可用性结果
 */
export async function checkApiKeyNameAvailable(
  userId: string,
  name: string
): Promise<CheckNameResult> {
  try {
    const result = await apiKeyApi.checkNameAvailable(userId, name);
    return result;
  } catch (error) {
    console.error('检查名称可用性失败:', error);
    // 失败时假设可用，由后端最终验证
    return { available: true };
  }
}
