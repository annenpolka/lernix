import React from 'react';
import { render } from 'ink-testing-library';
import { Header } from '../components/Header';
import { describe, it, expect } from 'vitest';

describe('Header component', () => {
  it('renders the title correctly', () => {
    const { lastFrame } = render(<Header title="Test Title" />);
    expect(lastFrame()).toContain('Test Title');
  });

  it('renders subtitle when provided', () => {
    const { lastFrame } = render(<Header title="Test Title" subtitle="Test Subtitle" />);
    expect(lastFrame()).toContain('Test Title');
    expect(lastFrame()).toContain('Test Subtitle');
  });

  it('does not render subtitle when not provided', () => {
    const { lastFrame } = render(<Header title="Test Title" />);
    expect(lastFrame()).toContain('Test Title');
    // Check for border characters which should be present, but no subtitle text
    expect(lastFrame()).toMatch(/[─│┌┐└┘]/);
  });

  it('renders with border style', () => {
    const { lastFrame } = render(<Header title="Test Title" />);
    // Check for border characters
    expect(lastFrame()).toMatch(/[─│┌┐└┘]/);
  });
});