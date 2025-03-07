/**
 * Gemini用プロンプトビルダー
 * Gemini APIの特性と構造化出力に最適化されたプロンプト生成
 */
import type { PromptBuilderState, PromptBuilder } from './PromptBuilder.js';
import { createBasePromptBuilder } from './basePromptBuilder.js';
import type { DifficultyLevel, QuestionCategory, QuestionLanguage } from '../../domain/models/types.js';

/**
 * Gemini固有の指示を追加するためのカスタマイザー関数
 */
const getGeminiSpecificInstructions = (lang: QuestionLanguage): string[] => {
  // Gemini特有の指示（言語に応じて異なる場合は条件分岐可能）
  if (lang === 'en') {
    return [
      'Assign a unique ID for each question',
      'Important: Response must be a valid JSON array',
      'Important: Avoid special characters that could break JSON parsing',
      'Important: Maintain a simple, well-formatted style for any formulas'
    ];
  }

  return [
    '各問題には一意のIDを割り当ててください',
    '重要: 応答は必ず有効なJSON配列形式にしてください',
    '重要: JSON解析を壊す可能性のある特殊文字は避けてください',
    '重要: 数式を使用する場合は、シンプルで整形された形式を維持してください'
  ];
};

/**
 * Geminiのプロンプト変換関数
 */
const buildGeminiSpecificPrompt = (basePrompt: string, state: PromptBuilderState): string => {
  // Gemini固有の追加処理が必要な場合はここに実装
  // 現在は基本プロンプトをそのまま返す（カスタマイズ済み）
  if (!state.category || !state.difficulty || !state.count) {
    return basePrompt;
  }

  return basePrompt;
};


/**
 * 問題選択肢のJSONスキーマ定義（単純な参照用）
 */
export const choiceSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    text: { type: "string" },
    isCorrect: { type: "boolean" }
  },
  required: ["id", "text", "isCorrect"],
  propertyOrdering: ['id', 'text', 'isCorrect']
};

/**
 * 問題のJSONスキーマ定義（単純な参照用）
 */
export const createQuestionSchema = (category: QuestionCategory, difficulty: DifficultyLevel) => {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        category: {
          type: "string",
          enum: [category]
        },
        difficulty: {
          type: "string",
          enum: [difficulty]
        },
        text: { type: "string" },
        choices: {
          type: "array",
          items: choiceSchema,
          minItems: 4,
          maxItems: 4
        },
        explanation: { type: "string" }
      },
      required: ['id', 'category', 'difficulty', 'text', 'choices', 'explanation'],
      propertyOrdering: ['id', 'category', 'difficulty', 'text', 'choices', 'explanation']
    }
  };
};

/**
 * Gemini用プロンプトビルダーの作成
 */
export const createGeminiPromptBuilder = (initialState: PromptBuilderState = {}): PromptBuilder => {
  return createBasePromptBuilder(initialState, buildGeminiSpecificPrompt, undefined, getGeminiSpecificInstructions);
};

/**
 * 後方互換性のための互換層：クラスベースのインターフェースをエミュレート
 */
export class GeminiPromptBuilder {
  private builder: PromptBuilder;

  constructor(initialState: PromptBuilderState = {}) {
    this.builder = createGeminiPromptBuilder(initialState);
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
}