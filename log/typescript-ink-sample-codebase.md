# TypeScript + Ink サンプルコードベース解説

## 概要

このドキュメントは、Lernixプロジェクト用のTypeScript + Inkサンプル実装の構造と主要コンポーネントについて解説します。特に現在の実装ギャップと今後の開発方針に焦点を当てています。

## プロジェクト構成

```
log/samples/typescript-ink/
├── src/                         # ソースコード
│   ├── components/              # UIコンポーネント
│   ├── screens/                 # 画面コンポーネント
│   ├── types.ts                 # 型定義
│   ├── index.tsx                # エントリーポイント
│   ├── SimpleApp.tsx            # 簡易デモアプリ（現在使用中）
│   └── App.tsx                  # 本来の機能が実装されたアプリ（未接続）
├── __tests__/                   # テストコード
├── jest.config.js               # Jestの設定
├── package.json                 # 依存関係
└── tsconfig.json                # TypeScript設定
```

## 主要な依存関係

- **ink**: React風のターミナルUIライブラリ（v4.4.1）
- **react**: UIコンポーネントライブラリ（v18.2.0）
- **TypeScript**: 型付き開発環境（v5.3.0）
- **Jest**: テストフレームワーク（v29.7.0）
- **ink-testing-library**: Inkコンポーネントのテスト用ライブラリ

## データモデル

```typescript
// 学習カテゴリー
interface Category {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

// 選択肢
interface Option {
  id: string;
  content: string;
}

// 問題データ
interface Question {
  id: string;
  categoryId: string;
  content: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

// 学習モード
type LearningMode = 'quick' | 'deep' | 'weakspot';

// 学習セッション
interface LearningSession {
  id: string;
  categoryId: string;
  mode: LearningMode;
  startTime: Date;
  endTime?: Date;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> optionId
}

// アプリケーション画面
type AppScreen = 'home' | 'category-select' | 'mode-select' | 'learning' | 'results';

// アプリケーション状態
interface AppState {
  screen: AppScreen;
  categories: Category[];
  selectedCategoryId?: string;
  loading: boolean;
  error?: string;
}
```

## 実装状況と問題点

### 1. エントリーポイントの問題

現在のエントリーポイント（index.tsx）は次のようになっています：

```typescript
#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { SimpleApp } from './SimpleApp.js';

/**
 * Lernix アプリケーションのエントリーポイント
 * Inkを使用してターミナルUIをレンダリングします
 */

// シンプルなアプリをレンダリング
render(<SimpleApp />);
```

この問題点：
- **SimpleApp**はデモ用の簡易実装のみで機能が限定的（Counter表示のみ）
- 実際に機能する**App**コンポーネントが使われていない

### 2. 実装されている機能（App.tsx）

`App.tsx`には以下の機能が既に実装されていますが、エントリーポイントから接続されていません：

- ホーム画面、カテゴリ選択、学習セッション、結果表示の画面遷移
- サンプルデータを使った問題表示
- 各種ユーザー操作（選択、回答など）の処理

```typescript
export const App: React.FC = () => {
  // アプリケーション状態
  const [appState, setAppState] = useState<AppState>({
    screen: 'home',
    categories: SAMPLE_CATEGORIES,
    loading: false,
  });

  // 学習セッション
  const [session, setSession] = useState<LearningSession | undefined>(undefined);

  // ホーム画面からカテゴリ選択への遷移
  const handleStart = () => {
    setAppState((prev: AppState) => ({ ...prev, screen: 'category-select' }));
  };

  // 各種ハンドラ実装...

  return (
    <Box flexDirection="column" padding={1} width={80}>
      {appState.screen === 'home' && <HomeScreen onStart={handleStart} />}

      {appState.screen === 'category-select' && (
        <CategorySelector
          categories={appState.categories}
          onSelect={handleCategorySelect}
        />
      )}

      {/* 学習画面と結果画面 */}
    </Box>
  );
};
```

## コンポーネント構造

### UIコンポーネント

- **Counter**: シンプルなカウンター（基本動作確認用）
- **Header**: アプリケーションヘッダー
- **CategorySelector**: カテゴリ選択UI（キーボードナビゲーション）
- **ModeSelector**: 学習モード選択UI
- **QuestionCard**: 問題表示カード

### 画面コンポーネント

- **HomeScreen**: ホーム画面（アプリ開始）
- **LearningScreen**: 学習セッション画面（問題解答）
- **ResultsScreen**: 学習結果表示画面

## 主要機能

### 1. キーボードナビゲーション

```typescript
// CategorySelector.tsxより抜粋
useInput((input, key) => {
  if (key.upArrow) {
    // 上キーで前のカテゴリへ
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
  } else if (key.downArrow) {
    // 下キーで次のカテゴリへ
    setSelectedIndex(prev =>
      prev < categories.length - 1 ? prev + 1 : prev
    );
  } else if (key.return) {
    // Enterキーで選択確定
    const selectedCategory = categories[selectedIndex];
    if (selectedCategory) {
      onSelect(selectedCategory);
    }
  }
});
```

