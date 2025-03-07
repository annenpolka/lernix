import { beforeEach, describe, expect, it } from 'vitest';
import type { GenerationRequest } from '../../../domain/models/types.js';
import { createQuestionGenerationService } from '../../../domain/services/QuestionGenerationService.js';

// モックのインポート
import { createMockCacheManager, createMockLLMAdapter } from '../../mocks/question-service-mock.js';

// モックリクエスト
const mockRequest: GenerationRequest = {
  category: 'programming',
  difficulty: 'medium',
  count: 1,
};

describe('QuestionGenerationService', () => {
  // モックの準備
  let mockLLMService: ReturnType<typeof createMockLLMAdapter>;
  let mockCache: ReturnType<typeof createMockCacheManager>;

  beforeEach(() => {
    // テスト毎にモックをリセット
    mockLLMService = createMockLLMAdapter();
    mockCache = createMockCacheManager();
  });

  describe('generateQuestions', () => {
    it('LLMから問題を正常に生成できること', async () => {
      // モックLLMアダプターの応答を設定
      mockLLMService.mockSuccess();

      // サービスの作成
      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMService.adapter,
      });

      // 問題生成を実行
      const result = await questionService.generateQuestions(mockRequest);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(mockLLMService.adapter.generateQuestions).toHaveBeenCalledWith({
        category: mockRequest.category,
        difficulty: mockRequest.difficulty,
        count: mockRequest.count,
      });
    });

    it('LLMが失敗した場合はエラーを返すこと', async () => {
      // モックLLMアダプターのエラー応答を設定
      mockLLMService.mockError();

      // サービスの作成
      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMService.adapter,
      });

      // 問題生成を実行
      const result = await questionService.generateQuestions(mockRequest);

      // 検証
      expect(result.success).toBe(false);
      expect(result.error).toBe('問題生成に失敗しました');
    });

    it('キャッシュがある場合はLLMを呼び出さないこと', async () => {
      // サービスの作成（キャッシュマネージャー付き）
      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMService.adapter,
        cacheManager: mockCache,
      });

      // 問題生成を実行
      const result = await questionService.generateQuestions(mockRequest);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(mockLLMService.adapter.generateQuestions).not.toHaveBeenCalled();
      expect(mockCache.get).toHaveBeenCalled();
    });

    it('問題の最小品質チェックが失敗した場合は問題をフィルタリングすること', async () => {
      // 混合品質のレスポンスを設定
      mockLLMService.mockMixedQuality();

      // 品質チェック付きサービスの作成
      const questionService = createQuestionGenerationService({
        llmAdapter: mockLLMService.adapter,
        validateQuestion: (q) => q.text.length > 0, // 簡易的な検証関数
      });

      // 問題生成を実行
      const result = await questionService.generateQuestions(mockRequest);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1); // 低品質の問題が除外される
      expect(result.questions?.[0].id).toBe('1');
    });
  });
});