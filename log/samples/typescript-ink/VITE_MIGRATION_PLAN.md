# Lernix TypeScript + Ink プロジェクト - Vite/Vitest 移行計画

## 1. 目的

現在のTypeScript + Inkプロジェクトを、より高速な開発環境とテスト環境を提供するViteとVitestに移行し、開発効率とユーザー体験を向上させる。

## 2. 背景

- 現状はTypeScriptとInkを使用したTUIアプリケーション
- ビルドにはtscを使用、テストにはJestを使用
- ESModulesとInkの組み合わせでテスト実行に問題が発生
- Inkコンポーネント単体テストが実行できない状況

## 3. 移行ステップ

### フェーズ1: 基本環境構築 (推定所要時間: 3時間)

1. **Viteとプラグインのインストール**
   ```bash
   npm install --save-dev vite @vitejs/plugin-react rollup-plugin-node-externals
   ```

2. **Vite設定ファイルの作成**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import { nodeExternals } from 'rollup-plugin-node-externals'

   export default defineConfig({
     plugins: [
       react(),
       nodeExternals({
         deps: true,
         builtins: true
       })
     ],
     build: {
       lib: {
         entry: 'src/index.tsx',
         formats: ['cjs'],
         fileName: () => 'cli.js'
       },
       rollupOptions: {
         external: ['react', 'ink'],
         output: {
           globals: {
             react: 'React',
             ink: 'Ink'
           }
         }
       }
     }
   })
   ```

3. **package.jsonスクリプトの更新**
   ```json
   "scripts": {
     "dev": "vite build --watch",
     "build": "vite build",
     "start": "node dist/cli.js"
   }
   ```

### フェーズ2: Vitestテスト環境構築 (推定所要時間: 4時間)

1. **Vitestと関連パッケージのインストール**
   ```bash
   npm install --save-dev vitest c8 @vitest/ui
   ```

2. **Vitest設定ファイルの作成**
   ```typescript
   // vitest.config.ts
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'node',
       globals: true,
       include: ['**/__tests__/**/*.test.{ts,tsx}'],
       deps: {
         inline: ['ink-testing-library']
       },
       coverage: {
         provider: 'c8',
         reporter: ['text', 'html']
       }
     }
   })
   ```

3. **package.jsonテストスクリプトの更新**
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:ui": "vitest --ui",
     "coverage": "vitest run --coverage"
   }
   ```

4. **テストファイルの修正**
   - Jest → Vitest用の記法に修正
   - テストの依存関係をインポート

### フェーズ3: アプリケーション実装の修正 (推定所要時間: 3時間)

1. **インポートパスの修正**
   - `.js`拡張子をパスから削除
   - 相対パスをモジュールパスに変更（必要に応じて）

2. **コンポーネント構造の見直し**
   - Flexboxレイアウトの最適化
   - パフォーマンスの最適化ポイントの洗い出し

3. **bin用エントリーポイントの作成**
   ```bash
   mkdir -p bin
   touch bin/cli.js
   ```
   ```javascript
   #!/usr/bin/env node
   import '../dist/cli.js'
   ```

### フェーズ4: テスト・検証 (推定所要時間: 3時間)

1. **ユニットテスト作成**
   - 各コンポーネントのテストケース
   - UI状態の検証

2. **E2Eテスト**
   - CLI全体の動作確認
   - パラメータ処理の検証

3. **パフォーマンス検証**
   - ビルドサイズの確認
   - 起動時間の測定

## 4. 成果物

1. Viteでビルドされたコンパクトで高速なCLIアプリケーション
2. Vitestによる効率的なテスト環境
3. 拡張性の高いモジュラー構造
4. より優れた開発体験（HMR、ビルド速度の改善）

## 5. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| Viteの設定ミスでビルドが失敗 | 開発の遅延 | 段階的な設定変更と検証 |
| Inテスト環境の互換性問題 | テスト実行不能 | インライン依存関係として処理 |
| Node.js環境でのESM/CJS混在 | ランタイムエラー | 適切なフォーマット設定とポリフィル |
| 開発環境でのデバッグ課題 | 問題解決の遅延 | Viteのソースマップを有効化 |

## 6. マイルストーン

1. **基本環境構築完了**: Viteでのビルドが動作
2. **テスト環境構築完了**: Vitestでのテスト実行が成功 
3. **UI実装修正完了**: すべてのコンポーネントが正常動作
4. **本番リリース準備完了**: すべてのテストが通過し安定動作

## 7. 必要リソース

- **開発者**: 1名（フルスタック）
- **テスト環境**: Node.js v16以上
- **開発時間**: 合計約13時間

## 8. 承認基準

- すべてのテストケースが成功
- ビルドサイズが現行版より20%以上縮小
- 開発者のフィードバックでワークフロー改善の確認
- コードカバレッジ80%以上

## 9. 参考資料

- [Vite公式ドキュメント](https://vitejs.dev/)
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [ターミナルUI開発のベストプラクティス](https://blog.inkdrop.app/how-to-build-a-terminal-ui-with-ink-c0b95c9a52e7)