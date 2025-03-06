/**
 * 問題生成サービス
 * LLMを使用して問題を生成し、検証とキャッシュを管理します
 */
import type {
  LLMAdapter,
  GenerationRequest,
  LLMResponse,
  Question
} from '../models/types.js';

/**
 * キャッシュマネージャーの型
 */
type CacheManager = {
  get: (key: string) => Question[] | null;
  set: (key: string, value: Question[]) => void;
};

/**
 * 問題生成サービスの設定
 */
type QuestionGenerationServiceConfig = {
  llmAdapter: LLMAdapter;
  cacheManager?: CacheManager;
  validateQuestion?: (question: Question) => boolean;
};

/**
 * 問題生成サービスの型
 */
type QuestionGenerationService = {
  generateQuestions: (request: GenerationRequest) => Promise<LLMResponse>;
};

/**
 * キャッシュキーの生成
 */
const createCacheKey = (request: GenerationRequest): string => {
  return `${request.category}_${request.difficulty}_${request.count}`;
};

/**
 * 問題生成サービスの作成
 */
export const createQuestionGenerationService = (
  config: QuestionGenerationServiceConfig
): QuestionGenerationService => {
  const { llmAdapter, cacheManager, validateQuestion } = config;

  /**
   * 基本的な問題検証
   */
  const defaultValidator = (question: Question): boolean => {
    // 基本的な検証: 問題文、選択肢、解説があること
    return (
      question.text.length > 0 &&
      Array.isArray(question.choices) &&
      question.choices.length >= 2 &&
      question.explanation.length > 0
    );
  };

  // 実際に使用する検証関数
  const validator = validateQuestion || defaultValidator;

  /**
   * 問題生成の実行
   */
  const generateQuestions = async (request: GenerationRequest): Promise<LLMResponse> => {
    // キャッシュから問題を取得を試みる
    if (cacheManager) {
      const cacheKey = createCacheKey(request);
      const cachedQuestions = cacheManager.get(cacheKey);

      if (cachedQuestions && cachedQuestions.length >= request.count) {
        return {
          success: true,
          questions: cachedQuestions.slice(0, request.count),
        };
      }
    }

    // LLMを使用して問題を生成
    const llmResponse = await llmAdapter.generateQuestions(request);

    // LLMの応答が失敗した場合はそのまま返す
    if (!llmResponse.success || !llmResponse.questions) {
      return llmResponse;
    }

    // 問題の検証とフィルタリング
    const validQuestions = llmResponse.questions.filter(validator);

    // 結果をキャッシュに保存
    if (cacheManager && validQuestions.length > 0) {
      const cacheKey = createCacheKey(request);
      cacheManager.set(cacheKey, validQuestions);
    }

    return {
      success: true,
      questions: validQuestions,
    };
  };

  return {
    generateQuestions,
  };
};