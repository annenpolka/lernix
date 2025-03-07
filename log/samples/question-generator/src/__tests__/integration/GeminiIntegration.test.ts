import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    DifficultyLevel,
    GenerationRequest,
    Question,
    QuestionCategory
} from '../../domain/models/types.js';

// テストヘルパーとモックのインポート
import { GEMINI_MODELS } from '../../infrastructure/llm/GeminiAdapter.js';
import { getTestConfig, isApiTestMode, logTestConfig, showApiModeWarning } from '../helpers/test-utils.js';
import { setupGeminiApiMock, useRealGeminiApi } from '../mocks/gemini-api-mock.js';

// APIクライアントとサービスのインポート
import { createQuestionGenerationService } from '../../domain/services/QuestionGenerationService.js';
import { createGeminiAdapter } from '../../infrastructure/llm/GeminiAdapter.js';

// テスト設定を出力
logTestConfig();

// テスト用のモックまたはAPI実装の設定
let geminiApiMock = isApiTestMode() ? null : setupGeminiApiMock();
if (isApiTestMode()) {
  useRealGeminiApi();
}

// テスト用リクエスト
const testRequest: GenerationRequest = {
  category: 'programming' as QuestionCategory,
  difficulty: 'medium' as DifficultyLevel,
  count: isApiTestMode() ? getTestConfig().apiModeQuestionCount : 3,
  language: 'ja'
};

