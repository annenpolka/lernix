/**
 * LLMアダプター: 異なるLLMプロバイダーへの統一インターフェースを提供
 */
import type { LLMResponse, PromptParams } from '../../domain/models/types.js';

/**
 * LLMアダプターの型定義
 */
export type LLMAdapter = {
  generateQuestions: (params: PromptParams) => Promise<LLMResponse>;
};

// OpenAIアダプターは分離されたファイルに移動しました: OpenAIAdapter.ts
// Geminiアダプターは分離されたファイルに移動しました: GeminiAdapter.ts

// 外部へエクスポート
export { createOpenAIAdapter, type OpenAIAdapterConfig, OPENAI_MODELS } from './OpenAIAdapter.js';
export { createGeminiAdapter, type GeminiAdapterConfig, GEMINI_MODELS } from './GeminiAdapter.js';