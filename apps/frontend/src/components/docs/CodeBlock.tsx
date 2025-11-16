import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      {filename && (
        <div className="border-b border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {filename}
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded-md bg-white p-2 opacity-0 shadow-sm transition-opacity hover:bg-gray-50 group-hover:opacity-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="复制代码"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <pre className="overflow-x-auto p-4">
          <code className={`language-${language} text-sm`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
