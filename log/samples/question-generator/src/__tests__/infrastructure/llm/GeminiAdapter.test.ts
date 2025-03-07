import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DifficultyLevel, PromptParams, QuestionCategory } from '../../../domain/models/types.js';
import { createGeminiAdapter } from '../../../infrastructure/llm/GeminiAdapter.js';
import { testQuestionData } from '../../mocks/gemini-mock-data.js';

// テストモードを明示的に設定
process.env.TEST_MODE = 'mock';

// テスト用のモデル名
const TEST_MODEL = 'gemini-2.0-flash';

// モックプロンプトパラメータ
const mockPromptParams: PromptParams = {
  category: 'programming' as QuestionCategory,
  difficulty: 'medium' as DifficultyLevel,
  count: 1,
};

describe('GeminiAdapter', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    vi.clearAllMocks();
    vi.resetModules();

    // デフォルトのモック：正常なレスポンスを返す
    vi.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => {
          return {
            getGenerativeModel: vi.fn().mockImplementation(() => {
              return {
                generateContent: vi.fn().mockResolvedValue({
                  response: {
                    text: () => Promise.resolve(JSON.stringify(testQuestionData))
                  }
                })
              };
            })
          };
        }),
        SchemaType: {
          STRING: 'string',
          OBJECT: 'object',
          ARRAY: 'array',
          BOOLEAN: 'boolean'
        }
      };
    });

    console.log('[TEST] テストモード:', process.env.TEST_MODE, '使用モデル:', TEST_MODEL);
  });

  afterAll(() => {
    // テスト終了後にモックを復元
    vi.restoreAllMocks();
  });

  describe('基本機能テスト', () => {
    it('正常なレスポンスを処理できること', async () => {
      // アダプターの作成と実行
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });
      const result = await adapter.generateQuestions(mockPromptParams);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.questions?.[0].text).toBe(testQuestionData[0].text);
    });

    it('APIエラー時に適切なエラーレスポンスを返すこと', async () => {
      // エラーケース用のモックを設定
      vi.doMock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockRejectedValue(new Error('API Error: something went wrong'))
                };
              })
            };
          }),
          SchemaType: {
            STRING: 'string',
            OBJECT: 'object',
            ARRAY: 'array',
            BOOLEAN: 'boolean'
          }
        };
      });

      // モジュールをリロード
      vi.resetModules();
      const { createGeminiAdapter } = await import('../../../infrastructure/llm/GeminiAdapter.js');

      // アダプターの作成と実行
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });
      const result = await adapter.generateQuestions(mockPromptParams);

      // 検証
      expect(result.success).toBe(false);
      expect(result.error).toContain('API呼び出しエラー');
    });

    it('不正なJSONレスポンスを処理できること', async () => {
      // 不正なJSONレスポンスをカスタマイズ
      vi.doMock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockResolvedValue({
                    response: {
                      text: () => Promise.resolve('{"invalid JSON')
                    }
                  })
                };
              })
            };
          }),
          SchemaType: {
            STRING: 'string',
            OBJECT: 'object',
            ARRAY: 'array',
            BOOLEAN: 'boolean'
          }
        };
      });

      // モジュールをリロード
      vi.resetModules();
      const { createGeminiAdapter } = await import('../../../infrastructure/llm/GeminiAdapter.js');

      // アダプターの作成と実行
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });
      const result = await adapter.generateQuestions(mockPromptParams);

      // 検証
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON解析エラー');
    });
  });

  describe('パラメータ処理機能のテスト', () => {
    it('異なる質問カテゴリと難易度で処理できること', async () => {
      // モックを明示的に再設定
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockResolvedValue({
                    response: {
                      text: () => Promise.resolve(JSON.stringify(testQuestionData))
                    }
                  })
                };
              })
            };
          }),
          SchemaType: {
            STRING: 'string',
            OBJECT: 'object',
            ARRAY: 'array',
            BOOLEAN: 'boolean'
          }
        };
      });

      // アダプターの作成
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      // 異なるパラメータでテスト
      const customParams: PromptParams = {
        category: 'science' as QuestionCategory,
        difficulty: 'hard' as DifficultyLevel,
        count: 2,
        language: 'ja'
      };

      const result = await adapter.generateQuestions(customParams);

      // 基本的な成功検証
      expect(result.success).toBe(true);
      expect(result.questions).toBeDefined();
    });

    it('追加指示パラメータを処理できること', async () => {
      // モックを明示的に再設定
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockResolvedValue({
                    response: {
                      text: () => Promise.resolve(JSON.stringify(testQuestionData))
                    }
                  })
                };
              })
            };
          }),
          SchemaType: {
            STRING: 'string',
            OBJECT: 'object',
            ARRAY: 'array',
            BOOLEAN: 'boolean'
          }
        };
      });

      // アダプターの作成
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      // 追加指示を含むパラメータ
      const paramsWithInstructions: PromptParams = {
        ...mockPromptParams,
        additionalInstructions: '画像処理アルゴリズムに関する質問を含める'
      };

      const result = await adapter.generateQuestions(paramsWithInstructions);

      // 検証
      expect(result.success).toBe(true);
    });
  });

  describe('設定オプションのテスト', () => {
    it('異なるモデルパラメータで作成できること', async () => {
      // モックを明示的に再設定
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockResolvedValue({
                    response: {
                      text: () => Promise.resolve(JSON.stringify(testQuestionData))
                    }
                  })
                };
              })
            };
          }),
          SchemaType: {
            STRING: 'string',
            OBJECT: 'object',
            ARRAY: 'array',
            BOOLEAN: 'boolean'
          }
        };
      });

      // 異なるモデルでアダプターを作成
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: 'gemini-1.5-pro', // 異なるモデル
        temperature: 0.8,        // 温度パラメータを設定
        maxOutputTokens: 2048    // 最大トークン数を設定
      });

      const result = await adapter.generateQuestions(mockPromptParams);

      // 基本的な成功検証
      expect(result.success).toBe(true);
    });
  });
});