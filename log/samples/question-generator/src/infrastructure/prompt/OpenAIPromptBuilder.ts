/**
 * OpenAI用プロンプトビルダー
 * OpenAI APIの特性に最適化されたプロンプト生成
 */
import type { PromptBuilderState, PromptBuilder } from './PromptBuilder.js';
import { createBasePromptBuilder } from './basePromptBuilder.js';

/**
 * OpenAI用JSONスキーマを追加するプロンプト変換関数
 */
const appendOpenAIJsonSchema = (basePrompt: string, state: PromptBuilderState): string => {
  const { category, difficulty, count, excludeIds, additionalInstructions, language } = state;

  if (!category || !difficulty || !count) {
    return basePrompt;
  }

  // JSONスキーマの追加
  return `${basePrompt}\n
JSONスキーマ:
[
  {
    "id": "一意のID",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "text": "問題文",
    "choices": [
      { "id": "a", "text": "選択肢1", "isCorrect": true|false },
      { "id": "b", "text": "選択肢2", "isCorrect": true|false },
      { "id": "c", "text": "選択肢3", "isCorrect": true|false },
      { "id": "d", "text": "選択肢4", "isCorrect": true|false }
    ],
    "explanation": "解説文"
  }
]`;
};

/**
 * OpenAI固有の指示を追加するための関数
 * 現状は追加指示なし（将来的に必要があれば実装）
 */
const getOpenAISpecificInstructions = () => {
  return [];
};

/**
 * OpenAI用プロンプトビルダーの作成
 */
export const createOpenAIPromptBuilder = (initialState: PromptBuilderState = {}): PromptBuilder => {
  return createBasePromptBuilder(
    initialState,
    appendOpenAIJsonSchema,
    undefined, // デフォルトのシステムプロンプト生成関数を使用
    getOpenAISpecificInstructions
  );
};

/**
 * 後方互換性のための互換層：クラスベースのインターフェースをエミュレート
 */
export class OpenAIPromptBuilder {
  private builder: PromptBuilder;

  constructor(initialState: PromptBuilderState = {}) {
    this.builder = createOpenAIPromptBuilder(initialState);
  }

  withCategory(category: any) {
    this.builder = this.builder.withCategory(category);
    return this;
  }

  withDifficulty(difficulty: any) {
    this.builder = this.builder.withDifficulty(difficulty);
    return this;
  }

  withCount(count: number) {
    this.builder = this.builder.withCount(count);
    return this;
  }

  withLanguage(language: any) {
    this.builder = this.builder.withLanguage(language);
    return this;
  }

  withExcludeIds(excludeIds: string[]) {
    this.builder = this.builder.withExcludeIds(excludeIds);
    return this;
  }

  withAdditionalInstructions(instructions: string) {
    this.builder = this.builder.withAdditionalInstructions(instructions);
    return this;
  }

  build() {
    return this.builder.build();
  }

  buildSystemPrompt() {
    return this.builder.buildSystemPrompt ? this.builder.buildSystemPrompt() : '';
  }
}