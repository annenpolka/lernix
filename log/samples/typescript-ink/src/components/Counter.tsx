import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface CounterProps {
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

/**
 * 単純なカウンターコンポーネント
 * デモと動作確認用として使用
 */
export const Counter: React.FC<CounterProps> = ({ 
  initialCount = 0,
  onCountChange
}) => {
  const [count, setCount] = useState(initialCount);

  // 初期値が変更されたときに同期
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // カウント変更時にコールバックを呼び出す
  useEffect(() => {
    if (onCountChange) {
      onCountChange(count);
    }
  }, [count, onCountChange]);

  useInput((input, key) => {
    if (input === '+' || key.upArrow) {
      setCount(prev => prev + 1);
      // 変更をログに出力（デバッグ用）
      console.log(`カウント増加: ${count + 1}`);
    } else if (input === '-' || key.downArrow) {
      setCount(prev => prev - 1);
      console.log(`カウント減少: ${count - 1}`);
    } else if (input === 'r') {
      setCount(0);
      console.log('カウントリセット: 0');
    }
  });

  return (
    <Box>
      <Box marginRight={1}>
        <Text>カウント:</Text>
      </Box>
      <Text bold color="green">
        {count}
      </Text>
      <Box marginLeft={2}>
        <Text color="gray">(+/- または ↑/↓ で操作、r でリセット)</Text>
      </Box>
    </Box>
  );
};