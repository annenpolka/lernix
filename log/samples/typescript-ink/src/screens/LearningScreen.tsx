import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LearningSession, Question } from '../types.js';
import { QuestionCard } from '../components/QuestionCard.js';

interface LearningScreenProps {
  session: LearningSession;
  onAnswer: (questionId: string, optionId: string) => void;
  onComplete: () => void;
}

export const LearningScreen: React.FC<LearningScreenProps> = ({
  session,
  onAnswer,
  onComplete,
}) => {
  // セッションから最初の問題を取得
  const initialQuestion = session.questions[session.currentQuestionIndex] || session.questions[0];
  
  const [currentQuestion, setCurrentQuestion] = useState<Question>(initialQuestion);
  
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(
    session.answers[currentQuestion?.id]
  );
  
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    session.mode === 'quick' ? 30 : 60
  );

  // 問題切り替え効果
  useEffect(() => {
    if (session.questions.length > 0 && session.currentQuestionIndex < session.questions.length) {
      const question = session.questions[session.currentQuestionIndex];
      if (question) {
        setCurrentQuestion(question);
        setSelectedOptionId(session.answers[question.id]);
        setShowAnswer(false);
        setTimeRemaining(session.mode === 'quick' ? 30 : 60);
      }
    }
  }, [session.currentQuestionIndex, session.questions]);

  // 回答選択処理
  const handleAnswer = (optionId: string) => {
    if (showAnswer) return; // 回答表示中は選択できない
    
    setSelectedOptionId(optionId);
    
    // 回答を記録
    onAnswer(currentQuestion.id, optionId);
    
    // 回答を表示
    setShowAnswer(true);
    
    // 次の問題へ
    setTimeout(() => {
      if (session.currentQuestionIndex < session.questions.length - 1) {
        // まだ問題が残っている場合
        onAnswer(currentQuestion.id, optionId);
      } else {
        // 全問終了
        onComplete();
      }
    }, 3000);
  };

  if (!currentQuestion) {
    return (
      <Box>
        <Text>問題がありません</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text>
          <Text bold>問題 {session.currentQuestionIndex + 1}/{session.questions.length}</Text>
          {' - '}
          <Text color="cyan">{session.mode === 'quick' ? 'クイック' : session.mode === 'deep' ? 'ディープ' : '弱点強化'}モード</Text>
        </Text>
      </Box>

      <QuestionCard
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        onSelect={handleAnswer}
        showAnswer={showAnswer}
      />
      
      {showAnswer && (
        <Box marginTop={1}>
          <Text color="gray">次の問題に進んでいます...</Text>
        </Box>
      )}
    </Box>
  );
};