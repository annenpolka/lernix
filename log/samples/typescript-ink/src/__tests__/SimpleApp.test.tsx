import React from 'react';
import { render } from 'ink-testing-library';
import { SimpleApp } from '../SimpleApp';
import { describe, it, expect } from 'vitest';

describe('SimpleApp component', () => {
  it('renders the title correctly', () => {
    const { lastFrame } = render(<SimpleApp />);
    expect(lastFrame()).toContain('Lernix サンプルアプリ');
  });

  it('renders the subtitle correctly', () => {
    const { lastFrame } = render(<SimpleApp />);
    expect(lastFrame()).toContain('TypeScript + Ink デモ');
  });

  it('renders the counter component', () => {
    const { lastFrame } = render(<SimpleApp />);
    expect(lastFrame()).toContain('カウント:');
    expect(lastFrame()).toContain('0');
  });

  it('renders the counter instructions', () => {
    const { lastFrame } = render(<SimpleApp />);
    expect(lastFrame()).toContain('+/- または ↑/↓ で操作、r でリセット');
  });

  it('renders the footer message', () => {
    const { lastFrame } = render(<SimpleApp />);
    expect(lastFrame()).toContain('このサンプルアプリは Ink の基本機能を確認するためのものです。');
  });
});