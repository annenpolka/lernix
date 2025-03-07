import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { DifficultyLevel, PromptParams, QuestionCategory } from '../../../domain/models/types.js';
import { createOpenAIAdapter } from '../../../infrastructure/llm/LLMAdapter.js';

// モックのインポート
import { setupOpenAIApiMock } from '../../mocks/openai-api-mock.js';
import { testQuestionData } from '../../mocks/openai-mock-data.js';

// モックプロンプトパラメータ
const mockPromptParams: PromptParams = {
  category: 'programming' as QuestionCategory,
  difficulty: 'medium' as DifficultyLevel,
  count: 1,
};

describe('LLMAdapter', () => {
  // OpenAI APIのモックをセットアップ
  const openaiMock = setupOpenAIApiMock();

  beforeEach(() => {
    // テスト毎にモックをリセット
    openaiMock.reset();
  });

  afterAll(() => {
    // テスト終了後にモックを復元
    openaiMock.restore();
  });

  describe('OpenAI Adapter', () => {
    it('正常なレスポンスを処理できること', async () => {
      // デフォルトモックは正常なレスポンスを返す

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.questions?.[0].text).toBe(testQuestionData[0].text);
    }, 10000);

    it('APIエラー時に適切なエラーレスポンスを返すこと', async () => {
      // エラーレスポンスをモック
      openaiMock.mockError('API Error');

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    }, 10000);

    it('不正なJSONレスポンスを処理できること', async () => {
      // 不正なJSONをモック
      openaiMock.mockInvalidJson();

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON解析エラー');
    }, 10000);
  });

  describe('言語パラメータの処理', () => {
    it('言語パラメータが指定されている場合、適切なプロンプトが生成されること', async () => {
      // モックの実装をスパイに置き換え
      let capturedBody: any;
      openaiMock.customizeMock((url: string, options: { body: string }) => {
        // リクエストボディをキャプチャ
        capturedBody = JSON.parse(options.body);

        // 正常なレスポンスを返す
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(testQuestionData),
                },
              },
            ],
          }),
        });
      });

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      await adapter.generateQuestions({
        ...mockPromptParams,
        language: 'en',
      });

      // リクエストの検証
      const userContent = capturedBody.messages[1].content;
      expect(userContent).toContain('language: en');
    }, 10000);

    it('言語パラメータが指定されていない場合、デフォルト言語（ja）が使用されること', async () => {
      // モックの実装をスパイに置き換え
      let capturedBody: any;
      openaiMock.customizeMock((url: string, options: { body: string }) => {
        // リクエストボディをキャプチャ
        capturedBody = JSON.parse(options.body);

        // 正常なレスポンスを返す
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(testQuestionData),
                },
              },
            ],
          }),
        });
      });

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      await adapter.generateQuestions(mockPromptParams);

      // リクエストの検証
      const userContent = capturedBody.messages[1].content;
      expect(userContent).toContain('language: ja');
    }, 10000);
  });
});