/**
 * Gemini API モック実装
 */
import { vi } from 'vitest';
import { createMockApiResponse } from './gemini-mock-data.js';

// モックがすでに設定されているかのフラグ
let isMockSetup = false;

// モックの呼び出し情報を保存するための変数
let capturedRequests: any[] = [];

/**
 * Gemini APIのモックを設定する
 */
export const setupGeminiApiMock = () => {
  // モックデータ
  const mockGenerateContent = vi.fn();
  capturedRequests = [];

  if (!isMockSetup) {
    // @google/generative-aiモジュールをモック（初回のみ）
    vi.mock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => {
          console.log('[MOCK] GoogleGenerativeAI インスタンスを作成');
          return {
            getGenerativeModel: vi.fn().mockImplementation(({ model }) => {
              console.log('[MOCK] getGenerativeModel が呼び出されました');
              return {
                generateContent: mockGenerateContent
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

    isMockSetup = true;
  }

  // デフォルトのモック実装を設定
  mockGenerateContent.mockImplementation((request: any) => {
    console.log('[MOCK] generateContent が呼び出されました', request);

    // リクエストをキャプチャ
    capturedRequests.push(request);
    return Promise.resolve(createMockApiResponse());
  });

  return {
    /**
     * モックをリセットする
     */
    reset: () => {
      mockGenerateContent.mockClear();
      capturedRequests = [];
      console.log('[MOCK] モックをリセットしました');
    },

    /**
     * モックをカスタマイズする
     * @param implementation カスタムの実装
     */
    customizeMock: (implementation: (request: any) => Promise<any>) => {
      mockGenerateContent.mockImplementation(implementation);
      capturedRequests = [];
      console.log('[MOCK] モック実装をカスタマイズしました');
    },

    /**
     * モックの設定を元に戻す（カスタマイズをリセット）
     */
    resetImplementation: () => {
      mockGenerateContent.mockImplementation((request: any) => {
        console.log('[MOCK] モックレスポンスを生成', request);
        capturedRequests.push(request);
        return Promise.resolve(createMockApiResponse());
      });
      capturedRequests = [];
      console.log('[MOCK] モック実装をリセットしました');
    },

    /**
     * キャプチャしたリクエストを取得する
     */
    getCapturedRequests: () => {
      return capturedRequests;
    },

    /**
     * 特定のモック関数に対してspyOnを設定する
     * @param obj モック対象のオブジェクト
     * @param method スパイするメソッド名
     */
    spyOn: (obj: any, method: string) => {
      console.log(`[MOCK] ${method}メソッドにスパイを設定しました`);
      return vi.spyOn(obj, method);
    },

    /**
     * テスト終了時にモックを完全に解除する
     */
    restore: () => {
      // テスト間では解除せず、全テスト終了時にのみ解除する
      console.log('[MOCK] GoogleGenerativeAIのモックを解除しました');
      vi.restoreAllMocks();
      capturedRequests = [];
      isMockSetup = false;
    }
  };
};

/**
 * Gemini APIの実際の実装を使用する
 */
export const useRealGeminiApi = () => {
  vi.resetModules();
  vi.unmock('@google/generative-ai');
  isMockSetup = false;
  console.log('[API] GoogleGenerativeAIの実装を使用します');
};