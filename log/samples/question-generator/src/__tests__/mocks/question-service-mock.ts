/**
 * Question Generation Service用モックデータ
 */
import { vi } from 'vitest';
import type { LLMAdapter, LLMResponse, Question } from '../../domain/models/types.js';

// モック問題データ
export const mockQuestion: Question = {
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
};

// LLMアダプターモックの作成
export const createMockLLMAdapter = () => {
  const mockAdapter: LLMAdapter = {
    generateQuestions: vi.fn(),
  };

  // 成功レスポンスの設定
  const successResponse: LLMResponse = {
    success: true,
    questions: [mockQuestion],
  };

  // エラーレスポンスの設定
  const errorResponse: LLMResponse = {
    success: false,
    error: '問題生成に失敗しました',
  };

  // 低品質問題を含むレスポンス
  const lowQualityQuestion: Question = {
    ...mockQuestion,
    id: '2',
    text: '', // 空の問題文は低品質とみなす
  };

  const mixedQualityResponse: LLMResponse = {
    success: true,
    questions: [mockQuestion, lowQualityQuestion],
  };

  // デフォルトの成功レスポンスを設定
  mockAdapter.generateQuestions = vi.fn().mockResolvedValue(successResponse);

  return {
    adapter: mockAdapter,
    mockSuccess: () => {
      mockAdapter.generateQuestions = vi.fn().mockResolvedValue(successResponse);
    },
    mockError: () => {
      mockAdapter.generateQuestions = vi.fn().mockResolvedValue(errorResponse);
    },
    mockMixedQuality: () => {
      mockAdapter.generateQuestions = vi.fn().mockResolvedValue(mixedQualityResponse);
    },
    reset: () => {
      vi.resetAllMocks();
    }
  };
};

// キャッシュマネージャーモックの作成
export const createMockCacheManager = () => {
  return {
    get: vi.fn().mockReturnValue([mockQuestion]),
    set: vi.fn(),
  };
};