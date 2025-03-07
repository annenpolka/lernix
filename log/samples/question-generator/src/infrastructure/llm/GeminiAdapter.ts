/**
 * Geminiアダプター: Google Gemini APIへの統一インターフェースを提供
 * Structured Outputs機能を活用した実装
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import type { DifficultyLevel, LLMResponse, PromptParams, QuestionCategory } from '../../domain/models/types.js';
import type { LLMAdapter } from './LLMAdapter.js';

// 環境変数の読み込み
dotenv.config();

// テストモードの確認
const TEST_MODE = process.env.TEST_MODE || '';

/**
 * Geminiアダプターの設定
 */
export type GeminiAdapterConfig = {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Geminiのモデル一覧と推奨用途
 */
export const GEMINI_MODELS = {
  // 標準モデル
  'gemini-pro': 'gemini-pro', // 下位互換性のために残す

  // 高性能モデル
  'gemini-1.5-pro': 'gemini-1.5-pro', // 長い文脈と複雑な推論
  'gemini-1.5-flash': 'gemini-1.5-flash', // バランスの取れた性能
  'gemini-1.5-flash-8b': 'gemini-1.5-flash-8b', // 軽量かつ高速なレスポンス

  // 最新モデル
  'gemini-2.0-flash': 'gemini-2.0-flash', // 次世代の機能を備えた高速モデル
  'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite', // 費用対効果と低レイテンシ
};

/**
 * Gemini API のレスポンス型定義（型エイリアスで定義）
 */
type GeminiResponse = {
  response?: {
    text: () => string | Promise<string>;
    candidates?: Array<{
      content: { parts: Array<{text: string}> }
    }>;
  };
  text?: () => string | Promise<string>;
  candidates?: Array<{ content: { parts: Array<{text: string}> } }>;
};

/**
 * 問題選択肢のJSONスキーマ定義
 */
const choiceSchema = {
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
 * 問題のJSONスキーマ定義
 * @param category 問題カテゴリ
 * @param difficulty 難易度
 */
const createQuestionSchema = (category: QuestionCategory, difficulty: DifficultyLevel) => {
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
 * Geminiアダプターの生成
 */
export const createGeminiAdapter = (config: GeminiAdapterConfig): LLMAdapter => {
  // Gemini APIクライアントの初期化
  const genAI = new GoogleGenerativeAI(config.apiKey);

  /**
   * プロンプトの生成
   */
  const buildPrompt = (params: PromptParams): string => {
    const { category, difficulty, count, excludeIds, additionalInstructions, language } = params;

    // デフォルト言語は日本語
    const promptLanguage = language || 'ja';

    // 英語の場合は英語のプロンプトを生成
    if (promptLanguage === 'en') {
      let prompt = `Generate ${count} educational questions with the following criteria:\n`;
      prompt += `- Category: ${category}\n`;
      prompt += `- Difficulty: ${difficulty}\n`;
      prompt += `- language: ${promptLanguage}\n`;
      prompt += `- Format: Multiple choice with 4 options\n`;
      prompt += `- Include the correct answer for each question\n`;
      prompt += `- Include an explanation for each question\n`;
      prompt += `- Assign a unique ID for each question\n`;

      if (excludeIds && excludeIds.length > 0) {
        prompt += `\nExclude IDs: ${excludeIds.join(', ')}`;
      }

      if (additionalInstructions) {
        prompt += `\nAdditional instructions: ${additionalInstructions}`;
      }

      return prompt;
    }

    // 日本語のプロンプト（デフォルト）
    let prompt = `以下の条件に合致する問題を${count}問生成してください:\n`;
    prompt += `- カテゴリ: ${category}\n`;
    prompt += `- 難易度: ${difficulty}\n`;
    prompt += `- language: ${promptLanguage}\n`;
    prompt += `- 形式: 4択問題\n`;
    prompt += `- 各問題には正解の選択肢を含めてください\n`;
    prompt += `- 各問題には説明文を含めてください\n`;
    prompt += `- 各問題には一意のIDを割り当ててください\n`;

    // JSON形式に関する重要な指示を追加
    prompt += `- 重要: 応答は必ず有効なJSON配列形式にしてください\n`;
    prompt += `- 重要: JSON解析を壊す可能性のある特殊文字は避けてください\n`;
    prompt += `- 重要: 数式を使用する場合は、シンプルで整形された形式を維持してください\n`;

    if (excludeIds && excludeIds.length > 0) {
      prompt += `\n除外するID: ${excludeIds.join(', ')}`;
    }

    if (additionalInstructions) {
      prompt += `\n追加指示: ${additionalInstructions}`;
    }

    return prompt;
  };

  /**
   * Gemini APIを呼び出して問題を生成する
   */
  const generateQuestions = async (params: PromptParams): Promise<LLMResponse> => {
    try {
      const prompt = buildPrompt(params);

      // スキーマの作成
      const questionSchema = createQuestionSchema(params.category, params.difficulty);

      // モデルインスタンスの作成（Structured Outputsを使用）
      const model = genAI.getGenerativeModel({
        model: config.model,
        generationConfig: {
          temperature: config.temperature ?? 0.5, // 低めの温度値に設定して安定性を向上
          maxOutputTokens: config.maxOutputTokens ?? 2048, // トークン数を増やす
          responseMimeType: "application/json",
          responseSchema: questionSchema as any // 型の問題を回避するためanyにキャスト
        }
      });

      try {
        // APIリクエスト
        const request = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        };

        // APIを呼び出す
        const apiResponse = await model.generateContent(request);
        // 型変換
        const response = apiResponse as unknown as GeminiResponse;

        // レスポンスからJSONを抽出
        let responseText: string;

        // テキスト抽出ロジック（各種レスポンスパターンに対応）
        if (response.response && typeof response.response.text === 'function') {
          try {
            // response.response.text()がPromiseを返す場合
            const textResult = response.response.text();
            if (textResult instanceof Promise) {
              responseText = await textResult;
            } else {
              responseText = textResult;
            }
          } catch (error) {
            return {
              success: false,
              error: 'テキスト抽出エラー'
            };
          }
        } else if (response.response && response.response.candidates &&
                  response.response.candidates.length > 0 &&
                  response.response.candidates[0].content.parts.length > 0) {
          // candidatesから直接テキストを取得
          responseText = response.response.candidates[0].content.parts[0].text || '';
        } else if (typeof response.text === 'function') {
          // 直接response.textがある場合
          try {
            const textResult = response.text();
            if (textResult instanceof Promise) {
              responseText = await textResult;
            } else {
              responseText = textResult;
            }
          } catch (error) {
            return { success: false, error: 'レスポンステキスト抽出エラー' };
          }
        } else {
          responseText = JSON.stringify({ error: 'レスポンスからテキストを抽出できませんでした' });
        }
        if (!responseText) {
          return {
            success: false,
            error: 'APIからの応答に内容がありません'
          };
        }

        // JSONパース
        try {
          // JSON解析前のサニタイズ処理を追加
          const sanitizeJsonText = (text: string): string => {
            // エスケープされていない特殊文字を処理
            let sanitized = text.replace(/\\(?!["\\/bfnrt])/g, '\\\\');

            // JSON内での引用符のバランスを確認し修正
            const quoteCount = (sanitized.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              console.warn('[Gemini API] 警告: 引用符が閉じられていない可能性があります');
              // 最後の閉じ括弧の前に引用符がない場合を検出
              if (sanitized.lastIndexOf('"') < sanitized.lastIndexOf('}')) {
                sanitized = sanitized.replace(/}(?=[^"]*$)/, '"}');
              }
            }

            // JSON配列の閉じ括弧がない場合に追加
            if (sanitized.trim().startsWith('[') && !sanitized.trim().endsWith(']')) {
              sanitized = sanitized.trim() + ']';
            }

            return sanitized;
          };

          // サニタイズ処理を実行
          const sanitizedText = sanitizeJsonText(responseText);

          // デバッグログ
          if (sanitizedText !== responseText) {
            console.log('[Gemini API] レスポンスを自動修正しました');
          }

          let parsedQuestions;
          try {
            // 通常のJSON解析を試みる
            parsedQuestions = JSON.parse(sanitizedText);
          } catch (jsonError) {
            // JSONの配列部分だけ抽出して再試行
            console.warn('[Gemini API] 最初のJSON解析に失敗、部分抽出を試みます');
            const jsonArrayMatch = sanitizedText.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonArrayMatch) {
              try {
                parsedQuestions = JSON.parse(jsonArrayMatch[0]);
              } catch (extractError) {
                // 部分抽出も失敗した場合は元のエラーをスロー
                throw jsonError;
              }
            } else {
              // 配列部分を抽出できなかった場合は元のエラーをスロー
              throw jsonError;
            }
          }

          // 結果が配列でない場合の処理
          if (!Array.isArray(parsedQuestions)) {
            return {
              success: false,
              error: 'APIからの応答が正しいJSON配列形式ではありません'
            };
          }

          // 現在の日時を設定したクエスチョンの作成
          const questionsWithDate = parsedQuestions.map(q => ({
            ...q,
            createdAt: new Date()
          }));

          return {
            success: true,
            questions: questionsWithDate
          };
        } catch (error: any) {
          console.error('[Gemini API] JSON解析エラー詳細:', error);
          console.log('[Gemini API] 解析失敗したレスポンス:', responseText.substring(0, 300) + '...');

          return {
            success: false,
            error: `JSON解析エラー: ${error.message}`
          };
        }

      } catch (error: any) {
        return {
          success: false,
          error: `API呼び出しエラー: ${error.message}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `予期しないエラーが発生しました: ${error.message}`
      };
    }
  };

  // アダプターインターフェースを返す
  return {
    generateQuestions
  };
};