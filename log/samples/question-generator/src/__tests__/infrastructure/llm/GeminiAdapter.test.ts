import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DifficultyLevel, PromptParams, QuestionCategory } from '../../../domain/models/types.js';
import { createGeminiAdapter } from '../../../infrastructure/llm/GeminiAdapter.js';
import { testQuestionData } from '../../mocks/gemini-mock-data.js';
import { setupGeminiApiMock } from '../../mocks/gemini-api-mock.js';

// テストモードを明示的に設定
process.env.TEST_MODE = 'mock';

// vi.Mockのインポート（型安全性のため）
import type { Mock } from 'vitest';

// テスト用のモデル名
const TEST_MODEL = 'gemini-2.0-flash';

// モックの設定
vi.mock('@google/generative-ai', () => {
  const generateContentMock = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => {
      return {
        getGenerativeModel: vi.fn().mockImplementation(({ model }) => {
          return {
            generateContent: generateContentMock
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

// generateContentのモックを取得する
const getGenerateContentMock = () => {
  // vi.mock内でモックされた実装を取得
  return vi.fn() as Mock;
};

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

    // モックの設定を上書き
    vi.mock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => {
          return {
            getGenerativeModel: vi.fn().mockImplementation(({ model }) => {
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

  describe('spyOnを使用したメソッド呼び出しの検証', () => {
    it('generateContentが正しいパラメータで呼び出されること', async () => {
      // generateContentのスパイを設定
      const generateContentSpy = vi.fn().mockResolvedValue({
        response: {
          text: () => Promise.resolve(JSON.stringify(testQuestionData))
        }
      });

      // モックを上書き
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: generateContentSpy
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

      // アダプターの作成と実行
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });
      await adapter.generateQuestions(mockPromptParams);

      // generateContentが呼び出されたことを確認
      expect(generateContentSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gemini Adapter基本機能', () => {
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
      // エラーケース: エラーをスローする
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
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

      // アダプターの作成と実行
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });
      const result = await adapter.generateQuestions(mockPromptParams);

      // 検証
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('不正なJSONレスポンスを処理できること', async () => {
      // 不正なJSONレスポンスをカスタマイズ
      vi.mock('@google/generative-ai', () => {
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

  describe('プロンプト生成機能の検証', () => {
    it('buildPromptメソッドが正しくプロンプトを生成すること', async () => {
      // アダプターインスタンスを作成
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      // プロンプト生成をキャプチャするためのモック
      let capturedPrompt: string = '';

      // generateContentをモックして内部で生成されるプロンプトをキャプチャ
      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockImplementation((request: any) => {
                    // プロンプトをキャプチャ
                    capturedPrompt = request.contents[0].parts[0].text;

                    return Promise.resolve({
                      response: {
                        text: () => Promise.resolve(JSON.stringify(testQuestionData))
                      }
                    });
                  })
                };
              })
            };
          }),
          SchemaType: { STRING: 'string', OBJECT: 'object', ARRAY: 'array', BOOLEAN: 'boolean' }
        };
      });
    });
  });

  describe('言語パラメータの処理', () => {
    it('言語パラメータが英語の場合、適切なプロンプトが生成されること', async () => {
      // プロンプトをキャプチャするためのモック
      let capturedPrompt = '';

      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockImplementation((request: any) => {
                    // プロンプトをキャプチャ
                    capturedPrompt = request.contents[0].parts[0].text;

                    // 正常なレスポンスを返す
                    return Promise.resolve({
                      response: {
                        text: () => Promise.resolve(JSON.stringify(testQuestionData))
                      }
                    });
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

      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      await adapter.generateQuestions({
        ...mockPromptParams,
        language: 'en'
      });

      // キャプチャしたプロンプトの検証
      expect(capturedPrompt).toContain('language: en');
      expect(capturedPrompt).toContain('Generate');
    });

    it('言語パラメータが指定されていない場合、デフォルト言語（ja）が使用されること', async () => {
      // プロンプトをキャプチャするためのモック
      let capturedPrompt = '';

      vi.mock('@google/generative-ai', () => {
        return {
          GoogleGenerativeAI: vi.fn().mockImplementation(() => {
            return {
              getGenerativeModel: vi.fn().mockImplementation(() => {
                return {
                  generateContent: vi.fn().mockImplementation((request: any) => {
                    // プロンプトをキャプチャ
                    capturedPrompt = request.contents[0].parts[0].text;

                    // 正常なレスポンスを返す
                    return Promise.resolve({
                      response: {
                        text: () => Promise.resolve(JSON.stringify(testQuestionData))
                      }
                    });
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

      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      await adapter.generateQuestions(mockPromptParams);

      // キャプチャしたプロンプトの検証
      expect(capturedPrompt).toContain('language: ja');
      expect(capturedPrompt).toContain('以下の条件に合致する問題を');
    });
  });

  describe('リクエストキャプチャとspyOnの組み合わせ', () => {
    it('モックAPIのリクエストキャプチャ機能を使用してプロンプトを検証', async () => {
      // GeminiApiMockのセットアップ
      const geminiMock = setupGeminiApiMock();

      // アダプターの作成
      const adapter = createGeminiAdapter({
        apiKey: 'test-key',
        model: TEST_MODEL
      });

      // テスト用のカスタムパラメータを含むリクエスト
      const specialRequest: PromptParams = {
        category: 'history' as QuestionCategory,
        difficulty: 'hard' as DifficultyLevel,
        count: 2,
        language: 'en',
        additionalInstructions: 'Focus on ancient civilizations'
      };

      // 実行
      await adapter.generateQuestions(specialRequest);

      // キャプチャされたリクエストの検証
      const requests = geminiMock.getCapturedRequests();
      expect(requests.length).toBeGreaterThan(0);

      // リクエストの内容を検証
      if (requests.length > 0) {
        const capturedPrompt = requests[0].contents[0].parts[0].text;

        // 言語が英語であることを確認
        expect(capturedPrompt).toContain('language: en');
        // 追加指示が含まれていることを確認
        expect(capturedPrompt).toContain('Focus on ancient civilizations');
        // カテゴリが指定されていることを確認
        expect(capturedPrompt).toContain('Category: history');
      }

      geminiMock.restore();
    });
  });
});