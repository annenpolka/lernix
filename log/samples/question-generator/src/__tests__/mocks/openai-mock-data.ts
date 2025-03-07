/**
 * OpenAI API モックデータ
 */

// テスト用サンプル質問データ
export const testQuestionData = [
  {
    id: "openai-js-closure-001",
    category: "programming",
    difficulty: "medium",
    text: "JavaScriptにおけるクロージャとは何ですか？",
    choices: [
      { id: "a", text: "外部変数を参照する関数", isCorrect: true },
      { id: "b", text: "メモリリークの一種", isCorrect: false },
      { id: "c", text: "コールバック関数の別名", isCorrect: false },
      { id: "d", text: "イベントハンドラーの一種", isCorrect: false }
    ],
    explanation: "クロージャは関数が宣言された時点のスコープにある変数を保持する関数です。これにより、関数が定義されたスコープ外からでも、クロージャ内の変数にアクセスできるようになります。"
  }
];

// モックAPIレスポンスの作成
export const createMockOpenAIResponse = () => {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify(testQuestionData),
        },
      },
    ],
  };
};