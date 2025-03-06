#!/usr/bin/env node
/**
 * 問題生成CLI
 * 対話形式でLLMによる問題生成をテストできるシンプルなインターフェース
 */
// .envファイルからの環境変数読み込み
import { config } from 'dotenv';
// .envファイルの読み込み
config();

import chalk from 'chalk';
import { Command } from 'commander';
import type { DifficultyLevel, GenerationRequest, Question, QuestionCategory, QuestionLanguage } from './domain/models/types.js';
import { createQuestionGenerationService } from './domain/services/QuestionGenerationService.js';
import { createCacheManager } from './infrastructure/cache/CacheManager.js';
import { createOpenAIAdapter, OPENAI_MODELS } from './infrastructure/llm/LLMAdapter.js';
import { writeFileSync } from 'fs';

// ESMでのrequireの代わり - 必要に応じて使用
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// inquirerをESモジュールとして直接インポート
import inquirer from 'inquirer';

// CLIプログラムの定義
const program = new Command();

/**
 * OpenAI APIキーの取得（環境変数またはユーザー入力）
 */
const getOpenAIKey = async (): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    return apiKey;
  }

  const { key } = await inquirer.prompt([
    {
      type: 'password',
      name: 'key',
      message: 'OpenAI APIキーを入力してください:',
      validate: (input: string) => input.length > 0 ? true : 'APIキーは必須です'
    }
  ]);

  return key;
};

/**
 * OpenAIモデルの選択
 */
const selectOpenAIModel = async (): Promise<string> => {
  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'OpenAIモデルを選択:',
      choices: [
        { name: 'o3-mini（推奨: コスト効率と性能のバランス）', value: OPENAI_MODELS['o3-mini'] },
        { name: 'gpt-3.5-turbo（低コスト）', value: OPENAI_MODELS['gpt-3.5-turbo'] },
        { name: 'o3（STEM特化）', value: OPENAI_MODELS['o3'] },
        { name: 'gpt-4o（マルチモーダル対応）', value: OPENAI_MODELS['gpt-4o'] },
        { name: 'gpt-4.5（最新高性能モデル）', value: OPENAI_MODELS['gpt-4.5'] }
      ]
    }
  ]);

  return model;
};

/**
 * 問題生成リクエストのユーザー入力取得
 */
const getQuestionGenerationRequest = async (): Promise<GenerationRequest> => {
  const { category, difficulty, count } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: '問題カテゴリを選択:',
      choices: [
        { name: '数学', value: 'math' },
        { name: '科学', value: 'science' },
        { name: '歴史', value: 'history' },
        { name: '言語', value: 'language' },
        { name: 'プログラミング', value: 'programming' },
        { name: '一般知識', value: 'general_knowledge' }
      ]
    },
    {
      type: 'list',
      name: 'difficulty',
      message: '難易度を選択:',
      choices: [
        { name: '簡単', value: 'easy' },
        { name: '普通', value: 'medium' },
        { name: '難しい', value: 'hard' },
        { name: '専門家', value: 'expert' }
      ]
    },
    {
      type: 'number',
      name: 'count',
      message: '生成する問題数:',
      default: 1,
      validate: (input: number) => {
        if (input < 1) return '最低1問は生成してください';
        if (input > 5) return '一度に生成できるのは最大5問です';
        return true;
      }
    }
  ]);

  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: '問題の言語を選択:',
      choices: [
        { name: '日本語', value: 'ja' },
        { name: '英語', value: 'en' },
        { name: 'フランス語', value: 'fr' },
        { name: 'ドイツ語', value: 'de' },
        { name: 'スペイン語', value: 'es' },
        { name: '中国語', value: 'zh' },
        { name: '韓国語', value: 'ko' }
      ],
      default: 'ja'
    }
  ]);

  const { additionalInstructions } = await inquirer.prompt([
    {
      type: 'input',
      name: 'additionalInstructions',
      message: '追加指示（オプション）:'
    }
  ]);

  return {
    category: category as QuestionCategory,
    difficulty: difficulty as DifficultyLevel,
    count,
    language: language as QuestionLanguage,
    additionalInstructions: additionalInstructions || undefined
  };
};

/**
 * 生成された問題の表示
 */
const displayQuestion = (index: number, question: Question): void => {
  console.log(`\n${chalk.bold(`問題 ${index + 1}: ${question.text}`)}\n`);

  // 選択肢の表示
  question.choices.forEach((choice) => {
    const prefix = choice.isCorrect ? chalk.green('✓') : ' ';
    console.log(`${prefix} ${choice.id || ''} ${choice.text}`);
  });

  console.log(`\n${chalk.italic('解説:')} ${question.explanation}\n`);
  console.log(chalk.dim('─'.repeat(50)));
};

/**
 * ヘッドレスモードでの問題生成
 * E2Eテスト用の非対話実行モード
 */
