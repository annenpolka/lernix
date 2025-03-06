import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { LearningMode } from '../types.js';

interface ModeSelectorProps {
  onSelect: (mode: LearningMode) => void;
}

type ModeOption = {
  id: LearningMode;
  name: string;
  description: string;
};

const MODES: ModeOption[] = [
  {
    id: 'quick',
    name: 'クイックモード',
    description: '短時間で重要ポイントを学習',
  },
  {
    id: 'deep',
    name: 'ディープモード',
    description: '詳細な解説と応用問題で深く学習',
  },
  {
    id: 'weakspot',
    name: '弱点強化モード',
    description: '苦手な分野を重点的に学習',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < MODES.length - 1 ? prev + 1 : prev));
    } else if (key.return) {
      const selectedMode = MODES[selectedIndex];
      if (selectedMode) {
        onSelect(selectedMode.id);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>学習モードを選択してください：</Text>
      </Box>

      {MODES.map((mode, index) => (
        <Box key={mode.id} flexDirection="column" marginY={1}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '› ' : '  '}
            <Text bold={index === selectedIndex}>{mode.name}</Text>
          </Text>
          {index === selectedIndex && (
            <Box marginLeft={4} marginTop={1}>
              <Text color="gray">{mode.description}</Text>
            </Box>
          )}
        </Box>
      ))}

      <Box marginTop={2}>
        <Text color="gray">↑/↓ キーで選択、Enter キーで決定</Text>
      </Box>
    </Box>
  );
};