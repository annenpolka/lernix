/**
 * シンプルなインメモリキャッシュマネージャー
 */
import type { Question } from '../../domain/models/types.js';
import NodeCache from 'node-cache';

/**
 * キャッシュマネージャーの設定
 */
type CacheManagerConfig = {
  ttl?: number; // キャッシュ有効期限（秒）
  checkPeriod?: number; // 期限切れチェック間隔（秒）
};

/**
 * キャッシュマネージャーの型
 */
export type CacheManager = {
  get: (key: string) => Question[] | null;
  set: (key: string, value: Question[]) => void;
  delete: (key: string) => void;
  clear: () => void;
  stats: () => { keys: number; hits: number; misses: number };
};

/**
 * インメモリキャッシュマネージャーの作成
 */
export const createCacheManager = (config: CacheManagerConfig = {}): CacheManager => {
  // デフォルト設定
  const options = {
    ttl: config.ttl || 60 * 60, // デフォルト: 1時間
    checkperiod: config.checkPeriod || 60, // デフォルト: 1分
  };

  // NodeCacheインスタンスの作成
  const cache = new NodeCache(options);

  // 統計情報
  let hits = 0;
  let misses = 0;

  const get = (key: string): Question[] | null => {
    const value = cache.get<Question[]>(key);

    if (value) {
      hits++;
      return value;
    }

    misses++;
    return null;
  };

  const set = (key: string, value: Question[]): void => {
    cache.set(key, value);
  };

  const deleteKey = (key: string): void => {
    cache.del(key);
  };

  const clear = (): void => {
    cache.flushAll();
    hits = 0;
    misses = 0;
  };

  const stats = () => {
    const keys = cache.keys().length;
    return { keys, hits, misses };
  };

  return {
    get,
    set,
    delete: deleteKey,
    clear,
    stats,
  };
};