#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

/**
 * Lernix アプリケーションのエントリーポイント
 * Inkを使用してターミナルUIをレンダリングします
 */

// アプリをレンダリング
const { waitUntilExit } = render(<App />);

waitUntilExit().then(() => {
  console.log('Lernix アプリケーションを終了しました');
});