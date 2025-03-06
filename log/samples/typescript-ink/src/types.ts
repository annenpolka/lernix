// 学習カテゴリー
export interface Category {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

// 選択肢
export interface Option {
  id: string;
  content: string;
}

// 問題データ
export interface Question {
  id: string;
  categoryId: string;
  content: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

// 学習モード
export type LearningMode = 'quick' | 'deep' | 'weakspot';

// 学習セッション
export interface LearningSession {
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
export type AppScreen = 'home' | 'category-select' | 'mode-select' | 'learning' | 'results';

// アプリケーション状態
export interface AppState {
  screen: AppScreen;
  categories: Category[];
  selectedCategoryId?: string;
  loading: boolean;
  error?: string;
}