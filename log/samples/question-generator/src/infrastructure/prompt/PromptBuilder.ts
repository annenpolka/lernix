/**
 * プロンプトビルダー
 * LLMごとのプロンプト生成を柔軟に構築するための関数型ビルダーパターン実装
 */
import type { DifficultyLevel, QuestionCategory, QuestionLanguage } from '../../domain/models/types.js';

/**
 * プロンプトビルダーの状態
 */
export type PromptBuilderState = {
  category?: QuestionCategory;
  difficulty?: DifficultyLevel;
  count?: number;
  language?: QuestionLanguage;
  excludeIds?: string[];
  additionalInstructions?: string;
};

/**
 * プロンプトビルダーインターフェース
 */
export type PromptBuilder = {
  withCategory: (category: QuestionCategory) => PromptBuilder;
  withDifficulty: (difficulty: DifficultyLevel) => PromptBuilder;
  withCount: (count: number) => PromptBuilder;
  withLanguage: (language: QuestionLanguage) => PromptBuilder;
  withExcludeIds: (excludeIds: string[]) => PromptBuilder;
  withAdditionalInstructions: (instructions: string) => PromptBuilder;
  build: () => string;
  buildSystemPrompt?: () => string;
  getState: () => PromptBuilderState;
};

/**
 * プロンプトビルダーファクトリ
 * 初期状態から新しいビルダーインスタンスを作成
 */
export const createPromptBuilder = (
  initialState: PromptBuilderState = {},
  buildFn: (state: PromptBuilderState) => string,
  buildSystemPromptFn?: (state: PromptBuilderState) => string
): PromptBuilder => {
  const state = { ...initialState };

  // 新しい状態で新しいビルダーを作成する内部関数
  const createNewBuilder = (newState: PromptBuilderState): PromptBuilder => {
    return createPromptBuilder({ ...state, ...newState }, buildFn, buildSystemPromptFn);
  };

  return {
    withCategory: (category) => createNewBuilder({ category }),
    withDifficulty: (difficulty) => createNewBuilder({ difficulty }),
    withCount: (count) => createNewBuilder({ count }),
    withLanguage: (language) => createNewBuilder({ language }),
    withExcludeIds: (excludeIds) => createNewBuilder({ excludeIds }),
    withAdditionalInstructions: (instructions) => createNewBuilder({ additionalInstructions: instructions }),
    build: () => buildFn(state),
    buildSystemPrompt: buildSystemPromptFn ? () => buildSystemPromptFn(state) : undefined,
    getState: () => ({ ...state }),
  };
};