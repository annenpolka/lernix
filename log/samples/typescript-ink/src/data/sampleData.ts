import { Category, Question, LearningSession } from '../types.js';

// サンプルカテゴリ
export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    description: 'JavaScriptの基礎から応用まで',
    questionCount: 10
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScriptの型システムと文法',
    questionCount: 8
  },
  {
    id: 'react',
    name: 'React',
    description: 'Reactの基本概念とフック',
    questionCount: 12
  }
];

// サンプル問題
export const SAMPLE_QUESTIONS: Record<string, Question[]> = {
  javascript: [
    {
      id: 'js1',
      categoryId: 'javascript',
      content: 'JavaScriptにおける "==" と "===" の違いは何ですか？',
      options: [
        { id: 'a', content: '"==" は代入、"===" は比較' },
        { id: 'b', content: '"==" は値の比較、"===" は値と型の比較' },
        { id: 'c', content: '"==" は文字列比較、"===" は数値比較' },
        { id: 'd', content: '違いはない' }
      ],
      correctOptionId: 'b',
      explanation: '"==" は型変換を行って比較しますが、"===" は型変換なしで値と型が厳密に一致するか確認します。'
    },
    {
      id: 'js2',
      categoryId: 'javascript',
      content: '次のうち、JavaScriptのプリミティブ型ではないものはどれですか？',
      options: [
        { id: 'a', content: 'String' },
        { id: 'b', content: 'Number' },
        { id: 'c', content: 'Boolean' },
        { id: 'd', content: 'Object' }
      ],
      correctOptionId: 'd',
      explanation: 'プリミティブ型は String, Number, Boolean, Null, Undefined, Symbol, BigInt です。Object はプリミティブ型ではなく参照型です。'
    }
  ],
  typescript: [
    {
      id: 'ts1',
      categoryId: 'typescript',
      content: 'TypeScriptの "interface" と "type" の主な違いは何ですか？',
      options: [
        { id: 'a', content: 'interfaceはオブジェクト型のみを定義できる' },
        { id: 'b', content: 'typeは継承できない' },
        { id: 'c', content: 'interfaceは宣言的マージ（Declaration Merging）が可能' },
        { id: 'd', content: 'typeはジェネリクスをサポートしていない' }
      ],
      correctOptionId: 'c',
      explanation: 'interfaceは同じ名前で複数定義すると自動的にマージされますが、typeでは重複定義はエラーになります。両方とも継承可能で、オブジェクト以外の型も定義でき、ジェネリクスもサポートしています。'
    }
  ],
  react: [
    {
      id: 'react1',
      categoryId: 'react',
      content: 'Reactコンポーネントのレンダリングが発生するのはどのような時ですか？',
      options: [
        { id: 'a', content: 'props または state が変更された時' },
        { id: 'b', content: 'componentDidUpdateが呼ばれた時' },
        { id: 'c', content: 'DOMが更新された時' },
        { id: 'd', content: 'イベントハンドラが実行された時' }
      ],
      correctOptionId: 'a',
      explanation: 'Reactコンポーネントは、propsまたはstateが変更された時、親コンポーネントが再レンダリングされた時にレンダリングが発生します。'
    }
  ]
};

// サンプルセッションの作成関数
export function createSampleSession(categoryId: string, mode: 'quick' | 'deep' | 'weakspot'): LearningSession {
  const questions = SAMPLE_QUESTIONS[categoryId] || [];
  return {
    id: `session-${Date.now()}`,
    categoryId,
    mode,
    startTime: new Date(),
    questions,
    currentQuestionIndex: 0,
    answers: {}
  };
}