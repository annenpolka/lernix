import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Category } from '../types.js';

interface CategorySelectorProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  onSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      // 上キーで前のカテゴリへ
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (key.downArrow) {
      // 下キーで次のカテゴリへ
      setSelectedIndex(prev =>
        prev < categories.length - 1 ? prev + 1 : prev
      );
    } else if (key.return) {
      // Enterキーで選択確定
      const selectedCategory = categories[selectedIndex];
      if (selectedCategory) {
        onSelect(selectedCategory);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>学習カテゴリを選択してください：</Text>
      </Box>

      {categories.map((category, index) => (
        <Box key={category.id} marginY={1}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '› ' : '  '}
            <Text bold={index === selectedIndex}>{category.name}</Text>
            <Text> ({category.questionCount}問)</Text>
          </Text>
        </Box>
      ))}

      <Box marginTop={2}>
        <Text color="gray">↑/↓ キーで選択、Enter キーで決定</Text>
      </Box>
    </Box>
  );
};