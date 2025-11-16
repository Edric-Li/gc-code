import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * 模型定价数据接口
 */
interface ModelPricing {
  input_cost_per_token: number;
  output_cost_per_token: number;
  cache_creation_input_token_cost?: number;
  cache_read_input_token_cost?: number;
  litellm_provider?: string;
  max_input_tokens?: number;
  max_output_tokens?: number;
  supports_prompt_caching?: boolean;
}

/**
 * 费用计算结果接口
 */
export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  cacheCreateCost: number;
  cacheReadCost: number;
  ephemeral5mCost: number;
  ephemeral1hCost: number;
  totalCost: number;
  hasPricing: boolean;
  isLongContextRequest?: boolean;
  pricing: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
    ephemeral1h: number;
  };
}

/**
 * 使用量数据接口
 */
export interface UsageData {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
}

/**
 * 动态定价服务
 * 支持从 LiteLLM 仓库自动同步模型定价数据
 * 优化版：使用 NestJS HttpService，更好的类型支持
 */
@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);

  // 数据文件路径
  private readonly dataDir: string;
  private readonly pricingFile: string;
  private readonly fallbackFile: string;

  // 定价数据 URL (LiteLLM 官方仓库)
  private readonly pricingUrl =
    'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

  // 定价数据缓存
  private pricingData: Record<string, ModelPricing> | null = null;
  private lastUpdated: Date | null = null;

  // 更新间隔：24 小时
  private readonly updateInterval = 24 * 60 * 60 * 1000;

  // 1小时缓存定价 (ephemeral_1h) - USD per token
  private readonly ephemeral1hPricing: Record<string, number> = {
    // Opus 系列: $30/MTok
    'claude-opus-4-1': 0.00003,
    'claude-opus-4-1-20250805': 0.00003,
    'claude-3-opus': 0.00003,
    'claude-3-opus-20240229': 0.00003,

    // Sonnet 系列: $6/MTok
    'claude-3-5-sonnet': 0.000006,
    'claude-3-5-sonnet-20241022': 0.000006,
    'claude-3-5-sonnet-20240620': 0.000006,
    'claude-3-sonnet': 0.000006,
    'claude-3-sonnet-20240229': 0.000006,
    'claude-sonnet-4': 0.000006,
    'claude-sonnet-4-20250514': 0.000006,
    'claude-sonnet-4-5-20250929': 0.000006,

    // Haiku 系列: $1.6/MTok
    'claude-3-5-haiku': 0.0000016,
    'claude-3-5-haiku-20241022': 0.0000016,
    'claude-3-haiku': 0.0000016,
    'claude-3-haiku-20240307': 0.0000016,
  };

  // 长上下文定价 (>200k tokens) - USD per token
  private readonly longContextPricing: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-20250514[1m]': {
      input: 0.000006, // $6/MTok
      output: 0.0000225, // $22.50/MTok
    },
  };

  constructor(private readonly httpService: HttpService) {
    // 初始化路径
    const rootDir = process.cwd();
    this.dataDir = path.join(rootDir, 'data');
    this.pricingFile = path.join(this.dataDir, 'model_pricing.json');
    this.fallbackFile = path.join(rootDir, 'resources', 'model-pricing', 'model_pricing.json');
  }

  /**
   * 模块初始化时执行
   */
  async onModuleInit() {
    await this.initialize();
  }

  /**
   * 初始化定价服务
   */
  private async initialize(): Promise<void> {
    try {
      // 确保 data 目录存在
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        this.logger.log('Created data directory for pricing files');
      }

      // 检查并更新定价数据
      await this.checkAndUpdatePricing();

      // 设置定时更新任务
      setInterval(() => {
        this.checkAndUpdatePricing().catch((err) =>
          this.logger.error(`Failed to update pricing: ${err.message}`)
        );
      }, this.updateInterval);

      this.logger.log('Pricing service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize pricing service: ${error.message}`);
      // 即使初始化失败，也尝试使用 fallback
      await this.useFallbackPricing();
    }
  }

  /**
   * 检查并更新定价数据
   */
  private async checkAndUpdatePricing(): Promise<void> {
    try {
      const needsUpdate = this.needsUpdate();

      if (needsUpdate) {
        this.logger.log('Updating model pricing data from LiteLLM...');
        await this.downloadPricingData();
      } else {
        // 不需要更新，加载现有数据
        await this.loadPricingData();
      }
    } catch (error) {
      this.logger.error(`Failed to check/update pricing: ${error.message}`);
      await this.useFallbackPricing();
    }
  }

  /**
   * 检查是否需要更新
   */
  private needsUpdate(): boolean {
    if (!fs.existsSync(this.pricingFile)) {
      this.logger.debug('Pricing file not found, will download');
      return true;
    }

    const stats = fs.statSync(this.pricingFile);
    const fileAge = Date.now() - stats.mtime.getTime();

    if (fileAge > this.updateInterval) {
      this.logger.debug(
        `Pricing file is ${Math.round(fileAge / (60 * 60 * 1000))} hours old, will update`
      );
      return true;
    }

    return false;
  }

  /**
   * 下载定价数据
   */
  private async downloadPricingData(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Record<string, ModelPricing>>(this.pricingUrl, {
          timeout: 30000,
        })
      );

      if (response.status === 200 && response.data) {
        // 保存到文件
        fs.writeFileSync(this.pricingFile, JSON.stringify(response.data, null, 2));

        // 更新内存缓存
        this.pricingData = response.data;
        this.lastUpdated = new Date();

        this.logger.log(
          `Pricing data downloaded successfully (${Object.keys(response.data).length} models)`
        );
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to download pricing data: ${error.message}`);
      throw error;
    }
  }

  /**
   * 加载定价数据
   */
  private async loadPricingData(): Promise<void> {
    try {
      if (fs.existsSync(this.pricingFile)) {
        const data = fs.readFileSync(this.pricingFile, 'utf-8');
        this.pricingData = JSON.parse(data);
        this.lastUpdated = fs.statSync(this.pricingFile).mtime;
        this.logger.debug(
          `Loaded pricing data from file (${Object.keys(this.pricingData).length} models)`
        );
      } else {
        await this.useFallbackPricing();
      }
    } catch (error) {
      this.logger.error(`Failed to load pricing data: ${error.message}`);
      await this.useFallbackPricing();
    }
  }

  /**
   * 使用 fallback 定价数据
   */
  private async useFallbackPricing(): Promise<void> {
    try {
      if (fs.existsSync(this.fallbackFile)) {
        const data = fs.readFileSync(this.fallbackFile, 'utf-8');
        this.pricingData = JSON.parse(data);
        this.logger.warn('Using fallback pricing data');
      } else {
        this.logger.error('Fallback pricing file not found');
        this.pricingData = null;
      }
    } catch (error) {
      this.logger.error(`Failed to load fallback pricing: ${error.message}`);
      this.pricingData = null;
    }
  }

  /**
   * 获取模型定价
   */
  getModelPricing(modelName: string): ModelPricing | null {
    if (!this.pricingData) {
      return null;
    }

    // 移除 [1m] 后缀（长上下文标记）
    const cleanModelName = modelName.replace('[1m]', '');

    return this.pricingData[cleanModelName] || null;
  }

  /**
   * 获取 ephemeral_1h 缓存定价
   */
  private getEphemeral1hPricing(modelName: string): number {
    const cleanModelName = modelName.replace('[1m]', '');
    return this.ephemeral1hPricing[cleanModelName] || 0.000006; // 默认 $6/MTok
  }

  /**
   * 计算费用
   * 支持 Prompt Caching (ephemeral_5m, ephemeral_1h)
   * 支持长上下文定价 (>200k tokens)
   */
  calculateCost(usage: UsageData, modelName: string): CostCalculation {
    // 检查是否为长上下文模型
    const isLongContextModel = modelName && modelName.includes('[1m]');
    let isLongContextRequest = false;
    let useLongContextPricing = false;

    if (isLongContextModel) {
      // 计算总输入 tokens
      const inputTokens = usage.input_tokens || 0;
      const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
      const cacheReadTokens = usage.cache_read_input_tokens || 0;
      const totalInputTokens = inputTokens + cacheCreationTokens + cacheReadTokens;

      // 如果总输入超过 200k，使用长上下文定价
      if (totalInputTokens > 200000) {
        isLongContextRequest = true;
        if (this.longContextPricing[modelName]) {
          useLongContextPricing = true;
        } else {
          // 使用第一个长上下文模型作为默认
          const defaultModel = Object.keys(this.longContextPricing)[0];
          if (defaultModel) {
            useLongContextPricing = true;
            this.logger.warn(
              `No specific 1M pricing for ${modelName}, using default from ${defaultModel}`
            );
          }
        }
      }
    }

    const pricing = this.getModelPricing(modelName);

    if (!pricing && !useLongContextPricing) {
      return {
        inputCost: 0,
        outputCost: 0,
        cacheCreateCost: 0,
        cacheReadCost: 0,
        ephemeral5mCost: 0,
        ephemeral1hCost: 0,
        totalCost: 0,
        hasPricing: false,
        isLongContextRequest: false,
        pricing: {
          input: 0,
          output: 0,
          cacheCreate: 0,
          cacheRead: 0,
          ephemeral1h: 0,
        },
      };
    }

    let inputCost = 0;
    let outputCost = 0;

    if (useLongContextPricing) {
      // 使用长上下文定价
      const longContextPrices =
        this.longContextPricing[modelName] ||
        this.longContextPricing[Object.keys(this.longContextPricing)[0]];

      inputCost = (usage.input_tokens || 0) * longContextPrices.input;
      outputCost = (usage.output_tokens || 0) * longContextPrices.output;

      this.logger.debug(
        `Using 1M context pricing for ${modelName}: input=$${longContextPrices.input}/token, output=$${longContextPrices.output}/token`
      );
    } else {
      // 使用正常定价
      inputCost = (usage.input_tokens || 0) * (pricing?.input_cost_per_token || 0);
      outputCost = (usage.output_tokens || 0) * (pricing?.output_cost_per_token || 0);
    }

    // 缓存读取费用
    const cacheReadCost =
      (usage.cache_read_input_tokens || 0) * (pricing?.cache_read_input_token_cost || 0);

    // 处理缓存创建费用
    let ephemeral5mCost = 0;
    let ephemeral1hCost = 0;
    let cacheCreateCost = 0;

    if (usage.cache_creation && typeof usage.cache_creation === 'object') {
      // 新格式：详细的缓存创建数据
      const ephemeral5mTokens = usage.cache_creation.ephemeral_5m_input_tokens || 0;
      const ephemeral1hTokens = usage.cache_creation.ephemeral_1h_input_tokens || 0;

      // 5分钟缓存
      ephemeral5mCost = ephemeral5mTokens * (pricing?.cache_creation_input_token_cost || 0);

      // 1小时缓存
      const ephemeral1hPrice = this.getEphemeral1hPricing(modelName);
      ephemeral1hCost = ephemeral1hTokens * ephemeral1hPrice;

      cacheCreateCost = ephemeral5mCost + ephemeral1hCost;
    } else if (usage.cache_creation_input_tokens) {
      // 旧格式：所有缓存创建 tokens 按 5分钟价格计算
      cacheCreateCost =
        (usage.cache_creation_input_tokens || 0) * (pricing?.cache_creation_input_token_cost || 0);
      ephemeral5mCost = cacheCreateCost;
    }

    const totalCost = inputCost + outputCost + cacheCreateCost + cacheReadCost;

    return {
      inputCost,
      outputCost,
      cacheCreateCost,
      cacheReadCost,
      ephemeral5mCost,
      ephemeral1hCost,
      totalCost,
      hasPricing: true,
      isLongContextRequest,
      pricing: {
        input: useLongContextPricing
          ? (
              this.longContextPricing[modelName] ||
              this.longContextPricing[Object.keys(this.longContextPricing)[0]]
            )?.input || 0
          : pricing?.input_cost_per_token || 0,
        output: useLongContextPricing
          ? (
              this.longContextPricing[modelName] ||
              this.longContextPricing[Object.keys(this.longContextPricing)[0]]
            )?.output || 0
          : pricing?.output_cost_per_token || 0,
        cacheCreate: pricing?.cache_creation_input_token_cost || 0,
        cacheRead: pricing?.cache_read_input_token_cost || 0,
        ephemeral1h: this.getEphemeral1hPricing(modelName),
      },
    };
  }

  /**
   * 格式化费用显示
   */
  formatCost(cost: number): string {
    if (cost === 0) {
      return '$0.000000';
    }
    if (cost < 0.000001) {
      return `$${cost.toExponential(2)}`;
    }
    if (cost < 0.01) {
      return `$${cost.toFixed(6)}`;
    }
    if (cost < 1) {
      return `$${cost.toFixed(4)}`;
    }
    return `$${cost.toFixed(2)}`;
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    hasPricingData: boolean;
    lastUpdated: Date | null;
    modelsCount: number;
  } {
    return {
      hasPricingData: !!this.pricingData,
      lastUpdated: this.lastUpdated,
      modelsCount: this.pricingData ? Object.keys(this.pricingData).length : 0,
    };
  }
}
