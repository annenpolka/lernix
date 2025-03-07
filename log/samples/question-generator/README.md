# Lernix 問題生成サンプル

このプロジェクトは、Lernixの問題生成フローを実装したサンプルアプリケーションです。LLM（大規模言語モデル）を活用して、様々なカテゴリの問題を自動生成します。

## 機能

- 複数カテゴリの問題生成（数学、科学、歴史、言語、プログラミング、一般知識）
- 4段階の難易度設定（簡単、普通、難しい、専門家）
- 最新のOpenAIモデル対応（o3-mini, gpt-3.5-turbo, o3, gpt-4o, gpt-4.5）
- Google Geminiモデル対応（gemini-1.5-pro, gemini-2.0-flash, gemini-2.0-pro）
- キャッシュ機能による問題の再利用
- 問題の検証とフィルタリング
- コマンドライン対話式インターフェース

## アーキテクチャ

このプロジェクトは以下の原則に基づいて設計されています：

- **ドメイン駆動設計（DDD）** - ドメインモデルを中心とした設計
- **関数型プログラミング** - 純粋関数と不変性を重視
- **テスト駆動開発（TDD）** - テストファーストの開発アプローチ
- **クリーンアーキテクチャ** - 関心の分離と依存性の方向制御

### 主要コンポーネント

```
src/
├── domain/              # ドメイン層（ビジネスロジック）
│   ├── models/          # ドメインモデル（エンティティと値オブジェクト）
│   └── services/        # ドメインサービス
├── infrastructure/      # インフラ層（外部システムとの連携）
│   ├── cache/           # キャッシュ管理
│   └── llm/             # LLMプロバイダーとの連携
└── __tests__/           # テストコード
```

## セットアップ

### 前提条件

- Node.js 18以上
- OpenAI APIキー
- Google Gemini APIキー（Gemini機能を使用する場合）

### インストール

```bash
# パッケージのインストール
cd samples/question-generator
npm install

# 必要な型定義のインストール
npm install --save-dev @types/node @types/inquirer

# TypeScriptのビルド
npm run build
```

### 環境変数の設定

API認証情報を環境変数として設定することができます：

```bash
# OpenAI API (macOS/Linux)
export OPENAI_API_KEY=your_api_key_here

# OpenAI API (Windows)
set OPENAI_API_KEY=your_api_key_here

# Google Gemini API (macOS/Linux)
export GEMINI_API_KEY=your_gemini_api_key_here

# Google Gemini API (Windows)
set GEMINI_API_KEY=your_gemini_api_key_here
```

または、プロジェクトルートに `.env` ファイルを作成し、その中に設定することもできます。

環境変数を設定しない場合は、アプリケーション実行時に入力を求められます。

## 使い方

```bash
# 開発モードで実行
npm run dev

# ビルド後に実行
npm start
```

### 対話フロー

1. LLMプロバイダー（OpenAI/Gemini）の選択
2. APIキーの入力（環境変数未設定の場合）
2. 使用するモデルの選択（OpenAI/Geminiのモデル）
2. 問題カテゴリの選択
3. 難易度の選択
4. 生成する問題数の指定（1-5問）
5. 追加指示の入力（オプション）
6. 問題の生成と表示
7. 別の問題を生成するか選択

## テスト

```bash
# テストの実行
npm test

# 統合テストの実行
npm run test:integration

# Gemini統合テストのみ実行
npm run test:gemini

# 実際のAPI接続で統合テストを実行
npm run test:gemini:api

# カバレッジレポート付きでテスト実行
npm run test:coverage


## プロジェクト構造の詳細

### ドメインモデル

- `Question`: 問題エンティティ（問題文、選択肢、解説など）
- `Choice`: 選択肢の値オブジェクト
- その他カテゴリや難易度などの列挙型

### サービス

- `QuestionGenerationService`: 問題生成の中核サービス
  - LLMからの問題生成
  - キャッシュ管理
  - 問題検証

### インフラストラクチャ

- `LLMAdapter`: LLMプロバイダーとの統一インターフェース
  - OpenAIとGeminiをサポート
  - 拡張可能な設計
- `OpenAIAdapter`: OpenAI APIとの連携
  - OpenAIの最新モデルに対応
- `GeminiAdapter`: Google Gemini APIとの連携
  - structured outputsを活用した堅牢な出力
- `CacheManager`: 問題キャッシュの管理
  - インメモリキャッシュ
  - 統計情報の提供

## 拡張ポイント

このサンプルは以下のように拡張できます：

1. 新しいLLMプロバイダーのサポート（Anthropic, Claude等）
2. 永続的なキャッシュストレージ（ファイル、データベース）
3. 問題の品質評価機能の強化
4. 類似問題検出のベクトル埋め込み実装
5. バッチ処理による問題生成の最適化

## ヘッドレス統合テスト

CI/CD環境などでヘッドレスにテストを実行するためのユーティリティスクリプトが用意されています：

```bash
# ヘッドレス統合テストの実行（モックモード）
npm run test:headless [テスト名] [オプション]
```

### 推奨モデル

デフォルトでは「o3-mini」を推奨モデルとして設定しています。これはコスト効率と性能のバランスが良いモデルです。
用途に応じて最適なモデルを選択してください：
- 一般的な問題生成: o3-mini または gpt-3.5-turbo
- 高度な問題（STEM系）: o3
- 最新の高性能モデル: gpt-4.5
- 高速レスポンス: gemini-2.0-flash
- 高品質な回答: gemini-2.0-pro

### APIキーの問題

OpenAIまたはGemini APIキーが正しく設定されていない場合は、APIエラーが表示されます。
APIキーが有効であることを確認してください。
また、Geminiの場合は対応リージョンが制限されている可能性があります。

### エラーメッセージ

生成中にエラーが発生した場合、詳細なエラーメッセージが表示されます。問題が解決しない場合は、APIの状態を確認してください。