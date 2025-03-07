/**
 * Gemini API モックデータ
 */

// モック応答の型定義
export type MockGeminiResponse = {
  response: {
    text: () => string | Promise<string>;
  };
  candidates?: Array<{
    content: {
      parts: Array<{text: string}>
    }
  }>;
  promptFeedback?: {
    blockReason: string;
    safetyRatings: any[];
  };
};

// テスト用サンプル質問データ
export const testQuestionData = [
  {
    id: "typescript-interface-vs-type-001",
    category: "programming",
    difficulty: "medium",
    text: "TypeScriptにおけるinterfaceとtypeの主な違いは何ですか？",
    choices: [
      { id: "a", text: "interfaceは継承可能だが、typeは継承できない", isCorrect: false },
      { id: "b", text: "typeは組み合わせ可能だが、interfaceは組み合わせできない", isCorrect: false },
      { id: "c", text: "interfaceは宣言マージ可能だが、typeはできない", isCorrect: true },
      { id: "d", text: "typeはプリミティブ型を定義できるが、interfaceはオブジェクト型のみ", isCorrect: false }
    ],
    explanation: "TypeScriptにおいて、interfaceとtypeは似た機能を持ちますが、大きな違いの一つは宣言マージ（Declaration Merging）です。interfaceは同名で複数回宣言するとマージされますが、typeは再宣言するとエラーになります。両方とも継承、組み合わせ、オブジェクト型の定義が可能です。"
  }
];

// モックAPI応答
export const createMockApiResponse = (): MockGeminiResponse => {
  const jsonData = JSON.stringify(testQuestionData);

  return {
    response: {
      text: () => Promise.resolve(jsonData)
    },
    candidates: [{
      content: {
        parts: [{
          text: jsonData
        }]
      }
    }],
    promptFeedback: {
      blockReason: '',
      safetyRatings: []
    }
  };
};