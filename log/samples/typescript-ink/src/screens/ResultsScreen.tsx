import React from 'react';
import { Box, Text, useInput } from 'ink';
import { LearningSession, Question } from '../types.js';

interface ResultsScreenProps {
  session: LearningSession;
  onRestart: () => void;
  onExit: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  session,
  onRestart,
  onExit,
}) => {
  // 正解数の計算
  const correctCount = Object.entries(session.answers).reduce((count, [questionId, answerId]) => {
    const question = session.questions.find(q => q.id === questionId);
    return question && question.correctOptionId === answerId ? count + 1 : count;
  }, 0);
  
  // 正解率
  const totalQuestions = session.questions.length;
  const percentCorrect = totalQuestions > 0 
    ? Math.round((correctCount / totalQuestions) * 100) 
    : 0;
  
  // 学習時間の計算
  const startTime = session.startTime;
  const endTime = session.endTime || new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  
  // キー入力ハンドリング
  useInput((input, key) => {
    if (input === 'r' || input === 'R') {
      onRestart();
    } else if (input === 'q' || input === 'Q' || key.escape) {
      onExit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">学習結果</Text>
      </Box>
      
      <Box borderStyle="single" paddingX={2} paddingY={1} flexDirection="column" marginBottom={1}>
        <Box marginY={1} justifyContent="space-between">
          <Text>カテゴリ:</Text>
          <Text bold>{session.categoryId}</Text>
        </Box>
        
        <Box marginY={1} justifyContent="space-between">
          <Text>モード:</Text>
          <Text bold>
            {session.mode === 'quick' 
              ? 'クイック' 
              : session.mode === 'deep' 
                ? 'ディープ' 
                : '弱点強化'}
          </Text>
        </Box>
        
        <Box marginY={1} justifyContent="space-between">
          <Text>問題数:</Text>
          <Text bold>{totalQuestions}問</Text>
        </Box>
        
        <Box marginY={1} justifyContent="space-between">
          <Text>正解数:</Text>
          <Text bold color={percentCorrect >= 80 ? 'green' : percentCorrect >= 60 ? 'yellow' : 'red'}>
            {correctCount}問 ({percentCorrect}%)
          </Text>
        </Box>
        
        <Box marginY={1} justifyContent="space-between">
          <Text>学習時間:</Text>
          <Text bold>{durationMinutes}分{durationSeconds}秒</Text>
        </Box>
      </Box>
      
      <Box marginY={1} flexDirection="column">
        <Text>
          <Text bold color="yellow">R</Text> - もう一度学習する
        </Text>
        <Text>
          <Text bold color="yellow">Q</Text> - ホーム画面に戻る
        </Text>
      </Box>
    </Box>
  );
};