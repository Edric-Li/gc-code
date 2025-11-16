/**
 * Claude API 接口定义
 */

export interface ClaudeMessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeMessageContent[];
}

export interface ClaudeMessagesRequest {
  model: string;
  messages: ClaudeMessage[];
  max_tokens: number;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  metadata?: {
    user_id?: string;
  };
  stop_sequences?: string[];
  system?: string;
}

export interface ClaudeMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    // Prompt Caching 支持
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    // Extended Prompt Caching (Ephemeral)
    cache_creation?: {
      ephemeral_5m_input_tokens?: number;
      ephemeral_1h_input_tokens?: number;
    };
  };
}

export interface ClaudeStreamEvent {
  type: string;
  message?: ClaudeMessagesResponse;
  index?: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
  usage?: {
    output_tokens: number;
  };
}

export interface ClaudeErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  organizationId?: string;
  projectId?: string;
  channelId?: string;
  channelTargetType?: 'CHANNEL' | 'PROVIDER';
  providerId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuthenticatedRequest extends Express.Request {
  apiKey: ApiKeyInfo;
}
