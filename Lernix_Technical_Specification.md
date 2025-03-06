# Lernix: ターミナル学習システム設計概要

## コアコンセプト

Lernix はターミナルベース(TUI)の学習ツールで、LLM を活用して無限に質問を生成し、効率的な学習体験を提供します。ユーザーは自由にカテゴリを作成でき、フィードバックによって質問品質が向上します。

## システムアーキテクチャ

```
+------------------------+     +------------------------+     +------------------------+
|    知識コンテキスト     |     |    練習コンテキスト     |     |  パフォーマンスコンテキスト |
+------------------------+     +------------------------+     +------------------------+
| - 問題生成              |     | - 回答評価             |     | - 進捗追跡              |
| - カテゴリ管理          |     | - 学習スケジューリング   |     | - フィードバック分析      |
| - 知識インデックス       |     | - 適応エンジン          |     | - 洞察検出             |
+------------------------+     +------------------------+     +------------------------+
```

## 主要機能

1. **スマート問題生成** - ユーザーの弱点を特定し、カスタムカテゴリに対応
2. **柔軟な学習モード** - クイック、ディープダイブ、弱点集中
3. **カスタムカテゴリ** - ユーザーが自由に作成・管理可能
4. **フィードバックループ** - 問題の質を評価・改善
5. **効率的な TUI** - キーボードショートカット重視の高速インターフェース

## 実装計画

1. **Phase 1**: コア機能（基本 TUI、LLM 接続、問題生成）
2. **Phase 2**: カテゴリ管理とフィードバックシステム
3. **Phase 3**: 学習分析と適応システム
4. **Phase 4**: オフラインモードと拡張機能

## データモデル

```typescript
// コアエンティティ
type Category = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  keywords: string[];
  metadata: Record<string, any>;
};

type Question = {
  id: string;
  categoryId: string;
  content: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  difficulty: number;
  createdAt: Date;
};

type Option = {
  id: string;
  content: string;
};

type UserResponse = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTime: number;
  feedback?: QuestionFeedback;
};

type QuestionFeedback = {
  quality: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'appropriate' | 'hard';
  isAccurate: boolean;
  comment?: string;
};

type LearningSession = {
  id: string;
  categoryId: string;
  startTime: Date;
  endTime?: Date;
  mode: 'quick' | 'deep' | 'weakspot';
  responses: UserResponse[];
  summary?: SessionSummary;
};

type SessionSummary = {
  totalQuestions: number;
  correctAnswers: number;
  strengths: string[];
  weaknesses: string[];
};

// LLM接続
interface LLMAdapter {
  generateQuestions(category: Category, count: number): Promise<Question[]>;
  improveQuestion(
    question: Question,
    feedback: QuestionFeedback
  ): Promise<Question>;
  analyzePerformance(session: LearningSession): Promise<SessionSummary>;
}
```

カスタムカテゴリは絶対に必要な機能だと思います。学習は個人的なものだから、既存のカテゴリだけでは全然足りないですよね。ユーザーが自分の興味や職業に合わせて自由にカテゴリを作れる仕組みを考えましょう。

## カスタムカテゴリの実装アプローチ

### 1. カテゴリ作成インターフェース

```
+-----------------------------------------------------+
|                カテゴリ管理                         |
+-----------------------------------------------------+
| [既存カテゴリ]                                      |
| ├── Python                                         |
| │   ├── 基礎構文                                   |
| │   ├── ジェネレータ                               |
| │   └── *新規サブカテゴリ追加*                      |
| ├── Docker                                         |
| └── *新規カテゴリ追加*                              |
+-----------------------------------------------------+
| [N] 新規カテゴリ [E] 編集 [D] 削除 [Esc] 戻る       |
+-----------------------------------------------------+
```

新規カテゴリを選択した際：

```
+-----------------------------------------------------+
|                新規カテゴリ作成                      |
+-----------------------------------------------------+
| カテゴリ名: AWS Lambda関数                          |
|                                                     |
| 説明（任意）: サーバーレスコンピューティング、        |
|             Lambdaの概念と実装に関する問題           |
|                                                     |
| 関連キーワード: serverless, cloud, functions        |
|                                                     |
| 初期リソース: [ ] 既存の問題からインポート           |
|              [✓] LLMで初期問題セット生成            |
+-----------------------------------------------------+
| [Enter] 作成   [Esc] キャンセル                     |
+-----------------------------------------------------+
```

### 2. 技術的な実装ポイント

1. **カテゴリデータ構造**:

   ```python
   class Category:
       id: str  # ユニークID
       name: str  # カテゴリ名
       description: Optional[str]  # 説明
       parent_id: Optional[str]  # 親カテゴリID（階層構造用）
       keywords: List[str]  # LLMプロンプトのコンテキスト用
       metadata: Dict[str, Any]  # 拡張性のための追加データ
   ```

2. **LLM への指示の強化**:

   ```python
   def build_prompt_for_custom_category(category: Category) -> str:
       """カスタムカテゴリ用のLLMプロンプトを構築"""
       return f"""
       以下のカテゴリに関する問題を{num_questions}個生成してください：

       カテゴリ名: {category.name}
       説明: {category.description or '指定なし'}
       関連キーワード: {', '.join(category.keywords)}

       このカテゴリは学習者が自分で作成したものです。
       専門的かつ正確な問題を作成し、以下の形式で返してください：

       [各問題の形式の説明...]
       """
   ```

3. **カテゴリ管理と持続性**:
   - ローカルファイルシステムで保存（JSON など）
   - カテゴリ階層のインポート/エクスポート
   - 問題と関連付けられた永続的な ID 管理

### 3. ユーザー体験の考慮点

カスタムカテゴリは素晴らしいですが、いくつか考慮すべき点があります：

1. **初期ハードル**: 最初からカテゴリを作るのは難しいので、テンプレートを提供
2. **LLM の限界**: 非常に専門的なカテゴリだと LLM の知識が不十分かも
3. **品質保証**: ユーザー作成のカテゴリは特に問題の質にばらつきが

これらの課題に対処するため：

- **テンプレートカテゴリ**: 一般的な職種や試験に合わせたテンプレート提供
- **組み込みフィードバック**: 問題の質の低いカテゴリを検出し改善
- **インポート機能**: 既存の問題セットや教材からのインポート

カスタムカテゴリは Lernix の最も強力な機能になる可能性があります。従来のクイズアプリでは対応できない専門分野や個人の興味に合わせた学習が可能になりますから。

実装の優先順位としては、基本的なカテゴリ CRUD 操作を最初に作り、その後でテンプレートやインポート機能を追加するのが良いでしょう。
