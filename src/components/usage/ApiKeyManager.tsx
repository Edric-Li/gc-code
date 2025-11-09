import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ApiKeyManagerProps {
  apiKey: string | null;
  maskedApiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onCancel?: () => void;
}

export default function ApiKeyManager({
  apiKey,
  maskedApiKey,
  onSave,
  onClear,
  onCancel,
}: ApiKeyManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    try {
      onSave(inputValue);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleClear = () => {
    if (confirm('确定要清除 API Key 吗？')) {
      onClear();
      setInputValue('');
      setError('');
    }
  };

  // API Key 输入/编辑（全屏蒙层）
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {apiKey ? '管理 API Key' : '输入 API Key'}
          </h2>
          {apiKey && onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {apiKey && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            当前 API Key: <span className="font-mono">{maskedApiKey}</span>
          </p>
        )}

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {apiKey ? '输入新的 API Key 或清除当前 Key' : '请输入您的 API Key 以查看用量统计'}
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="cr_xxxxxxxxxxxxxxxxxx"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {apiKey ? '更新' : '确认'}
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              className="flex-1 rounded-lg border border-red-300 bg-white px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              清除
            </button>
          )}
        </div>

        {apiKey && onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            取消
          </button>
        )}

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          您的 API Key 将安全地保存在浏览器本地，不会上传到其他服务器
        </p>
      </div>
    </div>
  );
}
