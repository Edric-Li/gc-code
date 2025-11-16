import { api } from './api';

// ==================== 类型定义 ====================

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
}

export interface AlertConfig {
  recipients: string[];
  cooldownMinutes: number;
  batchEnabled: boolean;
  batchIntervalMinutes: number;
  enabledTypes: AlertType[];
}

export enum AlertType {
  TEMP_ERROR = 'TEMP_ERROR', // 临时错误（5分钟内3次5xx）
  ERROR = 'ERROR', // 永久性错误（401/403）
  RATE_LIMITED = 'RATE_LIMITED', // 被限流（429）
  RECOVERED = 'RECOVERED', // 渠道已恢复
}

export enum NotificationStatus {
  PENDING = 'PENDING', // 待发送
  SENT = 'SENT', // 已发送
  FAILED = 'FAILED', // 发送失败
}

export interface AlertLog {
  id: string;
  channelId: string;
  alertType: AlertType;
  recipients: string[];
  subject: string;
  content: string;
  sentAt: string;
  status: NotificationStatus;
  errorMessage?: string;
  retryCount: number;
  channel: {
    name: string;
    status: string;
  };
}

export interface AlertStats {
  alertType: AlertType;
  status: NotificationStatus;
  _count: number;
}

export interface NotificationStatus {
  emailAvailable: boolean;
  hasEmailConfig: boolean;
  emailConfig: Partial<EmailConfig> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

// ==================== API 方法 ====================

export const notificationApi = {
  // ========== 邮件配置管理 ==========

  /**
   * 获取邮件配置（脱敏）
   */
  getEmailConfig: () => api.get<ApiResponse<Partial<EmailConfig>>>('/notifications/email/config'),

  /**
   * 保存邮件配置
   */
  saveEmailConfig: (config: EmailConfig) =>
    api.post<ApiResponse<void>>('/notifications/email/config', config),

  /**
   * 测试邮件连接
   */
  testEmailConnection: (config?: EmailConfig) =>
    api.post<ApiResponse<{ success: boolean; message: string }>>(
      '/notifications/email/test-connection',
      config || {},
    ),

  /**
   * 发送测试邮件
   */
  sendTestEmail: (to: string) =>
    api.post<ApiResponse<void>>('/notifications/email/test-send', { to }),

  /**
   * 重新加载邮件配置
   */
  reloadEmailConfig: () => api.post<ApiResponse<void>>('/notifications/email/reload'),

  /**
   * 启用/禁用邮件通知
   */
  toggleEmailNotification: (enabled: boolean) =>
    api.post<ApiResponse<void>>('/notifications/email/toggle', { enabled }),

  // ========== 告警配置管理 ==========

  /**
   * 获取告警配置
   */
  getAlertConfig: () => api.get<ApiResponse<AlertConfig>>('/notifications/alert/config'),

  /**
   * 保存告警配置
   */
  saveAlertConfig: (config: AlertConfig) =>
    api.post<ApiResponse<void>>('/notifications/alert/config', config),

  // ========== 告警历史和统计 ==========

  /**
   * 获取告警历史
   */
  getAlertHistory: (params?: {
    channelId?: string;
    alertType?: AlertType;
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return api.get<ApiResponse<AlertLog[]>>(
      `/notifications/alerts/history${queryString ? `?${queryString}` : ''}`,
    );
  },

  /**
   * 获取告警统计
   */
  getAlertStats: (days?: number) => {
    const queryString = days ? `?days=${days}` : '';
    return api.get<ApiResponse<AlertStats[]>>(`/notifications/alerts/stats${queryString}`);
  },

  /**
   * 获取通知服务状态
   */
  getStatus: () => api.get<ApiResponse<NotificationStatus>>('/notifications/status'),
};
