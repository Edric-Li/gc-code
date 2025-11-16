import { useEffect, useState } from 'react';
import {
  Mail,
  Bell,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  RefreshCw,
  Save,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  notificationApi,
  type EmailConfig,
  type AlertConfig,
  AlertType,
} from '@/services/notificationApi';

export default function NotificationSettings() {
  const [activeTab, setActiveTab] = useState<'email' | 'alert'>('email');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">通知配置</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">配置邮件服务和告警规则</p>
      </div>

      {/* 选项卡 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Mail className="w-5 h-5" />
            邮件配置
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`${
              activeTab === 'alert'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Bell className="w-5 h-5" />
            告警规则
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      {activeTab === 'email' && <EmailConfigSection />}
      {activeTab === 'alert' && <AlertConfigSection />}
    </div>
  );
}

// ==================== 邮件配置部分 ====================

function EmailConfigSection() {
  const [config, setConfig] = useState<EmailConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: 'GC-Code1 Monitor',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getEmailConfig();
      if (response.data) {
        setConfig((prev) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('加载邮件配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await notificationApi.saveEmailConfig(config);
      setMessage({ type: 'success', text: '邮件配置保存成功！' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage(null);
      const response = await notificationApi.testEmailConnection(config);
      if (response.data?.success) {
        setMessage({ type: 'success', text: response.data.message || '连接测试成功！' });
      } else {
        setMessage({ type: 'error', text: response.data?.message || '连接测试失败' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '测试失败',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: '请输入测试邮箱地址' });
      return;
    }
    try {
      setSendingTest(true);
      setMessage(null);
      await notificationApi.sendTestEmail(testEmail);
      setMessage({ type: 'success', text: `测试邮件已发送到 ${testEmail}` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '发送测试邮件失败',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div
          className={`${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          } border px-4 py-3 rounded-lg flex items-center gap-2`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* SMTP 配置表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SMTP 服务器配置
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SMTP 地址
              </label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                端口
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="secure"
              checked={config.secure}
              onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="secure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              使用 SSL/TLS 加密连接
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              发件人邮箱
            </label>
            <input
              type="email"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="noreply@yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码/应用专用密码
            </label>
            <input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              对于 Gmail，请使用应用专用密码而非账户密码
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              发件人名称
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
              placeholder="GC-Code1 Monitor"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存配置
          </button>

          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            测试连接
          </button>
        </div>
      </div>

      {/* 发送测试邮件 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">发送测试邮件</h3>

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="admin@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendTest}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            {sendingTest ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发送测试
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          输入接收测试邮件的邮箱地址，用于验证配置是否正确
        </p>
      </div>

      {/* 配置说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-2">常见邮件服务器配置参考：</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Gmail: smtp.gmail.com, 端口 587, 需使用应用专用密码</li>
              <li>Outlook: smtp-mail.outlook.com, 端口 587</li>
              <li>QQ邮箱: smtp.qq.com, 端口 587, 需开启 SMTP 服务并使用授权码</li>
              <li>163邮箱: smtp.163.com, 端口 465 (SSL)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 告警规则配置部分 ====================

function AlertConfigSection() {
  const [config, setConfig] = useState<AlertConfig>({
    recipients: [],
    cooldownMinutes: 30,
    batchEnabled: false,
    batchIntervalMinutes: 5,
    enabledTypes: [AlertType.ERROR, AlertType.TEMP_ERROR, AlertType.RATE_LIMITED, AlertType.RECOVERED],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAlertConfig();
  }, []);

  const loadAlertConfig = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getAlertConfig();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (err) {
      console.error('加载告警配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await notificationApi.saveAlertConfig(config);
      setMessage({ type: 'success', text: '告警配置保存成功！' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;

    // 简单的邮箱验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: '请输入有效的邮箱地址' });
      return;
    }

    if (config.recipients.includes(email)) {
      setMessage({ type: 'error', text: '该邮箱已存在' });
      return;
    }

    setConfig({ ...config, recipients: [...config.recipients, email] });
    setRecipientInput('');
    setMessage(null);
  };

  const removeRecipient = (email: string) => {
    setConfig({
      ...config,
      recipients: config.recipients.filter((r) => r !== email),
    });
  };

  const toggleAlertType = (type: AlertType) => {
    if (config.enabledTypes.includes(type)) {
      setConfig({
        ...config,
        enabledTypes: config.enabledTypes.filter((t) => t !== type),
      });
    } else {
      setConfig({
        ...config,
        enabledTypes: [...config.enabledTypes, type],
      });
    }
  };

  const alertTypeLabels: Record<AlertType, { label: string; description: string; icon: string }> =
    {
      [AlertType.ERROR]: {
        label: '认证失败告警',
        description: '渠道 API Key 认证失败 (401/403)',
        icon: '🚨',
      },
      [AlertType.TEMP_ERROR]: {
        label: '临时错误告警',
        description: '5分钟内连续3次服务器错误 (5xx)',
        icon: '⚠️',
      },
      [AlertType.RATE_LIMITED]: {
        label: '限流告警',
        description: '渠道被限流 (429 Too Many Requests)',
        icon: '⏱️',
      },
      [AlertType.RECOVERED]: {
        label: '恢复通知',
        description: '渠道从错误状态自动恢复',
        icon: '✅',
      },
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div
          className={`${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          } border px-4 py-3 rounded-lg flex items-center gap-2`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* 收件人管理 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">告警收件人</h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="admin@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addRecipient}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              添加
            </button>
          </div>

          {config.recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无收件人，请添加至少一个邮箱</p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{email}</span>
                  </div>
                  <button
                    onClick={() => removeRecipient(email)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 告警类型配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">启用的告警类型</h3>

        <div className="space-y-3">
          {Object.entries(alertTypeLabels).map(([type, info]) => (
            <label
              key={type}
              className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={config.enabledTypes.includes(type as AlertType)}
                onChange={() => toggleAlertType(type as AlertType)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{info.label}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{info.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 高级设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">高级设置</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              告警冷却时间（分钟）
            </label>
            <input
              type="number"
              value={config.cooldownMinutes}
              onChange={(e) =>
                setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) || 30 })
              }
              min={1}
              max={1440}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              同一渠道相同类型的告警在此时间内只发送一次
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <input
              type="checkbox"
              id="batchEnabled"
              checked={config.batchEnabled}
              onChange={(e) => setConfig({ ...config, batchEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="batchEnabled"
                className="font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                启用批量告警摘要
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                将多个告警合并为一封邮件发送，减少邮件数量
              </p>
              {config.batchEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    批量发送间隔（分钟）
                  </label>
                  <input
                    type="number"
                    value={config.batchIntervalMinutes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        batchIntervalMinutes: parseInt(e.target.value) || 5,
                      })
                    }
                    min={1}
                    max={60}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || config.recipients.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存配置
        </button>
      </div>
    </div>
  );
}
