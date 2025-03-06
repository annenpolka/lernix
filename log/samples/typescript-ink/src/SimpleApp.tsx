import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Counter } from './components/Counter.js';
import { Header } from './components/Header.js';

/**
 * シンプルなデモアプリケーション
 * 基本的なコンポーネントとインタラクションを示すためのデモ
 */
export const SimpleApp: React.FC = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Header 
        title="Lernix サンプルアプリ" 
        subtitle="TypeScript + Ink デモ" 
      />
      
      <Box marginY={1}>
        <Text>これは TypeScript + Ink のサンプル実装です。以下のカウンターを操作してみてください：</Text>
      </Box>
      
      <Box marginY={2} paddingX={2}>
        <Counter initialCount={0} />
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">
          このサンプルアプリは Ink の基本機能を確認するためのものです。
        </Text>
      </Box>
    </Box>
  );
};