export const runHeadless = async (options: {
  apiKey: string;
  model: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  count: number;
  language?: QuestionLanguage;
  additionalInstructions?: string;
  outputPath?: string;
}): Promise<Question[]> => {
  // サービスの初期化
  const llmAdapter = createOpenAIAdapter({
    apiKey: options.apiKey,
    model: options.model,
  });

  const cacheManager = createCacheManager();

  const questionService = createQuestionGenerationService({
    llmAdapter,
    cacheManager,
  });

  // リクエストの作成
  const request: GenerationRequest = {
    category: options.category,
    difficulty: options.difficulty,
    count: options.count,
    language: options.language,
    additionalInstructions: options.additionalInstructions
  };

  // 問題生成
  const result = await questionService.generateQuestions(request);

  if (!result.success || !result.questions || result.questions.length === 0) {
    throw new Error(`問題生成に失敗しました: ${result.error || '不明なエラー'}`);
  }

  // 結果ファイルを出力（オプション）
  if (options.outputPath) {
    writeFileSync(
      options.outputPath,
      JSON.stringify(result.questions, null, 2),
      'utf-8'
    );
  }

  return result.questions;
};

/**
 * CLI引数の設定
 */
const setupCliCommands = (): void => {
  program
    .name('question-generator')
    .description('LLMを使用した問題生成ツール')
    .version('0.1.0');

  program
    .command('generate')
    .description('非対話モードで問題を生成（E2Eテスト用）')
    .requiredOption('--apiKey <key>', 'OpenAI APIキー、または環境変数OPENAI_API_KEYを使用')
    .option('--model <model>', 'OpenAIモデル名', 'gpt-3.5-turbo')
    .requiredOption('--category <category>', '問題カテゴリ: math, science, history, language, programming, general_knowledge')
    .requiredOption('--difficulty <level>', '難易度: easy, medium, hard, expert')
    .option('--language <lang>', '問題の言語: ja, en, fr, de, es, zh, ko', 'ja')
    .option('--count <number>', '生成する問題数', '1')
    .option('--instructions <text>', '追加指示（オプション）')
    .option('--output <path>', '結果を出力するJSONファイルのパス')
    .action(async (options) => {
      try {
        const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('APIキーが必要です');

        await runHeadless({
          apiKey,
          model: options.model,
          category: options.category as QuestionCategory,
          difficulty: options.difficulty as DifficultyLevel,
          language: options.language as QuestionLanguage,
          count: parseInt(options.count, 10),
          additionalInstructions: options.instructions,
          outputPath: options.output
        });
      } catch (error) {
        console.error(chalk.red(`エラー: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

/**
 * メインの実行関数
 */
const run = async (): Promise<void> => {
  // CLIコマンドの設定
  setupCliCommands();

  // コマンドライン引数が指定されている場合はパース
  if (process.argv.length > 2) {
    program.parse();
    return;
  }

  // 引数がない場合は対話モードで起動
  console.log(chalk.bold.blue('\n🧠 Lernix 問題生成 CLI 🧠\n'));

  try {
    // APIキーの取得
    const apiKey = await getOpenAIKey();

    // OpenAIモデルの選択
    const model = await selectOpenAIModel();

    // サービスの初期化
    const llmAdapter = createOpenAIAdapter({
      apiKey,
      model,
    });

    const cacheManager = createCacheManager();

    const questionService = createQuestionGenerationService({
      llmAdapter,
      cacheManager,
    });

    let continueLoop = true;

    while (continueLoop) {
      // リクエスト取得
      const request = await getQuestionGenerationRequest();

      console.log(chalk.blue('\n問題を生成中...'));

      // 問題生成
      const result = await questionService.generateQuestions(request);

      if (!result.success || !result.questions || result.questions.length === 0) {
        console.error(chalk.red(`\n問題生成に失敗しました: ${result.error || '不明なエラー'}`));
      } else {
        console.log(chalk.green(`\n${result.questions.length}問の問題が生成されました！\n`));

        // 問題の表示
        result.questions.forEach((question, index) => {
          displayQuestion(index, question);
        });

        // キャッシュ統計
        const stats = cacheManager.stats();
        console.log(chalk.dim(`\nキャッシュ統計: ${stats.keys}個のキャッシュ (ヒット: ${stats.hits}, ミス: ${stats.misses})\n`));
      }

      // 継続確認
      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: '別の問題を生成しますか？',
          default: true
        }
      ]);

      continueLoop = shouldContinue;
    }

    console.log(chalk.bold.blue('\nご利用ありがとうございました！👋\n'));
  } catch (error) {
    console.error(chalk.red(`\nエラーが発生しました: ${(error as Error).message}`));
    process.exit(1);
  }
};

// エントリーポイント
// ESモジュールでの実行判定
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  run().catch(error => {
    console.error(chalk.red(`実行エラー: ${error.message}`));
    process.exit(1);
  });
}