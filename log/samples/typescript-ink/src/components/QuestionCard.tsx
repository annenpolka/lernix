import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Question } from '../types.js';

interface QuestionCardProps {
  question: Question;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  showAnswer?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOptionId,
  onSelect,
  showAnswer = false,
}) => {
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

  return (
    <Box flexDirection="column" marginY={1} width={76}>
      {/* 問題文 */}
      <Box 
        flexDirection="column" 
        borderStyle="single" 
        paddingX={2} 
        paddingY={1}
        marginBottom={1}
      >
        <Text bold wrap="wrap">{question.content}</Text>
      </Box>
      
      {/* 選択肢 */}
      <Box flexDirection="column">
        {question.options.map((option, index) => {
          const isSelected = option.id === selectedOptionId;
          const isCorrect = option.id === question.correctOptionId;
          
          let optionColor: string = 'white';
          if (showAnswer) {
            optionColor = isCorrect ? 'green' : (isSelected && !isCorrect ? 'red' : 'white');
          } else {
            optionColor = isSelected ? 'blue' : 'white';
          }
          
          return (
            <Box key={option.id} marginY={1}>
              <Text color={optionColor}>
                <Text bold>{index + 1}. </Text>
                <Text>{option.content}</Text>
                {showAnswer && isCorrect && <Text color="green"> ✓</Text>}
                {showAnswer && isSelected && !isCorrect && <Text color="red"> ✗</Text>}
              </Text>
            </Box>
          );
        })}
      </Box>
      
      {/* 解説 (回答後のみ表示) */}
      {showAnswer && (
        <Box flexDirection="column" marginTop={2} paddingX={2}>
          <Text bold>解説:</Text>
          <Text color="gray" wrap="wrap">{question.explanation}</Text>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text color="gray">数字キー（1〜{question.options.length}）で選択</Text>
      </Box>
    </Box>
  );
};