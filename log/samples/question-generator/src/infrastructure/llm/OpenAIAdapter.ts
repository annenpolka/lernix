/**
 * OpenAIアダプター:
 * OpenAI APIへのインターフェースを提供し、プロンプトビルダーを活用したLLM呼び出しを実装
 */
import type { LLMResponse, PromptParams, Question } from '../../domain/models/types.js';
import { createOpenAIPromptBuilder } from '../prompt/OpenAIPromptBuilder.js';
import type { LLMAdapter } from './LLMAdapter.js';

/**
 * OpenAIアダプターの設定
 */
export type OpenAIAdapterConfig = {
  apiKey: string;
  model: string;
  endpoint?: string;
  promptBuilder?: any; // カスタムプロンプトビルダーを許可（テスト目的）
};

/**
 * OpenAIのモデル一覧と推奨用途
 */
export const OPENAI_MODELS = {
  // コスト効率モデル
  'o3-mini': 'o3-mini', // 推論性能とコスト効率のバランスが良い
  'gpt-3.5-turbo': 'gpt-3.5-turbo', // 最も低コスト

  // 高性能モデル
  'o3': 'o3', // STEM特化
  'gpt-4o': 'gpt-4o', // マルチモーダル対応
  'gpt-4.5': 'gpt-4.5', // 最新の高度なモデル
};

/**
 * OpenAIアダプターの生成
 */
export const createOpenAIAdapter = (config: OpenAIAdapterConfig): LLMAdapter => {
  // デフォルトのエンドポイント
  const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';

  // プロンプトビルダーの初期化（カスタムまたはデフォルト）
  const promptBuilder = config.promptBuilder || createOpenAIPromptBuilder();

  /**
   * OpenAI APIを呼び出して問題を生成する
   */
  const generateQuestions = async (params: PromptParams): Promise<LLMResponse> => {
    try {
      // プロンプト生成ロジックをビルダーに委譲
      const builder = promptBuilder
        .withCategory(params.category)
        .withDifficulty(params.difficulty)
        .withCount(params.count)
        .withLanguage(params.language || 'ja');

      // オプションパラメータの設定
      if (params.excludeIds && params.excludeIds.length > 0) {
        builder.withExcludeIds(params.excludeIds);
      }

      if (params.additionalInstructions) {
        builder.withAdditionalInstructions(params.additionalInstructions);
      }

      // プロンプトとシステムプロンプトを構築
      const prompt = builder.build();
      const systemPrompt = builder.buildSystemPrompt ? builder.buildSystemPrompt() : undefined;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt || (params.language === 'en'
                ? 'You are an AI assistant that generates educational questions in English. Output in JSON format.'
                : params.language && params.language !== 'ja'
                  ? `You are an AI assistant that generates educational questions in ${params.language}. Output in JSON format.`
                  : '教育問題を生成するAIアシスタントです。JSON形式で出力します。')
            },
            { role: 'user', content: prompt }
          ]
          // Note: temperatureパラメータは一部のモデル（特にo3系）ではサポートされていません
        })
      });

      if (!response.ok) {
        // エラーの詳細ログを出力
        const errorText = await response.text();
        console.error(`APIエラー詳細: ${errorText}`);

        return {
          success: false,
          error: `APIエラー: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'APIからの応答に内容がありません'
        };
      }

      try {
        // LLMの応答からJSON部分を抽出して解析
        const parsedQuestions = JSON.parse(content) as Question[];

        // 現在の日時をセット
        const questionsWithDate = parsedQuestions.map(q => ({
          ...q,
          createdAt: new Date()
        }));

        return {
          success: true,
          questions: questionsWithDate
        };
      } catch (e) {
        return {
          success: false,
          error: `JSON解析エラー: ${(e as Error).message}`
        };
      }
    } catch (e) {
      return {
        success: false,
        error: `API呼び出しエラー: ${(e as Error).message}`
      };
    }
  };

  return {
    generateQuestions
  };
};