/**
 * 基底プロンプトビルダーモジュール
 * 異なるLLM用プロンプトビルダーで共通化できる部分を抽出
 */
import { createPromptBuilder, PromptBuilder, PromptBuilderState } from './PromptBuilder.js';
import { QuestionLanguage } from '../../domain/models/types.js';

// 言語リソース型定義
export type PromptLanguageResources = {
  generateQuestions: string;
  category: string;
  difficulty: string;
  format: string;
  includeCorrectAnswer: string;
  includeExplanation: string;
  excludeIds: string;
  additionalInstructions: string;
};

// 言語リソースマップ
const languageResources: Partial<Record<QuestionLanguage, PromptLanguageResources>> = {
  'ja': {
    generateQuestions: '以下の条件に合致する問題を{count}問生成してください:',
    category: 'カテゴリ',
    difficulty: '難易度',
    format: '形式: 4択問題（JSON形式で出力してください）',
    includeCorrectAnswer: '各問題には正解の選択肢を含めてください',
    includeExplanation: '各問題には説明文を含めてください',
    excludeIds: '除外するID',
    additionalInstructions: '追加指示'
  },
  'en': {
    generateQuestions: 'Generate {count} questions matching the following criteria:',
    category: 'Category',
    difficulty: 'Difficulty',
    format: 'Format: Multiple choice with 4 options (Output in JSON format)',
    includeCorrectAnswer: 'Include the correct answer for each question',
    includeExplanation: 'Include an explanation for each question',
    excludeIds: 'Exclude IDs',
    additionalInstructions: 'Additional instructions'
  }
};

/**
 * 共通システムプロンプト生成関数
 */
export const buildBaseSystemPrompt = (state: PromptBuilderState): string => {
  const { language } = state;
  const promptLanguage = language || 'ja';

  if (promptLanguage === 'en') {
    return 'You are an AI assistant that generates educational questions in English. Output in JSON format.';
  } else if (promptLanguage && promptLanguage !== 'ja') {
    return `You are an AI assistant that generates educational questions in ${promptLanguage}. Output in JSON format.`;
  } else {
    return '教育問題を生成するAIアシスタントです。JSON形式で出力します。';
  }
};

/**
 * 共通のプロンプト生成関数 - Template Methodパターン
 * 基本構造を定義し、LLM固有のカスタマイズポイントを提供
 */
export const buildBasePrompt = (
  state: PromptBuilderState,
  llmSpecificInstructions: (lang: QuestionLanguage) => string[] = () => []
): string => {
  const { category, difficulty, count, excludeIds, additionalInstructions, language } = state;

  // 必要なパラメータが不足している場合はエラーメッセージを返す
  if (!category || !difficulty || !count) {
    return '必須パラメータ(カテゴリ、難易度、問題数)が不足しています';
  }

  // デフォルト言語は日本語
  const promptLanguage = language || 'ja';
  const resources = (languageResources[promptLanguage as QuestionLanguage] || languageResources.ja)!;

  // 基本プロンプトの構築
  let prompt = resources.generateQuestions.replace('{count}', count.toString());
  prompt += `\n- ${resources.category}: ${category}`;
  prompt += `\n- ${resources.difficulty}: ${difficulty}`;
  prompt += `\n- language: ${promptLanguage}`;
  prompt += `\n- ${resources.format}`;
  prompt += `\n- ${resources.includeCorrectAnswer}`;
  prompt += `\n- ${resources.includeExplanation}`;

  // LLM固有の指示を追加
  const specificInstructions = llmSpecificInstructions(promptLanguage as QuestionLanguage);
  for (const instruction of specificInstructions) {
    prompt += `\n- ${instruction}`;
  }

  // オプションパラメータの処理
  if (excludeIds && excludeIds.length > 0) {
    prompt += `\n${resources.excludeIds}: ${excludeIds.join(', ')}`;
  }

  if (additionalInstructions) {
    prompt += `\n${resources.additionalInstructions}: ${additionalInstructions}`;
  }

  return prompt;
};

/**
 * 基底プロンプトビルダー作成関数
 * 共通のビルダーロジックとLLM固有のカスタマイズを組み合わせる
 */
export const createBasePromptBuilder = (
  initialState: PromptBuilderState = {},
  buildLLMSpecificPrompt: (basePrompt: string, state: PromptBuilderState) => string,
  buildLLMSpecificSystemPrompt: (state: PromptBuilderState) => string = buildBaseSystemPrompt,
  llmSpecificInstructions: (lang: QuestionLanguage) => string[] = () => []
): PromptBuilder => {
  // ラッパー関数を作成して基本プロンプトをカスタマイズ
  const buildFullPrompt = (state: PromptBuilderState): string => {
    const basePrompt = buildBasePrompt(state,
      llmSpecificInstructions); // LLM固有の指示を適用
    return buildLLMSpecificPrompt(basePrompt, state);
  };

  return createPromptBuilder(initialState, buildFullPrompt, buildLLMSpecificSystemPrompt);
};