describe('Gemini統合テスト', () => {
  beforeAll(() => {
    // テストモードに応じた初期化 (モックはすでに設定済み)
    if (isApiTestMode()) {
      console.log('[API] 実際のAPIを使用してテストを実行します');
    } else {
      console.log('[MOCK] モックを使用してテストを実行します');
    }
  });

  afterAll(() => {
    // テスト終了時のクリーンアップ
    if (!isApiTestMode() && geminiApiMock) {
      geminiApiMock.restore();
    }
  });

  beforeEach(() => {
    // 各テスト前のモックリセット
    if (!isApiTestMode() && geminiApiMock) {
      geminiApiMock.reset();
    }
  });

  describe('Gemini LLMアダプター単体のテスト', () => {
    it('Geminiアダプターが問題を生成できること', async () => {
      // API使用時の警告表示
      showApiModeWarning();

      // Geminiアダプターを作成
      const adapter = createGeminiAdapter({
        apiKey: getTestConfig().apiKey,
        model: getTestConfig().model
      });

      // 問題生成を実行
      const result = await adapter.generateQuestions(testRequest);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toBeDefined();
      if (result.questions) {
        expect(result.questions.length).toBeGreaterThan(0);

        // 各問題の形式を検証
        const question = result.questions[0];
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('choices');
        expect(question.choices.length).toBe(4);

        // 少なくとも1つの正解選択肢があることを確認
        const correctChoices = question.choices.filter(c => c.isCorrect);
        expect(correctChoices.length).toBeGreaterThan(0);
      }
    }, 30000);

    it('無効なAPIキーでエラーを返すこと', async () => {
      // 無効なAPIキーを設定
      const adapter = createGeminiAdapter({
        apiKey: 'invalid-api-key',
        model: getTestConfig().model
      });

      // モックモードの場合、エラーレスポンスをカスタマイズ
      if (!isApiTestMode() && geminiApiMock) {
        geminiApiMock.customizeMock(() => {
          throw new Error('API key not valid');
        });
      }

      // 問題生成を実行
      const result = await adapter.generateQuestions(testRequest);

      // エラーレスポンスの検証
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  });

  describe('QuestionGenerationServiceとの統合テスト', () => {
    it('サービスとアダプターが連携して問題を生成できること', async () => {
      // Geminiアダプターを作成
      const adapter = createGeminiAdapter({
        apiKey: getTestConfig().apiKey,
        model: getTestConfig().model
      });

      // サービスを作成し、アダプターを注入
      const service = createQuestionGenerationService({
        llmAdapter: adapter
      });

      // 問題生成を実行
      const result = await service.generateQuestions(testRequest);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toBeDefined();
      if (result.questions) {
        expect(result.questions.length).toBeGreaterThan(0);
      }
    }, 30000);

    it('カスタム検証関数で低品質の問題がフィルタリングされること', async () => {
      // モックをリセット
      if (!isApiTestMode() && geminiApiMock) {
        geminiApiMock.reset();
        geminiApiMock.reset();
        geminiApiMock.resetImplementation();
      }

      // カスタム検証関数（長さが短すぎる問題文を除外する）
      const validateQuestion = (question: Question) => {
        return question.text.length >= 20; // 問題文が20文字以上であること
      };

      // アダプターを作成
      const questionService = createQuestionGenerationService({
        llmAdapter: createGeminiAdapter({
          apiKey: process.env.GEMINI_API_KEY || 'dummy-key',
          model: process.env.GEMINI_MODEL || GEMINI_MODELS["gemini-2.0-flash"]
        }),
        validateQuestion: validateQuestion // カスタム検証関数を設定
      });

      // 問題を生成
      const result = await questionService.generateQuestions({
        category: 'programming',
        difficulty: 'medium',
        count: 1
      });

      // 検証
      expect(result.success).toBe(true);
      if (result.questions && result.questions.length > 0) {
        // すべての問題が厳格な検証基準を満たしていることを確認
        result.questions.forEach(q => {
          expect(q.text.length).toBeGreaterThanOrEqual(20);
        });
      } else {
        // モックの問題が検証をパスしたことを確認
        expect(result.questions).toBeDefined();
        expect(result.questions?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('spyOnを使用した振る舞い検証', () => {
    it('アダプターのgenerateQuestionsが正しいパラメータで呼び出されることを確認', async () => {
      // Geminiアダプターを作成
      const adapter = createGeminiAdapter({
        apiKey: getTestConfig().apiKey,
        model: getTestConfig().model
      });

      // アダプターのgenerateQuestionsメソッドをスパイ
      const generateQuestionsSpy = vi.spyOn(adapter, 'generateQuestions');

      // サービスを作成し、アダプターを注入
      const service = createQuestionGenerationService({
        llmAdapter: adapter
      });

      // テスト用リクエスト
      const spyTestRequest: GenerationRequest = {
        category: 'science' as QuestionCategory,
        difficulty: 'easy' as DifficultyLevel,
        count: 2,
        language: 'ja'
      };

      // 問題生成を実行
      await service.generateQuestions(spyTestRequest);

      // スパイの検証
      expect(generateQuestionsSpy).toHaveBeenCalledTimes(1);
      expect(generateQuestionsSpy).toHaveBeenCalledWith(spyTestRequest);

      // スパイをリセット
      generateQuestionsSpy.mockRestore();
    }, 30000);

    it('サービス内で処理の流れが正しいことをspyOnで確認', async () => {
      // サービスを作成
      const service = createQuestionGenerationService({
        llmAdapter: createGeminiAdapter({
          apiKey: getTestConfig().apiKey,
          model: getTestConfig().model
        })
      });

      // サービスの内部メソッドをスパイ
      const validateQuestionsSpy = vi.spyOn(service as any, 'validateQuestions');

      // 問題生成を実行
      await service.generateQuestions(testRequest);

      // 検証メソッドが呼ばれたことを確認
      expect(validateQuestionsSpy).toHaveBeenCalled();
    }, 30000);
  });

  describe('構造化出力(Structured Outputs)の検証', () => {
    it('Structured Outputs機能が正しいJSON形式を返すこと', async () => {
      // Geminiアダプターを作成
      const adapter = createGeminiAdapter({
        apiKey: getTestConfig().apiKey,
        model: getTestConfig().model
      });

      // 問題生成を実行
      const result = await adapter.generateQuestions({
        ...testRequest,
        count: 1 // 1問だけリクエスト
      });

      expect(result.success).toBe(true);
      if (result.questions && result.questions.length > 0) {
        const question = result.questions[0];

        // 基本的な構造の検証
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('category', 'programming');
        expect(question).toHaveProperty('difficulty', 'medium');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('choices');
        expect(question).toHaveProperty('explanation');

        // 選択肢の検証
        expect(Array.isArray(question.choices)).toBe(true);
        expect(question.choices.length).toBe(4);

        // 選択肢の形式を検証
        question.choices.forEach(choice => {
          expect(choice).toHaveProperty('id');
          expect(choice).toHaveProperty('text');
          expect(choice).toHaveProperty('isCorrect');
          expect(typeof choice.isCorrect).toBe('boolean');
        });

        // 少なくとも1つの正解選択肢があることを確認
        const correctCount = question.choices.filter(c => c.isCorrect).length;
        expect(correctCount).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('環境変数からの設定読み込み', () => {
    it('環境変数からAPIキーとモデルを読み込めること', () => {
      const config = getTestConfig();
      expect(config.apiKey).toBeDefined();
      expect(config.apiKey.length).toBeGreaterThan(0);
      expect(config.model).toBeDefined();
      expect(config.model.length).toBeGreaterThan(0);
    });
  });
});