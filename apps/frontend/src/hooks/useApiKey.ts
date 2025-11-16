import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'gc-code-api-key';

/**
 * API Key 管理 Hook
 */
export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载 API Key
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKey(storedKey);
    setIsLoading(false);
  }, []);

  // 保存 API Key
  const saveApiKey = (key: string) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      throw new Error('API Key 不能为空');
    }

    // 简单验证 API Key 格式
    if (!trimmedKey.startsWith('cr_')) {
      throw new Error('API Key 格式不正确，应以 cr_ 开头');
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    setApiKey(trimmedKey);
  };

  // 清除 API Key
  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
  };

  // 获取脱敏的 API Key 用于显示
  const getMaskedApiKey = () => {
    if (!apiKey) return '';
    const firstPart = apiKey.slice(0, 8);
    const lastPart = apiKey.slice(-6);
    return `${firstPart}...${lastPart}`;
  };

  return {
    apiKey,
    isLoading,
    hasApiKey: !!apiKey,
    saveApiKey,
    clearApiKey,
    getMaskedApiKey,
  };
}
