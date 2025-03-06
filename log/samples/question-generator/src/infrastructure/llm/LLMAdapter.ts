/**
 * LLMアダプター: 異なるLLMプロバイダーへの統一インターフェースを提供
 */
import type { LLMResponse, PromptParams, Question } from '../../domain/models/types.js';

/**
 * LLMアダプターの型定義
 */
export type LLMAdapter = {
  generateQuestions: (params: PromptParams) => Promise<LLMResponse>;
};

/**
 * OpenAIアダプターの設定
 */
export type OpenAIAdapterConfig = {
  apiKey: string;
  model: string;
  endpoint?: string;
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

  // プロンプトの生成関数
  const buildPrompt = (params: PromptParams): string => {
    const { category, difficulty, count, excludeIds, additionalInstructions } = params;

    let prompt = `
以下の条件に合致する問題を${count}問生成してください:
- カテゴリ: ${category}
- 難易度: ${difficulty}
- 形式: 4択問題
- 各問題には正解の選択肢を含めてください
- 各問題には説明文を含めてください
- JSON形式で出力してください
`;

    if (excludeIds && excludeIds.length > 0) {
      prompt += `\n除外するID: ${excludeIds.join(', ')}`;
    }

    if (additionalInstructions) {
      prompt += `\n追加指示: ${additionalInstructions}`;
    }

    prompt += `\n
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

    return prompt;
  };

  /**
   * OpenAI APIを呼び出して問題を生成する
   */
  const generateQuestions = async (params: PromptParams): Promise<LLMResponse> => {
    try {
      const prompt = buildPrompt(params);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: '教育問題を生成するAIアシスタントです。JSON形式で出力します。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
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