import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpenAIAdapter } from '../../../infrastructure/llm/LLMAdapter.js';
import type { LLMResponse, PromptParams, Question, QuestionCategory, DifficultyLevel } from '../../../domain/models/types.js';

// モックデータの作成
const mockPromptParams: PromptParams = {
  category: 'programming' as QuestionCategory,
  difficulty: 'medium' as DifficultyLevel,
  count: 1,
};

const mockSuccessResponse: LLMResponse = {
  success: true,
  questions: [
    {
      id: '1',
      category: 'programming',
      difficulty: 'medium',
      text: 'JavaScriptにおけるクロージャとは何ですか？',
      choices: [
        { id: 'a', text: '外部変数を参照する関数', isCorrect: true },
        { id: 'b', text: 'メモリリークの一種', isCorrect: false },
        { id: 'c', text: 'コールバック関数の別名', isCorrect: false },
        { id: 'd', text: 'イベントハンドラーの一種', isCorrect: false },
      ],
      explanation: 'クロージャは関数が宣言された時点のスコープにある変数を保持する関数です',
      createdAt: new Date(),
    },
  ],
};

const mockErrorResponse: LLMResponse = {
  success: false,
  error: 'API呼び出しエラー',
};

// モックAPIの設定
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LLMAdapter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('OpenAI Adapter', () => {
    it('正常なレスポンスを処理できること', async () => {
      // モックの応答を設定
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockSuccessResponse.questions),
              },
            },
          ],
        }),
      });

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.questions?.[0].text).toBe('JavaScriptにおけるクロージャとは何ですか？');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('APIエラー時に適切なエラーレスポンスを返すこと', async () => {
      // APIエラーをシミュレート
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('不正なJSONレスポンスを処理できること', async () => {
      // 不正なJSON応答をシミュレート
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"invalid JSON',
              },
            },
          ],
        }),
      });

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON解析エラー');
    });
  });
});