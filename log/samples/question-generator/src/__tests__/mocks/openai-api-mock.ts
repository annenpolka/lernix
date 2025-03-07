/**
 * OpenAI API モック実装
 */
import { vi } from 'vitest';
import { createMockOpenAIResponse } from './openai-mock-data.js';

/**
 * OpenAI APIのフェッチモックをセットアップする
 */
export const setupOpenAIApiMock = () => {
  // globalのfetchをモック
  const mockFetch = vi.fn();

  // 元のfetch関数を保存
  const originalFetch = global.fetch;

  // モックレスポンスの設定
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => createMockOpenAIResponse(),
  });

  // グローバルのfetchをモックに置き換え
  global.fetch = mockFetch;

  return {
    /**
     * モックをリセットする
     */
    reset: () => {
      mockFetch.mockClear();
    },

    /**
     * モックをカスタマイズする
     * @param implementation カスタムの実装（成功/失敗/エラーなど）
     */
    customizeMock: (implementation: any) => {
      mockFetch.mockReset();
      mockFetch.mockImplementation(implementation);
    },

    /**
     * 特定のエラーレスポンスを返すように設定
     */
    mockError: (errorMessage: string) => {
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));
    },

    /**
     * 不正なJSONを返すように設定
     */
    mockInvalidJson: () => {
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
    },

    /**
     * モックを元に戻す
     */
    restore: () => {
      global.fetch = originalFetch;
      console.log('[MOCK] fetchのモックを解除しました');
    }
  };
};