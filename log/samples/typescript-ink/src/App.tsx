import React, { useState } from 'react';
import { Box } from 'ink';
import { HomeScreen } from './screens/HomeScreen.js';
import { CategorySelector } from './components/CategorySelector.js';
import { ModeSelector } from './components/ModeSelector.js';
import { LearningScreen } from './screens/LearningScreen.js';
import { ResultsScreen } from './screens/ResultsScreen.js';
import { AppState, LearningSession, Category, LearningMode } from './types.js';
import { SAMPLE_CATEGORIES, createSampleSession } from './data/sampleData.js';

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

  // カテゴリ選択処理
  const handleCategorySelect = (category: Category) => {
    setAppState((prev: AppState) => ({
      ...prev,
      screen: 'mode-select',
      selectedCategoryId: category.id,
    }));
  };

  // 学習モード選択処理
  const handleModeSelect = (mode: LearningMode) => {
    // 選択されたカテゴリとモードでセッションを作成
    if (appState.selectedCategoryId) {
      const newSession = createSampleSession(
        appState.selectedCategoryId,
        mode
      );
      setSession(newSession);
      setAppState((prev: AppState) => ({ ...prev, screen: 'learning' }));
    }
  };

  // 回答処理
  const handleAnswer = (questionId: string, optionId: string) => {
    if (session) {
      // 回答を記録
      setSession((prev) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: optionId,
          },
          // 次の問題へ
          currentQuestionIndex: prev.currentQuestionIndex + 1,
        };
      });
    }
  };

  // 学習完了処理
  const handleLearningComplete = () => {
    if (session) {
      // 終了時間を記録
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          endTime: new Date(),
        };
      });
      setAppState((prev: AppState) => ({ ...prev, screen: 'results' }));
    }
  };

  // 再学習処理
  const handleRestart = () => {
    if (appState.selectedCategoryId && session) {
      const newSession = createSampleSession(
        appState.selectedCategoryId,
        session.mode
      );
      setSession(newSession);
      setAppState((prev: AppState) => ({ ...prev, screen: 'learning' }));
    }
  };

  // ホームに戻る処理
  const handleExit = () => {
    setSession(undefined);
    setAppState({
      screen: 'home',
      categories: SAMPLE_CATEGORIES,
      loading: false
    });
  };

  return (
    <Box flexDirection="column" padding={1} width={80}>
      {appState.screen === 'home' && <HomeScreen onStart={handleStart} />}

      {appState.screen === 'category-select' && (
        <CategorySelector
          categories={appState.categories}
          onSelect={handleCategorySelect}
        />
      )}

      {appState.screen === 'mode-select' && (
        <ModeSelector onSelect={handleModeSelect} />
      )}

      {appState.screen === 'learning' && session && (
        <LearningScreen
          session={session}
          onAnswer={handleAnswer}
          onComplete={handleLearningComplete}
        />
      )}

      {appState.screen === 'results' && session && (
        <ResultsScreen
          session={session}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
    </Box>
  );
};