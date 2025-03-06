import React from 'react';
import { render } from 'ink-testing-library';
import { Counter } from '../components/Counter';
import { describe, it, expect, vi } from 'vitest';

// useEffectのモックを削除し、シンプルなテストに集中

describe('Counter component', () => {
  // Counter コンポーネントが正しく初期値を表示するかテスト
  it('renders with initial count', () => {
    const { lastFrame } = render(<Counter initialCount={5} />);
    expect(lastFrame()).toContain('5');
  });

  // インターフェイスの表示をテスト
  it('displays the counter interface correctly', () => {
    const { lastFrame } = render(<Counter initialCount={3} />);
    expect(lastFrame()).toContain('カウント:');
    expect(lastFrame()).toContain('3');
    expect(lastFrame()).toContain('+/- または ↑/↓ で操作、r でリセット');
  });

  // onCountChangeプロパティがないケースをテスト（エラーが発生しないことを確認）
  it('works without onCountChange prop', () => {
    // onCountChangeを渡さないレンダリングでエラーが発生しないことを確認
    expect(() => {
      render(<Counter initialCount={5} />);
    }).not.toThrow();
  });
});