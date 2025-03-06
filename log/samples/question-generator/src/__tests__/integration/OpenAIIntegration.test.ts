import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { createOpenAIAdapter } from '../../infrastructure/llm/LLMAdapter.js';
import { createQuestionGenerationService } from '../../domain/services/QuestionGenerationService.js';
import type {
  GenerationRequest,
  LLMResponse,
  Question,
  QuestionCategory,
  DifficultyLevel
} from '../../domain/models/types.js';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

// テスト設定
const TEST_MODE = process.env.TEST_MODE || 'mock'; // 'mock' または 'api'
const API_KEY = process.env.OPENAI_API_KEY || 'dummy-key';
const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// デバッグログ
console.log(`テストモード: ${TEST_MODE}, APIキー: ${API_KEY.substring(0, 5)}*****, モデル: ${MODEL}`);

// テストリクエスト
const testRequest: GenerationRequest = {
  category: 'programming' as QuestionCategory,
  difficulty: 'medium' as DifficultyLevel,
  count: 1,
  additionalInstructions: 'TypeScriptに関する問題を出題してください'
};

// モックレスポンスデータ
const mockApiResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            id: 'test-id-1',
            category: 'programming',
            difficulty: 'medium',
            text: 'TypeScriptにおける「型ガード」とは何ですか？',
            choices: [
              { id: 'a', text: '特定の型であることを実行時に確認する条件文', isCorrect: true },
              { id: 'b', text: 'コンパイル時に型チェックをスキップする機能', isCorrect: false },
              { id: 'c', text: '外部ライブラリの型定義ファイル', isCorrect: false },
              { id: 'd', text: '関数の戻り値の型を強制的に変換する機能', isCorrect: false }
            ],
            explanation: '型ガードは TypeScript において、特定のスコープ内で値の型を絞り込むための条件チェックです。例えば typeof や instanceof を使用した条件分岐により、その後のコードブロック内で変数の型が特定のものとして扱われます。'
          }
        ])
      }
    }
  ]
};

describe('OpenAI統合テスト', () => {
  // APIモック化の設定
  const originalFetch = global.fetch;

  beforeAll(() => {
    if (TEST_MODE === 'mock') {
      // fetchをモック化
      global.fetch = vi.fn().mockImplementation((url, options) => {
        return Promise.resolve({
          ok: true,
          json: async () => mockApiResponse
        });
      });
    }
  });

  afterAll(() => {
    // モック化を元に戻す
    if (TEST_MODE === 'mock') {
      global.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    if (TEST_MODE === 'mock') {
      vi.clearAllMocks();
    }
  });

  describe('OpenAI LLMアダプター単体のテスト', () => {
    it('OpenAIアダプターが問題を生成できること', async () => {
      // OpenAIアダプターを作成
      if (TEST_MODE === 'api') {
        console.log('⚠️ 実APIを使用してテストを実行します。APIキーの課金に注意してください。');
      }
      const adapter = createOpenAIAdapter({
        apiKey: API_KEY,
        model: MODEL
      });

      // 問題生成を実行
      const result = await adapter.generateQuestions(testRequest);

      // エラー内容をコンソールに出力
      console.log('API通信結果:', JSON.stringify(result, null, 2));
      console.log('エラー詳細:', result.error);

      // 検証
      expect(result.success).toBe(true);
      expect(result.questions).toBeDefined();
      if (result.questions) {
        expect(result.questions.length).toBeGreaterThan(0);

        // 最初の問題の構造を検証
        const firstQuestion = result.questions[0];
        expect(firstQuestion.id).toBeDefined();
        expect(firstQuestion.category).toBe('programming');
        expect(firstQuestion.difficulty).toBe('medium');
        expect(firstQuestion.text.length).toBeGreaterThan(0);
        expect(firstQuestion.choices.length).toBeGreaterThanOrEqual(2);
        expect(firstQuestion.explanation.length).toBeGreaterThan(0);

        // 少なくとも1つの選択肢が正解であることを確認
        const hasCorrectAnswer = firstQuestion.choices.some(choice => choice.isCorrect);
        expect(hasCorrectAnswer).toBe(true);
      }
    }, 30000); // タイムアウトを30秒に設定（実APIコールの場合に対応）

    it('無効なAPIキーでエラーを返すこと', async () => {
      // TEST_MODEが'api'の場合のみ実行
      if (TEST_MODE === 'api') {
        const adapter = createOpenAIAdapter({
          apiKey: 'invalid-key',
          model: MODEL
        });

        const result = await adapter.generateQuestions(testRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } else {
        // mockモードではスキップ
        expect(true).toBe(true);
      }
    }, 10000);
  });

  describe('QuestionGenerationServiceとの統合テスト', () => {
    it('サービスとアダプターが連携して問題を生成できること', async () => {
      // OpenAIアダプターを作成
      const adapter = createOpenAIAdapter({
        apiKey: API_KEY,
        model: MODEL
      });

      // QuestionGenerationServiceを作成
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

        // 生成された問題が検証関数を通過していることを確認
        const firstQuestion = result.questions[0];
        expect(firstQuestion.text.length).toBeGreaterThan(0);
        expect(firstQuestion.choices.length).toBeGreaterThanOrEqual(2);
        expect(firstQuestion.explanation.length).toBeGreaterThan(0);
      }
    }, 30000);

    it('カスタム検証関数で低品質の問題がフィルタリングされること', async () => {
      // OpenAIアダプターを作成
      const adapter = createOpenAIAdapter({
        apiKey: API_KEY,
        model: MODEL
      });

      // より厳しい検証関数を持つサービスを作成
      const service = createQuestionGenerationService({
        llmAdapter: adapter,
        validateQuestion: (q) => {
          // より厳格な検証基準
          return (
            q.text.length >= 10 && // 十分な長さの問題文
            q.choices.length === 4 && // 必ず4つの選択肢
            q.explanation.length >= 20 && // 十分な長さの解説
            q.choices.filter(c => c.isCorrect).length === 1 // 正解は1つだけ
          );
        }
      });

      // 問題生成を実行
      const result = await service.generateQuestions(testRequest);

      // 検証
      expect(result.success).toBe(true);
      if (result.questions && result.questions.length > 0) {
        // すべての問題が厳格な検証基準を満たしていることを確認
        result.questions.forEach(q => {
          expect(q.text.length).toBeGreaterThanOrEqual(10);
          expect(q.choices.length).toBe(4);
          expect(q.explanation.length).toBeGreaterThanOrEqual(20);
          expect(q.choices.filter(c => c.isCorrect).length).toBe(1);
        });
      }
    }, 30000);
  });

  // 環境変数からモデル設定を読み込むテスト
  describe('環境変数からの設定読み込み', () => {
    it('環境変数からAPIキーとモデルを読み込めること', () => {
      // 環境変数の読み込みをテスト
      expect(API_KEY).toBeDefined();
      expect(API_KEY.length).toBeGreaterThan(0);

      // モデル名が有効なものであることを確認
      const validModels = ['o3-mini', 'gpt-3.5-turbo', 'o3', 'gpt-4o', 'gpt-4.5'];
      expect(validModels.includes(MODEL) || MODEL === 'dummy-model').toBe(true);
    });
  });
});