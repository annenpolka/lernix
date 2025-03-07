import { describe, expect, it } from 'vitest';
import { DifficultyLevel, QuestionCategory, QuestionLanguage } from '../../../domain/models/types.js';
import { createBasePromptBuilder } from '../../../infrastructure/prompt/basePromptBuilder.js';
import { GeminiPromptBuilder, createGeminiPromptBuilder } from '../../../infrastructure/prompt/geminiPromptBuilder.js';
import { OpenAIPromptBuilder, createOpenAIPromptBuilder } from '../../../infrastructure/prompt/OpenAIPromptBuilder.js';

describe('PromptBuilder', () => {
  // 基底プロンプトビルダーのテスト
  describe('basePromptBuilder', () => {
    it('基本的なプロンプトを生成できること', () => {
      // 最もシンプルな実装として、入力をそのまま返す関数を使用
      const simpleBuilder = createBasePromptBuilder(
        {},
        (basePrompt) => basePrompt
      );

      const prompt = simpleBuilder
        .withCategory('programming' as QuestionCategory)
        .withDifficulty('medium' as DifficultyLevel)
        .withCount(3)
        .build();

      // 基本要素の確認
      expect(prompt).toContain('カテゴリ: programming');
      expect(prompt).toContain('難易度: medium');
      expect(prompt).toContain('3問生成してください');
    });

    it('カスタムプロンプト変換を適用できること', () => {
      // カスタム変換関数を使用
      const customBuilder = createBasePromptBuilder(
        {},
        (basePrompt) => `${basePrompt}\n\nカスタム変換を適用しました。`
      );

      const prompt = customBuilder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel)
        .withCount(2)
        .build();

      expect(prompt).toContain('カテゴリ: math');
      expect(prompt).toContain('難易度: easy');
      expect(prompt).toContain('カスタム変換を適用しました。');
    });

    it('英語のプロンプトを生成できること', () => {
      const builder = createBasePromptBuilder(
        {},
        (basePrompt) => basePrompt
      );

      const prompt = builder
        .withCategory('programming' as QuestionCategory)
        .withDifficulty('medium' as DifficultyLevel)
        .withCount(3)
        .withLanguage('en' as QuestionLanguage)
        .build();

      // より一般的な表現に修正（実装に依存しない検証に）
      expect(prompt).toContain('Generate 3');
      expect(prompt).toContain('Category: programming');
      expect(prompt).toContain('Difficulty: medium');
    });

    it('追加指示を含めることができること', () => {
      const builder = createBasePromptBuilder(
        {},
        (basePrompt) => basePrompt
      );

      const additionalInstructions = '各問題には図表に関する説明を含めてください';
      const prompt = builder
        .withCategory('science' as QuestionCategory)
        .withDifficulty('hard' as DifficultyLevel)
        .withCount(2)
        .withAdditionalInstructions(additionalInstructions)
        .build();

      expect(prompt).toContain(`追加指示: ${additionalInstructions}`);
    });

    it('システムプロンプトを正しく生成できること', () => {
      const builder = createBasePromptBuilder(
        {},
        (basePrompt) => basePrompt
      );

      // 日本語
      const builderWithMath = builder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel);
      let systemPrompt = builderWithMath.buildSystemPrompt?.() || '';

      expect(systemPrompt).toContain('教育問題を生成するAIアシスタント');

      // 英語
      const builderWithEn = builder.withLanguage('en' as QuestionLanguage);
      systemPrompt = builderWithEn.buildSystemPrompt?.() || '';

      expect(systemPrompt).toContain('AI assistant that generates educational questions in English');
    });
  });

  // 関数ベースのプロンプトビルダーのテスト（新しいアプローチ）
  describe('関数ベースのプロンプトビルダー', () => {
    describe('OpenAIプロンプトビルダー（関数型）', () => {
      it('基本的なプロンプトを生成できること', () => {
        const builder = createOpenAIPromptBuilder()
          .withCategory('programming' as QuestionCategory)
          .withDifficulty('medium' as DifficultyLevel)
          .withCount(3);

        const prompt = builder.build();

        // 基本要素の確認
        expect(prompt).toContain('カテゴリ: programming');
        expect(prompt).toContain('難易度: medium');
        expect(prompt).toContain('3問生成してください');
        expect(prompt).toContain('JSON形式で出力');
      });

      it('英語のプロンプトを生成できること', () => {
        const prompt = createOpenAIPromptBuilder()
          .withCategory('programming' as QuestionCategory)
          .withDifficulty('medium' as DifficultyLevel)
          .withCount(3)
          .withLanguage('en' as QuestionLanguage)
          .build();

        // より一般的な表現に修正
        expect(prompt).toContain('Generate 3');
        expect(prompt).toContain('Category: programming');
        expect(prompt).toContain('Difficulty: medium');
      });

      it('追加指示を含めることができること', () => {
        const additionalInstructions = '各問題には図表に関する説明を含めてください';

        const prompt = createOpenAIPromptBuilder()
          .withCategory('science' as QuestionCategory)
          .withDifficulty('hard' as DifficultyLevel)
          .withCount(2)
          .withAdditionalInstructions(additionalInstructions)
          .build();

        expect(prompt).toContain(`追加指示: ${additionalInstructions}`);
      });

      it('システムプロンプトを正しく生成できること', () => {
        const builder = createOpenAIPromptBuilder()
          .withCategory('math' as QuestionCategory)
          .withDifficulty('easy' as DifficultyLevel);

        // 日本語
        let systemPrompt = builder.buildSystemPrompt?.() || '';
        expect(systemPrompt).toContain('教育問題を生成するAIアシスタント');

        // 英語
        const builderWithEn = builder.withLanguage('en' as QuestionLanguage);
        systemPrompt = builderWithEn.buildSystemPrompt?.() || '';

        expect(systemPrompt).toContain('AI assistant that generates educational questions in English');
      });
    });

    describe('Geminiプロンプトビルダー（関数型）', () => {
      it('基本的なプロンプトを生成できること', () => {
        const prompt = createGeminiPromptBuilder()
          .withCategory('programming' as QuestionCategory)
          .withDifficulty('medium' as DifficultyLevel)
          .withCount(3)
          .build();

        // 基本要素の確認
        expect(prompt).toContain('カテゴリ: programming');
        expect(prompt).toContain('難易度: medium');
        expect(prompt).toContain('3問生成してください');
        // Gemini特有の指示
        expect(prompt).toContain('重要: 応答は必ず有効なJSON配列形式にしてください');
      });

      it('英語のプロンプトを生成できること', () => {
        const prompt = createGeminiPromptBuilder()
          .withCategory('programming' as QuestionCategory)
          .withDifficulty('medium' as DifficultyLevel)
          .withCount(3)
          .withLanguage('en' as QuestionLanguage)
          .build();

        // より一般的な表現に修正
        expect(prompt).toContain('Generate 3');
        expect(prompt).toContain('Category: programming');
        expect(prompt).toContain('Difficulty: medium');
      });
    });
  });

  // クラスベースのプロンプトビルダーのテスト（後方互換性のため）
  describe('OpenAIPromptBuilder', () => {
    it('基本的なプロンプトを生成できること', () => {
      const builder = new OpenAIPromptBuilder();
      const prompt = builder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel)
        .withCount(3)
        .build();

      // 基本要素の確認
      expect(prompt).toContain('カテゴリ: math');
      expect(prompt).toContain('難易度: easy');
      expect(prompt).toContain('3問生成してください');
      expect(prompt).toContain('JSON形式で出力');
    });

    it('英語のプロンプトを生成できること', () => {
      const builder = new OpenAIPromptBuilder();
      const prompt = builder
        .withCategory('programming' as QuestionCategory)
        .withDifficulty('medium' as DifficultyLevel)
        .withCount(3)
        .withLanguage('en' as QuestionLanguage)
        .build();

      // より一般的な表現に修正
      expect(prompt).toContain('Generate 3');
      expect(prompt).toContain('Category: programming');
      expect(prompt).toContain('Difficulty: medium');
    });

    it('追加指示を含めることができること', () => {
      const builder = new OpenAIPromptBuilder();
      const additionalInstructions = '各問題には図表に関する説明を含めてください';

      const prompt = builder
        .withCategory('science' as QuestionCategory)
        .withDifficulty('hard' as DifficultyLevel)
        .withCount(2)
        .withAdditionalInstructions(additionalInstructions)
        .build();

      expect(prompt).toContain(`追加指示: ${additionalInstructions}`);
    });

    it('除外IDを含めることができること', () => {
      const builder = new OpenAIPromptBuilder();
      const excludeIds = ['q123', 'q456', 'q789'];

      const prompt = builder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel)
        .withCount(5)
        .withExcludeIds(excludeIds)
        .build();

      expect(prompt).toContain(`除外するID: ${excludeIds.join(', ')}`);
    });

    it('システムプロンプトを正しく生成できること', () => {
      const builder = new OpenAIPromptBuilder();

      // 日本語
      const builderWithMath = builder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel);
      let systemPrompt = builderWithMath.buildSystemPrompt();

      expect(systemPrompt).toContain('教育問題を生成するAIアシスタント');

      // 英語
      const builderWithEn = builder.withLanguage('en' as QuestionLanguage);
      systemPrompt = builderWithEn.buildSystemPrompt();

      expect(systemPrompt).toContain('AI assistant that generates educational questions in English');
    });
  });

  describe('GeminiPromptBuilder', () => {
    it('基本的なプロンプトを生成できること', () => {
      const builder = new GeminiPromptBuilder();
      const prompt = builder
        .withCategory('programming' as QuestionCategory)
        .withDifficulty('medium' as DifficultyLevel)
        .withCount(3)
        .build();

      // 基本要素の確認
      expect(prompt).toContain('カテゴリ: programming');
      expect(prompt).toContain('難易度: medium');
      expect(prompt).toContain('3問生成してください');
      // Gemini特有の指示
      expect(prompt).toContain('重要: 応答は必ず有効なJSON配列形式にしてください');
    });

    it('英語のプロンプトを生成できること', () => {
      const builder = new GeminiPromptBuilder();
      const prompt = builder
        .withCategory('programming' as QuestionCategory)
        .withDifficulty('medium' as DifficultyLevel)
        .withCount(3)
        .withLanguage('en' as QuestionLanguage)
        .build();

      // より一般的な表現に修正
      expect(prompt).toContain('Generate 3');
      expect(prompt).toContain('Category: programming');
      expect(prompt).toContain('Difficulty: medium');
    });

    it('追加指示を含めることができること', () => {
      const builder = new GeminiPromptBuilder();
      const additionalInstructions = '各問題には図表に関する説明を含めてください';

      const prompt = builder
        .withCategory('science' as QuestionCategory)
        .withDifficulty('hard' as DifficultyLevel)
        .withCount(2)
        .withAdditionalInstructions(additionalInstructions)
        .build();

      expect(prompt).toContain(`追加指示: ${additionalInstructions}`);
    });

    it('除外IDを含めることができること', () => {
      const builder = new GeminiPromptBuilder();
      const excludeIds = ['q123', 'q456', 'q789'];

      const prompt = builder
        .withCategory('math' as QuestionCategory)
        .withDifficulty('easy' as DifficultyLevel)
        .withCount(5)
        .withExcludeIds(excludeIds)
        .build();

      expect(prompt).toContain(`除外するID: ${excludeIds.join(', ')}`);
    });
  });
});