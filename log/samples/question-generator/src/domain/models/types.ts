/**
 * 問題生成サンプルプロジェクトの型定義
 */

/**
 * 問題の難易度レベル
 */
export type DifficultyLevel =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert';

/**
 * 問題のカテゴリ
 */
export type QuestionCategory =
  | 'math'
  | 'science'
  | 'history'
  | 'language'
  | 'programming'
  | 'general_knowledge';

/**
 * 問題の選択肢
 */
export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

/**
 * 問題エンティティ
 */
export type Question = {
  id: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  text: string;
  choices: Choice[];
  explanation: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
};

/**
 * 問題生成リクエスト
 */
export type GenerationRequest = {
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  count: number;
  excludeIds?: string[];
  additionalInstructions?: string;
};

/**
 * LLMへの問題生成プロンプト構築パラメータ
 */
export type PromptParams = {
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  count: number;
  excludeIds?: string[];
  additionalInstructions?: string;
};

/**
 * LLMレスポンス
 */
export type LLMResponse = {
  success: boolean;
  questions?: Question[];
  error?: string;
};

/**
 * 問題の検証結果
 */
export type ValidationResult = {
  valid: boolean;
  question?: Question;
  errors: string[];
  qualityScore?: number;
  similarityScore?: number;
  needsImprovement?: boolean;
};

/**
 * キャッシュ管理の型
 */
export type CacheOptions = {
  ttl: number; // 有効期限（秒）
  checkPeriod?: number; // チェック間隔（秒）
};

/**
 * フォールバック戦略の種類
 */
export type FallbackStrategy =
  | 'retry_different_provider'
  | 'simplify_prompt'
  | 'use_cached_similar'
  | 'use_emergency_set';

/**
 * LLMアダプターの型定義
 */
export type LLMAdapter = {
  generateQuestions: (params: PromptParams) => Promise<LLMResponse>;
};