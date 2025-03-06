import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../components/Header.js';

interface HomeScreenProps {
  onStart: () => void;
}

/**
 * ホーム画面コンポーネント
 * アプリケーションの起動画面を表示し、学習開始への導線を提供
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  // Enterキーで学習開始
  useInput((input, key) => {
    if (key.return) {
      onStart();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header 
        title="Lernix" 
        subtitle="ターミナルベース学習システム" 
      />
      
      <Box marginY={1}>
        <Text>ようこそ Lernix へ！ターミナルでの効率的な学習をサポートします。</Text>
      </Box>
      
      <Box marginY={1} flexDirection="column">
        <Text>主な機能:</Text>
        <Text color="gray">• AI による適応型問題生成</Text>
        <Text color="gray">• キーボード操作に最適化された UI</Text>
        <Text color="gray">• パーソナライズされた学習体験</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text color="green">
          <Text bold>Enter</Text> キーを押して学習を開始
        </Text>
      </Box>
    </Box>
  );
};