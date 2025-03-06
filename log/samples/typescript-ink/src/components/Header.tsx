import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * アプリケーションヘッダーコンポーネント
 * タイトルとオプションのサブタイトルを表示
 */
export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <Box flexDirection="column" marginBottom={1} borderStyle="single" paddingX={2} paddingY={1}>
      <Text bold color="blue">
        {title}
      </Text>
      
      {subtitle && (
        <Text color="gray">
          {subtitle}
        </Text>
      )}
    </Box>
  );
};