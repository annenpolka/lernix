import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestionGenerationService } from '../../../domain/services/QuestionGenerationService.js';
import type {
  GenerationRequest,
  LLMAdapter,
  LLMResponse,
  Question
} from '../../../domain/models/types.js';

// モックデータ
const mockQuestion: Question = {
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

const mockRequest: GenerationRequest = {
  category: 'programming',
  difficulty: 'medium',
  count: 1,
};

describe('QuestionGenerationService', () => {
  // モックアダプターの準備
  let mockLLMAdapter: LLMAdapter;

  beforeEach(() => {
    // テスト毎にモックをリセット
    mockLLMAdapter = {
      generateQuestions: vi.fn(),
    };
  });

  describe('generateQuestions', () => {
    it('LLMから問題を正常に生成できること', async () => {
      // モックLLMアダプターの応答を設定
      const successResponse: LLMResponse = {
        success: true,
        questions: [mockQuestion],
      };

      mockLLMAdapter.generateQuestions = vi.fn().mockResolvedValue(successResponse);

      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMAdapter,
      });

      const result = await questionService.generateQuestions(mockRequest);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(mockLLMAdapter.generateQuestions).toHaveBeenCalledWith({
        category: mockRequest.category,
        difficulty: mockRequest.difficulty,
        count: mockRequest.count,
      });
    });

    it('LLMが失敗した場合はエラーを返すこと', async () => {
      // モックLLMアダプターのエラー応答を設定
      const errorResponse: LLMResponse = {
        success: false,
        error: '問題生成に失敗しました',
      };

      mockLLMAdapter.generateQuestions = vi.fn().mockResolvedValue(errorResponse);

      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMAdapter,
      });

      const result = await questionService.generateQuestions(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('問題生成に失敗しました');
    });

    it('キャッシュがある場合はLLMを呼び出さないこと', async () => {
      // キャッシュマネージャーをモック
      const mockCacheManager = {
        get: vi.fn().mockReturnValue([mockQuestion]),
        set: vi.fn(),
      };

      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMAdapter,
        cacheManager: mockCacheManager,
      });

      const result = await questionService.generateQuestions(mockRequest);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(mockLLMAdapter.generateQuestions).not.toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('問題の最小品質チェックが失敗した場合は問題をフィルタリングすること', async () => {
      // 問題を2つ含むレスポンス（1つは品質が低い）
      const mockQuestionLowQuality = {
        ...mockQuestion,
        id: '2',
        text: '', // 空の問題文は低品質とみなす
      };

      const successResponse: LLMResponse = {
        success: true,
        questions: [mockQuestion, mockQuestionLowQuality],
      };

      mockLLMAdapter.generateQuestions = vi.fn().mockResolvedValue(successResponse);

      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMAdapter,
        validateQuestion: (q) => q.text.length > 0, // 簡易的な検証関数
      });

      const result = await questionService.generateQuestions(mockRequest);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1); // 低品質の問題が除外される
      expect(result.questions?.[0].id).toBe('1');
    });
  });
});