### 2. 学習セッション管理

```typescript
// LearningScreen.tsxより抜粋
// 回答処理
const handleAnswer = (optionId: string) => {
  setSelectedOptionId(optionId);
  onAnswer(currentQuestion.id, optionId);

  // 遅延して次の問題へ、あるいは完了へ
  setTimeout(() => {
    if (session.currentQuestionIndex < session.questions.length - 1) {
      const nextQuestion = session.questions[session.currentQuestionIndex + 1];
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setSelectedOptionId(session.answers[nextQuestion.id]);
        setTimeRemaining(session.mode === 'quick' ? 30 : 60);
      }
    } else {
      onComplete();
    }
  }, 1500);
};
```

### 3. 問題表示と解答

```typescript
// QuestionCard.tsxより抜粋
useInput((input, key) => {
  // 数字キーで選択肢を選ぶ
  const num = parseInt(input);
  if (!isNaN(num) && num > 0 && num <= question.options.length) {
    const option = question.options[num - 1];
    if (option) {
      onSelect(option.id);
    }
  }
});
```

## テスト実装

Jest + ink-testing-libraryを使用した各コンポーネントのテスト：

```typescript
// CategorySelector.test.tsxより抜粋
test('矢印キーでの選択が機能する', () => {
  const onSelect = jest.fn();
  const { stdin, lastFrame } = render(
    <CategorySelector
      categories={categories}
      onSelect={onSelect}
    />
  );

  // 初期状態では最初のカテゴリが選択されている
  let frame = lastFrame();
  expect(frame).toMatch(/JavaScript.*\(10問\)/);

  // 下矢印キーを送信して2番目のアイテムを選択
  stdin.write('\x1B[B'); // 下矢印キー

  frame = lastFrame();
  expect(frame).toMatch(/TypeScript.*\(8問\)/);

  // Enterキーを送信して選択を確定
  stdin.write('\r');

  expect(onSelect).toHaveBeenCalledWith(categories[1]);
});
```

## 不足している実装

1. **エントリーポイントの接続**
   - `index.tsx`から`App`コンポーネントを使用するように変更すべき

2. **LLM連携機能**
   - 現在はサンプルデータのみ
   - LLMによる問題生成・回答評価の実装が必要

3. **データ永続化**
   - セッション保存機能
   - ユーザー進捗管理

4. **統合テスト**
   - コンポーネントレベルのテストは実装済み
   - 全体フローを検証する統合テストがない

## テストファースト開発の現況と次のステップ

### 現在のテスト状況

- 個別コンポーネント（CategorySelector, Header, HomeScreen）のテストが実装済み
- TDDアプローチの痕跡が見られる（テスト実装が先行）
- テストカバレッジを拡張すべき領域：
  1. App全体の統合テスト
  2. LLM連携部分のモック/スタブによるテスト
  3. データ永続化部分のテスト

### 次のステップ（TDDアプローチで進める場合）

1. **App統合テストの作成**
   ```typescript
   // App.test.tsxを新規作成
   test('ホーム画面からカテゴリ選択画面への遷移', () => {
     const { stdin, lastFrame } = render(<App />);

     // ホーム画面の表示を確認
     expect(lastFrame()).toContain('ようこそ Lernix へ');

     // Enter押下でカテゴリ選択画面に遷移
     stdin.write('\r');

     expect(lastFrame()).toContain('学習カテゴリを選択してください');
   });
   ```

2. **LLM連携部分のテスト実装**
   ```typescript
   // LLMAdapter.test.tsを新規作成
   test('カテゴリに基づいた問題生成', async () => {
     const mockLLM = new MockLLMAdapter();
     const questions = await mockLLM.generateQuestions(
       { id: 'javascript', name: 'JavaScript', ... },
       5
     );

     expect(questions.length).toBe(5);
     expect(questions[0].categoryId).toBe('javascript');
   });
   ```

3. **データ永続化のテスト実装**
   ```typescript
   // Storage.test.tsを新規作成
   test('学習セッションの保存と読み込み', async () => {
     const storage = new SessionStorage();
     const session = { /* テストセッションデータ */ };

     await storage.saveSession(session);
     const loaded = await storage.getSession(session.id);

     expect(loaded).toEqual(session);
   });
   ```

4. **実装の連携**
   - 上記テストが失敗することを確認（Red）
   - テストを通るように実装（Green）
   - コードをリファクタリング（Refactor）

## 実行方法

```bash
# 依存関係インストール
npm install

# 開発モードで実行
npm run dev

# ビルド
npm run build

# アプリケーション実行
npm start

# テスト実行
npm test
```

## 現在の制限事項

1. 現在のエントリーポイントでは完全なアプリケーション機能にアクセスできない
2. LLM連携の実装がまだ含まれていない
3. データ永続化機能が未実装
4. UIのスタイリングは基本的なもののみ