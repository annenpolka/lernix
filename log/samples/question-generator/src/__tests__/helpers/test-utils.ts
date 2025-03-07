/**
 * テスト用ヘルパー関数
 */
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

/**
 * テスト環境の設定を取得する
 */
export const getTestConfig = () => {
  return {
    // テストモード ('mock' または 'api')
    // 注: 環境変数TEST_MODEが設定されていない場合はデフォルトで'mock'モードを使用
    mode: process.env.TEST_MODE || 'mock',

    // APIキー (テストモードが'api'の場合に使用)
    apiKey: process.env.GEMINI_API_KEY || 'dummy-key',

    // 使用するモデル
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

    // APIモードで実行する際の質問生成数 (テスト高速化のため)
    apiModeQuestionCount: 1
  };
};

/**
 * テストモードを判定する
 */
export const isApiTestMode = () => {
  return getTestConfig().mode === 'api';
};

/**
 * APIモードの警告を表示する
 */
export const showApiModeWarning = () => {
  if (isApiTestMode()) {
    console.log('⚠️ 実APIを使用してテストを実行します。APIキーの課金に注意してください。');
  }
};

/**
 * テスト設定をコンソールに出力する
 */
export const logTestConfig = () => {
  const config = getTestConfig();
  // APIキーをマスクして表示（セキュリティのため）
  const maskedKey = config.apiKey.substring(0, 5) + '*****';
  console.log(`テストモード: ${config.mode}, APIキー: ${maskedKey}, モデル: ${config.model}`);

  // APIモードの場合は警告を表示
  showApiModeWarning();
};